import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { chatbotAPI } from '../services/api';

const HospitalMap = lazy(() => import('./HospitalMap'));

/* ─── Suggested quick questions ─────────────────────────────────────────── */
const SUGGESTIONS = [
  'Vaccination schedule',
  'What is BCG vaccine?',
  'Normal weight for 6 month baby',
  'What is malnutrition?',
  'Signs of emergency',
  'What is ICDS scheme?',
  'Diarrhea treatment',
  'Fever in baby',
  'Breastfeeding tips',
  'Baby milestones',
];

/* ─── Markdown-lite renderer ─────────────────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^• (.+)$/gm,     '<div style="display:flex;gap:6px;margin-bottom:3px"><span style="color:#0891b2;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^✅ (.+)$/gm,    '<div style="display:flex;gap:6px;margin-bottom:3px"><span style="flex-shrink:0">✅</span><span>$1</span></div>')
    .replace(/^🚨 (.+)$/gm,    '<div style="display:flex;gap:6px;margin-bottom:3px"><span style="flex-shrink:0">🚨</span><span style="color:#b91c1c;font-weight:600">$1</span></div>')
    .replace(/^⚠️ (.+)$/gm,   '<div style="display:flex;gap:6px;margin-bottom:3px;padding:6px 10px;background:#fef3c7;border-radius:7px"><span style="flex-shrink:0">⚠️</span><span>$1</span></div>')
    .replace(/^📞 (.+)$/gm,    '<div style="display:flex;gap:6px;margin-bottom:3px"><span style="flex-shrink:0">📞</span><span style="color:#059669;font-weight:600">$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

/* ─── Single chat message ─────────────────────────────────────────────────── */
function Message({ role, text, ts }) {
  const isBot = role === 'bot';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isBot ? 'row' : 'row-reverse',
      gap: 8,
      marginBottom: 14,
      alignItems: 'flex-start',
      animation: 'fadeUp .25s ease',
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isBot ? 'linear-gradient(135deg,#0891b2,#0e7490)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#fff', fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      }}>
        {isBot ? '🤖' : '👤'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        background: isBot ? '#fff' : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
        border: isBot ? '1px solid #c5e8ef' : 'none',
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.65,
        color: isBot ? '#0c2340' : '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
      }}>
        {isBot
          ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          : <span>{text}</span>
        }
        <div style={{ fontSize: 10, opacity: .55, marginTop: 5, textAlign: isBot ? 'left' : 'right' }}>
          {new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

/* ─── Typing indicator ───────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
      <div style={{ background: '#fff', border: '1px solid #c5e8ef', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#0891b2',
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main ChatBot widget ─────────────────────────────────────────────────── */
export default function ChatBot() {
  const [open,     setOpen]     = useState(false);
  const [showMap,  setShowMap]  = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Namaste! 🙏 I am Sishu Arogaya's health assistant.\n\nI can answer questions about:\n• Vaccines and immunization schedule\n• Child growth and nutrition\n• Government health schemes\n• Common illnesses and home care\n• Emergency warning signs\n\nHow can I help you today?`,
      ts: Date.now(),
    },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [listening, setListening] = useState(false);
  const [unread,   setUnread]   = useState(0);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const recognRef   = useRef(null);

  /* ── scroll to bottom on new message ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── unread badge ── */
  useEffect(() => {
    if (!open && messages.length > 1) setUnread(prev => prev + 1);
  }, [messages]); // eslint-disable-line

  const openChat = () => { setOpen(true); setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); };

  /* ── send message ── */
  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatbotAPI.query(msg);
      setMessages(prev => [...prev, { role: 'bot', text: res.data.answer, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '⚠️ Sorry, I could not connect to the health assistant right now. Please try again in a moment.\n\nFor urgent medical queries, please contact your ASHA worker or call 108.',
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  /* ── voice recognition ── */
  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported by your browser. Please use Chrome or Edge.');
      return;
    }

    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart  = () => setListening(true);
    recog.onend    = () => setListening(false);
    recog.onerror  = () => setListening(false);
    recog.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput(transcript);
        setTimeout(() => send(transcript), 200);
      }
    };

    recognRef.current = recog;
    recog.start();
  }

  /* ── clear chat ── */
  function clearChat() {
    setMessages([{
      role: 'bot',
      text: 'Chat cleared. How can I help you?',
      ts: Date.now(),
    }]);
  }

  const panelWidth  = showMap ? 860 : 380;
  const chatWidth   = showMap ? 360 : '100%';
  const mapWidth    = 480;

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes pulse     { 0%,100% { box-shadow:0 0 0 0 rgba(8,145,178,.4); } 50% { box-shadow:0 0 0 10px rgba(8,145,178,0); } }
        .chat-panel-enter    { animation: fadeUp .3s ease; }
        .sb-btn:hover        { filter: brightness(1.08); transform: scale(1.05); }
        .sb-btn              { transition: filter .15s, transform .15s; }
        .suggestion-chip:hover { background:#e0f2fe !important; border-color:#0891b2 !important; }
        .chat-input:focus    { outline:none; border-color:#0891b2 !important; }

        /* Leaflet override inside chat panel */
        .leaflet-container { font-family: 'DM Sans', sans-serif; border-radius: 12px; }
        .leaflet-popup-content-wrapper { border-radius: 10px; padding: 4px; }
      `}</style>

      {/* ── Floating trigger button ── */}
      {!open && (
        <button
          onClick={openChat}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            width: 60, height: 60, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            color: '#fff', fontSize: 26, cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(8,145,178,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}
          title="Open Health Assistant"
        >
          🤖
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 20,
              padding: '2px 6px', minWidth: 18, textAlign: 'center',
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat + Map panel ── */}
      {open && (
        <div
          className="chat-panel-enter"
          style={{
            position: 'fixed',
            bottom: 24, right: 24,
            zIndex: 9999,
            width: panelWidth,
            maxWidth: 'calc(100vw - 32px)',
            height: 580,
            maxHeight: 'calc(100vh - 80px)',
            display: 'flex',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,.22), 0 6px 20px rgba(8,145,178,.15)',
            border: '1px solid #c5e8ef',
            background: '#f0fdff',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* ── CHAT COLUMN ── */}
          <div style={{
            width: chatWidth,
            minWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            background: '#f0fdff',
            flexShrink: 0,
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#0891b2,#0e7490)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Sishu Arogaya Assistant</div>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>
                  {loading ? '● Thinking…' : '● Online — Health & Vaccine Expert'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {/* Map toggle */}
                <button
                  className="sb-btn"
                  onClick={() => setShowMap(v => !v)}
                  title={showMap ? 'Hide hospital map' : 'Show hospital map'}
                  style={{
                    background: showMap ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.4)',
                    borderRadius: 8, padding: '5px 8px',
                    color: '#fff', cursor: 'pointer', fontSize: 14,
                  }}
                >🗺️</button>
                {/* Clear */}
                <button
                  className="sb-btn"
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.4)',
                    borderRadius: 8, padding: '5px 8px',
                    color: '#fff', cursor: 'pointer', fontSize: 14,
                  }}
                >🗑️</button>
                {/* Close */}
                <button
                  className="sb-btn"
                  onClick={() => setOpen(false)}
                  title="Close"
                  style={{
                    background: 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.4)',
                    borderRadius: 8, padding: '5px 8px',
                    color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                  }}
                >✕</button>
              </div>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 14px 8px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {messages.map((m, i) => (
                <Message key={i} role={m.role} text={m.text} ts={m.ts} />
              ))}
              {loading && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestion chips */}
            {messages.length <= 2 && !loading && (
              <div style={{
                padding: '6px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                borderTop: '1px solid #e0f2fe',
                background: '#fff',
                flexShrink: 0,
              }}>
                {SUGGESTIONS.slice(0, 6).map(s => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => send(s)}
                    style={{
                      padding: '4px 10px', borderRadius: 20,
                      border: '1.5px solid #c5e8ef',
                      background: '#f0fdff', color: '#0e7490',
                      fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >{s}</button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid #c5e8ef',
              background: '#fff',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}>
              {/* Voice button */}
              <button
                className="sb-btn"
                onClick={toggleVoice}
                title={listening ? 'Stop recording' : 'Speak your question'}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: `2px solid ${listening ? '#ef4444' : '#c5e8ef'}`,
                  background: listening ? '#fee2e2' : '#f0fdff',
                  color: listening ? '#ef4444' : '#0891b2',
                  fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  animation: listening ? 'pulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {listening ? '🔴' : '🎤'}
              </button>

              {/* Text input */}
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder={listening ? 'Listening… speak your question' : 'Type your health question here…'}
                rows={1}
                style={{
                  flex: 1, resize: 'none',
                  border: '1.5px solid #c5e8ef',
                  borderRadius: 12, padding: '9px 12px',
                  fontSize: 13, fontFamily: 'inherit',
                  color: '#0c2340', background: '#f0fdff',
                  lineHeight: 1.5, maxHeight: 90, overflowY: 'auto',
                }}
              />

              {/* Send button */}
              <button
                className="sb-btn"
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg,#0891b2,#0e7490)'
                    : '#c5e8ef',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                  color: '#fff', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {loading
                  ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                  : '➤'
                }
              </button>
            </div>

            {/* Disclaimer */}
            <div style={{
              padding: '5px 12px 8px',
              fontSize: 10,
              color: '#4a7a8a',
              textAlign: 'center',
              background: '#fff',
              borderTop: '1px solid #f0f9ff',
              flexShrink: 0,
            }}>
              🏥 For medical emergencies call 108 · This assistant provides general health guidance only
            </div>
          </div>

          {/* ── MAP COLUMN ── */}
          {showMap && (
            <div style={{
              width: mapWidth,
              borderLeft: '1px solid #c5e8ef',
              background: '#0c2340',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Map header */}
              <div style={{
                background: '#0c2340',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ color: '#cffafe', fontWeight: 700, fontSize: 13 }}>🗺️ India Health Facilities</div>
                  <div style={{ color: 'rgba(207,250,254,.6)', fontSize: 10 }}>Zoom in to see hospitals near you</div>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, padding: '3px 8px', color: '#cffafe', fontSize: 12, cursor: 'pointer' }}
                >Hide</button>
              </div>

              {/* Leaflet map */}
              <div style={{ flex: 1, padding: '0 8px 8px' }}>
                <Suspense fallback={
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cffafe', fontSize: 13 }}>
                    Loading map…
                  </div>
                }>
                  <HospitalMap height="100%" />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
