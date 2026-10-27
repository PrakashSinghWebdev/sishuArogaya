import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { ashaAPI, messageAPI, notificationAPI } from '../services/api';
import logo from '../assets/logo-mark.jpg';
import { TEXT_SIZES, getTextSize, applyTextSize } from '../utils/textSize';

// Top navigation for every ASHA page: section menus, record search (Ctrl+K), unread badges,
// language and profile. On phones the section menus hide (the bottom tab bar takes over).
const MENU = [
  { key: 'navDashboard', icon: 'bi-house-door-fill', to: '/asha/dashboard' },
  { key: 'families', icon: 'bi-people', match: ['/asha/families'], items: [
    { key: 'families', to: '/asha/families' },
    { key: 'registerChild', to: '/asha/register-child' },
  ] },
  { key: 'navChildren', icon: 'bi-emoji-smile', match: ['/asha/children', '/asha/child/', '/asha/register-child', '/asha/growth-records'], items: [
    { key: 'myChildren', to: '/asha/children' },
    { key: 'growthRecords', to: '/asha/growth-records' },
    { key: 'registerChild', to: '/asha/register-child' },
  ] },
  { key: 'maternalCare', icon: 'bi-person-standing-dress', match: ['/asha/maternal-care', '/asha/pregnancy/'], items: [
    { key: 'pregnantWomen', to: '/asha/maternal-care' },
    { key: 'registerPregnancy', to: '/asha/maternal-care?new=1' },
  ] },
  { key: 'navVaccination', icon: 'bi-eyedropper', match: ['/asha/vaccination-tracker', '/asha/camps'], items: [
    { key: 'vaccinationTracker', to: '/asha/vaccination-tracker' },
    { key: 'healthCampaigns', to: '/asha/camps' },
  ] },
  { key: 'navNutrition', icon: 'bi-apple', match: ['/asha/malnutrition-report'], items: [
    { key: 'malnutritionReport', to: '/asha/malnutrition-report' },
    { key: 'growthRecords', to: '/asha/growth-records' },
  ] },
  { key: 'myVisits', icon: 'bi-calendar-check', match: ['/asha/my-visits', '/asha/log-visit', '/asha/visit-history'], items: [
    { key: 'myVisits', to: '/asha/my-visits' },
    { key: 'logVisit', to: '/asha/log-visit' },
    { key: 'visitHistory', to: '/asha/visit-history' },
  ] },
  { key: 'navReports', icon: 'bi-bar-chart-line', match: ['/asha/generate-report', '/asha/incentives'], items: [
    { key: 'monthlyReport', to: '/asha/generate-report' },
    { key: 'incentiveClaims', to: '/asha/incentives' },
  ] },
  { key: 'navMore', icon: 'bi-grid-3x3-gap-fill', match: ['/asha/referrals', '/asha/messages', '/asha/notifications', '/asha/settings'], items: [
    { key: 'referrals', to: '/asha/referrals' },
    { key: 'supervisorMessages', to: '/asha/messages' },
    { key: 'notificationsNav', to: '/asha/notifications' },
    { key: 'settingsNav', to: '/asha/settings' },
  ] },
];

const initials = (name) => String(name || 'A').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const plain = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim(); // drop leading emoji from old labels

export default function AshaNavbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(null); // which dropdown is open
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [textSize, setTextSize] = useState(getTextSize());
  const barRef = useRef(null);
  const searchRef = useRef(null);

  // Unread badges: on load, on page change, and every minute
  useEffect(() => {
    const refresh = () => Promise.all([
      notificationAPI.list().then((r) => (r.data || []).filter((n) => !n.isRead).length).catch(() => 0),
      messageAPI.unreadCount().then((r) => r.data.count).catch(() => 0),
    ]).then(([notifications, messages]) => setCounts({ notifications, messages }));
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [pathname]);

  useEffect(() => { setOpen(null); setResults(null); setQ(''); }, [pathname, search]);

  // Close menus on outside click / Escape; Ctrl+K (⌘K) focuses search
  useEffect(() => {
    const onClick = (e) => { if (!barRef.current?.contains(e.target)) { setOpen(null); setResults(null); } };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setOpen(null); setResults(null); }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  // Debounced record search
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return undefined; }
    const id = setTimeout(() => {
      ashaAPI.search(q.trim()).then((r) => { setResults(r.data); setActive(0); }).catch(() => setResults({ children: [], mothers: [] }));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const hits = results ? [
    ...results.children.map((c) => ({ id: c._id, to: `/asha/child/${c._id}`, icon: c.gender === 'female' ? '👧' : '👦', title: c.name, sub: [c.childId, c.motherName && `${t('mother')}: ${c.motherName}`, c.village].filter(Boolean).join(' · ') })),
    ...results.mothers.map((m) => ({ id: m._id, to: `/asha/pregnancy/${m._id}`, icon: '🤰', title: m.womanName, sub: [t(m.status === 'pregnant' ? 'tabPregnant' : m.status === 'delivered' ? 'tabPostnatal' : 'refClosed'), m.village].filter(Boolean).join(' · ') })),
  ] : [];

  function onSearchKey(e) {
    if (!hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
    if (e.key === 'Enter') { e.preventDefault(); navigate(hits[active].to); }
  }

  const isActive = (m) => (m.to ? pathname === m.to : m.match.some((p) => pathname.startsWith(p)));
  const toggle = (key) => { setLangOpen(false); setSizeOpen(false); setOpen((o) => (o === key ? null : key)); };
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <nav ref={barRef} className="asha-navbar" aria-label="ASHA">
      <style>{`
        .asha-navbar{position:sticky;top:0;z-index:1030;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(15,23,42,.06);display:flex;align-items:center;gap:8px;padding:3px 12px;font-family:'DM Sans','Segoe UI',sans-serif}
        .asha-navbar .an-menu{display:flex;align-items:stretch;gap:2px;margin:0;padding:0;list-style:none}
        .asha-navbar .an-item{position:relative}
        .asha-navbar .an-btn{display:flex;flex-direction:column;align-items:center;gap:0;padding:4px 7px;border:0;border-radius:8px;background:none;color:#334155;font-size:11px;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap;min-width:52px}
        .asha-navbar .an-btn i.bi:first-child{font-size:17px;line-height:1.1}
        .asha-navbar .an-btn:hover{background:#f1f5f9}
        .asha-navbar .an-btn.is-active{background:#e8f5e9;color:#166534}
        .asha-navbar .an-btn.is-active i.bi:first-child{color:#166534}
        .asha-navbar .an-caret{font-size:8px;margin-left:2px}
        .asha-navbar .an-drop{position:absolute;top:calc(100% + 4px);left:0;min-width:210px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.14);padding:6px;z-index:1040}
        .asha-navbar .an-drop a,.asha-navbar .an-drop button{display:block;width:100%;text-align:left;padding:7px 10px;border-radius:8px;color:#0f172a;font-size:13px;text-decoration:none;border:0;background:none}
        .asha-navbar .an-drop a:hover,.asha-navbar .an-drop button:hover,.asha-navbar .an-drop .is-on{background:#f0fdf4;color:#166534}
        .asha-navbar .an-sep{width:1px;align-self:stretch;background:#e2e8f0;margin:5px 2px}
        .asha-navbar .an-search{position:relative;width:250px;margin-right:4px}
        .asha-navbar .an-search input{width:100%;border:1px solid #cbd5e1;border-radius:999px;padding:5px 62px 5px 32px;font-size:13px;background:#f8fafc;outline:none}
        .asha-navbar .an-search input:focus{border-color:#16a34a;background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.15)}
        .asha-navbar .an-search .bi-search{position:absolute;left:12px;font-size:13px;top:50%;transform:translateY(-50%);color:#64748b}
        .asha-navbar .an-kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#64748b;border:1px solid #cbd5e1;border-radius:6px;padding:1px 6px;background:#fff}
        .asha-navbar .an-results{left:0;right:0;min-width:0;max-height:380px;overflow:auto}
        .asha-navbar .an-icon{position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;color:#334155;font-size:18px;text-decoration:none}
        .asha-navbar .an-icon:hover{background:#f1f5f9}
        .asha-navbar .an-badge{position:absolute;top:0;right:-2px;background:#ea580c;color:#fff;font-size:9.5px;font-weight:700;border-radius:999px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}
        .asha-navbar .an-profile{display:flex;align-items:center;gap:7px;border:0;background:none;border-radius:999px;padding:2px 6px;color:#0f172a;font-weight:600;font-size:12.5px}
        .asha-navbar .an-profile:hover{background:#f1f5f9}
        .asha-navbar .an-drop .an-drop-label{padding:6px 10px 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
        .asha-navbar .an-drop hr{margin:4px 0;border-color:#e2e8f0}
        .asha-navbar .an-me{right:0;left:auto;width:300px;max-width:calc(100vw - 16px);max-height:calc(100vh - 70px);overflow-y:auto;padding:8px}
        .asha-navbar .an-me-head{display:flex;align-items:center;gap:10px;padding:8px 8px 10px;border-bottom:1px solid #f1f5f9;margin-bottom:4px}
        .asha-navbar .an-drop .an-me-row{display:flex;align-items:center;gap:10px}
        .asha-navbar .an-me-row > i:first-child{font-size:16px;width:18px;text-align:center;color:#334155}
        .asha-navbar .an-me-row.text-danger > i:first-child{color:#dc2626}
        .asha-navbar .an-me-row > span{flex:1}
        .asha-navbar .an-me-row > i:last-child:not(:first-child){font-size:12px;color:#64748b}
        .asha-navbar .an-me-sub{margin:0 0 4px 28px;border-left:2px solid #e2e8f0;max-height:200px;overflow-y:auto}
        .asha-navbar .an-me-sub button{padding:6px 10px;font-size:13px}
        .asha-navbar .an-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0891b2,#16a34a);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0}
        .asha-navbar .an-right{display:flex;align-items:center;gap:6px;margin-left:auto;padding-left:8px}
        .asha-navbar .an-brand{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;padding-right:2px}
        .asha-navbar .an-brand img{width:34px;height:34px;border-radius:8px;object-fit:contain}
        .asha-navbar .an-brand-text{display:flex;flex-direction:column;line-height:1.1}
        .asha-navbar .an-brand-name{font-family:'Libre Baskerville',Georgia,serif;font-weight:700;font-size:14px;color:#166534;white-space:nowrap}
        .asha-navbar .an-brand-sub{font-size:10px;color:#64748b;white-space:nowrap}
        .asha-navbar .an-menu{flex-shrink:1;min-width:0}
        @media(max-width:1499px){.asha-navbar .an-brand-text{display:none}.asha-navbar .an-search{width:200px}}
        @media(max-width:1399px){.asha-navbar .an-btn{min-width:46px;padding:4px 5px;font-size:10.5px}}
        @media(max-width:1199px){.asha-navbar .an-menu{display:none}.asha-navbar .an-brand-text{display:flex}.asha-navbar .an-right{flex:1;justify-content:flex-end}.asha-navbar .an-search{flex:1;width:auto;max-width:420px}}
        @media(max-width:575px){.asha-navbar{padding:3px 8px}.asha-navbar .an-kbd,.asha-navbar .an-who,.asha-navbar .an-brand-text{display:none}.asha-navbar .an-search input{padding-right:12px}.asha-navbar .an-right{gap:2px;padding-left:4px}}
      `}</style>

      <Link to="/asha/dashboard" className="an-brand" aria-label="Shishu Aarogya — home">
        <img src={logo} alt="" width="34" height="34" />
        <span className="an-brand-text">
          <span className="an-brand-name">Shishu Aarogya</span>
          <span className="an-brand-sub">{t('ashaPortalShort')}</span>
        </span>
      </Link>
      <span className="an-sep" />

      <ul className="an-menu">
        {MENU.map((m) => (
          <li className="an-item" key={m.key}>
            {m.to ? (
              <Link to={m.to} className={`an-btn ${isActive(m) ? 'is-active' : ''}`}>
                <i className={`bi ${m.icon}`}></i><span>{plain(t(m.key))}</span>
              </Link>
            ) : (
              <>
                <button type="button" className={`an-btn ${isActive(m) ? 'is-active' : ''}`} aria-haspopup="true" aria-expanded={open === m.key} onClick={() => toggle(m.key)}>
                  <i className={`bi ${m.icon}`}></i><span>{plain(t(m.key))}<i className="bi bi-chevron-down an-caret"></i></span>
                </button>
                {open === m.key && (
                  <div className="an-drop" role="menu">
                    {m.items.map((it) => <Link key={it.to} to={it.to} role="menuitem" className={pathname === it.to.split('?')[0] ? 'is-on' : ''}>{plain(t(it.key))}</Link>)}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="an-right">
      <div className="an-search" role="search">
        <i className="bi bi-search"></i>
        <label className="visually-hidden" htmlFor="asha-search">{t('navSearch')}</label>
        <input id="asha-search" ref={searchRef} type="search" autoComplete="off" placeholder={t('navSearch')} value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchKey} aria-controls="asha-search-results" />
        {!q && <span className="an-kbd">{isMac ? '⌘ K' : 'Ctrl + K'}</span>}
        {results && (
          <div id="asha-search-results" className="an-drop an-results" role="listbox">
            {hits.length === 0 ? <div className="small text-muted p-2">{t('noRecords')}</div> : hits.map((h, i) => (
              <Link key={`${h.to}`} to={h.to} role="option" aria-selected={i === active} className={i === active ? 'is-on' : ''}>
                <span className="me-2">{h.icon}</span><strong>{h.title}</strong>
                {h.sub && <div className="small text-muted ms-4">{h.sub}</div>}
              </Link>
            ))}
          </div>
        )}
      </div>

        <Link to="/asha/notifications" className="an-icon" aria-label={`${t('notificationsNav')} (${counts.notifications})`}>
          <i className="bi bi-bell"></i>
          {counts.notifications > 0 && <span className="an-badge">{counts.notifications > 99 ? '99+' : counts.notifications}</span>}
        </Link>
        <Link to="/asha/messages" className="an-icon" aria-label={`${t('supervisorMessages')} (${counts.messages})`}>
          <i className="bi bi-chat-square-text"></i>
          {counts.messages > 0 && <span className="an-badge">{counts.messages > 99 ? '99+' : counts.messages}</span>}
        </Link>

        <span className="an-sep" />


        <div className="an-item">
          <button type="button" className="an-profile" aria-haspopup="true" aria-expanded={open === 'me'} onClick={() => toggle('me')}>
            <span className="an-avatar">{initials(user?.name)}</span>
            <span className="an-who text-start" style={{ lineHeight: 1.2 }}>
              <span className="d-block fw-bold">{user?.name}</span>
              <span className="d-block small text-muted fw-normal">{t('ashaWorkerRole')}</span>
            </span>
            <i className="bi bi-chevron-down an-caret"></i>
          </button>
          {open === 'me' && (
            <div className="an-drop an-me" role="menu">
              <div className="an-me-head">
                <span className="an-avatar" style={{ width: 42, height: 42, fontSize: 15 }}>{initials(user?.name)}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="d-block fw-bold text-truncate">{user?.name}</span>
                  <span className="d-block small text-muted text-truncate">{user?.email || t('ashaWorkerRole')}</span>
                </span>
              </div>

              <div className="an-drop-label">{t('accountSection')}</div>
              <Link to="/asha/settings?s=profile" role="menuitem" className="an-me-row"><i className="bi bi-person-circle"></i><span>{t('manageProfile')}</span><i className="bi bi-arrow-right"></i></Link>
              <Link to="/asha/settings?s=security" role="menuitem" className="an-me-row"><i className="bi bi-lock"></i><span>{t('passwordSecurity')}</span><i className="bi bi-arrow-right"></i></Link>
              <Link to="/asha/settings?s=notifications" role="menuitem" className="an-me-row"><i className="bi bi-bell"></i><span>{t('notificationsNav')}</span><i className="bi bi-arrow-right"></i></Link>
              <button type="button" role="menuitem" aria-expanded={langOpen} className="an-me-row" onClick={() => setLangOpen((v) => !v)}>
                <i className="bi bi-translate"></i><span>{t('languageNav')}</span>
                <small className="text-muted">{LANGUAGES.find((l) => l.code === language)?.label || language}</small>
                <i className={`bi bi-chevron-${langOpen ? 'up' : 'down'}`}></i>
              </button>
              {langOpen && (
                <div className="an-me-sub">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} type="button" role="menuitemradio" aria-checked={l.code === language} className={l.code === language ? 'is-on' : ''} onClick={() => { setLanguage(l.code); setLangOpen(false); }}>
                      {l.label}{l.code === language && <i className="bi bi-check-lg float-end"></i>}
                    </button>
                  ))}
                </div>
              )}

              <div className="an-drop-label">{t('preferencesSection')}</div>
              <Link to="/asha/settings?s=about" role="menuitem" className="an-me-row"><i className="bi bi-info-square"></i><span>{t('aboutUs')}</span><i className="bi bi-arrow-right"></i></Link>
              <button type="button" role="menuitem" aria-expanded={sizeOpen} className="an-me-row" onClick={() => setSizeOpen((v) => !v)}>
                <i className="bi bi-fonts"></i><span>{t('textSize')}</span>
                <small className="text-muted">{t(`textSize_${textSize}`)}</small>
                <i className={`bi bi-chevron-${sizeOpen ? 'up' : 'down'}`}></i>
              </button>
              {sizeOpen && (
                <div className="an-me-sub">
                  {Object.keys(TEXT_SIZES).map((k) => (
                    <button key={k} type="button" role="menuitemradio" aria-checked={k === textSize} className={k === textSize ? 'is-on' : ''} onClick={() => { applyTextSize(k); setTextSize(k); }}>
                      {t(`textSize_${k}`)}{k === textSize && <i className="bi bi-check-lg float-end"></i>}
                    </button>
                  ))}
                </div>
              )}

              <div className="an-drop-label">{t('supportSection')}</div>
              <Link to="/asha/settings?s=help" role="menuitem" className="an-me-row"><i className="bi bi-question-circle"></i><span>{t('helpCenter')}</span><i className="bi bi-arrow-right"></i></Link>
              <hr />
              <button type="button" role="menuitem" className="an-me-row text-danger" onClick={() => { logout(); navigate('/login'); }}><i className="bi bi-box-arrow-right"></i><span>{plain(t('logout')) || 'Logout'}</span></button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
