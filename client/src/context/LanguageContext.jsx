import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Supported languages ────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'English',  label: 'English',    flag: '🇬🇧', locale: ['en'] },
  { code: 'हिंदी',    label: 'हिंदी',      flag: '🇮🇳', locale: ['hi'] },
  { code: 'বাংলা',   label: 'বাংলা',      flag: '🇧🇩', locale: ['bn'] },
  { code: 'ਪੰਜਾਬੀ', label: 'ਪੰਜਾਬੀ',   flag: '🟠',  locale: ['pa'] },
  { code: 'தமிழ்',  label: 'தமிழ்',     flag: '🔴',  locale: ['ta'] },
  { code: 'తెలుగు', label: 'తెలుగు',    flag: '🟡',  locale: ['te'] },
  { code: 'मराठी',   label: 'मराठी',      flag: '🟣',  locale: ['mr'] },
];

// ── Translation tables ─────────────────────────────────────────────────────
const T = {
  English: {
    dashboard: '🏠 Dashboard',     myChild: '👶 My Child',
    vaccines:  '💉 Vaccines',      growth:  '📈 Growth',
    dietPlan:  '🥗 Diet Plan',     schemes: '🏛️ Schemes',
    reports:   '📋 Reports',       notifications: '🔔 Notifications',
    settings:  '⚙️ Settings',
    welcome: 'Welcome back',       addChild: 'Add Child',
    bookVaccine: 'Book Vaccine',   logGrowth: 'Log Growth',
    downloadReport: 'Download Report', viewProfile: 'View Profile',
    healthScore: 'Health Score',   saveAll: '💾 Save All Changes',
    langTitle: 'Language Preference', langSub: 'Choose your preferred language',
    profileTitle: 'Parent / Guardian Profile', profileSub: 'Your registered account information',
    childInfoTitle: 'Child Information', childInfoSub: "Registered child's health profile",
    notifTitle: 'Notification Settings', notifSub: 'Manage what alerts you receive',
    secTitle: 'Security', secSub: 'Change your account password',
    downloadAll: '📥 Download All Reports',
    bookAppt: '📅 Book Appointment', vaccineCard: '💳 Vaccine Card',
    setReminder: '🔔 Set Reminder',  bookNow: '📅 Book Now',
    checkStatus: 'Check Status →',   checkEligibility: 'Check Eligibility →',
    nearbyHospitals: '🏥 Nearby Hospitals', searchLocation: 'Search location…',
    recordGrowth: '📏 Record Growth', weightKg: 'Weight (kg)', heightCm: 'Height (cm)',
    save: 'Save', cancel: 'Cancel', markDone: 'Mark Done',
    dietPlanFor: 'Diet Plan for', ageMonths: 'months old',
  },
  हिंदी: {
    dashboard: '🏠 डैशबोर्ड',     myChild: '👶 मेरा बच्चा',
    vaccines:  '💉 टीकाकरण',      growth:  '📈 विकास',
    dietPlan:  '🥗 आहार योजना',   schemes: '🏛️ सरकारी योजनाएं',
    reports:   '📋 रिपोर्ट',      notifications: '🔔 सूचनाएं',
    settings:  '⚙️ सेटिंग्स',
    welcome: 'वापस स्वागत है',     addChild: 'बच्चा जोड़ें',
    bookVaccine: 'टीका बुक करें',  logGrowth: 'विकास दर्ज करें',
    downloadReport: 'रिपोर्ट डाउनलोड करें', viewProfile: 'प्रोफाइल देखें',
    healthScore: 'स्वास्थ्य स्कोर', saveAll: '💾 सभी बदलाव सहेजें',
    langTitle: 'भाषा वरीयता',     langSub: 'अपनी पसंदीदा भाषा चुनें',
    profileTitle: 'माता-पिता / अभिभावक प्रोफाइल', profileSub: 'आपकी पंजीकृत खाता जानकारी',
    childInfoTitle: 'बच्चे की जानकारी', childInfoSub: 'पंजीकृत बच्चे का स्वास्थ्य प्रोफाइल',
    notifTitle: 'सूचना सेटिंग्स', notifSub: 'प्रबंधित करें कि आपको कौन से अलर्ट मिलते हैं',
    secTitle: 'सुरक्षा', secSub: 'अपना खाता पासवर्ड बदलें',
    downloadAll: '📥 सभी रिपोर्ट डाउनलोड करें',
    bookAppt: '📅 अपॉइंटमेंट बुक करें', vaccineCard: '💳 वैक्सीन कार्ड',
    setReminder: '🔔 अनुस्मारक सेट करें', bookNow: '📅 अभी बुक करें',
    checkStatus: 'स्थिति जांचें →', checkEligibility: 'पात्रता जांचें →',
    nearbyHospitals: '🏥 नजदीकी अस्पताल', searchLocation: 'स्थान खोजें…',
    recordGrowth: '📏 विकास दर्ज करें', weightKg: 'वजन (किग्रा)', heightCm: 'ऊंचाई (सेमी)',
    save: 'सहेजें', cancel: 'रद्द करें', markDone: 'पूर्ण करें',
    dietPlanFor: 'आहार योजना',    ageMonths: 'महीने का',
  },
  বাংলা: {
    dashboard: '🏠 ড্যাশবোর্ড',  myChild: '👶 আমার শিশু',
    vaccines:  '💉 টিকা',         growth:  '📈 বৃদ্ধি',
    dietPlan:  '🥗 খাদ্য পরিকল্পনা', schemes: '🏛️ সরকারি প্রকল্প',
    reports:   '📋 রিপোর্ট',     notifications: '🔔 বিজ্ঞপ্তি',
    settings:  '⚙️ সেটিংস',
    welcome: 'ফিরে স্বাগতম',     addChild: 'শিশু যোগ করুন',
    bookVaccine: 'টিকা বুক করুন', logGrowth: 'বৃদ্ধি লগ করুন',
    downloadReport: 'রিপোর্ট ডাউনলোড করুন', viewProfile: 'প্রোফাইল দেখুন',
    healthScore: 'স্বাস্থ্য স্কোর', saveAll: '💾 সব পরিবর্তন সংরক্ষণ করুন',
    langTitle: 'ভাষা পছন্দ',     langSub: 'আপনার পছন্দের ভাষা বেছে নিন',
    profileTitle: 'অভিভাবক প্রোফাইল', profileSub: 'আপনার নিবন্ধিত অ্যাকাউন্টের তথ্য',
    childInfoTitle: 'শিশুর তথ্য', childInfoSub: 'নিবন্ধিত শিশুর স্বাস্থ্য প্রোফাইল',
    notifTitle: 'বিজ্ঞপ্তি সেটিংস', notifSub: 'কোন সতর্কতা পাবেন তা পরিচালনা করুন',
    secTitle: 'নিরাপত্তা', secSub: 'আপনার অ্যাকাউন্ট পাসওয়ার্ড পরিবর্তন করুন',
    downloadAll: '📥 সব রিপোর্ট ডাউনলোড করুন',
    bookAppt: '📅 অ্যাপয়েন্টমেন্ট বুক করুন', vaccineCard: '💳 ভ্যাকসিন কার্ড',
    setReminder: '🔔 রিমাইন্ডার সেট করুন', bookNow: '📅 এখনই বুক করুন',
    checkStatus: 'স্থিতি পরীক্ষা করুন →', checkEligibility: 'যোগ্যতা পরীক্ষা করুন →',
    nearbyHospitals: '🏥 কাছের হাসপাতাল', searchLocation: 'অবস্থান খুঁজুন…',
    recordGrowth: '📏 বৃদ্ধি রেকর্ড করুন', weightKg: 'ওজন (কেজি)', heightCm: 'উচ্চতা (সেমি)',
    save: 'সংরক্ষণ', cancel: 'বাতিল', markDone: 'সম্পন্ন করুন',
    dietPlanFor: 'খাদ্য পরিকল্পনা', ageMonths: 'মাস বয়সী',
  },
  ਪੰਜਾਬੀ: {
    dashboard: '🏠 ਡੈਸ਼ਬੋਰਡ',     myChild: '👶 ਮੇਰਾ ਬੱਚਾ',
    vaccines:  '💉 ਟੀਕਾਕਰਣ',      growth:  '📈 ਵਿਕਾਸ',
    dietPlan:  '🥗 ਖੁਰਾਕ ਯੋਜਨਾ', schemes: '🏛️ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ',
    reports:   '📋 ਰਿਪੋਰਟ',      notifications: '🔔 ਸੂਚਨਾਵਾਂ',
    settings:  '⚙️ ਸੈਟਿੰਗਾਂ',
    welcome: 'ਵਾਪਸ ਸੁਆਗਤ ਹੈ',    addChild: 'ਬੱਚਾ ਜੋੜੋ',
    bookVaccine: 'ਟੀਕਾ ਬੁੱਕ ਕਰੋ', logGrowth: 'ਵਿਕਾਸ ਦਰਜ ਕਰੋ',
    downloadReport: 'ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ', viewProfile: 'ਪ੍ਰੋਫਾਈਲ ਦੇਖੋ',
    healthScore: 'ਸਿਹਤ ਸਕੋਰ',    saveAll: '💾 ਸਾਰੀਆਂ ਤਬਦੀਲੀਆਂ ਸੇਵ ਕਰੋ',
    langTitle: 'ਭਾਸ਼ਾ ਤਰਜੀਹ',    langSub: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ',
    profileTitle: 'ਮਾਤਾ-ਪਿਤਾ ਪ੍ਰੋਫਾਈਲ', profileSub: 'ਤੁਹਾਡੀ ਰਜਿਸਟਰਡ ਖਾਤਾ ਜਾਣਕਾਰੀ',
    childInfoTitle: 'ਬੱਚੇ ਦੀ ਜਾਣਕਾਰੀ', childInfoSub: 'ਰਜਿਸਟਰਡ ਬੱਚੇ ਦਾ ਸਿਹਤ ਪ੍ਰੋਫਾਈਲ',
    notifTitle: 'ਸੂਚਨਾ ਸੈਟਿੰਗਾਂ', notifSub: 'ਅਲਰਟ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
    secTitle: 'ਸੁਰੱਖਿਆ', secSub: 'ਪਾਸਵਰਡ ਬਦਲੋ',
    downloadAll: '📥 ਸਾਰੀਆਂ ਰਿਪੋਰਟਾਂ ਡਾਊਨਲੋਡ ਕਰੋ',
    bookAppt: '📅 ਅਪੌਇੰਟਮੈਂਟ ਬੁੱਕ ਕਰੋ', vaccineCard: '💳 ਵੈਕਸੀਨ ਕਾਰਡ',
    setReminder: '🔔 ਯਾਦ ਦਿਵਾਉਣਾ ਸੈਟ ਕਰੋ', bookNow: '📅 ਹੁਣੇ ਬੁੱਕ ਕਰੋ',
    checkStatus: 'ਸਥਿਤੀ ਜਾਂਚੋ →', checkEligibility: 'ਯੋਗਤਾ ਜਾਂਚੋ →',
    nearbyHospitals: '🏥 ਨੇੜਲੇ ਹਸਪਤਾਲ', searchLocation: 'ਸਥਾਨ ਖੋਜੋ…',
    recordGrowth: '📏 ਵਿਕਾਸ ਦਰਜ ਕਰੋ', weightKg: 'ਭਾਰ (ਕਿਲੋ)', heightCm: 'ਕੱਦ (ਸੈ.ਮੀ.)',
    save: 'ਸੇਵ ਕਰੋ', cancel: 'ਰੱਦ ਕਰੋ', markDone: 'ਪੂਰਾ ਕਰੋ',
    dietPlanFor: 'ਖੁਰਾਕ ਯੋਜਨਾ', ageMonths: 'ਮਹੀਨੇ ਦੀ ਉਮਰ',
  },
  தமிழ்: {
    dashboard: '🏠 டாஷ்போர்டு',  myChild: '👶 என் குழந்தை',
    vaccines:  '💉 தடுப்பூசி',   growth:  '📈 வளர்ச்சி',
    dietPlan:  '🥗 உணவு திட்டம்', schemes: '🏛️ அரசு திட்டங்கள்',
    reports:   '📋 அறிக்கைகள்',  notifications: '🔔 அறிவிப்புகள்',
    settings:  '⚙️ அமைப்புகள்',
    welcome: 'மீண்டும் வரவேற்கிறோம்', addChild: 'குழந்தை சேர்க்கவும்',
    bookVaccine: 'தடுப்பூசி பதிவு',   logGrowth: 'வளர்ச்சி பதிவு',
    downloadReport: 'அறிக்கை பதிவிறக்கு', viewProfile: 'சுயவிவரம் பார்க்கவும்',
    healthScore: 'சுகாதார மதிப்பெண்',  saveAll: '💾 அனைத்தையும் சேமிக்கவும்',
    langTitle: 'மொழி விருப்பம்',      langSub: 'விருப்பமான மொழியை தேர்ந்தெடுக்கவும்',
    profileTitle: 'பெற்றோர் சுயவிவரம்', profileSub: 'பதிவு செய்யப்பட்ட கணக்கு தகவல்',
    childInfoTitle: 'குழந்தை தகவல்',  childInfoSub: 'பதிவு செய்யப்பட்ட குழந்தையின் சுகாதார சுயவிவரம்',
    notifTitle: 'அறிவிப்பு அமைப்புகள்', notifSub: 'எச்சரிக்கைகளை நிர்வகிக்கவும்',
    secTitle: 'பாதுகாப்பு', secSub: 'கடவுச்சொல் மாற்றவும்',
    downloadAll: '📥 அனைத்து அறிக்கைகளையும் பதிவிறக்கவும்',
    bookAppt: '📅 நேரம் பதிவு', vaccineCard: '💳 தடுப்பூசி அட்டை',
    setReminder: '🔔 நினைவூட்டல் அமை', bookNow: '📅 இப்போது பதிவு',
    checkStatus: 'நிலையை சரிபார்க்கவும் →', checkEligibility: 'தகுதியை சரிபார்க்கவும் →',
    nearbyHospitals: '🏥 அருகிலுள்ள மருத்துவமனைகள்', searchLocation: 'இடம் தேடவும்…',
    recordGrowth: '📏 வளர்ச்சி பதிவு', weightKg: 'எடை (கிகி)', heightCm: 'உயரம் (செமீ)',
    save: 'சேமிக்கவும்', cancel: 'ரத்து', markDone: 'முடிந்தது',
    dietPlanFor: 'உணவு திட்டம்', ageMonths: 'மாத வயது',
  },
  తెలుగు: {
    dashboard: '🏠 డాష్‌బోర్డ్',  myChild: '👶 నా పిల్లవాడు',
    vaccines:  '💉 టీకాలు',       growth:  '📈 పెరుగుదల',
    dietPlan:  '🥗 ఆహార ప్రణాళిక', schemes: '🏛️ ప్రభుత్వ పథకాలు',
    reports:   '📋 నివేదికలు',    notifications: '🔔 నోటిఫికేషన్లు',
    settings:  '⚙️ సెట్టింగులు',
    welcome: 'తిరిగి స్వాగతం',    addChild: 'పిల్లవాడిని జోడించు',
    bookVaccine: 'టీకా బుక్ చేయి', logGrowth: 'పెరుగుదల నమోదు',
    downloadReport: 'నివేదిక డౌన్‌లోడ్', viewProfile: 'ప్రొఫైల్ చూడు',
    healthScore: 'ఆరోగ్య స్కోరు',  saveAll: '💾 అన్ని మార్పులు సేవ్ చేయి',
    langTitle: 'భాష ప్రాధాన్యత',  langSub: 'మీకు నచ్చిన భాష ఎంచుకోండి',
    profileTitle: 'తల్లిదండ్రుల ప్రొఫైల్', profileSub: 'మీ నమోదు ఖాతా సమాచారం',
    childInfoTitle: 'పిల్లల సమాచారం', childInfoSub: 'నమోదు చేయబడిన పిల్లల ఆరోగ్య ప్రొఫైల్',
    notifTitle: 'నోటిఫికేషన్ సెట్టింగులు', notifSub: 'హెచ్చరికలు నిర్వహించండి',
    secTitle: 'భద్రత', secSub: 'పాస్‌వర్డ్ మార్చు',
    downloadAll: '📥 అన్ని నివేదికలు డౌన్‌లోడ్ చేయి',
    bookAppt: '📅 అపాయింట్‌మెంట్ బుక్', vaccineCard: '💳 టీకా కార్డు',
    setReminder: '🔔 రిమైండర్ సెట్', bookNow: '📅 ఇప్పుడు బుక్',
    checkStatus: 'స్థితి తనిఖీ చేయి →', checkEligibility: 'అర్హత తనిఖీ →',
    nearbyHospitals: '🏥 సమీప ఆసుపత్రులు', searchLocation: 'స్థానం వెతుకు…',
    recordGrowth: '📏 పెరుగుదల నమోదు', weightKg: 'బరువు (కిలో)', heightCm: 'ఎత్తు (సెంమీ)',
    save: 'సేవ్', cancel: 'రద్దు', markDone: 'పూర్తయింది',
    dietPlanFor: 'ఆహార ప్రణాళిక', ageMonths: 'నెలల వయస్సు',
  },
  मराठी: {
    dashboard: '🏠 डॅशबोर्ड',    myChild: '👶 माझे मूल',
    vaccines:  '💉 लसीकरण',      growth:  '📈 वाढ',
    dietPlan:  '🥗 आहार योजना',  schemes: '🏛️ सरकारी योजना',
    reports:   '📋 अहवाल',       notifications: '🔔 सूचना',
    settings:  '⚙️ सेटिंग्ज',
    welcome: 'पुन्हा स्वागत आहे', addChild: 'मूल जोडा',
    bookVaccine: 'लस बुक करा',    logGrowth: 'वाढ नोंदवा',
    downloadReport: 'अहवाल डाउनलोड करा', viewProfile: 'प्रोफाइल पहा',
    healthScore: 'आरोग्य स्कोर',  saveAll: '💾 सर्व बदल जतन करा',
    langTitle: 'भाषा प्राधान्य', langSub: 'आपली पसंदीची भाषा निवडा',
    profileTitle: 'पालक प्रोफाइल', profileSub: 'नोंदणीकृत खाते माहिती',
    childInfoTitle: 'मुलाची माहिती', childInfoSub: 'नोंदणीकृत मुलाचे आरोग्य प्रोफाइल',
    notifTitle: 'सूचना सेटिंग्ज', notifSub: 'अलर्ट व्यवस्थापित करा',
    secTitle: 'सुरक्षा', secSub: 'पासवर्ड बदला',
    downloadAll: '📥 सर्व अहवाल डाउनलोड करा',
    bookAppt: '📅 अपॉइंटमेंट बुक करा', vaccineCard: '💳 लस कार्ड',
    setReminder: '🔔 आठवण सेट करा', bookNow: '📅 आता बुक करा',
    checkStatus: 'स्थिती तपासा →', checkEligibility: 'पात्रता तपासा →',
    nearbyHospitals: '🏥 जवळचे रुग्णालय', searchLocation: 'ठिकाण शोधा…',
    recordGrowth: '📏 वाढ नोंदवा', weightKg: 'वजन (किलो)', heightCm: 'उंची (सेमी)',
    save: 'जतन करा', cancel: 'रद्द करा', markDone: 'पूर्ण करा',
    dietPlanFor: 'आहार योजना', ageMonths: 'महिने वयाचे',
  },
};

// Fallback to English for any missing key
function translate(lang, key) {
  return T[lang]?.[key] ?? T.English[key] ?? key;
}

// ── Country → Language mapping ──────────────────────────────────────────
const COUNTRY_LANG = {
  'IN': 'हिंदी',
  'PK': 'English',
  'CA': 'English',
  'GB': 'English',
  'US': 'English',
  'AU': 'English',
  'SG': 'English',
  'LK': 'English',
  'BD': 'বাংলা',
  'PB': 'ਪੰਜਾਬੀ',  // Punjab
  'TN': 'தமிழ்',   // Tamil Nadu
  'TG': 'తెలుగు',  // Telangana
  'MH': 'मराठी',   // Maharashtra
};

// ── Enhanced location-based detection ─────────────────────────────────────
async function detectLanguage() {
  const saved = localStorage.getItem('sa_language');
  if (saved) return saved;

  try {
    // 1. GPS (most accurate)
    const pos = await new Promise((resolve, reject) => 
      navigator.geolocation.getCurrentPosition(resolve, reject, { 
        timeout: 8000, enableHighAccuracy: true 
      })
    );
    const { latitude, longitude } = pos.coords;
    
    // Reverse geocode
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const geoData = await geoRes.json();
    const suggested = COUNTRY_LANG[geoData.countryCode] || COUNTRY_LANG['IN'];
    if (suggested && LANGUAGES.some(l => l.code === suggested)) {
      return suggested;
    }
  } catch (gpsErr) {
    // 2. IP geolocation fallback
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      const suggested = COUNTRY_LANG[ipData.country_code] || 'English';
      if (LANGUAGES.some(l => l.code === suggested)) {
        return suggested;
      }
    } catch (ipErr) {
      console.log('Location detection failed, using browser fallback');
    }
  }

  // 3. Browser locale fallback (original logic)
  const browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
  for (const lang of LANGUAGES) {
    if (lang.locale.includes(browserLang)) return lang.code;
  }
  return 'English';
}

// ── Context ────────────────────────────────────────────────────────────────
const LanguageContext = createContext({
  language: 'English',
  setLanguage: () => {},
  t: (k) => k,
  navLinks: [],
  suggestedLanguage: null,
  dismissSuggestion: () => {},
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('English');
  const [suggestedLanguage, setSuggestedLanguageState] = useState(null);

  // Initialize language detection
  useEffect(() => {
    detectLanguage().then(setLanguageState).catch(() => {});
    if (localStorage.getItem('sa_language')) return; // already manually set
    const browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
    for (const lang of LANGUAGES) {
      if (lang.locale.includes(browserLang) && lang.code !== language) {
        setSuggestedLanguageState(lang.code);
        break;
      }
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('sa_language', lang);
    setSuggestedLanguageState(null);
  };

  const dismissSuggestion = () => setSuggestedLanguageState(null);

  const t = (key) => translate(language, key);

  const navLinks = [
    [t('dashboard'),     '/parent/dashboard'],
    [t('myChild'),       '/parent/child-profile'],
    [t('vaccines'),      '/parent/vaccination'],
    [t('growth'),        '/parent/growth'],
    [t('dietPlan'),      '/parent/diet-plan'],
    [t('schemes'),       '/parent/schemes'],
    [t('reports'),       '/parent/reports'],
    [t('notifications'), '/parent/notifications'],
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, navLinks, suggestedLanguage, dismissSuggestion }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
