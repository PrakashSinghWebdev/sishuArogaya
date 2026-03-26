import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationAPI, schemeAPI, vaccinationAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const HospitalMap = lazy(() => import('../../components/HospitalMap'));

/* ─── constants ──────────────────────────────────────────────────────────── */

const SLIDES = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
];

const QUICK_ACTIONS = [
  { emoji: '💉', labelKey: 'bookVaccine',    to: '/parent/vaccination' },
  { emoji: '📈', labelKey: 'logGrowth',      to: '/parent/growth'      },
  { emoji: '🥗', labelKey: 'dietPlan',       to: '/parent/diet-plan'   },
  { emoji: '📥', labelKey: 'downloadReport', to: '/parent/reports'     },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */

function fmt(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? 'Date unavailable'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcAge(dob) {
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
  const color = score >= 75 ? '#059669' : score >= 50 ? '#f59e0b' : '#ef4444';
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

/* ─── main component ─────────────────────────────────────────────────────── */

export default function ParentDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { navLinks, t } = useLanguage();
  const { children, selectedChild, selectedChildId, setSelectedChild, loading: childLoading } = useSelectedChild();

  const [vaccines,      setVaccines]      = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schemes,       setSchemes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cur,           setCur]           = useState(0);
  const timerRef = useRef(null);

  /* ── data fetching (unchanged) ── */
  useEffect(() => {
    Promise.all([
      notificationAPI.list().catch(() => ({ data: [] })),
      schemeAPI.list().catch(() => ({ data: [] })),
    ])
      .then(([n, s]) => {
        setNotifications((n.data || []).slice(0, 5));
        setSchemes((s.data || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild?._id) { setVaccines([]); return; }
    vaccinationAPI
      .getSchedule(selectedChild._id)
      .then((res) => setVaccines((res.data || []).slice(0, 7)))
      .catch(console.error);
  }, [selectedChild]);

  /* ── carousel timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setCur((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ── computed values (unchanged) ── */
  const due    = vaccines.filter((v) => v.status === 'due');
  const unread = notifications.filter((n) => !n.isRead).length;
  const score  = selectedChild?.nutritionStatus === 'healthy'  ? 86
               : selectedChild?.nutritionStatus === 'moderate' ? 62
               : selectedChild ? 42 : 0;

  const heroText = useMemo(() => {
    if (!selectedChild) return 'Add a child profile to start tracking vaccination, growth, and nutrition updates.';
    if (due[0])         return `${selectedChild.name} has ${due[0].vaccineName} due soon.`;
    return `${selectedChild.name}'s health records are available and ready to monitor.`;
  }, [selectedChild, due]);

  const firstName   = user?.name?.split(' ')[0] || 'Parent';
  const userInitial = (user?.name || 'P')[0].toUpperCase();
  const today       = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ── vaccine done count ── */
  const doneCount = vaccines.filter((v) => v.status === 'done').length;

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

        .sa-nav-link {
          display: inline-flex; align-items: center;
          padding: 5px 11px; border-radius: 6px;
          font-size: 13px; font-weight: 500;
          color: #0c2340; text-decoration: none;
          white-space: nowrap;
          transition: background .15s, color .15s;
        }
        .sa-nav-link:hover       { background: #cffafe; color: #0e7490; }
        .sa-nav-link.active      { background: #f0fdff; color: #0e7490; font-weight: 600; }

        .sa-hero-btn {
          display: inline-block;
          padding: 7px 15px; border-radius: 8px;
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
          box-shadow: 0 6px 24px rgba(8,145,178,.15);
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
        .sa-grid2 { display: grid; grid-template-columns: 1fr 1fr;      gap: 20px; }

        @media (max-width: 1024px) {
          .sa-grid4 { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 768px) {
          .sa-navlinks { display: none !important; }
          .sa-grid4    { grid-template-columns: repeat(2,1fr); }
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
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🏥</div>
          <div>
            <div style={{
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 700, fontSize: 16, color: '#0e7490', lineHeight: 1.1,
            }}>Sishu Arogaya</div>
            <div style={{ fontSize: 10, color: '#4a7a8a', lineHeight: 1 }}>Child Health Portal</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="sa-navlinks" style={{
          display: 'flex', alignItems: 'center',
          gap: 2, flex: 1, justifyContent: 'center', flexWrap: 'nowrap', overflow: 'hidden',
        }}>
          {navLinks.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className={`sa-nav-link${location.pathname === to ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: bell + avatar */}
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
        {/* Carousel slides */}
        {SLIDES.map((src, i) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === cur ? 1 : 0,
            transition: 'opacity 1.1s ease',
          }} />
        ))}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(8,145,178,.92),rgba(14,116,144,.6),rgba(8,145,178,.8))',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1280, margin: '0 auto',
          padding: '0 48px',
          height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div className="sa-hero-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            {/* Left */}
            <div style={{ color: '#fff', animation: 'fadeUp .5s ease both' }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                textTransform: 'uppercase', color: '#cffafe', marginBottom: 8,
              }}>
                Parent Dashboard
              </div>
              <h1 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 700, color: '#fff',
                margin: '0 0 10px', lineHeight: 1.2,
              }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 14, margin: '0 0 20px', maxWidth: 480 }}>
                {heroText}
              </p>

              {/* Quick action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QUICK_ACTIONS.map(({ emoji, labelKey, to }) => (
                  <Link key={to} to={to} className="sa-hero-btn">
                    {emoji} {t(labelKey)}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right */}
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
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, display: 'flex', gap: 7,
        }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCur(i); clearInterval(timerRef.current); timerRef.current = setInterval(() => setCur((p) => (p + 1) % SLIDES.length), 4500); }}
              style={{
                width: i === cur ? 22 : 8, height: 8,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: i === cur ? '#fff' : 'rgba(255,255,255,.45)',
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
          /* ── Empty state ── */
          <div className="sa-card" style={{ padding: '60px 24px', textAlign: 'center', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👶</div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", color: '#0c2340', marginBottom: 8 }}>
              No child profile yet
            </h2>
            <p style={{ color: '#4a7a8a', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
              Add a child profile to start tracking vaccination, growth, and nutrition updates.
            </p>
            <Link to="/parent/child-profile" style={{
              display: 'inline-block',
              padding: '11px 28px', borderRadius: 9,
              background: 'linear-gradient(135deg,#0891b2,#0e7490)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(8,145,178,.35)',
            }}>
              + Add Child
            </Link>
          </div>
        ) : (
          <>
            {/* ── Section header ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 12, marginBottom: 20,
              animation: 'fadeUp .4s ease',
            }}>
              <div>
                <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 700, margin: 0, color: '#0c2340' }}>
                  Current Baby
                </h2>
              </div>
              <div style={{ fontSize: 13, color: '#4a7a8a', fontWeight: 500 }}>{today}</div>
            </div>

            {/* ── Child card ── */}
            <div className="sa-card" style={{ padding: '20px 24px', marginBottom: 22, animation: 'fadeUp .45s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#cffafe,#0891b2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>👶</div>
                  <div>
                    <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: '#0c2340' }}>
                      {selectedChild.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#4a7a8a', marginTop: 3 }}>
                      {[
                        calcAge(selectedChild.dob) || (selectedChild.ageInMonths != null ? `${selectedChild.ageInMonths} months` : null),
                        selectedChild.gender,
                        selectedChild.bloodGroup ? `Blood: ${selectedChild.bloodGroup}` : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link to="/parent/child-profile" style={{
                    padding: '8px 18px', borderRadius: 8,
                    border: '1.5px solid #0891b2', color: '#0891b2',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'background .15s',
                  }}>{t('viewProfile')}</Link>
                  <Link to="/parent/reports" style={{
                    padding: '8px 18px', borderRadius: 8,
                    border: '1.5px solid #c5e8ef', color: '#4a7a8a',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'background .15s',
                  }}>{t('downloadReport')}</Link>
                </div>
              </div>
            </div>

            {/* ── 4-column stats ── */}
            <div className="sa-grid4" style={{ marginBottom: 22, animation: 'fadeUp .5s ease' }}>
              <StatCard
                emoji="💉" accent="#0891b2"
                label="Vaccines Completed"
                value={`${doneCount}/${vaccines.length}`}
                sub={due.length > 0 ? `${due.length} due now` : 'All up to date'}
                subColor={due.length > 0 ? '#ef4444' : '#059669'}
              />
              <StatCard
                emoji="⚖️" accent="#059669"
                label="Current Weight"
                value={selectedChild.currentWeight ? `${selectedChild.currentWeight} kg` : 'N/A'}
                sub={selectedChild.ageInMonths != null ? `${selectedChild.ageInMonths} months old` : 'No records yet'}
              />
              <StatCard
                emoji="📏" accent="#f59e0b"
                label="Current Height"
                value={selectedChild.currentHeight ? `${selectedChild.currentHeight} cm` : 'N/A'}
                sub={selectedChild.gender || 'No records yet'}
              />
              <StatCard
                emoji="🔔" accent="#1d4ed8"
                label="Unread Alerts"
                value={String(unread)}
                sub={`${schemes.length} schemes available`}
                subColor={unread > 0 ? '#ef4444' : undefined}
              />
            </div>

            {/* ── Quick actions grid ── */}
            <div className="sa-grid4" style={{ marginBottom: 28, animation: 'fadeUp .55s ease' }}>
              {QUICK_ACTIONS.map(({ emoji, labelKey, to }) => (
                <Link key={to} to={to} className="sa-card sa-card-hover" style={{ padding: '22px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0c2340' }}>{t(labelKey)}</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 4 }}>Tap to open →</div>
                </Link>
              ))}
            </div>

            {/* ── 2-column lower grid ── */}
            <div className="sa-grid2" style={{ animation: 'fadeUp .6s ease' }}>
              {/* Vaccination Snapshot */}
              <div className="sa-card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>
                    💉 Vaccination Snapshot
                  </h3>
                  <Link to="/parent/vaccination" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>
                    View all →
                  </Link>
                </div>
                {vaccines.length === 0 ? (
                  <div style={{ color: '#4a7a8a', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                    No vaccination records available yet.
                  </div>
                ) : vaccines.map((v) => (
                  <div key={v._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', marginBottom: 8,
                    border: '1px solid #c5e8ef', borderRadius: 10,
                    gap: 10,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0c2340' }}>{v.vaccineName}</div>
                      <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>{fmt(v.dueDate)}</div>
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

              {/* Nearby Hospitals Map */}
              <div className="sa-card" style={{ padding: 0, overflow: 'hidden', minHeight: 380 }}>
                <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c5e8ef' }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>
                    🏥 Nearby Hospitals
                  </h3>
                  <span style={{ fontSize: 11, color: '#4a7a8a' }}>Real-time · GPS</span>
                </div>
                <Suspense fallback={<div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7a8a', fontSize: 13 }}>Loading map…</div>}>
                  <HospitalMap height="340px" showSearchBar={true} />
                </Suspense>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════ FOOTER ════ */}
      <footer style={{
        background: '#0e7490',
        color: 'rgba(255,255,255,.45)',
        textAlign: 'center',
        padding: '18px 24px',
        fontSize: 12,
        letterSpacing: .3,
      }}>
        Sishu Arogaya © 2024 &nbsp;·&nbsp; Government Integrated Child Health Monitoring System &nbsp;·&nbsp; DBUU Dehradun
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