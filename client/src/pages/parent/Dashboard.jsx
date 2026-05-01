import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationAPI, schemeAPI, vaccinationAPI, growthAPI, dietAPI, searchAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';
import SearchBar from '../../components/SearchBar';

const HospitalMap = lazy(() => import('../../components/HospitalMap'));

/* ─── constants ──────────────────────────────────────────────────────────── */



const QUICK_ACTIONS = [
  { emoji: '💉', labelKey: 'bookVaccine',    label: 'Vaccinations',    to: '/parent/vaccination' },
  { emoji: '📈', labelKey: 'logGrowth',      label: 'Growth',          to: '/parent/growth'      },
  { emoji: '🥗', labelKey: 'dietPlan',       label: 'Diet Plan',       to: '/parent/diet-plan'   },
  { emoji: '📥', labelKey: 'downloadReport', label: 'Reports',         to: '/parent/reports'     },
  { emoji: '🏛️', labelKey: 'schemes',        label: 'Govt Schemes',    to: '/parent/schemes'     },
  { emoji: '🔔', labelKey: 'notifications',  label: 'Notifications',   to: '/parent/notifications' },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */

function formatDate(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? 'Date unavailable'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function childAgeLabel(dob) {
  if (!dob) return null;
  const ms = Date.now() - new Date(dob).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  return `${years} yr${years !== 1 ? 's' : ''}`;
}

/* ─── Health Score SVG circle ────────────────────────────────────────────── */

function ScoreCircle({ score }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff',
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, opacity: .75, marginTop: 2 }}>Health Score</span>
      </div>
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, margin: 0, color: '#0c2340' }}>
        {title}
      </h3>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>
          {linkLabel || 'View all →'}
        </Link>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

export default function ParentDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { navLinks, t } = useLanguage();
  const { children, selectedChild, selectedChildId, setSelectedChild, loading: childLoading } = useSelectedChild();

  const [vaccines,      setVaccines]      = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schemes,       setSchemes]       = useState([]);
  const [growth,        setGrowth]        = useState([]);
  const [prediction,    setPrediction]    = useState(null);
  const [diet,          setDiet]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [slideIndex,    setSlideIndex]    = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const timerRef = useRef(null);

  /* ── fetch notifications & schemes ── */
  useEffect(() => {
    Promise.all([
      notificationAPI.list().catch(() => ({ data: [] })),
      schemeAPI.list().catch(() => ({ data: [] })),
    ])
      .then(([n, s]) => {
        setNotifications((n.data || []).slice(0, 6));
        setSchemes((s.data || []).slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── fetch child-specific data ── */
  useEffect(() => {
    if (!selectedChild?._id) {
      setVaccines([]); setGrowth([]); setPrediction(null); setDiet(null);
      return;
    }
    const childId = selectedChild._id;
    const ageMonths = selectedChild.ageInMonths;

    vaccinationAPI.getSchedule(childId)
      .then((res) => setVaccines((res.data || []).slice(0, 8)))
      .catch(console.error);

    growthAPI.getHistory(childId)
      .then((res) => setGrowth((res.data || []).slice(-6).reverse()))
      .catch(console.error);

    growthAPI.getPrediction(childId)
      .then((res) => setPrediction(res.data))
      .catch(() => setPrediction(null));

    if (ageMonths != null) {
      dietAPI.getByAge(ageMonths)
        .then((res) => setDiet(res.data))
        .catch(() => setDiet(null));
    }
  }, [selectedChild]);

  /* ── carousel timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setSlideIndex((p) => (p + 1) % MEDIA_ARRAY.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ── search handler ── */
  const handleSearch = async (query) => {
    setSearchLoading(true);
    try {
      const res = await searchAPI.parentSearchChildren(query);
      setSearchResults(res.data?.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultClick = (child) => {
    setSelectedChild(child._id);
  };

  /* ── computed values ── */
  const due    = vaccines.filter((v) => v.status === 'due');
  const unread = notifications.filter((n) => !n.isRead).length;
  const score  = selectedChild?.nutritionStatus === 'healthy'  ? 86
               : selectedChild?.nutritionStatus === 'moderate' ? 62
               : selectedChild ? 42 : 0;

  const heroText = useMemo(() => {
    if (!selectedChild) return `${t('addChild')} ${t('myChild').toLowerCase()} to start tracking ${t('vaccines').toLowerCase()}, ${t('growth').toLowerCase()}, and ${t('nutrition').toLowerCase()} updates.`;
    if (due[0])         return `${selectedChild.name} has ${due[0].vaccineName} ${t('due').toLowerCase()} soon.`;
    return `${selectedChild.name}'s ${t('healthScore').toLowerCase()} and records are up to date.`;
  }, [selectedChild, due, t]);

  const firstName   = user?.name?.split(' ')[0] || t('myChild');
  const userInitial = (user?.name || 'P')[0].toUpperCase();
  const today       = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const doneCount = vaccines.filter((v) => v.status === 'done').length;

  /* ── latest growth record ── */
  const latestGrowth = growth[0] || null;

  /* ─────────────────────────────────────────── render ─── */
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0fdff', minHeight: '100vh', color: '#0c2340' }}>

      {/* ── global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .sa-logo-box {
          display: flex; align-items: center; gap: 12px; flex-shrink: 0;
          text-decoration: none;
        }
        .sa-logo-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: #fff;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
        }
        .sa-logo-text {
          font-family: 'Libre Baskerville', serif;
          font-weight: 700; font-size: 18px; color: #0e7490; line-height: 1;
        }
        .sa-logo-tag {
          font-size: 10px; color: #4a7a8a; font-weight: 500; margin-top: 2px;
          letter-spacing: 0.02em;
        }

        .sa-nav-link {
          display: inline-flex; align-items: center;
          padding: 5px 11px; border-radius: 6px;
          font-size: 13px; font-weight: 500;
          color: #0c2340; text-decoration: none;
          white-space: nowrap;
          transition: background .15s, color .15s;
        }
        .sa-nav-link:hover  { background: #cffafe; color: #0e7490; }
        .sa-nav-link.active { background: #e0f7fa; color: #0e7490; font-weight: 600; }

        .sa-hero-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,.92); color: #0e7490;
          border: none; text-decoration: none;
          cursor: pointer; white-space: nowrap;
          transition: background .15s, transform .1s;
        }
        .sa-hero-btn:hover { background: #fff; transform: translateY(-1px); }

        .sa-card {
          background: #fff;
          border: 1.5px solid #c5e8ef;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(8,145,178,.07);
        }
        .sa-card-hover {
          transition: box-shadow .2s, transform .15s;
          text-decoration: none; color: inherit;
          display: block;
        }
        .sa-card-hover:hover {
          box-shadow: 0 6px 24px rgba(8,145,178,.16);
          transform: translateY(-2px);
        }

        .sa-badge-done     { background: #d1fae5; color: #065f46; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 600; }
        .sa-badge-due      { background: #fef3c7; color: #92400e; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 600; }
        .sa-badge-upcoming { background: #f1f5f9; color: #475569;  border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 600; }

        .sa-spinner {
          width: 44px; height: 44px;
          border: 4px solid #cffafe;
          border-top-color: #0891b2;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        .sa-grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .sa-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .sa-grid2 { display: grid; grid-template-columns: 1fr 1fr;      gap: 20px; }

        @media (max-width: 1100px) {
          .sa-grid4 { grid-template-columns: repeat(2,1fr); }
          .sa-grid3 { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 768px) {
          .sa-navlinks { display: none !important; }
          .sa-grid4    { grid-template-columns: repeat(2,1fr); }
          .sa-grid3    { grid-template-columns: 1fr; }
          .sa-grid2    { grid-template-columns: 1fr; }
          .sa-hero-row { flex-direction: column !important; align-items: flex-start !important; }
          .sa-hero-right { align-self: flex-start; }
        }
        @media (max-width: 480px) {
          .sa-grid4 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ════════════════════════════════════ NAVBAR ════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff',
        height: 64,
        borderBottom: '2px solid #cffafe',
        boxShadow: '0 2px 16px rgba(8,145,178,.10)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        gap: 16,
      }}>
        <Link className="sa-logo-box" to="/parent/dashboard">
          <div className="sa-logo-icon">🏥</div>
          <div>
            <div className="sa-logo-text">Shishu Aarogya</div>
            <div className="sa-logo-tag">National Child Health Portal</div>
          </div>
        </Link>

        <div className="sa-navlinks" style={{
          display: 'flex', alignItems: 'center',
          gap: 2, flex: 1, justifyContent: 'center', flexWrap: 'nowrap', overflow: 'hidden',
        }}>
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} className={`sa-nav-link${location.pathname === to ? ' active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
          <Link to="/parent/notifications" style={{ position: 'relative', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                borderRadius: 20, padding: '1px 5px',
                minWidth: 16, textAlign: 'center',
              }}>{unread}</span>
            )}
          </Link>
          <Link to="/parent/settings" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', userSelect: 'none', textDecoration: 'none',
            flexShrink: 0,
          }}>{userInitial}</Link>
        </div>
      </nav>

      {/* ════════════════════════════════════ HERO ════ */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <MediaCarousel currentSlideIndex={slideIndex} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(8,145,178,.93),rgba(14,116,144,.65),rgba(8,145,178,.82))',
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1280, margin: '0 auto',
          padding: '0 48px',
          height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div className="sa-hero-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div style={{ color: '#fff', animation: 'fadeUp .5s ease both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>
                {t('dashboard')}
              </div>
              <h1 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 700, color: '#fff',
                margin: '0 0 10px', lineHeight: 1.2,
              }}>
                {t('welcome')}, {firstName}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 14, margin: '0 0 20px', maxWidth: 480 }}>
                {heroText}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QUICK_ACTIONS.slice(0, 4).map(({ emoji, labelKey, label, to }) => (
                  <Link key={to} to={to} className="sa-hero-btn">
                    {emoji} {t(labelKey) || label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="sa-hero-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {selectedChild && <ScoreCircle score={score} />}
              {children.length > 1 && (
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 9,
                    border: '1.5px solid rgba(255,255,255,.4)',
                    background: 'rgba(255,255,255,.15)',
                    color: '#fff', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', outline: 'none',
                    backdropFilter: 'blur(4px)',
                    minWidth: 180,
                  }}
                >
                  {children.map((ch) => (
                    <option key={ch._id} value={ch._id} style={{ color: '#0c2340', background: '#fff' }}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              )}
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, textAlign: 'center' }}>{today}</div>
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, display: 'flex', gap: 7,
        }}>
          {MEDIA_ARRAY.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIndex(i); clearInterval(timerRef.current); timerRef.current = setInterval(() => setSlideIndex((p) => (p + 1) % MEDIA_ARRAY.length), 4500); }}
              style={{
                width: i === slideIndex? 22 : 8, height: 8,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: i === slideIndex? '#fff' : 'rgba(255,255,255,.45)',
                transition: 'width .3s, background .3s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════ MAIN ════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 60px' }}>

        {loading || childLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <div className="sa-spinner" />
          </div>
        ) : !selectedChild ? (

          /* ══════════════════ WELCOME / NO CHILD STATE ══════════════════ */
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{
              background: 'linear-gradient(135deg,#0891b2,#0e7490)',
              borderRadius: 18, padding: '32px 36px', marginBottom: 24,
              color: '#fff', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 20,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>
                  {t('home')} • {t('dashboard')}
                </div>
                <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, fontWeight: 700, margin: '0 0 10px', color: '#fff' }}>
                  {t('welcome')}, {firstName}!
                </h2>
                <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 14, margin: '0 0 20px', maxWidth: 440 }}>
                  {t('registerTitle')}. {t('childInfoTitle')} to track {t('vaccines').toLowerCase()}, {t('growth').toLowerCase()}, {t('dietPlan').toLowerCase()} and {t('reports').toLowerCase()}.
                </p>
                <Link to="/parent/child-profile" style={{
                  display: 'inline-block', padding: '11px 28px', borderRadius: 9,
                  background: '#fff', color: '#0891b2', fontWeight: 700, fontSize: 14,
                  textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.15)',
                }}>
                  + {t('addChild')}
                </Link>
              </div>
              <div style={{ fontSize: 80, opacity: .3 }}>👶</div>
            </div>

            <div className="sa-grid4" style={{ marginBottom: 28 }}>
              {[
                { emoji: '💉', label: t('vaccines'),      desc: `${t('vaccines')} tracker`, to: '/parent/vaccination' },
                { emoji: '📈', label: t('growth'),        desc: `${t('growth')} monitoring`, to: '/parent/growth' },
                { emoji: '🥗', label: t('dietPlan'),      desc: `${t('dietPlan')} ${t('for') || ''}`.trim(), to: '/parent/diet-plan' },
                { emoji: '🏛️', label: t('schemes'),      desc: t('governmentSchemes'), to: '/parent/schemes' },
                { emoji: '📋', label: t('reports'),       desc: t('downloadReport'), to: '/parent/reports' },
                { emoji: '🔔', label: t('notifications'), desc: `${t('notifications')} & ${t('reminder') || 'alerts'}`, to: '/parent/notifications' },
                { emoji: '👶', label: t('myChild'),       desc: t('childInfoTitle'), to: '/parent/child-profile' },
                { emoji: '⚙️', label: t('settings'),      desc: t('langTitle'), to: '/parent/settings' },
              ].map(({ emoji, label, desc, to }) => (
                <Link key={to} to={to} className="sa-card sa-card-hover" style={{ padding: '20px 16px', textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0c2340', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a', lineHeight: 1.5 }}>{desc}</div>
                </Link>
              ))}
            </div>

            <div style={{ background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>ℹ️</div>
              <div style={{ fontSize: 13, color: '#4a7a8a', lineHeight: 1.6 }}>
                <strong style={{ color: '#0c2340' }}>Logged in as:</strong> {user?.name} ({user?.email}) &nbsp;·&nbsp; Role: Parent<br />
                Add your child's profile to unlock vaccination schedules, growth charts, diet plans and more.
              </div>
            </div>
          </div>

        ) : (
          /* ══════════════════ FULL DASHBOARD (CHILD SELECTED) ══════════════════ */
          <>
            {/* ── Section header row ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 12, marginBottom: 20, animation: 'fadeUp .4s ease',
            }}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 700, margin: 0, color: '#0c2340' }}>
                {selectedChild.name}'s Dashboard
              </h2>
              <div style={{ fontSize: 13, color: '#4a7a8a', fontWeight: 500 }}>{today}</div>
            </div>

            {/* ── Search Bar ── */}
            <div style={{ marginBottom: 24, animation: 'fadeUp .45s ease' }}>
              <SearchBar
                placeholder="Search children by name or ID..."
                onSearch={handleSearch}
                results={searchResults}
                isLoading={searchLoading}
                noResultsMessage="No children found"
                onResultClick={handleSearchResultClick}
                searchType="child"
              />
            </div>

            {/* ── Child card ── */}
            <div className="sa-card" style={{ padding: '20px 24px', marginBottom: 22, animation: 'fadeUp .45s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#cffafe,#0891b2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>👶</div>
                  <div>
                    <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: '#0c2340' }}>
                      {selectedChild.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#4a7a8a', marginTop: 3 }}>
                      {[
                        childAgeLabel(selectedChild.dob) || (selectedChild.ageInMonths != null ? `${selectedChild.ageInMonths} months` : null),
                        selectedChild.gender,
                        selectedChild.bloodGroup ? `Blood: ${selectedChild.bloodGroup}` : null,
                        selectedChild.nutritionStatus ? `Nutrition: ${selectedChild.nutritionStatus}` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link to="/parent/child-profile" style={{
                    padding: '8px 18px', borderRadius: 8,
                    border: '1.5px solid #0891b2', color: '#0891b2',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>View Profile</Link>
                  <Link to="/parent/reports" style={{
                    padding: '8px 18px', borderRadius: 8,
                    border: '1.5px solid #c5e8ef', color: '#4a7a8a',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>Download Report</Link>
                </div>
              </div>
            </div>

            {/* ── Stat cards (4-col) ── */}
            <div className="sa-grid4" style={{ marginBottom: 22, animation: 'fadeUp .5s ease' }}>
              <StatCard
                emoji="💉" accent="#0891b2"
                label="Vaccines Done"
                value={`${doneCount}/${vaccines.length}`}
                sub={due.length > 0 ? `${due.length} due now` : 'All up to date'}
                subColor={due.length > 0 ? '#ef4444' : '#059669'}
              />
              <StatCard
                emoji="⚖️" accent="#059669"
                label="Current Weight"
                value={latestGrowth?.weight ? `${latestGrowth.weight} kg` : (selectedChild.currentWeight ? `${selectedChild.currentWeight} kg` : 'N/A')}
                sub={latestGrowth ? `Recorded ${formatDate(latestGrowth.date)}` : 'No record yet'}
              />
              <StatCard
                emoji="📏" accent="#f59e0b"
                label="Current Height"
                value={latestGrowth?.height ? `${latestGrowth.height} cm` : (selectedChild.currentHeight ? `${selectedChild.currentHeight} cm` : 'N/A')}
                sub={selectedChild.ageInMonths != null ? `Age: ${selectedChild.ageInMonths} months` : selectedChild.gender || '—'}
              />
              <StatCard
                emoji="🔔" accent="#1d4ed8"
                label="Unread Alerts"
                value={String(unread)}
                sub={`${schemes.length} govt schemes`}
                subColor={unread > 0 ? '#ef4444' : undefined}
              />
            </div>

            {/* ── Quick action tiles (6-col) ── */}
            <div className="sa-grid3" style={{ marginBottom: 28, animation: 'fadeUp .55s ease' }}>
              {QUICK_ACTIONS.map(({ emoji, label, to }) => (
                <Link key={to} to={to} className="sa-card sa-card-hover" style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>{emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0c2340' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 3 }}>Tap to open →</div>
                </Link>
              ))}
            </div>

            {/* ── 2-col grid: Vaccination + Hospital Map ── */}
            <div className="sa-grid2" style={{ marginBottom: 24, animation: 'fadeUp .6s ease' }}>
              {/* Vaccination snapshot */}
              <div className="sa-card" style={{ padding: '20px 22px' }}>
                <SectionHeader title="💉 Vaccination Schedule" linkTo="/parent/vaccination" />
                {vaccines.length === 0 ? (
                  <div style={{ color: '#4a7a8a', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                    No vaccination records yet.
                  </div>
                ) : vaccines.map((v) => (
                  <div key={v._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', marginBottom: 8,
                    border: '1px solid #c5e8ef', borderRadius: 10, gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0c2340' }}>{v.vaccineName}</div>
                      <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>{formatDate(v.dueDate)}</div>
                    </div>
                    <span className={
                      v.status === 'done'     ? 'sa-badge-done'
                      : v.status === 'due'    ? 'sa-badge-due'
                      :                         'sa-badge-upcoming'
                    }>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hospital Map */}
              <div className="sa-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c5e8ef', flexShrink: 0 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>
                    🏥 {t('nearbyHospitals') || 'Nearby Hospitals'}
                  </h3>
                  <span style={{ fontSize: 11, color: '#4a7a8a' }}>{t('realtimeGps') || 'Real-time · GPS'}</span>
                </div>
                <Suspense fallback={
                  <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7a8a', fontSize: 13 }}>
                    Loading map…
                  </div>
                }>
                  <HospitalMap height="100%" showSearchBar={true} />
                </Suspense>
              </div>
            </div>

            {/* ── Growth Monitoring ── */}
            <div className="sa-card" style={{ padding: '20px 22px', marginBottom: 24, animation: 'fadeUp .65s ease' }}>
              <SectionHeader title="📈 Growth Monitoring" linkTo="/parent/growth" />
              {growth.length === 0 ? (
                <div style={{ color: '#4a7a8a', fontSize: 13, padding: '12px 0', textAlign: 'center' }}>
                  No growth records yet. <Link to="/parent/growth" style={{ color: '#0891b2', fontWeight: 600 }}>Log first entry →</Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0fdff' }}>
                        {['Date', 'Weight (kg)', 'Height (cm)', 'Age (mo)', 'Weight Z', 'Height Z', 'Status'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a7a8a', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #c5e8ef', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {growth.map((g, i) => (
                        <tr key={g._id || i} style={{ borderBottom: '1px solid #f0fdff' }}>
                          <td style={{ padding: '9px 12px', color: '#0c2340', fontWeight: 500 }}>{formatDate(g.date || g.createdAt)}</td>
                          <td style={{ padding: '9px 12px', color: '#059669', fontWeight: 600 }}>{g.weight ?? '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#0891b2', fontWeight: 600 }}>{g.height ?? '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{g.ageInMonths ?? '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{g.weightForAgeZ != null ? g.weightForAgeZ.toFixed(2) : '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{g.heightForAgeZ != null ? g.heightForAgeZ.toFixed(2) : '—'}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className={
                              g.nutritionStatus === 'healthy'  ? 'sa-badge-done'
                              : g.nutritionStatus === 'moderate' ? 'sa-badge-due'
                              : g.nutritionStatus              ? 'sa-badge-upcoming'
                              : ''
                            }>
                              {g.nutritionStatus || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── AI Prediction ── */}
            {prediction && (
              <div style={{
                background: 'linear-gradient(135deg,#0891b2,#0e7490)',
                borderRadius: 16, padding: '22px 28px', marginBottom: 24,
                animation: 'fadeUp .7s ease',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 16,
              }}>
                <div style={{ color: '#fff' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 6 }}>
                    AI-Powered Prediction
                  </div>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
                    🤖 Growth Forecast for {selectedChild.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {prediction.predictedWeight != null && (
                      <div>
                        <div style={{ fontSize: 11, color: '#cffafe', marginBottom: 2 }}>Predicted Weight</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#f7c948' }}>{prediction.predictedWeight} kg</div>
                      </div>
                    )}
                    {prediction.predictedHeight != null && (
                      <div>
                        <div style={{ fontSize: 11, color: '#cffafe', marginBottom: 2 }}>Predicted Height</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#f7c948' }}>{prediction.predictedHeight} cm</div>
                      </div>
                    )}
                    {prediction.riskLevel && (
                      <div>
                        <div style={{ fontSize: 11, color: '#cffafe', marginBottom: 2 }}>Risk Level</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: prediction.riskLevel === 'low' ? '#86efac' : prediction.riskLevel === 'moderate' ? '#fde68a' : '#fca5a5' }}>
                          {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                  {prediction.recommendation && (
                    <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: '12px 0 0', maxWidth: 500 }}>
                      {prediction.recommendation}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: 64, opacity: .25 }}>🧠</div>
              </div>
            )}

            {/* ── 2-col: Alerts + Diet Plan ── */}
            <div className="sa-grid2" style={{ marginBottom: 24, animation: 'fadeUp .72s ease' }}>
              {/* Alerts / Notifications */}
              <div className="sa-card" style={{ padding: '20px 22px' }}>
                <SectionHeader title="🔔 Recent Alerts" linkTo="/parent/notifications" />
                {notifications.length === 0 ? (
                  <div style={{ color: '#4a7a8a', fontSize: 13, padding: '12px 0', textAlign: 'center' }}>No alerts yet.</div>
                ) : notifications.map((n) => (
                  <div key={n._id} style={{
                    padding: '10px 14px', marginBottom: 8,
                    borderRadius: 10,
                    border: `1px solid ${n.isRead ? '#c5e8ef' : '#bae6fd'}`,
                    background: n.isRead ? '#fff' : '#f0fdff',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <div style={{ fontSize: 18, flexShrink: 0 }}>
                      {n.type === 'vaccine' ? '💉' : n.type === 'growth' ? '📈' : n.type === 'diet' ? '🥗' : '📣'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0c2340', marginBottom: 2 }}>{n.title || n.message}</div>
                      {n.title && n.message && (
                        <div style={{ fontSize: 12, color: '#4a7a8a' }}>{n.message}</div>
                      )}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{formatDate(n.createdAt)}</div>
                    </div>
                    {!n.isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0891b2', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Diet Plan */}
              <div className="sa-card" style={{ padding: '20px 22px' }}>
                <SectionHeader title="🥗 Diet Plan" linkTo="/parent/diet-plan" />
                {!diet ? (
                  <div style={{ color: '#4a7a8a', fontSize: 13, padding: '12px 0', textAlign: 'center' }}>
                    {selectedChild.ageInMonths != null
                      ? 'Loading diet plan…'
                      : 'Set child age to view diet plan.'}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, background: '#e0f7fa', padding: '2px 10px', borderRadius: 20 }}>
                        {diet.ageGroup || `${selectedChild.ageInMonths} months`}
                      </span>
                    </div>
                    {(diet.meals || []).slice(0, 4).map((meal, i) => (
                      <div key={i} style={{
                        padding: '10px 14px', marginBottom: 8,
                        border: '1px solid #c5e8ef', borderRadius: 10,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <span style={{ fontSize: 20 }}>
                          {meal.type === 'breakfast' ? '🌅' : meal.type === 'lunch' ? '🍽️' : meal.type === 'dinner' ? '🌙' : meal.type === 'snack' ? '🍎' : '🥛'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0c2340', textTransform: 'capitalize' }}>
                            {meal.type || meal.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>
                            {meal.items ? meal.items.join(', ') : meal.description || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                    {diet.notes && (
                      <div style={{ fontSize: 12, color: '#4a7a8a', background: '#f0fdff', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
                        💡 {diet.notes}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Government Schemes ── */}
            {schemes.length > 0 && (
              <div style={{ marginBottom: 24, animation: 'fadeUp .76s ease' }}>
                <SectionHeader title="🏛️ Government Schemes" linkTo="/parent/schemes" />
                <div className="sa-grid3">
                  {schemes.map((s) => (
                    <div key={s._id} className="sa-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 9,
                          background: 'linear-gradient(135deg,#e0f7fa,#cffafe)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0,
                        }}>🏛️</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0c2340', lineHeight: 1.3 }}>{s.name}</div>
                      </div>
                      {s.description && (
                        <div style={{ fontSize: 12, color: '#4a7a8a', lineHeight: 1.6, marginBottom: 10 }}>
                          {s.description.length > 100 ? s.description.slice(0, 100) + '…' : s.description}
                        </div>
                      )}
                      {s.eligibility && (
                        <div style={{ fontSize: 11, color: '#0891b2', fontWeight: 500 }}>
                          Eligibility: {s.eligibility}
                        </div>
                      )}
                      {s.benefit && (
                        <div style={{
                          marginTop: 8, padding: '6px 12px', borderRadius: 7,
                          background: '#f7c948', color: '#0c2340', fontSize: 12, fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          {s.benefit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* ════════════════════════════════════ FOOTER ════ */}
      <footer style={{ marginTop: 40, borderTop: '1px solid #c5e8ef', paddingTop: 24, textAlign: 'center', fontSize: 13, color: '#4a7a8a' }}>
        Shishu Aarogya &copy; 2024 &nbsp;·&nbsp; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </div>
  );
}

/* ─── StatCard sub-component ─────────────────────────────────────────────── */

function StatCard({ emoji, accent, label, value, sub, subColor }) {
  return (
    <div className="sa-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 12, color: '#4a7a8a', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0c2340', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || '#4a7a8a', marginTop: 6, fontWeight: subColor ? 600 : 400 }}>
        {sub}
      </div>
    </div>
  );
}
