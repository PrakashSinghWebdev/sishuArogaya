import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const NAV = [
  ['🏠 Dashboard', '/parent/dashboard'],
  ['👶 My Child', '/parent/child-profile'],
  ['💉 Vaccines', '/parent/vaccination'],
  ['📈 Growth', '/parent/growth'],
  ['🥗 Diet Plan', '/parent/diet-plan'],
  ['🏛️ Schemes', '/parent/schemes'],
  ['📋 Reports', '/parent/reports'],
  ['🔔 Notifications', '/parent/notifications'],
];

const SLIDES = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
];

const LANGUAGES = ['English', 'हिंदी', 'বাংলা', 'తెలుగు', 'தமிழ்', 'ਪੰਜਾਬੀ', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം'];

const NOTIF_LABELS = {
  vaccines: { label: 'Vaccine Reminders', desc: 'Alerts for upcoming vaccine due dates', icon: '💉' },
  growth: { label: 'Growth Updates', desc: 'Monthly growth monitoring reminders', icon: '📈' },
  asha: { label: 'ASHA Alerts', desc: 'Messages from your assigned ASHA worker', icon: '👩‍⚕️' },
  schemes: { label: 'Scheme Updates', desc: 'Government health scheme notifications', icon: '🏛️' },
  tips: { label: 'Health Tips', desc: 'Weekly health and nutrition tips', icon: '💡' },
  emergency: { label: 'Emergency Alerts', desc: 'Critical health warnings and emergencies', icon: '🚨' },
};

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: on ? '#0891b2' : '#c5e8ef',
        position: 'relative', transition: 'background .25s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        left: on ? 23 : 3, transition: 'left .25s',
      }} />
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { language, setLanguage, t } = useLanguage();
  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load notification settings from localStorage
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_notif_settings');
      return saved ? JSON.parse(saved) : {
        vaccines: true, growth: true, asha: true, schemes: true, tips: false, emergency: true,
      };
    } catch { return { vaccines: true, growth: true, asha: true, schemes: true, tips: false, emergency: true }; }
  });

  useEffect(() => {
    timerRef.current = setInterval(() => setCur(p => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  // Persist notification settings whenever they change
  useEffect(() => {
    localStorage.setItem('sa_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) { setError('Please fill all password fields.'); return; }
    if (newPass !== confirmPass) { setError('New passwords do not match.'); return; }
    if (newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
      setMsg('Password changed successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = () => {
    if (currentPass || newPass || confirmPass) handleChangePassword();
    else { setMsg('Preferences saved successfully!'); setTimeout(() => setMsg(''), 3000); }
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setMsg(`Language changed to ${lang}!`);
    setTimeout(() => setMsg(''), 3000);
  };

  const inputStyle = {
    width: '100%', padding: '10px 13px', border: '1.5px solid #c5e8ef',
    borderRadius: 10, background: '#f0fdff', fontFamily: "'DM Sans',sans-serif",
    fontSize: 13, color: '#0c2340', outline: 'none',
  };

  const infoRow = (icon, label, value) => (
    <div style={{ display: 'flex', gap: 12, background: '#f0fdff', border: '1px solid #c5e8ef', borderRadius: 10, padding: '11px 14px', alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#cffafe', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#4a7a8a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0c2340', marginTop: 2 }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f8fffe', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .wrap{max-width:1280px;margin:0 auto;padding:24px 28px 60px}
        .g31{display:grid;grid-template-columns:2fr 1fr;gap:24px}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .glang{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        @media(max-width:1024px){.g31{grid-template-columns:1fr}.g2{grid-template-columns:1fr 1fr}}
        @media(max-width:768px){.navlinks{display:none!important}.g2{grid-template-columns:1fr}.wrap{padding:20px 16px 60px}}
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', height: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: '2px solid #cffafe', boxShadow: '0 2px 16px rgba(8,145,178,.1)' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 20 }}>🏥</div>
          <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#0891b2' }}>Sishu Arogaya</div>
        </Link>
        <div className="navlinks" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, marginLeft: 8 }}>
          {NAV.map(([label, to]) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', background: active ? '#f0fdff' : 'transparent', color: active ? '#0e7490' : '#4a7a8a' }}>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ height: 240, position: 'relative', overflow: 'hidden', background: '#0e7490' }}>
        {SLIDES.map((src, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: cur === i ? 1 : 0, transition: 'opacity .9s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(14,116,144,.88) 0%,rgba(8,145,178,.72) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(207,250,254,.18)', border: '1px solid rgba(207,250,254,.4)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#cffafe', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14, width: 'fit-content' }}>🏥 Settings</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>
            Account &amp; <span style={{ color: '#cffafe' }}>Preferences</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 10, maxWidth: 420 }}>Manage your profile, security settings, and notification preferences.</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: 24, display: 'flex', gap: 6, zIndex: 2 }}>
          {SLIDES.map((_, i) => <div key={i} onClick={() => setCur(i)} style={{ width: cur === i ? 22 : 8, height: 8, borderRadius: 4, background: cur === i ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      {/* Main content */}
      <div className="wrap">
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>⚙️ Settings &amp; Profile</h2>
            <p style={{ fontSize: 13, color: '#4a7a8a' }}>Manage your account, child info, and preferences</p>
          </div>
          <button
            onClick={handleSaveAll}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#0891b2,#0e7490)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(8,145,178,.3)' }}
          >
            {t('saveAll')}
          </button>
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
            ✓ {msg}
          </div>
        )}

        {/* 2-column grid */}
        <div className="g31">
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Card: Parent / Guardian Profile */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .4s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#cffafe', display: 'grid', placeItems: 'center', fontSize: 16 }}>👤</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>{t('profileTitle')}</div>
                    <div style={{ fontSize: 12, color: '#4a7a8a' }}>{t('profileSub')}</div>
                  </div>
                </div>
                <button onClick={() => navigate('/parent/child-profile')} style={{ padding: '6px 14px', background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0e7490', cursor: 'pointer' }}>✏️ Edit</button>
              </div>
              <div style={{ padding: 20 }}>
                <div className="g2">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Full Name</div>
                    <input style={inputStyle} value={user?.name || ''} readOnly placeholder="Parent Name" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Father's Name</div>
                    <input style={inputStyle} placeholder="Father's Name" defaultValue="" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Mobile Number</div>
                    <input style={inputStyle} placeholder="Mobile Number" defaultValue="" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Email</div>
                    <input style={inputStyle} value={user?.email || ''} readOnly placeholder="Email Address" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Address</div>
                    <input style={inputStyle} placeholder="Full Address" defaultValue="" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Pincode</div>
                    <input style={inputStyle} placeholder="Pincode" defaultValue="" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>District</div>
                    <input style={inputStyle} placeholder="District" defaultValue="" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>State</div>
                    <input style={inputStyle} placeholder="State" defaultValue="" />
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#4a7a8a', background: '#f0fdff', border: '1px solid #c5e8ef', borderRadius: 8, padding: '9px 13px' }}>
                  ℹ️ To update contact details, please reach out to your ASHA worker or Admin.
                </div>
              </div>
            </div>

            {/* Card: Child Information */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .5s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dcfce7', display: 'grid', placeItems: 'center', fontSize: 16 }}>👶</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>{t('childInfoTitle')}</div>
                    <div style={{ fontSize: 12, color: '#4a7a8a' }}>{t('childInfoSub')}</div>
                  </div>
                </div>
                <button onClick={() => navigate('/parent/child-profile')} style={{ padding: '6px 14px', background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0e7490', cursor: 'pointer' }}>✏️ Edit</button>
              </div>
              <div style={{ padding: 20 }}>
                <div className="g2" style={{ gap: 10 }}>
                  {infoRow('👶', 'Child Name', selectedChild?.name || 'Not registered')}
                  {infoRow('🎂', 'Date of Birth', selectedChild?.dob ? new Date(selectedChild.dob).toLocaleDateString('en-IN') : 'Not set')}
                  {infoRow('⚧', 'Gender', selectedChild?.gender || 'Not set')}
                  {infoRow('🩸', 'Blood Group', selectedChild?.bloodGroup || 'Not set')}
                  {infoRow('🪪', 'Child ID', selectedChild?._id ? selectedChild._id.slice(-8).toUpperCase() : 'Not registered')}
                  {infoRow('👩‍⚕️', 'ASHA Worker', selectedChild?.ashaWorker?.name || 'Not assigned')}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link to="/parent/child-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0891b2', textDecoration: 'none' }}>
                    👶 View child profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Card: Language Preference */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .4s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dbeafe', display: 'grid', placeItems: 'center', fontSize: 16 }}>🌐</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>{t('langTitle')}</div>
                  <div style={{ fontSize: 12, color: '#4a7a8a' }}>{t('langSub')}</div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div className="glang">
                  {LANGUAGES.map(lang => {
                    const sel = language === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => handleSelectLanguage(lang)}
                        style={{
                          padding: '9px 10px', borderRadius: 8, fontSize: 13, fontWeight: sel ? 700 : 500,
                          border: sel ? '1.5px solid #0891b2' : '1.5px solid #c5e8ef',
                          background: sel ? '#f0fdff' : '#fff',
                          color: sel ? '#0e7490' : '#4a7a8a',
                          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s',
                        }}
                      >
                        <span>{lang}</span>
                        {sel && <span style={{ color: '#0891b2', fontWeight: 800 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#4a7a8a', background: '#f0fdff', border: '1px solid #c5e8ef', borderRadius: 8, padding: '8px 12px' }}>
                  🌐 Selected: <strong style={{ color: '#0e7490' }}>{language}</strong> — navigation and labels will update across all pages.
                </div>
              </div>
            </div>

            {/* Card: Notification Settings */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .5s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef3c7', display: 'grid', placeItems: 'center', fontSize: 16 }}>🔔</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>{t('notifTitle')}</div>
                  <div style={{ fontSize: 12, color: '#4a7a8a' }}>{t('notifSub')}</div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {Object.entries(NOTIF_LABELS).map(([key, cfg]) => (
                  <div
                    key={key}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: '1px solid #f0fdff' }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0fdff', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0c2340' }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: '#4a7a8a' }}>{cfg.desc}</div>
                    </div>
                    <Toggle
                      on={notifSettings[key]}
                      onToggle={() => setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Security */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .6s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fee2e2', display: 'grid', placeItems: 'center', fontSize: 16 }}>🔒</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>{t('secTitle')}</div>
                  <div style={{ fontSize: 12, color: '#4a7a8a' }}>{t('secSub')}</div>
                </div>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {msg && !currentPass && (
                  <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#15803d' }}>✓ {msg}</div>
                )}
                {error && (
                  <div style={{ padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#ef4444' }}>⚠ {error}</div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Current Password</div>
                  <input
                    type="password"
                    style={inputStyle}
                    value={currentPass}
                    onChange={e => { setCurrentPass(e.target.value); setError(''); setMsg(''); }}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>New Password</div>
                  <input
                    type="password"
                    style={inputStyle}
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Confirm New Password</div>
                  <input
                    type="password"
                    style={inputStyle}
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setError(''); }}
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '11px 16px', background: saving ? '#c5e8ef' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(239,68,68,.3)',
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      Updating...
                    </>
                  ) : '🔒 Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #c5e8ef', fontSize: 12, color: '#4a7a8a' }}>
          Sishu Arogaya &copy; 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
        </div>
      </div>
    </div>
  );
}
