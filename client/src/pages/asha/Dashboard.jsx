import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ashaAPI, vaccinationAPI, notificationAPI } from '../../services/api';

/* ── constants ── */
const SLIDES = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
];

const NAV = [
  ['🏠 Dashboard',    '/asha/dashboard'],
  ['👶 Children',     '/asha/children'],
  ['📝 Log Visit',    '/asha/log-visit'],
  ['💉 Vaccines',     '/asha/vaccination-tracker'],
  ['📈 Growth',       '/asha/growth-records'],
  ['🚨 Malnutrition', '/asha/malnutrition-report'],
  ['📋 Visits',       '/asha/visit-history'],
  ['🗺️ Area Map',     '/asha/area-map'],
  ['🔔 Alerts',       '/asha/notifications'],
];

const QUICK_ACTIONS = [
  { emoji: '📝', label: 'Log Visit',      to: '/asha/log-visit' },
  { emoji: '👶', label: 'Children',       to: '/asha/children' },
  { emoji: '💉', label: 'Vaccines',       to: '/asha/vaccination-tracker' },
  { emoji: '📈', label: 'Growth',         to: '/asha/growth-records' },
];

/* ── helpers ── */
const fmt = (d) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const calcAge = (dob) => {
  if (!dob) return null;
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr`;
};

/* ── status helpers ── */
const SS = {
  healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', bbg: '#d1fae5', label: '✓ Healthy' },
  moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', bbg: '#fef3c7', label: '⚠️ Moderate' },
  severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', bbg: '#fee2e2', label: '🚨 Severe' },
};
const s = (status) => SS[status] || SS.healthy;

export default function AshaDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [profile,       setProfile]       = useState(null);
  const [children,      setChildren]      = useState([]);
  const [visits,        setVisits]        = useState([]);
  const [overdue,       setOverdue]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cur,           setCur]           = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      ashaAPI.getProfile().catch(() => ({ data: null })),
      ashaAPI.getMyChildren().catch(() => ({ data: [] })),
      ashaAPI.getVisits().catch(() => ({ data: [] })),
      vaccinationAPI.getOverdue().catch(() => ({ data: [] })),
      notificationAPI.list().catch(() => ({ data: [] })),
    ]).then(([p, c, v, o, n]) => {
      setProfile(p.data);
      setChildren(c.data || []);
      setVisits((v.data || []).slice(0, 8));
      setOverdue((o.data || []).slice(0, 5));
      setNotifications((n.data || []).filter(x => !x.isRead).slice(0, 3));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setCur(p => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const severe   = children.filter(c => c.nutritionStatus === 'severe').length;
  const moderate = children.filter(c => c.nutritionStatus === 'moderate').length;
  const healthy  = children.filter(c => c.nutritionStatus === 'healthy').length;
  const today    = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = user?.name?.split(' ')[0] || 'ASHA';
  const userInitial = (user?.name || 'A')[0].toUpperCase();
  const unread = notifications.length;

  /* current month visits */
  const thisMonth = new Date().getMonth();
  const monthVisits = visits.filter(v => new Date(v.visitDate || v.createdAt).getMonth() === thisMonth);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0fdff', minHeight: '100vh', color: '#0c2340' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .an-nav-link{display:inline-flex;align-items:center;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:500;color:#0c2340;text-decoration:none;white-space:nowrap;transition:background .15s,color .15s}
        .an-nav-link:hover{background:#cffafe;color:#0e7490}
        .an-nav-link.active{background:#e0f7fa;color:#0e7490;font-weight:700}
        .an-card{background:#fff;border:1.5px solid #c5e8ef;border-radius:14px;box-shadow:0 2px 12px rgba(8,145,178,.07)}
        .an-card-hover{transition:box-shadow .2s,transform .15s;text-decoration:none;color:inherit;display:block}
        .an-card-hover:hover{box-shadow:0 6px 24px rgba(8,145,178,.16);transform:translateY(-2px)}
        .an-spinner{width:44px;height:44px;border:4px solid #cffafe;border-top-color:#0891b2;border-radius:50%;animation:spin .8s linear infinite}
        .an-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .an-g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .an-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .an-badge-ok{background:#d1fae5;color:#065f46;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
        .an-badge-warn{background:#fef3c7;color:#92400e;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
        .an-badge-bad{background:#fee2e2;color:#991b1b;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
        @media(max-width:1024px){.an-g4{grid-template-columns:repeat(2,1fr)}.an-g3{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){.an-navlinks{display:none!important}.an-g4{grid-template-columns:repeat(2,1fr)}.an-g2{grid-template-columns:1fr}.an-hero-row{flex-direction:column!important}}
        @media(max-width:480px){.an-g4{grid-template-columns:1fr}.an-g3{grid-template-columns:1fr}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', height: 64, borderBottom: '2px solid #cffafe', boxShadow: '0 2px 16px rgba(8,145,178,.10)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontWeight: 700, fontSize: 15, color: '#0e7490', lineHeight: 1.1 }}>Sishu Arogaya</div>
            <div style={{ fontSize: 10, color: '#4a7a8a' }}>ASHA Worker Portal</div>
          </div>
        </div>
        <div className="an-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
          {NAV.map(([label, to]) => (
            <Link key={to} to={to} className={`an-nav-link${location.pathname === to ? ' active' : ''}`}>{label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
          <Link to="/asha/notifications" style={{ position: 'relative', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>
            🔔
            {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{unread}</span>}
          </Link>
          <Link to="/asha/settings" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{userInitial}</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <div key={src} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === cur ? 1 : 0, transition: 'opacity 1.1s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,145,178,.93),rgba(14,116,144,.65),rgba(8,145,178,.82))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="an-hero-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div style={{ color: '#fff', animation: 'fadeUp .5s ease both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>ASHA Worker Portal</div>
              <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                Namaste, {firstName}!
              </h1>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: '0 0 18px' }}>
                {profile?.block ? `${profile.block}, ${profile.district}` : 'ASHA Worker'} · {children.length} children assigned · {today}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {QUICK_ACTIONS.map(({ emoji, label, to }) => (
                  <Link key={to} to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.9)', color: '#0e7490', textDecoration: 'none', transition: 'background .15s' }}>
                    {emoji} {label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Hero stats */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {[[children.length, 'Children', '👶'], [monthVisits.length, 'Visits', '✅'], [overdue.length, 'Overdue', '⏰'], [severe, 'Urgent', '🚨']].map(([v, l, ico]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', minWidth: 68 }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{ico}</div>
                  <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#cffafe', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* dots */}
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 7 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setCur(i); clearInterval(timerRef.current); timerRef.current = setInterval(() => setCur(p => (p + 1) % SLIDES.length), 4500); }}
              style={{ width: i === cur ? 22 : 8, height: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: i === cur ? '#fff' : 'rgba(255,255,255,.45)', transition: 'width .3s', padding: 0 }} />
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}><div className="an-spinner" /></div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div className="an-g4" style={{ marginBottom: 22, animation: 'fadeUp .4s ease' }}>
              <AStatCard emoji="👶" accent="#0891b2" label="Total Children" value={children.length} sub="All assigned" />
              <AStatCard emoji="✅" accent="#059669" label="Visits This Month" value={monthVisits.length} sub="Home visits done" />
              <AStatCard emoji="⏰" accent="#f59e0b" label="Overdue Vaccines" value={overdue.length} sub={overdue.length > 0 ? 'Follow-up needed' : 'All up to date'} subColor={overdue.length > 0 ? '#f59e0b' : undefined} />
              <AStatCard emoji="🚨" accent="#ef4444" label="Severe Cases" value={severe} sub="PHC referral needed" subColor={severe > 0 ? '#ef4444' : undefined} />
            </div>

            {/* ── Urgent banner ── */}
            {severe > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', borderRadius: 16, padding: '18px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: '0 6px 24px rgba(220,38,38,.3)', animation: 'fadeUp .45s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🚨</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>⚡ URGENT — IMMEDIATE ACTION REQUIRED</div>
                    <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{severe} Child{severe > 1 ? 'ren' : ''} with Severe Malnutrition</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>PHC referral required today. Visit immediately and update MCPC register.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/asha/malnutrition-report" style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', color: '#dc2626', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>View Cases →</Link>
                </div>
              </div>
            )}

            {/* ── 2-col: children list + schedule ── */}
            <div className="an-g2" style={{ marginBottom: 22, animation: 'fadeUp .5s ease' }}>
              {/* Children list */}
              <div className="an-card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>👶 My Children</h3>
                  <Link to="/asha/children" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {children.length === 0 ? (
                    <div style={{ color: '#4a7a8a', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No children assigned yet.</div>
                  ) : children.slice(0, 6).map((c) => {
                    const st = s(c.nutritionStatus);
                    return (
                      <Link key={c._id} to={`/asha/child/${c._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, border: `1px solid ${st.border}`, background: st.bg, textDecoration: 'none', transition: 'transform .2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = ''}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: st.bbg, border: `2px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👶</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>
                            {calcAge(c.dob) || (c.ageInMonths ? `${c.ageInMonths} mo` : '—')} · ⚖️ {c.currentWeight ?? '—'} kg
                          </div>
                        </div>
                        <span className={c.nutritionStatus === 'healthy' ? 'an-badge-ok' : c.nutritionStatus === 'moderate' ? 'an-badge-warn' : 'an-badge-bad'}>
                          {st.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Overdue vaccines */}
                <div className="an-card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>💉 Overdue Vaccines</h3>
                    <Link to="/asha/vaccination-tracker" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
                  </div>
                  {overdue.length === 0 ? (
                    <div style={{ color: '#059669', fontSize: 13, fontWeight: 600, padding: '10px 0', textAlign: 'center' }}>✅ No overdue vaccines!</div>
                  ) : overdue.map((v) => (
                    <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fcd34d', marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>💉</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340' }}>{v.childId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: '#4a7a8a' }}>{v.vaccineName} · Due: {fmt(v.dueDate)}</div>
                      </div>
                      <span className="an-badge-warn">Overdue</span>
                    </div>
                  ))}
                </div>

                {/* Health summary */}
                <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'rgba(255,255,255,.08)', borderRadius: '50%' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Block Health Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {[['✅', healthy, 'Healthy'], ['⚠️', moderate, 'Moderate'], ['🚨', severe, 'Severe']].map(([ico, cnt, lbl]) => (
                      <div key={lbl} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18 }}>{ico}</div>
                        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#cffafe' }}>{cnt}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                  {children.length > 0 && (
                    <>
                      <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((healthy / children.length) * 100)}%`, height: '100%', background: '#cffafe', borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 6, textAlign: 'right' }}>
                        {Math.round((healthy / children.length) * 100)}% children healthy
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Recent Visits table ── */}
            <div className="an-card" style={{ padding: '20px 22px', marginBottom: 22, animation: 'fadeUp .55s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>📋 Recent Visit Log</h3>
                <Link to="/asha/visit-history" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>Full History →</Link>
              </div>
              {visits.length === 0 ? (
                <div style={{ color: '#4a7a8a', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No visits logged yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0fdff' }}>
                        {['Child', 'Date', 'Type', 'Weight', 'Height', 'Outcome', 'Notes'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#4a7a8a', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #c5e8ef', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v, i) => (
                        <tr key={v._id || i} style={{ background: i % 2 ? '#f0fdff' : '#fff', borderBottom: '1px solid #e0f7fa' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0c2340' }}>👶 {v.childId?.name || '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a', fontSize: 12 }}>{fmt(v.visitDate || v.createdAt)}</td>
                          <td style={{ padding: '9px 12px' }}><span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: '#e0f7fa', color: '#0891b2', border: '1px solid #c5e8ef' }}>{v.visitType || '—'}</span></td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>⚖️ {v.weight ?? '—'} kg</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>📏 {v.height ?? '—'} cm</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className={v.outcome === 'healthy' ? 'an-badge-ok' : v.outcome === 'moderate' ? 'an-badge-warn' : 'an-badge-bad'}>
                              {v.outcome === 'healthy' ? '✓ Healthy' : v.outcome === 'moderate' ? '⚠️ Moderate' : v.outcome === 'severe' ? '🚨 Severe' : v.outcome || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#4a7a8a', maxWidth: 180 }}>{v.notes?.slice(0, 60) || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Quick actions ── */}
            <div className="an-g4" style={{ animation: 'fadeUp .6s ease' }}>
              {[
                { emoji: '📝', title: 'Log New Visit',    desc: 'Record today\'s home visit',     to: '/asha/log-visit' },
                { emoji: '👶', title: 'Children List',    desc: `View all ${children.length} assigned`,    to: '/asha/children' },
                { emoji: '💉', title: 'Vaccine Tracker',  desc: 'Check pending vaccinations',    to: '/asha/vaccination-tracker' },
                { emoji: '📊', title: 'Growth Records',   desc: 'Enter weight & height data',    to: '/asha/growth-records' },
              ].map(({ emoji, title, desc, to }) => (
                <Link key={to} to={to} className="an-card an-card-hover" style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, marginBottom: 9 }}>{emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a' }}>{desc}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '18px 24px', fontSize: 12, letterSpacing: .3 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </footer>
    </div>
  );
}

function AStatCard({ emoji, accent, label, value, sub, subColor }) {
  return (
    <div className="an-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 12, color: '#4a7a8a', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0c2340', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || '#4a7a8a', marginTop: 6, fontWeight: subColor ? 600 : 400 }}>{sub}</div>
    </div>
  );
}
