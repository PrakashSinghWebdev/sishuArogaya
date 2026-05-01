import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';

export default function VoiceGuide() {
  const { lang } = useLanguage();
  const { pathname } = useLocation();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoNarrate, setAutoNarrate] = useState(false); // OFF by default
  const lastSpokenRef = useRef(null);
  const speakTimeoutRef = useRef(null);
  const femaleVoiceRef = useRef(null);

  const INTRO_TEXT = {
    en: `Welcome to Shishu Arogaya - India's child health platform. We help parents and health workers track vaccinations, monitor growth, get AI-powered health predictions, find government welfare schemes, and receive nutrition advice. ASHA workers can log home visits and track malnutrition cases. Admins can view district-wide health analytics and vaccination coverage. All features work in multiple Indian languages. Let's explore!`,
    hi: `शिशु आरोग्य में आपका स्वागत है - भारत का बाल स्वास्थ्य मंच। हम माता-पिता और स्वास्थ्य कार्यकर्ताओं को टीकाकरण ट्रैक करने, विकास की निगरानी करने, कृत्रिम बुद्धिमत्ता से स्वास्थ्य भविष्यवाणी पाने, सरकारी कल्याण योजनाएं खोजने और पोषण सलाह पाने में मदद करते हैं। ASHA कार्यकर्ता घर के दौरे दर्ज कर सकते हैं और कुपोषण के मामलों को ट्रैक कर सकते हैं। प्रशासक जिले भर के स्वास्थ्य विश्लेषण और टीकाकरण कवरेज देख सकते हैं। सभी फीचर भारतीय भाषाओं में काम करते हैं। चलिए शुरू करते हैं!`
  };

  const BUTTON_DESCRIPTIONS = {
    en: {
      'dashboard': 'Dashboard - View your child health overview and recent activities',
      'vaccination': 'Vaccination Schedule - Track and manage vaccine dates from 0-24 months',
      'growth': 'Growth Monitoring - Monitor your child weight, height and development',
      'diet': 'Diet Plan - Get personalized nutrition recommendations based on child age',
      'prediction': 'AI Health Prediction - Get artificial intelligence powered health analysis',
      'schemes': 'Government Schemes - Find welfare schemes your child is eligible for',
      'notifications': 'Notifications - Check alerts and reminders for health milestones',
      'settings': 'Settings - Manage your account preferences and privacy settings',
      'logout': 'Logout - Sign out from your account',
      'profile': 'Profile - View and edit your child information',
      'language': 'Language - Change website language to English or Hindi',
      'search': 'Search - Find children by ID or name',
      'add': 'Add - Create new record or add child',
      'edit': 'Edit - Modify information',
      'delete': 'Delete - Remove record permanently',
      'save': 'Save - Save your changes',
      'cancel': 'Cancel - Discard changes and go back',
      'download': 'Download - Save file to your device',
      'upload': 'Upload - Add file from your device',
      'print': 'Print - Print this page',
      'register': 'Register - Create new account',
      'login': 'Login - Sign in to your account',
      'home': 'Home - Go to home page',
      'report': 'Report - Generate health reports',
      'back': 'Back - Return to previous page',
      'next': 'Next - Go to next step',
      'submit': 'Submit - Submit form',
      'visit': 'Visit - Log home visit details',
      'track': 'Track - Track health metrics',
      'view': 'View - View detailed information',
    },
    hi: {
      'dashboard': 'डैशबोर्ड - अपने बच्चे के स्वास्थ्य का अवलोकन और हाल की गतिविधियां देखें',
      'vaccination': 'टीकाकरण समय सूची - 0-24 महीने की टीकाकरण तारीखें ट्रैक करें',
      'growth': 'विकास निगरानी - बच्चे के वजन, ऊंचाई और विकास की निगरानी करें',
      'diet': 'आहार योजना - बच्चे की उम्र के अनुसार व्यक्तिगत पोषण सिफारिशें पाएं',
      'prediction': 'एआई स्वास्थ्य भविष्यवाणी - कृत्रिम बुद्धिमत्ता से स्वास्थ्य विश्लेषण पाएं',
      'schemes': 'सरकारी योजनाएं - वे कल्याण योजनाएं खोजें जिसके लिए बच्चा पात्र है',
      'notifications': 'सूचनाएं - स्वास्थ्य मील के पत्थर के लिए सतर्कता जांचें',
      'settings': 'सेटिंग्स - खाता प्राथमिकताएं और गोपनीयता प्रबंधित करें',
      'logout': 'लॉगआउट - खाते से साइन आउट करें',
      'profile': 'प्रोफाइल - बच्चे की जानकारी देखें और संपादित करें',
      'language': 'भाषा - वेबसाइट की भाषा बदलें',
      'search': 'खोज - बच्चों को आईडी या नाम से खोजें',
      'add': 'जोड़ें - नया रिकॉर्ड बनाएं या बच्चा जोड़ें',
      'edit': 'संपादित करें - जानकारी संशोधित करें',
      'delete': 'हटाएं - रिकॉर्ड स्थायी रूप से हटाएं',
      'save': 'सहेजें - अपने परिवर्तन सहेजें',
      'cancel': 'रद्द करें - परिवर्तन छोड़ें और वापस जाएं',
      'download': 'डाउनलोड - फ़ाइल अपने डिवाइस पर सहेजें',
      'upload': 'अपलोड - अपने डिवाइस से फ़ाइल जोड़ें',
      'print': 'प्रिंट - इस पेज को प्रिंट करें',
      'register': 'पंजीकरण - नया खाता बनाएं',
      'login': 'लॉगिन - अपने खाते में साइन इन करें',
      'home': 'होम - होम पेज पर जाएं',
      'report': 'रिपोर्ट - स्वास्थ्य रिपोर्ट बनाएं',
      'back': 'पीछे - पिछले पेज पर जाएं',
      'next': 'अगला - अगले चरण पर जाएं',
      'submit': 'जमा करें - फॉर्म जमा करें',
      'visit': 'दौरा - घर के दौरे का विवरण दर्ज करें',
      'track': 'ट्रैक - स्वास्थ्य मेट्रिक्स ट्रैक करें',
      'view': 'देखें - विस्तृत जानकारी देखें',
    }
  };

  // Load available voices and find a Hindi female voice
  const loadVoices = useCallback(() => {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    // Try to find a Hindi female voice first
    const hindiFemale = voices.find(
      (v) => v.lang.startsWith('hi') && v.name.toLowerCase().includes('female')
    );
    const hindiAny = voices.find((v) => v.lang.startsWith('hi'));
    // Fallback: any female voice
    const anyFemale = voices.find(
      (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('swara')
    );

    femaleVoiceRef.current = hindiFemale || hindiAny || anyFemale || null;
  }, []);

  useEffect(() => {
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  useEffect(() => {
    if (pathname === '/') {
      const shown = localStorage.getItem('voice_intro_shown');
      if (!shown) {
        setShowPermissionModal(true);
        localStorage.setItem('voice_intro_shown', 'true');
      }
    }
  }, [pathname]);

  // Persist auto-narrate preference
  useEffect(() => {
    const saved = localStorage.getItem('voice_auto_narrate');
    if (saved !== null) {
      setAutoNarrate(saved === 'true');
    }
  }, []);

  const speakText = useCallback((text) => {
    if (!text || !window.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Prevent rapid repeated speech
    if (lastSpokenRef.current === text && speakTimeoutRef.current) {
      return;
    }

    window.speechSynthesis.cancel();
    clearTimeout(speakTimeoutRef.current);

    const isHindi = lang === 'हिंदी' || lang === 'hi';
    const utterance = new SpeechSynthesisUtterance(text);

    // Default to Hindi with female voice
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.rate = isHindi ? 0.7 : 0.8;
    utterance.pitch = 1.1; // Slightly higher pitch for feminine voice
    utterance.volume = 1;

    // Try to use a female voice
    if (femaleVoiceRef.current) {
      utterance.voice = femaleVoiceRef.current;
    } else {
      // Reload voices and try again
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) => (v.lang.startsWith('hi') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('swara')))
      ) || voices.find(
        (v) => v.lang.startsWith('hi')
      ) || voices.find(
        (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        femaleVoiceRef.current = femaleVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      lastSpokenRef.current = text;
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      speakTimeoutRef.current = setTimeout(() => {
        lastSpokenRef.current = null;
      }, 1000);
    };

    utterance.onerror = (error) => {
      setIsSpeaking(false);
      console.error('Speech error:', error);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error speaking:', err);
      setIsSpeaking(false);
    }
  }, [lang]);

  const handleYes = () => {
    setShowPermissionModal(false);
    setTimeout(() => {
      // Always speak in Hindi by default
      speakText(INTRO_TEXT.hi);
    }, 200);
  };

  const handleNo = () => {
    setShowPermissionModal(false);
  };

  // Get description for any element
  const getDescription = useCallback((element) => {
    if (!element) return null;

    const isHindi = lang === 'हिंदी' || lang === 'hi';
    const descriptions = isHindi ? BUTTON_DESCRIPTIONS.hi : BUTTON_DESCRIPTIONS.en;
    const dataDesc = element.getAttribute('data-voice-desc');

    // Priority 1: data-voice-desc attribute
    if (dataDesc) return dataDesc;

    // Priority 2: aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const ariaLower = ariaLabel.toLowerCase();
      for (const [key, desc] of Object.entries(descriptions)) {
        if (ariaLower.includes(key)) return desc;
      }
    }

    // Priority 3: Button text or id
    const text = (element.textContent || '').toLowerCase().trim();
    const id = (element.id || '').toLowerCase();
    const classList = element.className || '';

    for (const [key, desc] of Object.entries(descriptions)) {
      if (text.includes(key) || id.includes(key) || classList.includes(key)) {
        return desc;
      }
    }

    return null;
  }, [lang]);

  // Only attach auto-narration listeners if toggle is ON
  useEffect(() => {
    if (!autoNarrate) return;

    const handleInteraction = (e) => {
      if (isSpeaking) return;

      let target = e.target;
      let button = null;

      // Find button in event target or parents
      while (target && target !== document) {
        if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.getAttribute('role') === 'button') {
          button = target;
          break;
        }
        target = target.parentElement;
      }

      if (button) {
        const desc = getDescription(button);
        if (desc) {
          speakText(desc);
        }
      }
    };

    // Use capture phase to catch events
    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('mouseover', handleInteraction, true);

    return () => {
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('mouseover', handleInteraction, true);
    };
  }, [autoNarrate, isSpeaking, lang, getDescription, speakText]);

  const toggleAutoNarrate = () => {
    const newValue = !autoNarrate;
    setAutoNarrate(newValue);
    localStorage.setItem('voice_auto_narrate', String(newValue));
    // Stop any current speech when turning off
    if (!newValue && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const isHindi = lang === 'हिंदी' || lang === 'hi';

  return (
    <>
      {/* Floating Voice Controls */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
      }}>
        {/* Auto-narrate toggle */}
        <button
          onClick={toggleAutoNarrate}
          title={autoNarrate
            ? (isHindi ? 'स्वचालित आवाज़ बंद करें' : 'Turn off auto-narration')
            : (isHindi ? 'स्वचालित आवाज़ चालू करें' : 'Turn on auto-narration')
          }
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: autoNarrate ? '2px solid #0891b2' : '2px solid #94a3b8',
            background: autoNarrate ? 'linear-gradient(135deg, #0891b2, #0e7490)' : '#fff',
            color: autoNarrate ? '#fff' : '#64748b',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            transition: 'all 0.25s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {autoNarrate ? '🔊' : '🔇'}
        </button>

        {/* Main speak button */}
        <button
          onClick={() => {
            if (isSpeaking) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            } else {
              // Always speak intro in Hindi by default
              speakText(INTRO_TEXT.hi);
            }
          }}
          title={isSpeaking ? (isHindi ? 'रोकें' : 'Stop') : (isHindi ? 'हिंदी में परिचय सुनें' : 'Listen intro in Hindi')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: isSpeaking ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0891b2, #0e7490)',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(8, 145, 178, 0.4)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isSpeaking ? 'pulse-button 1.5s infinite' : 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = isSpeaking
              ? '0 6px 24px rgba(239, 68, 68, 0.6)'
              : '0 6px 24px rgba(8, 145, 178, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = isSpeaking
              ? '0 4px 16px rgba(239, 68, 68, 0.4)'
              : '0 4px 16px rgba(8, 145, 178, 0.4)';
          }}
        >
          {isSpeaking ? '⏹️' : '🎙️'}
        </button>
      </div>

      {/* Modal on home page */}
      {pathname === '/' && showPermissionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '40px 30px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>👶</div>

            <h2 style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#0c2340',
              marginBottom: '12px',
              margin: '0 0 12px 0'
            }}>
              क्या आप हिंदी में परिचय सुनना चाहते हैं?
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.6',
              marginBottom: '28px',
              margin: '0 0 28px 0'
            }}>
              मैं आपको शिशु आरोग्य के बारे में पूरी जानकारी हिंदी में दे सकती हूं
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleNo}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #0891b2',
                  background: '#fff',
                  color: '#0891b2',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f0f9ff';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                नहीं
              </button>

              <button
                onClick={handleYes}
                disabled={isSpeaking}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSpeaking ? '#4a7a8a' : 'linear-gradient(135deg, #0891b2, #0e7490)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSpeaking ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!isSpeaking) {
                    e.target.style.opacity = '0.9';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSpeaking) {
                    e.target.style.opacity = '1';
                  }
                }}
              >
                {isSpeaking ? (
                  <>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      background: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite'
                    }} />
                    सुन रहे हैं...
                  </>
                ) : (
                  <>
                    🎙️ हाँ, सुनें
                  </>
                )}
              </button>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '16px',
              margin: '16px 0 0 0'
            }}>
              ✨ वॉल्यूम चालू रखें | हिंदी में महिला आवाज़
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes pulse-button {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.8);
          }
        }
      `}</style>
    </>
  );
}
