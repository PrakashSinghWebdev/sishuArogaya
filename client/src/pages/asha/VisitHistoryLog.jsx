import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ashaAPI, notificationAPI } from '../../services/api';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: '#0891b2', dark: '#0e7490', bg: '#f0fdff',
  light: '#cffafe', border: '#c5e8ef', text: '#0c2340', muted: '#4a7a8a',
};

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  ['🏠 Dashboard',      '/asha/dashboard'],
  ['👶 Children',       '/asha/children'],
  ['📝 Log Visit',      '/asha/log-visit'],
  ['💉 Vaccines',       '/asha/vaccination-tracker'],
  ['📈 Growth',         '/asha/growth-records'],
  ['🚨 Malnutrition',   '/asha/malnutrition-report'],
  ['📋 Visits',         '/asha/visit-history'],
  ['🔔 Alerts',         '/asha/notifications'],
];

// ─── Status helper ────────────────────────────────────────────────────────────
const SS = {
  healthy:  { bg:'#f0fdf4', border:'#6ee7b7', color:'#059669', bbg:'#d1fae5', grad:'linear-gradient(90deg,#059669,#34d399)', label:'✓ Healthy'  },
  moderate: { bg:'#fffbeb', border:'#fcd34d', color:'#92400e', bbg:'#fef3c7', grad:'linear-gradient(90deg,#f59e0b,#fbbf24)', label:'⚠ Moderate' },
  severe:   { bg:'#fff1f2', border:'#fca5a5', color:'#991b1b', bbg:'#fee2e2', grad:'linear-gradient(90deg,#ef4444,#f87171)', label:'🚨 Severe'   },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .an-nav-link { color:${C.muted}; text-decoration:none; padding:6px 10px; border-radius:8px; font-size:13.5px; font-weight:500; transition:background .15s,color .15s; white-space:nowrap; }
  .an-nav-link:hover { background:${C.light}; color:${C.dark}; }
  .an-nav-link.active { background:${C.primary}; color:#fff; }
  .an-card { background:#fff; border:1px solid ${C.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
  .an-spinner { width:36px;height:36px;border:3.5px solid ${C.light};border-top-color:${C.primary};border-radius:50%;animation:spin .7s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .vh-filter-btn { padding:7px 16px; border-radius:20px; font-size:13px; font-weight:600; border:1.5px solid transparent; cursor:pointer; transition:all .15s; }
  .vh-filter-btn.active { background:${C.primary}; color:#fff; border-color:${C.primary}; }
  .vh-filter-btn:not(.active) { background:#fff; color:${C.muted}; border-color:${C.border}; }
  .vh-filter-btn:not(.active):hover { border-color:${C.primary}; color:${C.primary}; background:${C.bg}; }
  .vh-search { width:100%; border:1.5px solid ${C.border}; border-radius:10px; padding:9px 14px 9px 36px; font-size:13.5px; color:${C.text}; outline:none; transition:border .15s; background:#fff; }
  .vh-search:focus { border-color:${C.primary}; box-shadow:0 0 0 3px rgba(8,145,178,.1); }
  .vh-timeline-item { display:flex; gap:16px; padding:16px 20px; transition:background .12s; animation:fadeUp .35s ease both; }
  .vh-timeline-item:hover { background:${C.bg} !important; }
`;

const style_inject = () => {
  if (document.getElementById('vh-styles')) return;
  const s = document.createElement('style');
  s.id = 'vh-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const fmt = (d) => {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const dateBadgeParts = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return { day: '—', month: '' };
  return {
    day:   dt.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: dt.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    year:  dt.getFullYear(),
  };
};

// ─── Visit type badge ─────────────────────────────────────────────────────────
const VISIT_TYPE_COLORS = {
  'routine':        { bg:'#e0f2fe', color:'#0369a1' },
  'follow-up':      { bg:'#fef3c7', color:'#92400e' },
  'phc-referral':   { bg:'#fee2e2', color:'#991b1b' },
  'vaccination':    { bg:'#f0fdf4', color:'#166534' },
  'growth-check':   { bg:C.light,   color:C.dark     },
  'emergency':      { bg:'#fee2e2', color:'#7f1d1d'  },
};

const visitTypeBadge = (type) => {
  const t = (type || 'routine').toLowerCase();
  const style = VISIT_TYPE_COLORS[t] || { bg:C.light, color:C.dark };
  return (
    <span style={{
      padding:'2px 10px', borderRadius:99,
      fontSize:11, fontWeight:700,
      background:style.bg, color:style.color,
      textTransform:'capitalize',
    }}>
      {type || 'Routine'}
    </span>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ unread }) {
  const nav = useNavigate();
  const path = window.location.pathname;
  const logout = () => { localStorage.removeItem('sa_token'); window.location.href = '/login'; };

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:100, height:64,
      background:'#fff', borderBottom:`1px solid ${C.border}`,
      display:'flex', alignItems:'center', padding:'0 24px', gap:16,
      boxShadow:'0 2px 10px rgba(8,145,178,.08)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
        <span style={{ fontSize:26 }}>🏥</span>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:C.text, lineHeight:1.2 }}>Sishu Arogaya</div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>ASHA Worker Portal</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
        {NAV.map(([label, href]) => (
          <a key={href} href={href}
            className={`an-nav-link${path === href ? ' active' : ''}`}
            onClick={e => { e.preventDefault(); nav(href); }}
          >{label}</a>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <a href="/asha/notifications"
          style={{ position:'relative', color:C.muted, textDecoration:'none', fontSize:20 }}
          onClick={e => { e.preventDefault(); nav('/asha/notifications'); }}
        >
          🔔
          {unread > 0 && (
            <span style={{
              position:'absolute', top:-4, right:-4, background:'#ef4444',
              color:'#fff', fontSize:10, fontWeight:700, borderRadius:'50%',
              width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
            }}>{unread > 9 ? '9+' : unread}</span>
          )}
        </a>
        <div style={{
          width:34, height:34, borderRadius:'50%',
          background:`linear-gradient(135deg,${C.primary},${C.dark})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
        }} title="Logout" onClick={logout}>A</div>
      </div>
    </nav>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, icon }) {
  return (
    <div className="an-card" style={{
      padding:'18px 20px', borderLeft:`4px solid ${accent}`,
      animation:'fadeUp .4s ease',
    }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:800, color:accent }}>{value}</div>
      <div style={{ fontSize:12, color:C.muted, fontWeight:500, marginTop:2 }}>{label}</div>
    </div>
  );
}

// ─── Timeline item ────────────────────────────────────────────────────────────
function TimelineItem({ visit, index }) {
  const outcome = (visit.outcome || 'healthy').toLowerCase();
  const s = SS[outcome] || SS.healthy;
  const dateStr = visit.visitDate || visit.createdAt;
  const { day, month, year } = dateBadgeParts(dateStr);
  const childName = visit.childId?.name || visit.childName || 'Unknown Child';

  return (
    <div className="vh-timeline-item"
      style={{ background: index % 2 === 0 ? '#f0fdff' : '#fff' }}
    >
      {/* Date badge */}
      <div style={{ flexShrink:0 }}>
        <div style={{
          width:52, minHeight:60, borderRadius:10,
          background:`linear-gradient(135deg,${C.primary},${C.dark})`,
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', padding:'6px 4px',
          boxShadow:'0 2px 8px rgba(8,145,178,.25)',
        }}>
          <div style={{ color:'#fff', fontWeight:800, fontSize:20, lineHeight:1 }}>{day}</div>
          <div style={{ color:C.light, fontSize:10, fontWeight:600, letterSpacing:1 }}>{month}</div>
          <div style={{ color:'rgba(255,255,255,.6)', fontSize:9, marginTop:2 }}>{year}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:6, marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{childName}</span>
            {visitTypeBadge(visit.visitType)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:C.muted }}>{fmt(dateStr)}</span>
            <span style={{
              padding:'3px 11px', borderRadius:99,
              background:s.bbg, color:s.color,
              fontWeight:700, fontSize:11,
            }}>{s.label}</span>
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom: visit.notes ? 8 : 0 }}>
          {visit.weight && (
            <span style={{ fontSize:12, color:C.muted }}>
              ⚖️ <strong style={{ color:C.text }}>{visit.weight} kg</strong>
            </span>
          )}
          {visit.height && (
            <span style={{ fontSize:12, color:C.muted }}>
              📏 <strong style={{ color:C.text }}>{visit.height} cm</strong>
            </span>
          )}
          {visit.vaccinesGiven && visit.vaccinesGiven.length > 0 && (
            <span style={{ fontSize:12, color:C.muted }}>
              💉 <strong style={{ color:'#059669' }}>
                {Array.isArray(visit.vaccinesGiven)
                  ? visit.vaccinesGiven.join(', ')
                  : visit.vaccinesGiven}
              </strong>
            </span>
          )}
        </div>

        {/* Notes */}
        {visit.notes && (
          <div style={{
            fontSize:12, color:C.muted, lineHeight:1.6,
            background:'rgba(8,145,178,.04)', borderLeft:`3px solid ${C.border}`,
            padding:'6px 10px', borderRadius:'0 6px 6px 0',
            marginTop:4,
          }}>
            {visit.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const VisitHistoryLog = () => {
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [unread, setUnread]   = useState(0);

  useEffect(() => {
    style_inject();
    ashaAPI.getVisits()
      .then(r => setVisits(r.data || []))
      .catch(() => setError('Failed to load visit history.'))
      .finally(() => setLoading(false));

    notificationAPI.list()
      .then(r => setUnread((r.data || []).filter(n => !n.isRead).length))
      .catch(() => {});
  }, []);

  // Derived counts
  const total    = visits.length;
  const healthy  = useMemo(() => visits.filter(v => (v.outcome || 'healthy').toLowerCase() === 'healthy').length,  [visits]);
  const moderate = useMemo(() => visits.filter(v => (v.outcome || '').toLowerCase() === 'moderate').length, [visits]);
  const severe   = useMemo(() => visits.filter(v => (v.outcome || '').toLowerCase() === 'severe').length,   [visits]);

  // Filtered + searched list (newest first)
  const displayed = useMemo(() => {
    let list = [...visits].reverse();
    if (filter !== 'all') {
      list = list.filter(v => (v.outcome || 'healthy').toLowerCase() === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        (v.childId?.name || v.childName || '').toLowerCase().includes(q) ||
        (v.visitType || '').toLowerCase().includes(q) ||
        (v.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [visits, filter, search]);

  const FILTERS = [
    { key:'all',      label:`All (${total})` },
    { key:'healthy',  label:`✓ Healthy (${healthy})` },
    { key:'moderate', label:`⚠ Moderate (${moderate})` },
    { key:'severe',   label:`🚨 Severe (${severe})` },
  ];

  return (
    <>
      <Navbar unread={unread} />
      <div style={{ background:C.bg, minHeight:'100vh', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>📋 Visit History</h1>
          <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>
            Complete log of all home visits conducted in your area
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          <StatCard label="Total Visits"       value={total}    accent={C.primary} icon="📋" />
          <StatCard label="Healthy Outcomes"   value={healthy}  accent="#059669"   icon="✅" />
          <StatCard label="Moderate Outcomes"  value={moderate} accent="#f59e0b"   icon="⚠️" />
          <StatCard label="Severe Outcomes"    value={severe}   accent="#ef4444"   icon="🚨" />
        </div>

        {/* Search + filters */}
        <div className="an-card" style={{ padding:'16px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'1 1 220px', minWidth:180 }}>
              <span style={{
                position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                fontSize:15, color:C.muted, pointerEvents:'none',
              }}>🔍</span>
              <input
                className="vh-search"
                placeholder="Search by child name, visit type, notes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Filter buttons */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {FILTERS.map(({ key, label }) => (
                <button key={key}
                  className={`vh-filter-btn${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="an-card" style={{ overflow:'hidden' }}>
          <div style={{
            padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text }}>
              Visit Timeline
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              Showing {displayed.length} of {total} visits
            </div>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:48 }}>
              <div className="an-spinner" />
            </div>
          ) : error ? (
            <div style={{
              margin:20, background:'#fff1f2', border:'1px solid #fca5a5',
              borderRadius:10, padding:'16px 20px', color:'#991b1b',
              fontWeight:600, fontSize:13,
            }}>
              {error}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding:'48px 24px', textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:44, marginBottom:12 }}>
                {total === 0 ? '📋' : '🔍'}
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:6 }}>
                {total === 0 ? 'No visits logged yet' : 'No visits match your search'}
              </div>
              <div style={{ fontSize:13 }}>
                {total === 0
                  ? 'Start logging home visits to see them appear here.'
                  : 'Try a different search term or filter.'}
              </div>
              {search && (
                <button
                  onClick={() => { setSearch(''); setFilter('all'); }}
                  style={{
                    marginTop:14, padding:'8px 20px', borderRadius:8,
                    background:C.primary, color:'#fff', border:'none',
                    fontWeight:600, fontSize:13, cursor:'pointer',
                  }}
                >Clear filters</button>
              )}
            </div>
          ) : (
            <div>
              {displayed.map((visit, i) => (
                <div key={visit._id || i}
                  style={{ borderBottom: i < displayed.length - 1 ? `1px solid ${C.border}` : 'none' }}
                >
                  <TimelineItem visit={visit} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default VisitHistoryLog;
