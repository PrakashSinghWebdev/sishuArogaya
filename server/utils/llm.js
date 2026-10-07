// Shared LLM access: local Ollama first, Gemini as backup (only if GOOGLE_AI_API_KEY is set).
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 90000;

let geminiModel = null;
if (process.env.GOOGLE_AI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  geminiModel = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' });
}

async function askOllama(system, messages, options = {}) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      options: { temperature: 0.3, repeat_penalty: 1.2, num_ctx: 4096, ...options },
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const text = (await res.json())?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Ollama');
  return text;
}

async function askGemini(system, messages) {
  if (!geminiModel) throw new Error('Gemini not configured');
  const convo = messages.map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n');
  const text = (await geminiModel.generateContent(`${system}\n\n${convo}`)).response.text();
  if (!text || !text.trim()) throw new Error('Empty response from Gemini');
  return text.trim();
}

// messages: [{ role: 'user' | 'assistant', content }]. Throws if no model is reachable.
async function chat(system, messages, options) {
  try {
    return { text: await askOllama(system, messages, options), source: 'ollama' };
  } catch (e) {
    console.warn('[LLM] Ollama unavailable:', e.message);
  }
  return { text: await askGemini(system, messages), source: 'gemini' };
}

module.exports = { chat };
