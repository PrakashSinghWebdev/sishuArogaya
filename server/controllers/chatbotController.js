const natural = require('natural');
const { KNOWLEDGE_BASE } = require('../data/chatbotKnowledge');

// ─── Gemini Setup ──────────────────────────────────────────────────────────
let geminiModel = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GOOGLE_AI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[Chatbot] ✅ Gemini AI loaded successfully');
  } else {
    console.warn('[Chatbot] ⚠️  GOOGLE_AI_API_KEY not set — Gemini fallback disabled');
  }
} catch (e) {
  console.warn('[Chatbot] ⚠️  @google/generative-ai not installed — run: npm install @google/generative-ai');
}

// ─── Gemini System Prompt ─────────────────────────────────────────────────
const GEMINI_SYSTEM_PROMPT = `You are "Sishu Arogaya Assistant", an expert AI health assistant for an Indian maternal and child health platform.

YOUR EXPERTISE:
- Child health from birth to 5 years (India-specific)
- Indian National Immunization Schedule (NIS) — BCG, OPV, DPT, HepB, PCV, Rotavirus, IPV, MR, MMR, Varicella, JE, Typhoid, Vitamin A
- WHO/UNICEF/IMCI guidelines adapted for India
- Malnutrition (SAM/MAM), MUAC measurements, growth monitoring
- Breastfeeding, complementary feeding, IYCF guidelines
- Danger signs in children: pneumonia, diarrhea, dehydration, fever, convulsions
- Government schemes: ICDS, Poshan Abhiyan, PM Matru Vandana Yojana, Janani Suraksha Yojana, Rashtriya Bal Swasthya Karyakram (RBSK), Mission Indradhanush, Ayushman Bharat
- ASHA worker roles and community health programs
- ORS preparation, zinc therapy, Vitamin A supplementation
- District health heatmaps, area coverage for ASHA workers
- Common childhood illnesses: ARI, diarrhea, malaria, dengue fever management

RESPONSE RULES:
1. Always respond in the SAME LANGUAGE the user writes in (Hindi, Bengali, Tamil, Telugu, etc.)
2. Keep responses concise but complete — use bullet points for lists
3. Always include emergency numbers when relevant: 108 (ambulance), 1800-180-1104 (child helpline), 104 (health helpline)
4. For dangerous symptoms (seizures, unconscious, severe breathing difficulty, severe dehydration), always say "Go to hospital immediately — call 108"
5. Give practical, actionable advice that ASHA workers and parents can follow
6. Use Indian medical terminology and reference Indian schemes by name
7. Format using markdown: **bold** for important items, bullet points (•) for lists
8. Never give wrong vaccine names or schedules — stick to India's NIS schedule
9. If you're unsure about a specific local detail, say so and direct to nearest PHC/CHC
10. Keep a warm, helpful, non-judgmental tone appropriate for rural/semi-urban Indian parents

KNOWLEDGE BASE TOPICS YOU ALWAYS KNOW:
- Complete IAP 2023 vaccination schedule
- SAM criteria: MUAC < 11.5cm, weight-for-height < -3SD, bilateral pitting edema
- MAM criteria: MUAC 11.5-12.5cm, weight-for-height -2SD to -3SD
- Normal developmental milestones: 0-60 months
- Breastfeeding: exclusive for 6 months, continue till 2 years with CF
- Complementary feeding starting at exactly 6 months
- ORS recipe: 1L water + 6 tsp sugar + 0.5 tsp salt
- Danger signs (IMCI): not able to drink, convulsions, lethargic, chest indrawing, stridor, severe pallor, severe dehydration, severe malnutrition
- Iron and folic acid supplementation for children
- Deworming: Albendazole 400mg for children 1-5 years (National Deworming Day)
- Vitamin A: 1 lakh IU at 9 months, 2 lakh IU every 6 months up to 5 years`;

// ─── NLP Setup (local KB) ─────────────────────────────────────────────────
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const classifier = new natural.BayesClassifier();
const tfidf = new natural.TfIdf();
const intentMap = {};
const intentDocs = {};
const patternDocs = [];

const SYNONYMS = {
  vaccination: ['vaccine', 'immunization', 'immunisation', 'teeka', 'tika'],
  baby: ['child', 'infant', 'newborn', 'kid', 'bachha', 'shishu'],
  weight: ['wt', 'bhaara', 'tola', 'wajan'],
  fever: ['temperature', 'bukhar', 'taap'],
  diarrhea: ['diarrhoea', 'loose motion', 'looose motion', 'loose stool', 'dast'],
  breastfeed: ['breastfeeding', 'nursing', 'breast milk', 'mother milk', 'stanpaan'],
  malnutrition: ['malnourish', 'underweight', 'sam', 'mam', 'wasting', 'stunting', 'kushposhan'],
  growth: ['height', 'length', 'development', 'milestone', 'vikas'],
  scheme: ['program', 'programme', 'yojana', 'benefit', 'sarkar'],
};

const FOLLOWUP_AFFIRMATIVES = ['yes', 'ok', 'okay', 'sure', 'tell me more', 'explain', 'more', 'details', 'detail', 'haan', 'ha'];
const FOLLOWUP_NEGATIVES = ['no', 'nope', 'nah', 'not now', 'later'];
const CONTEXTUAL_TERMS = ['more', 'details', 'explain', 'what else', 'next', 'then', 'how', 'why', 'when'];

function normalise(text) {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function stemQuery(text) {
  const tokens = tokenizer.tokenize(normalise(text)) || [];
  return tokens.map((t) => stemmer.stem(t)).join(' ');
}

function tokenSet(text) {
  return new Set((normalise(text).match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length > 1));
}

function jaccardScore(a, b) {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  aSet.forEach((t) => { if (bSet.has(t)) intersection += 1; });
  return intersection / new Set([...aSet, ...bSet]).size;
}

function typoSimilarity(query, pattern) {
  const q = normalise(query);
  const p = normalise(pattern);
  if (!q || !p) return 0;
  if (q === p) return 1;
  if (q.includes(p) || p.includes(q)) return 0.92;
  const distance = natural.LevenshteinDistance(q, p);
  return Math.max(0, 1 - distance / Math.max(q.length, p.length));
}

function expandPattern(pattern) {
  let variants = [pattern];
  const lower = pattern.toLowerCase();
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (lower.includes(key)) synonyms.forEach((s) => variants.push(lower.replace(new RegExp(key, 'gi'), s)));
    synonyms.forEach((s) => { if (lower.includes(s)) variants.push(lower.replace(new RegExp(s, 'gi'), key)); });
  }
  return [...new Set(variants)];
}

function tfidfIntentScores(query) {
  const scores = {};
  tfidf.tfidfs(normalise(query), (index, measure) => {
    const intent = KNOWLEDGE_BASE[index]?.intent;
    if (intent) scores[intent] = Math.max(scores[intent] || 0, measure);
  });
  return scores;
}

function keywordScore(query, entry) {
  const q = normalise(query);
  let score = 0;
  for (const pattern of entry.patterns) {
    const np = normalise(pattern);
    if (q === np) { score += 10; break; }
    if (q.includes(np)) score += 5;
    const pw = np.split(/\s+/);
    const qw = q.split(/\s+/);
    pw.forEach((p) => { if (p.length > 2 && qw.some((w) => w.includes(p) || p.includes(w))) score += 1; });
  }
  return score;
}

function semanticScore(query, entry) {
  const intentDoc = intentDocs[entry.intent] || '';
  const lexical = jaccardScore(query, intentDoc) * 3;
  const stemmed = jaccardScore(stemQuery(query), stemQuery(intentDoc)) * 2;
  let bestTypo = 0;
  for (const p of entry.patterns) bestTypo = Math.max(bestTypo, typoSimilarity(query, p));
  return lexical + stemmed + bestTypo * 4;
}

function bestPatternMatch(query) {
  let best = null;
  for (const doc of patternDocs) {
    const score = typoSimilarity(query, doc.raw) + jaccardScore(query, doc.raw);
    if (!best || score > best.score) best = { intent: doc.intent, score, pattern: doc.raw };
  }
  return best;
}

// Train classifier
KNOWLEDGE_BASE.forEach((item) => {
  intentMap[item.intent] = item.response;
  const allPatterns = [];
  item.patterns.forEach((pattern) => {
    expandPattern(pattern).forEach((variant) => {
      const tokens = tokenizer.tokenize(variant.toLowerCase()) || [];
      const stemmed = tokens.map((t) => stemmer.stem(t)).join(' ');
      classifier.addDocument(variant, item.intent);
      classifier.addDocument(stemmed, item.intent);
      allPatterns.push(variant);
      patternDocs.push({ intent: item.intent, raw: variant });
    });
  });
  intentDocs[item.intent] = allPatterns.join(' ');
});

classifier.train();
KNOWLEDGE_BASE.forEach((item) => tfidf.addDocument(intentDocs[item.intent] || ''));
console.log(`[Chatbot] NLP classifier trained on ${KNOWLEDGE_BASE.length} intents.`);

// ─── Local NLP classify ──────────────────────────────────────────────────
function classify(message, contextHint = '') {
  const norm = normalise(message);
  const stemmed = stemQuery(message);
  const classifications = classifier.getClassifications(norm);
  const stemClassifications = classifier.getClassifications(stemmed);
  const tfidfScores = tfidfIntentScores(norm);
  const merged = {};

  [...classifications, ...stemClassifications].forEach((item) => {
    merged[item.label] = (merged[item.label] || 0) + item.value;
  });

  Object.entries(tfidfScores).forEach(([intent, value]) => {
    merged[intent] = (merged[intent] || 0) + value * 0.7;
  });

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.intent === 'unknown') continue;
    merged[entry.intent] = (merged[entry.intent] || 0) + semanticScore(message, entry);
    merged[entry.intent] = (merged[entry.intent] || 0) + keywordScore(message, entry) * 0.35;
    if (contextHint && entry.intent === contextHint) {
      const hasContextCue = CONTEXTUAL_TERMS.some((t) => norm.includes(t));
      merged[entry.intent] += hasContextCue ? 1.6 : 0.4;
    }
  }

  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sorted[0] || ['unknown', 0];
  const [, secondScore] = sorted[1] || ['unknown', 0];
  const closePattern = bestPatternMatch(message);

  if ((!topIntent || topIntent === 'unknown' || topScore < 1.4) && closePattern?.score >= 1.05) {
    const rescued = KNOWLEDGE_BASE.find((e) => e.intent === closePattern.intent);
    if (rescued) return { intent: rescued.intent, response: rescued.response, method: 'pattern-similarity', score: closePattern.score };
  }

  if (!topIntent || topIntent === 'unknown' || topScore < 1.2 || (topScore - secondScore) < 0.18) {
    let bestScore = 0;
    let bestEntry = null;
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.intent === 'unknown') continue;
      const score = keywordScore(message, entry) + semanticScore(message, entry);
      if (score > bestScore) { bestScore = score; bestEntry = entry; }
    }
    if (bestScore > 1.1 && bestEntry) {
      return { intent: bestEntry.intent, response: bestEntry.response, method: 'hybrid-fallback', score: bestScore };
    }
    return { intent: 'unknown', response: null, method: 'unknown', score: 0 };
  }

  return { intent: topIntent, response: intentMap[topIntent], method: 'hybrid-nlp', score: topScore };
}

// ─── Gemini fallback ─────────────────────────────────────────────────────
async function askGemini(message, history = [], language = 'English') {
  if (!geminiModel) throw new Error('Gemini not configured');

  // Build conversation context from recent history (last 6 turns)
  const recentHistory = (history || []).slice(-6);
  let conversationContext = '';
  if (recentHistory.length > 0) {
    conversationContext = '\n\nRECENT CONVERSATION:\n' +
      recentHistory.map((h) => `${h.role === 'bot' ? 'Assistant' : 'User'}: ${h.text}`).join('\n');
  }

  const prompt = `${GEMINI_SYSTEM_PROMPT}${conversationContext}

USER LANGUAGE: ${language}
USER QUESTION: ${message}

Respond in ${language}. Be helpful, accurate, and concise.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  if (!text || !text.trim()) throw new Error('Empty response from Gemini');
  return text.trim();
}

// ─── Main handler ─────────────────────────────────────────────────────────
const query = async (req, res) => {
  try {
    const { message, history, language } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const trimmed = message.trim();
    const lang = language || 'English';
    let contextHint = '';

    if (Array.isArray(history) && history.length > 0) {
      const lastBot = [...history].reverse().find((item) => item.role === 'bot');
      if (lastBot && lastBot.intent) contextHint = lastBot.intent;
    }

    // Handle follow-up affirmatives using context
    if (FOLLOWUP_AFFIRMATIVES.includes(trimmed.toLowerCase()) && contextHint && intentMap[contextHint]) {
      return res.json({
        answer: intentMap[contextHint],
        intent: contextHint,
        method: 'context',
        source: 'local',
        timestamp: new Date().toISOString(),
        language: lang,
      });
    }

    // Handle follow-up negatives
    if (FOLLOWUP_NEGATIVES.includes(trimmed.toLowerCase())) {
      return res.json({
        answer: 'Okay. You can ask me anytime about vaccines, nutrition, child growth, danger signs, or government schemes.',
        intent: 'greeting',
        method: 'followup-negative',
        source: 'local',
        timestamp: new Date().toISOString(),
        language: lang,
      });
    }

    // Step 1: Try local NLP knowledge base
    const nlpResult = classify(trimmed, contextHint);

    // Step 2: If local KB has a confident answer, return it directly
    if (nlpResult.intent !== 'unknown' && nlpResult.response) {
      return res.json({
        answer: nlpResult.response,
        intent: nlpResult.intent,
        method: nlpResult.method,
        source: 'local',
        confidence: Number(nlpResult.score?.toFixed?.(3) || 0),
        timestamp: new Date().toISOString(),
        language: lang,
      });
    }

    // Step 3: Local KB doesn't know — ask Gemini
    if (geminiModel) {
      try {
        const geminiAnswer = await askGemini(trimmed, history, lang);
        return res.json({
          answer: geminiAnswer,
          intent: 'gemini_response',
          method: 'gemini-ai',
          source: 'gemini',
          timestamp: new Date().toISOString(),
          language: lang,
        });
      } catch (geminiErr) {
        console.error('[Chatbot] Gemini error:', geminiErr.message);
        // Fall through to hardcoded fallback
      }
    }

    // Step 4: Both failed — friendly fallback
    return res.json({
      answer: `I'm not sure about that specific question. For the best guidance:\n\n• **Call 104** — free health helpline (24/7)\n• **Call 108** — emergency ambulance\n• **Visit your nearest ASHA worker or PHC**\n\nYou can also ask me about:\n• Vaccination schedules\n• Child growth and nutrition\n• Government health schemes\n• Danger signs to watch for`,
      intent: 'unknown',
      method: 'hardcoded-fallback',
      source: 'local',
      timestamp: new Date().toISOString(),
      language: lang,
    });

  } catch (err) {
    console.error('[Chatbot] Error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.', error: err.message });
  }
};

module.exports = { query };
