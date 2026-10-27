// Shared LLM access: local Ollama first, Gemini as backup (only if GOOGLE_AI_API_KEY is set).
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 90000;

// A model answers a few requests at a time; under a burst, extra questions would wait minutes.
// Cap in-flight LLM calls per worker; overflow throws "busy" and the chatbot answers from its
// knowledge base instead. Tune LLM_MAX_CONCURRENT to what the model host can actually serve.
const { createGate } = require('./gate');
const gated = createGate({ maxRunning: Number(process.env.LLM_MAX_CONCURRENT) || 2, maxWaiting: 4 });

let geminiModel = null;
if (process.env.GOOGLE_AI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  geminiModel = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' });
}

async function askOllama(system, messages, options = {}, signal) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Also aborted when the user leaves: Ollama stops generating once the request is dropped
    signal: signal ? AbortSignal.any([AbortSignal.timeout(OLLAMA_TIMEOUT_MS), signal]) : AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
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
// `signal` (optional) cancels the call when the user has gone, queued or running.
async function chat(system, messages, options, signal) {
  return gated(() => chatNow(system, messages, options, signal), () => Boolean(signal?.aborted));
}

async function chatNow(system, messages, options, signal) {
  try {
    return { text: await askOllama(system, messages, options, signal), source: 'ollama' };
  } catch (e) {
    if (signal?.aborted) throw e; // user left: don't spend a Gemini call either
    console.warn('[LLM] Ollama unavailable:', e.message);
  }
  return { text: await askGemini(system, messages), source: 'gemini' };
}

module.exports = { chat };
