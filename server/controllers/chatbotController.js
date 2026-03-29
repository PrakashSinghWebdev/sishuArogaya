const natural = require('natural');
const { KNOWLEDGE_BASE } = require('../data/chatbotKnowledge');

/* ─── Build & train classifier at startup ─────────────────────────────────── */
const tokenizer   = new natural.WordTokenizer();
const stemmer     = natural.PorterStemmer;
const classifier  = new natural.BayesClassifier();
const tfidf       = new natural.TfIdf();
const intentMap   = {};          // intent → response
const intentDocs  = {};          // intent → all pattern text (for TF-IDF)

// Augment patterns programmatically (synonyms / spelling variants)
const SYNONYMS = {
  'vaccination': ['vaccine', 'immunization', 'immunisation', 'टीका', 'टीकाकरण'],
  'baby':        ['child', 'infant', 'newborn', 'kid', 'bachha', 'shishu'],
  'weight':      ['wt', 'bhaara', 'tola'],
  'fever':       ['temperature', 'bukhar', 'taap'],
  'diarrhea':    ['diarrhoea', 'loose motion', 'looose motion', 'loose stool', 'dastarkhwan'],
  'breastfeed':  ['breastfeeding', 'nursing', 'breast milk', 'mother milk', 'stanpaan'],
  'malnutrition':['malnourish', 'underweight', 'sam', 'mam', 'wasting', 'stunting', 'kushposhan'],
  'growth':      ['height', 'length', 'development', 'milestone', 'vikas'],
  'scheme':      ['program', 'programme', 'yojana', 'benefit', 'sarkar'],
};

function expandPattern(pattern) {
  let variants = [pattern];
  const lower = pattern.toLowerCase();
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (lower.includes(key)) {
      for (const syn of syns) {
        variants.push(lower.replace(new RegExp(key, 'gi'), syn));
      }
    }
    for (const syn of syns) {
      if (lower.includes(syn)) {
        variants.push(lower.replace(new RegExp(syn, 'gi'), key));
      }
    }
  }
  return [...new Set(variants)];
}

// Train classifier
KNOWLEDGE_BASE.forEach(item => {
  intentMap[item.intent] = item.response;
  const allPatterns = [];
  item.patterns.forEach(p => {
    const expanded = expandPattern(p);
    expanded.forEach(variant => {
      // Stem each word for better matching
      const tokens  = tokenizer.tokenize(variant.toLowerCase()) || [];
      const stemmed = tokens.map(t => stemmer.stem(t)).join(' ');
      classifier.addDocument(variant, item.intent);
      classifier.addDocument(stemmed, item.intent);
      allPatterns.push(variant);
    });
  });
  intentDocs[item.intent] = allPatterns.join(' ');
});

classifier.train();

// Build TF-IDF index
KNOWLEDGE_BASE.forEach((item) => {
  tfidf.addDocument(intentDocs[item.intent] || '');
});

console.log(`[Chatbot] NLP classifier trained on ${KNOWLEDGE_BASE.length} intents.`);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemQuery(text) {
  const tokens = tokenizer.tokenize(normalise(text)) || [];
  return tokens.map(t => stemmer.stem(t)).join(' ');
}

// Keyword fallback scorer — phrase-level + word-level
function keywordScore(query, entry) {
  const q = normalise(query);
  let score = 0;
  for (const p of entry.patterns) {
    const pn = normalise(p);
    if (q === pn)          { score += 10; break; }
    if (q.includes(pn))    { score += 5; }
    const pWords = pn.split(/\s+/);
    const qWords = q.split(/\s+/);
    for (const pw of pWords) {
      if (pw.length > 2 && qWords.some(w => w.includes(pw) || pw.includes(w))) {
        score += 1;
      }
    }
  }
  return score;
}

/* ─── Main classify function ──────────────────────────────────────────────── */
function classify(message) {
  const norm    = normalise(message);
  const stemmed = stemQuery(message);

  // 1. Bayes classification
  const classifications = classifier.getClassifications(norm);
  const stemClass       = classifier.getClassifications(stemmed);

  // Merge: pick whichever has higher value for its top intent
  const merged = {};
  [...classifications, ...stemClass].forEach(c => {
    merged[c.label] = (merged[c.label] || 0) + c.value;
  });
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sorted[0] || ['unknown', 0];

  // 2. Keyword fallback if Bayes confidence is low
  const THRESHOLD = 0.15;
  if (!topIntent || topIntent === 'unknown' || topScore < THRESHOLD) {
    let bestScore = 0, bestEntry = null;
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.intent === 'unknown') continue;
      const s = keywordScore(message, entry);
      if (s > bestScore) { bestScore = s; bestEntry = entry; }
    }
    if (bestScore > 0 && bestEntry) {
      return { intent: bestEntry.intent, response: bestEntry.response, method: 'keyword', score: bestScore };
    }
    const unknown = KNOWLEDGE_BASE.find(k => k.intent === 'unknown');
    return { intent: 'unknown', response: unknown ? unknown.response : "I'm not sure about that. Please ask your ASHA worker or call 108.", method: 'fallback', score: 0 };
  }

  const response = intentMap[topIntent];
  return { intent: topIntent, response, method: 'bayes', score: topScore };
}

/* ─── POST /api/chatbot/query ─────────────────────────────────────────────── */
const query = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const trimmed = message.trim();

    // Context-aware: check last bot intent for follow-up handling
    let contextHint = '';
    if (Array.isArray(history) && history.length > 0) {
      const lastBot = [...history].reverse().find(h => h.role === 'bot');
      if (lastBot && lastBot.intent) contextHint = lastBot.intent;
    }

    // Short affirmative follow-ups mapped to context
    const FOLLOWUP_AFFIRMATIVES = ['yes', 'ok', 'sure', 'tell me more', 'explain', 'more', 'details', 'detail', 'haan', 'ha'];
    if (FOLLOWUP_AFFIRMATIVES.includes(trimmed.toLowerCase()) && contextHint && intentMap[contextHint]) {
      return res.json({
        answer: intentMap[contextHint],
        intent: contextHint,
        method: 'context',
        timestamp: new Date().toISOString(),
      });
    }

    const result = classify(trimmed);
    res.json({
      answer: result.response,
      intent: result.intent,
      method: result.method,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Chatbot] Error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { query };
