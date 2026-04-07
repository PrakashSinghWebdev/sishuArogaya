import { useEffect, useRef, useState } from 'react';
import { chatbotAPI } from '../services/api';
import { LANGUAGES } from '../context/LanguageContext';
import { findAnswer } from '../data/chatbotKnowledge';

/* ─── Language-specific greetings & suggestions ──────────────────────────── */
const LANG_GREETINGS = {
  'English':    'Hello! 👋 I am your Sishu Arogaya health assistant. Ask me anything about child health, vaccines, nutrition, or government schemes!',
  'हिंदी':      'नमस्ते! 👋 मैं आपका शिशु आरोग्य स्वास्थ्य सहायक हूं। बच्चे के स्वास्थ्य, टीकाकरण, पोषण या सरकारी योजनाओं के बारे में कुछ भी पूछें!',
  'বাংলা':      'নমস্কার! 👋 আমি আপনার শিশু আরোগ্য স্বাস্থ্য সহায়ক। শিশুর স্বাস্থ্য, টিকা, পুষ্টি বা সরকারি প্রকল্প সম্পর্কে যেকোনো কিছু জিজ্ঞেস করুন!',
  'ਪੰਜਾਬੀ':    'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 👋 ਮੈਂ ਤੁਹਾਡਾ ਸਿਸ਼ੂ ਆਰੋਗਿਆ ਸਿਹਤ ਸਹਾਇਕ ਹਾਂ। ਬੱਚੇ ਦੀ ਸਿਹਤ, ਟੀਕਾਕਰਣ, ਪੋਸ਼ਣ ਜਾਂ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ!',
  'தமிழ்':      'வணக்கம்! 👋 நான் உங்கள் சிசு ஆரோக்கிய உதவியாளர். குழந்தை சுகாதாரம், தடுப்பூசி, ஊட்டச்சத்து அல்லது அரசு திட்டங்களைப் பற்றி எதையும் கேளுங்கள்!',
  'తెలుగు':     'నమస్కారం! 👋 నేను మీ శిశు ఆరోగ్య సహాయకుడిని. పిల్లల ఆరోగ్యం, టీకాలు, పోషణ లేదా ప్రభుత్వ పథకాల గురించి ఏదైనా అడగండి!',
  'मराठी':      'नमस्कार! 👋 मी तुमचा शिशू आरोग्य सहाय्यक आहे. मुलांचे आरोग्य, लसीकरण, पोषण किंवा सरकारी योजनांबद्दल काहीही विचारा!',
  'ગુજરાતી':    'નમસ્તે! 👋 હું તમારો શિશુ આરોગ્ય સહાયક છું. બાળ આરોગ્ય, રસીકરણ, પોષણ અથવા સરકારી યોજનાઓ વિશે કંઈ પણ પૂછો!',
  'ಕನ್ನಡ':      'ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ ಶಿಶು ಆರೋಗ್ಯ ಸಹಾಯಕ. ಮಕ್ಕಳ ಆರೋಗ್ಯ, ಲಸಿಕೆ, ಪೋಷಣೆ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!',
  'മലയാളം':     'നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ ശിശു ആരോഗ്യ സഹായിയാണ്. ശിശു ആരോഗ്യം, വാക്സിനേഷൻ, പോഷണം അല്ലെങ്കിൽ സർക്കാർ പദ്ധതികളെക്കുറിച്ച് എന്തും ചോദിക്കൂ!',
  'ଓଡ଼ିଆ':      'ନମସ୍କାର! 👋 ମୁଁ ଆପଣଙ୍କ ଶିଶୁ ଆରୋଗ୍ୟ ସହାୟକ। ଶିଶୁ ସ୍ୱାସ୍ଥ୍ୟ, ଟିକା, ପୋଷଣ ବା ସରକାରୀ ଯୋଜନା ବିଷୟରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାର!',
  'অসমীয়া':    'নমস্কাৰ! 👋 মই আপোনাৰ শিশু আৰোগ্য স্বাস্থ্য সহায়ক। শিশুৰ স্বাস্থ্য, ছিকা, পুষ্টি বা চৰকাৰী আঁচনিৰ বিষয়ে যিকোনো কথা সোধক!',
  'اردو':       '!السلام علیکم 👋 میں آپ کا شیشو آروگیہ صحت معاون ہوں۔ بچے کی صحت، ویکسین، غذائیت یا سرکاری اسکیموں کے بارے میں کچھ بھی پوچھیں',
  'नेपाली':     'नमस्ते! 👋 म तपाईंको शिशु आरोग्य स्वास्थ्य सहायक हुँ। बच्चाको स्वास्थ्य, खोप, पोषण वा सरकारी योजनाहरूबारे जे भए पनि सोध्नुहोस्!',
  'মৈতৈলোন্':  'খুরুমজরি! 👋 ঐ নুপা শিশু আরোগ্য চৎনবি য়ামখিবি। নুপামচাগী লমচৎ, ইনজেকশন, শজিল্লক্লবা অমদি সরকারগী প্লান শিংগী মতাংদা হন্না থাজিন্নহৌ!',
  'संस्कृत':   'नमस्ते! 👋 अहं भवतः शिशु-आरोग्य-सहायकः अस्मि। बालस्वास्थ्यं, टीकाकरणं, पोषणं सरकारीयोजनाः च विषये किमपि पृच्छतु!',
  'मैथिली':    'प्रणाम! 👋 हम अहाँक शिशु आरोग्य स्वास्थ्य सहायक छी। बच्चाक स्वास्थ्य, टीकाकरण, पोषण वा सरकारी योजना विषयमे कोनो बात पूछि सकैत छी!',
  'डोगरी':     'नमस्ते! 👋 मैं तुआडा शिशु आरोग्य स्वास्थ्य सहायक आं। बच्चे दी सेहत, टीकाकरण, पोषण ते सरकारी योजनाएं बारे कुछ भी पुच्छो!',
  'कोंकणी':    'देव बरे करूं! 👋 हांव तुमचो शिशु आरोग्य आरोग्य सहायक. भुरग्यांचें आरोग्य, रस, पोषण वा सरकारी योजनांविशीं कांयपूण विचारात!',
  'सिन्धी':    'जय जिंदगी! 👋 मांतुहांजो शिशु आरोग्य स्वास्थ्य सहायक आहियां। ٻار جي صحت، ويڪسين، غذائيت يا سرڪاري اسڪيمن بابت ڪجهه به پڇو!',
  'बड़ो':      'नमस्काराव! 👋 आं दिनैनि बोसोर शिशु आरोग्यनि स्वास्थ्य सहायक। बुथुर स्वास्थ्य, टिका, खाद्य सुरक्षा आरो सरकारनि योजनाफोरनि बिजिरनो दोनायखौ बिनि!',
  'ᱥᱟᱱᱛᱟᱲᱤ': 'ᱡᱳᱦᱟᱨ! 👋 ᱤᱧ ᱟᱢᱟᱜ ᱥᱤᱥᱷᱩ ᱟᱨᱳᱜᱭᱟ ᱥᱟᱶᱛᱮ ᱮᱸᱜᱮᱞ। ᱯᱤᱞᱪᱩ ᱥᱮᱦᱮᱛ, ᱴᱤᱠᱟ, ᱯᱳᱥᱱ ᱟᱨ ᱥᱚᱨᱠᱟᱨ ᱡᱳᱜᱟᱱ ᱠᱟᱛᱮ ᱠᱤᱪᱷᱩ ᱢᱮᱛᱟᱜ!',
  'कश्मीरी':   'آداب! 👋 میں آپنا شیشو آروگیہ صحت مددگار چھس۔ بچے کہ صحت، ویکسین، غذائیت تہ سرکاری اسکیماں بارے کیا بہ پوچھوو!',
};

const LANG_SUGGESTIONS = {
  'English':  ['Vaccination schedule', 'What is BCG vaccine?', 'Normal weight for baby', 'Signs of malnutrition', 'Emergency signs', 'Breastfeeding tips'],
  'हिंदी':    ['टीकाकरण कार्यक्रम', 'BCG टीका क्या है?', 'बच्चे का सामान्य वजन', 'कुपोषण के लक्षण', 'आपातकालीन संकेत', 'स्तनपान सुझाव'],
  'বাংলা':    ['টিকার সময়সূচি', 'BCG টিকা কি?', 'শিশুর স্বাভাবিক ওজন', 'অপুষ্টির লক্ষণ', 'জরুরি সংকেত', 'বুকের দুধ টিপস'],
  'ਪੰਜਾਬੀ':  ['ਟੀਕਾਕਰਣ ਸਮਾਂ-ਸਾਰਣੀ', 'BCG ਟੀਕਾ ਕੀ ਹੈ?', 'ਬੱਚੇ ਦਾ ਸਾਧਾਰਨ ਵਜ਼ਨ', 'ਕੁਪੋਸ਼ਣ ਦੇ ਲੱਛਣ', 'ਐਮਰਜੈਂਸੀ ਸੰਕੇਤ', 'ਦੁੱਧ ਚੁੰਘਾਉਣਾ ਸੁਝਾਅ'],
  'தமிழ்':   ['தடுப்பூசி அட்டவணை', 'BCG தடுப்பூசி என்ன?', 'குழந்தையின் சாதாரண எடை', 'ஊட்டச்சத்துக் குறைபாடு', 'அவசர அறிகுறிகள்', 'தாய்ப்பால் குறிப்புகள்'],
  'తెలుగు':  ['టీకా షెడ్యూల్', 'BCG టీకా అంటే ఏమిటి?', 'పిల్లల సాధారణ బరువు', 'పోషకాహార లోపం లక్షణాలు', 'అత్యవసర సంకేతాలు', 'తల్లి పాలు చిట్కాలు'],
  'मराठी':   ['लसीकरण वेळापत्रक', 'BCG लस म्हणजे काय?', 'बाळाचे सामान्य वजन', 'कुपोषणाची लक्षणे', 'आणीबाणीची चिन्हे', 'स्तनपान टिपा'],
  'ગુજરાતી': ['રસીકરણ સમયપત્રક', 'BCG રસી શું છે?', 'બાળકનું સામાન્ય વજન', 'કુપોષણના ચિહ્નો', 'ઇમર્જન્સી સંકેત', 'ધવડાવવાની ટિપ્સ'],
  'ಕನ್ನಡ':   ['ಲಸಿಕಾ ವೇಳಾಪಟ್ಟಿ', 'BCG ಲಸಿಕೆ ಎಂದರೇನು?', 'ಮಗುವಿನ ಸಾಮಾನ್ಯ ತೂಕ', 'ಅಪೌಷ್ಟಿಕತೆ ಲಕ್ಷಣ', 'ತುರ್ತು ಚಿಹ್ನೆಗಳು', 'ಎದೆ ಹಾಲು ಸಲಹೆಗಳು'],
  'മലയാളം':  ['വാക്സിനേഷൻ ഷെഡ്യൂൾ', 'BCG വാക്സിൻ എന്താണ്?', 'കുഞ്ഞിന്റെ സാധാരണ ഭാരം', 'പോഷകാഹാരക്കുറവ്', 'അടിയന്തര ലക്ഷണങ്ങൾ', 'മുലയൂട്ടൽ നുറുങ്ങുകൾ'],
};
// fallback suggestions for languages without specific entries
const DEFAULT_SUGGESTIONS = LANG_SUGGESTIONS['English'];

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
  // Persist chosen chat language across sessions
  const savedLang = localStorage.getItem('sa_chat_language');
  const [chatLang,  setChatLang]  = useState(savedLang || null);
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState(() => {
    const lang = localStorage.getItem('sa_chat_language');
    if (!lang) return [];
    return [{
      role: 'bot',
      text: LANG_GREETINGS[lang] || LANG_GREETINGS['English'],
      ts: Date.now(),
    }];
  });
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

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    // Focus input only if language already chosen
    if (chatLang) setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ── select chat language ── */
  function selectLanguage(lang) {
    setChatLang(lang);
    localStorage.setItem('sa_chat_language', lang);
    const greeting = LANG_GREETINGS[lang] || LANG_GREETINGS['English'];
    setMessages([{ role: 'bot', text: greeting, ts: Date.now() }]);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  /* ── change language (reset chat) ── */
  function changeLang() {
    setChatLang(null);
    localStorage.removeItem('sa_chat_language');
    setMessages([]);
  }

  /* ── send message ── */
  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msg, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await chatbotAPI.query(msg, nextHistory, chatLang || 'English');
      const answer = res.data?.answer || findAnswer(msg);
      const intent = res.data?.intent;
      setMessages(prev => [...prev, { role: 'bot', text: answer, intent, ts: Date.now() }]);
    } catch {
      const fallbackAnswer = findAnswer(msg);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: fallbackAnswer,
        intent: 'offline-fallback',
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
      text: chatLang ? (LANG_GREETINGS[chatLang] || LANG_GREETINGS['English']) : 'Chat cleared. How can I help you?',
      ts: Date.now(),
    }]);
  }

  const panelWidth  = 400;
  const chatWidth   = '100%';

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
                  {loading ? '● Thinking…' : chatLang ? `● ${chatLang} — Health & Vaccine Expert` : '● Select your language'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {/* Change Language */}
                {chatLang && (
                  <button
                    className="sb-btn"
                    onClick={changeLang}
                    title="Change language"
                    style={{
                      background: 'rgba(255,255,255,.18)',
                      border: '1px solid rgba(255,255,255,.4)',
                      borderRadius: 8, padding: '5px 8px',
                      color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >🌐</button>
                )}
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

            {/* ── Language selection screen ── */}
            {!chatLang ? (
              <div style={{
                flex: 1, overflowY: 'auto', padding: '18px 14px',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🌐</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>Choose your language</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a' }}>अपनी भाषा चुनें · ভাষা বেছে নিন · மொழியை தேர்ந்தெடுக்கவும்</div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 7,
                }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => selectLanguage(lang.code)}
                      style={{
                        padding: '9px 10px', borderRadius: 10,
                        border: '1.5px solid #c5e8ef',
                        background: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 13, fontWeight: 600, color: '#0c2340',
                        transition: 'all .15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0fdff'; e.currentTarget.style.borderColor = '#0891b2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c5e8ef'; }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{lang.flag}</span>
                      <span style={{ lineHeight: 1.25 }}>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
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
                    {(LANG_SUGGESTIONS[chatLang] || DEFAULT_SUGGESTIONS).map(s => (
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
              </>
            )}

            {/* Input row — only shown after language is chosen */}
            {chatLang && <div style={{
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
            </div>}

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

        </div>
      )}
    </>
  );
}
