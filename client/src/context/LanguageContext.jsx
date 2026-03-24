import React, { createContext, useContext, useState } from 'react';

// ── Translation tables ──────────────────────────────────────────────────────
const T = {
  English: {
    // Nav
    dashboard: '🏠 Dashboard',
    myChild: '👶 My Child',
    vaccines: '💉 Vaccines',
    growth: '📈 Growth',
    dietPlan: '🥗 Diet Plan',
    schemes: '🏛️ Schemes',
    reports: '📋 Reports',
    notifications: '🔔 Notifications',
    settings: '⚙️ Settings',
    // Common
    welcome: 'Welcome back',
    addChild: 'Add Child',
    bookVaccine: 'Book Vaccine',
    logGrowth: 'Log Growth',
    downloadReport: 'Download Report',
    viewProfile: 'View Profile',
    healthScore: 'Health Score',
    // Settings page
    saveAll: '💾 Save All Changes',
    langTitle: 'Language Preference',
    langSub: 'Choose your preferred language',
    profileTitle: 'Parent / Guardian Profile',
    profileSub: 'Your registered account information',
    childInfoTitle: 'Child Information',
    childInfoSub: "Registered child's health profile",
    notifTitle: 'Notification Settings',
    notifSub: 'Manage what alerts you receive',
    secTitle: 'Security',
    secSub: 'Change your account password',
    // Reports
    downloadAll: '📥 Download All Reports',
    // Vaccination
    bookAppt: '📅 Book Appointment',
    vaccineCard: '💳 Vaccine Card',
    setReminder: '🔔 Set Reminder',
    bookNow: '📅 Book Now',
    // Schemes
    checkStatus: 'Check Status →',
    checkEligibility: 'Check Eligibility →',
  },
  हिंदी: {
    dashboard: '🏠 डैशबोर्ड',
    myChild: '👶 मेरा बच्चा',
    vaccines: '💉 टीकाकरण',
    growth: '📈 विकास',
    dietPlan: '🥗 आहार योजना',
    schemes: '🏛️ सरकारी योजनाएं',
    reports: '📋 रिपोर्ट',
    notifications: '🔔 सूचनाएं',
    settings: '⚙️ सेटिंग्स',
    welcome: 'वापस स्वागत है',
    addChild: 'बच्चा जोड़ें',
    bookVaccine: 'टीका बुक करें',
    logGrowth: 'विकास दर्ज करें',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    viewProfile: 'प्रोफाइल देखें',
    healthScore: 'स्वास्थ्य स्कोर',
    saveAll: '💾 सभी बदलाव सहेजें',
    langTitle: 'भाषा वरीयता',
    langSub: 'अपनी पसंदीदा भाषा चुनें',
    profileTitle: 'माता-पिता / अभिभावक प्रोफाइल',
    profileSub: 'आपकी पंजीकृत खाता जानकारी',
    childInfoTitle: 'बच्चे की जानकारी',
    childInfoSub: 'पंजीकृत बच्चे का स्वास्थ्य प्रोफाइल',
    notifTitle: 'सूचना सेटिंग्स',
    notifSub: 'प्रबंधित करें कि आपको कौन से अलर्ट मिलते हैं',
    secTitle: 'सुरक्षा',
    secSub: 'अपना खाता पासवर्ड बदलें',
    downloadAll: '📥 सभी रिपोर्ट डाउनलोड करें',
    bookAppt: '📅 अपॉइंटमेंट बुक करें',
    vaccineCard: '💳 वैक्सीन कार्ड',
    setReminder: '🔔 अनुस्मारक सेट करें',
    bookNow: '📅 अभी बुक करें',
    checkStatus: 'स्थिति जांचें →',
    checkEligibility: 'पात्रता जांचें →',
  },
  বাংলা: {
    dashboard: '🏠 ড্যাশবোর্ড',
    myChild: '👶 আমার শিশু',
    vaccines: '💉 টিকা',
    growth: '📈 বৃদ্ধি',
    dietPlan: '🥗 খাদ্য পরিকল্পনা',
    schemes: '🏛️ সরকারি প্রকল্প',
    reports: '📋 রিপোর্ট',
    notifications: '🔔 বিজ্ঞপ্তি',
    settings: '⚙️ সেটিংস',
    welcome: 'ফিরে স্বাগতম',
    addChild: 'শিশু যোগ করুন',
    bookVaccine: 'টিকা বুক করুন',
    logGrowth: 'বৃদ্ধি লগ করুন',
    downloadReport: 'রিপোর্ট ডাউনলোড করুন',
    viewProfile: 'প্রোফাইল দেখুন',
    healthScore: 'স্বাস্থ্য স্কোর',
    saveAll: '💾 সব পরিবর্তন সংরক্ষণ করুন',
    langTitle: 'ভাষা পছন্দ',
    langSub: 'আপনার পছন্দের ভাষা বেছে নিন',
    profileTitle: 'অভিভাবক প্রোফাইল',
    profileSub: 'আপনার নিবন্ধিত অ্যাকাউন্টের তথ্য',
    childInfoTitle: 'শিশুর তথ্য',
    childInfoSub: 'নিবন্ধিত শিশুর স্বাস্থ্য প্রোফাইল',
    notifTitle: 'বিজ্ঞপ্তি সেটিংস',
    notifSub: 'কোন সতর্কতা পাবেন তা পরিচালনা করুন',
    secTitle: 'নিরাপত্তা',
    secSub: 'আপনার অ্যাকাউন্ট পাসওয়ার্ড পরিবর্তন করুন',
    downloadAll: '📥 সব রিপোর্ট ডাউনলোড করুন',
    bookAppt: '📅 অ্যাপয়েন্টমেন্ট বুক করুন',
    vaccineCard: '💳 ভ্যাকসিন কার্ড',
    setReminder: '🔔 রিমাইন্ডার সেট করুন',
    bookNow: '📅 এখনই বুক করুন',
    checkStatus: 'স্থিতি পরীক্ষা করুন →',
    checkEligibility: 'যোগ্যতা পরীক্ষা করুন →',
  },
};

// Fallback to English for any missing key
function translate(lang, key) {
  return T[lang]?.[key] ?? T.English[key] ?? key;
}

// ── Context ─────────────────────────────────────────────────────────────────
const LanguageContext = createContext({
  language: 'English',
  setLanguage: () => {},
  t: (k) => k,
  navLinks: [],
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('sa_language') || 'English'
  );

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('sa_language', lang);
  };

  const t = (key) => translate(language, key);

  const navLinks = [
    [t('dashboard'),      '/parent/dashboard'],
    [t('myChild'),        '/parent/child-profile'],
    [t('vaccines'),       '/parent/vaccination'],
    [t('growth'),         '/parent/growth'],
    [t('dietPlan'),       '/parent/diet-plan'],
    [t('schemes'),        '/parent/schemes'],
    [t('reports'),        '/parent/reports'],
    [t('notifications'),  '/parent/notifications'],
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, navLinks }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
