import { useState, useEffect } from 'react';
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

const SEVERE_PROTOCOL = [
  'Immediately refer to PHC / CMAM centre',
  'Initiate RUTF (Ready-to-Use Therapeutic Food)',
  'Visit family DAILY for 7 days',
  'Report to District Health Officer',
  'Document in MCPC register within 24 hours',
];
const MODERATE_PROTOCOL = [
  'Counsel mother on nutrition & breastfeeding',
  'Add energy-dense foods: dal, egg, ghee, ragi',
  'Visit WEEKLY for 4 weeks',
  'Enrol in ICDS supplementary nutrition programme',
  'Monitor weight every 2 weeks',
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .an-nav-link { color:${C.muted}; text-decoration:none; padding:6px 10px; border-radius:8px; font-size:13.5px; font-weight:500; transition:background .15s,color .15s; white-space:nowrap; }
  .an-nav-link:hover { background:${C.light}; color:${C.dark}; }
  .an-nav-link.active { background:${C.primary}; color:#fff; }
  .an-card { background:#fff; border:1px solid ${C.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
  .an-spinner { width:36px;height:36px;border:3.5px solid ${C.light};border-top-color:${C.primary};border-radius:50%;animation:spin .7s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .mr-case-card { border-radius:12px; overflow:hidden; transition:box-shadow .15s; }
  .mr-case-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }
  .mr-expand-btn { background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; padding:4px 8px; border-radius:6px; transition:background .12s; }
  .mr-expand-btn:hover { background:rgba(0,0,0,.06); }
  .mr-action-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px; font-size:12.5px; font-weight:600; border:none; cursor:pointer; text-decoration:none; transition:all .15s; }
`;

const style_inject = () => {
  if (document.getElementById('mr-styles')) return;
  const s = document.createElement('style');
  s.id = 'mr-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
};

const calcAge = (dob) => {
  if (!dob) return null;
  const ms = Date.now() - new Date(dob).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
  return months;
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
function StatCard({ label, value, accent, icon, sub }) {
  return (
    <div className="an-card" style={{
      padding:'18px 20px', borderLeft:`4px solid ${accent}`,
      animation:'fadeUp .4s ease',
    }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:800, color:accent }}>{value}</div>
      <div style={{ fontSize:12, color:C.muted, fontWeight:500, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:accent, fontWeight:600, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ─── Case card ────────────────────────────────────────────────────────────────
function CaseCard({ child, type }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const s = SS[type];
  const age = child.ageInMonths ?? calcAge(child.dateOfBirth);

  return (
    <div className="mr-case-card an-card"
      style={{ border:`1.5px solid ${s.border}`, marginBottom:12, animation:'fadeUp .3s ease' }}
    >
      {/* Header row */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px',
        background: type === 'severe'
          ? 'linear-gradient(90deg,#fff1f2,#fff)'
          : 'linear-gradient(90deg,#fffbeb,#fff)',
        borderBottom: open ? `1px solid ${s.border}` : 'none',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:40, height:40, borderRadius:'50%',
            background:s.bbg, border:`2px solid ${s.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18,
          }}>
            {type === 'severe' ? '🚨' : '⚠️'}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{child.name}</div>
            <div style={{ fontSize:12, color:C.muted }}>
              {age != null ? `${age} months` : '—'}
              {child.gender ? ` · ${child.gender}` : ''}
              {child.parentId?.name ? ` · Parent: ${child.parentId.name}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            padding:'4px 12px', borderRadius:99,
            background:s.bbg, color:s.color, fontWeight:700, fontSize:12,
          }}>{s.label}</span>
          <button className="mr-expand-btn" onClick={() => setOpen(o => !o)}
            style={{ color:C.muted }}
          >
            {open ? '▲ Less' : '▼ Details'}
          </button>
        </div>
      </div>

      {/* Quick metrics strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        padding:'10px 18px', gap:8,
        borderBottom: open ? `1px solid ${s.border}` : 'none',
      }}>
        {[
          { label:'Weight',     value: child.currentWeight ? `${child.currentWeight} kg` : (child.weight ? `${child.weight} kg` : '—') },
          { label:'Height',     value: child.currentHeight ? `${child.currentHeight} cm` : (child.height ? `${child.height} cm` : '—') },
          { label:'Blood Grp', value: child.bloodGroup || '—' },
          { label:'Village',   value: child.village || child.address || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{value}</div>
            <div style={{ fontSize:11, color:C.muted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Expandable details */}
      {open && (
        <div style={{ padding:'14px 18px', animation:'fadeUp .2s ease' }}>
          <div style={{
            background:s.bg, border:`1px solid ${s.border}`,
            borderRadius:10, padding:'12px 16px', marginBottom:14, fontSize:13, color:s.color,
          }}>
            <strong>Nutrition Status:</strong> {child.nutritionStatus?.toUpperCase() || type.toUpperCase()} —{' '}
            {type === 'severe'
              ? 'This child requires immediate medical attention and PHC referral.'
              : 'This child needs enhanced nutrition support and weekly monitoring.'}
          </div>

          {/* Extra details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[
              { label:'Date of Birth', value: child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-IN') : '—' },
              { label:'ASHA Zone',     value: child.zone || '—' },
              { label:'Last Visit',    value: child.lastVisit ? new Date(child.lastVisit).toLocaleDateString('en-IN') : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background:C.bg, border:`1px solid ${C.border}`,
                borderRadius:8, padding:'10px 12px',
              }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="mr-action-btn"
              style={{ background:'#ef4444', color:'#fff' }}
              onClick={() => nav(`/asha/log-visit?childId=${child._id}&type=phc-referral`)}
            >
              🏥 PHC Referral
            </button>
            <button className="mr-action-btn"
              style={{ background:C.primary, color:'#fff' }}
              onClick={() => nav(`/asha/log-visit?childId=${child._id}`)}
            >
              📝 Log Follow-up
            </button>
            {(child.parentId?.phone || child.phone) && (
              <a className="mr-action-btn"
                href={`tel:${child.parentId?.phone || child.phone}`}
                style={{ background:'#f0fdf4', color:'#059669', border:'1px solid #6ee7b7' }}
              >
                📞 Call Family
              </a>
            )}
            <button className="mr-action-btn"
              style={{ background:C.bg, color:C.primary, border:`1px solid ${C.border}` }}
              onClick={() => nav(`/asha/growth-records?childId=${child._id}`)}
            >
              📈 Growth Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Protocol card ────────────────────────────────────────────────────────────
function ProtocolCard({ title, steps, accent, icon }) {
  return (
    <div style={{
      background:'#fff', border:`1.5px solid ${accent}20`,
      borderTop:`4px solid ${accent}`,
      borderRadius:12, padding:'18px 20px',
    }}>
      <div style={{ fontWeight:700, fontSize:14, color:accent, marginBottom:14 }}>
        {icon} {title}
      </div>
      <ol style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:10 }}>
        {steps.map((step, i) => (
          <li key={i} style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const MalnutritionReport = () => {
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [unread, setUnread]           = useState(0);

  useEffect(() => {
    style_inject();
    ashaAPI.getMyChildren()
      .then(r => setAllChildren(r.data || []))
      .catch(() => setError('Failed to load children data.'))
      .finally(() => setLoading(false));

    notificationAPI.list()
      .then(r => setUnread((r.data || []).filter(n => !n.isRead).length))
      .catch(() => {});
  }, []);

  const severe   = allChildren.filter(c => c.nutritionStatus === 'severe');
  const moderate = allChildren.filter(c => c.nutritionStatus === 'moderate');
  const healthy  = allChildren.filter(c => !['severe','moderate'].includes(c.nutritionStatus));
  // Estimate PHC referrals as severe cases (all need referral)
  const phcCount = severe.length;

  if (loading) return (
    <>
      <Navbar unread={unread} />
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh', background:C.bg }}>
        <div className="an-spinner" />
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar unread={unread} />
      <div style={{ background:C.bg, minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center' }}>
        <div style={{ background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:12, padding:'24px 32px', color:'#991b1b', fontWeight:600 }}>
          {error}
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar unread={unread} />
      <div style={{ background:C.bg, minHeight:'100vh', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>🚨 Malnutrition Report</h1>
          <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>
            Active malnutrition cases in your assigned area — {allChildren.length} total children monitored
          </p>
        </div>

        {/* Urgent banner */}
        {severe.length > 0 && (
          <div style={{
            background:'linear-gradient(90deg,#991b1b,#dc2626)',
            color:'#fff', borderRadius:12, padding:'14px 20px',
            display:'flex', alignItems:'center', gap:14,
            marginBottom:20, animation:'fadeUp .3s ease',
            boxShadow:'0 4px 16px rgba(220,38,38,.3)',
          }}>
            <span style={{ fontSize:28 }}>🚨</span>
            <div>
              <div style={{ fontWeight:800, fontSize:15 }}>
                {severe.length} Severe Case{severe.length > 1 ? 's' : ''} — Immediate Action Required
              </div>
              <div style={{ fontSize:12, opacity:.9, marginTop:2 }}>
                {severe.map(c => c.name).join(', ')} require urgent PHC referral today.
              </div>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          <StatCard label="Severe Cases"    value={severe.length}   accent="#ef4444" icon="🚨" sub={severe.length > 0 ? 'Urgent referral needed' : undefined} />
          <StatCard label="Moderate Cases"  value={moderate.length} accent="#f59e0b" icon="⚠️" sub={moderate.length > 0 ? 'Weekly monitoring' : undefined} />
          <StatCard label="Healthy"         value={healthy.length}  accent="#059669" icon="✅" />
          <StatCard label="PHC Referrals"   value={phcCount}        accent={C.primary} icon="🏥" sub={phcCount > 0 ? 'Pending referrals' : 'None pending'} />
        </div>

        {/* Severe cases section */}
        {severe.length > 0 && (
          <section style={{ marginBottom:28 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:10, marginBottom:14,
              paddingBottom:10, borderBottom:`2px solid #fca5a5`,
            }}>
              <div style={{
                background:'#fee2e2', border:'1.5px solid #fca5a5',
                borderRadius:8, padding:'4px 14px',
                fontWeight:800, fontSize:14, color:'#991b1b',
              }}>
                🚨 Severe Cases ({severe.length})
              </div>
              <span style={{ fontSize:12, color:'#991b1b', fontWeight:500 }}>
                Requires immediate PHC referral and daily home visits
              </span>
            </div>
            {severe.map(child => (
              <CaseCard key={child._id} child={child} type="severe" />
            ))}
          </section>
        )}

        {/* Moderate cases section */}
        {moderate.length > 0 && (
          <section style={{ marginBottom:28 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:10, marginBottom:14,
              paddingBottom:10, borderBottom:`2px solid #fcd34d`,
            }}>
              <div style={{
                background:'#fef3c7', border:'1.5px solid #fcd34d',
                borderRadius:8, padding:'4px 14px',
                fontWeight:800, fontSize:14, color:'#92400e',
              }}>
                ⚠️ Moderate Cases ({moderate.length})
              </div>
              <span style={{ fontSize:12, color:'#92400e', fontWeight:500 }}>
                Weekly home visits and enhanced nutrition counselling
              </span>
            </div>
            {moderate.map(child => (
              <CaseCard key={child._id} child={child} type="moderate" />
            ))}
          </section>
        )}

        {/* No cases */}
        {severe.length === 0 && moderate.length === 0 && (
          <div className="an-card" style={{ padding:'48px 24px', textAlign:'center', animation:'fadeUp .4s ease' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:17, color:'#059669' }}>No Active Malnutrition Cases</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>
              All {allChildren.length} children in your area are healthy. Keep up the great work!
            </div>
          </div>
        )}

        {/* ASHA Action Protocol */}
        <div className="an-card" style={{ padding:22 }}>
          <div style={{ fontWeight:800, fontSize:16, color:C.text, marginBottom:4 }}>
            📋 ASHA Action Protocol
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>
            Standard operating procedures for managing malnutrition cases
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <ProtocolCard
              title="Severe Malnutrition Protocol"
              steps={SEVERE_PROTOCOL}
              accent="#ef4444"
              icon="🚨"
            />
            <ProtocolCard
              title="Moderate Malnutrition Protocol"
              steps={MODERATE_PROTOCOL}
              accent="#f59e0b"
              icon="⚠️"
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default MalnutritionReport;
