import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ashaAPI, vaccinationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ─── Constants ─────────────────────────────────────────────────── */
const NAV = [
  ['🏠 Dashboard', '/asha/dashboard'],
  ['👶 Children', '/asha/children'],
  ['📝 Log Visit', '/asha/log-visit'],
  ['💉 Vaccines', '/asha/vaccination-tracker'],
  ['📈 Growth', '/asha/growth-records'],
  ['🚨 Malnutrition', '/asha/malnutrition-report'],
  ['📋 Visits', '/asha/visit-history'],
  ['🔔 Alerts', '/asha/notifications'],
];

const C = {
  primary: '#0891b2',
  dark: '#0e7490',
  bg: '#f0fdff',
  light: '#cffafe',
  border: '#c5e8ef',
  text: '#0c2340',
  muted: '#4a7a8a',
};

const ALL_VACCINES = [
  { name: 'BCG', age: 'Birth', pct: 100 },
  { name: 'OPV-0', age: 'Birth', pct: 98 },
  { name: 'Hepatitis B (1st)', age: 'Birth', pct: 95 },
  { name: 'DPT-1+OPV-1+Hib-1+PCV-1+Rota-1', age: '6 Weeks', pct: 92 },
  { name: 'DPT-2+OPV-2+Hib-2+PCV-2+Rota-2', age: '10 Weeks', pct: 90 },
  { name: 'DPT-3+OPV-3+Hib-3+IPV+Hep-B', age: '14 Weeks', pct: 88 },
  { name: 'MMR-1+MR+JE-1', age: '9 Months', pct: 84 },
  { name: 'MMR-2+DPT Booster', age: '16–24 Months', pct: 72 },
  { name: 'Typhoid+Hepatitis A', age: '24 Months', pct: 65 },
];

const CAMPS = [
  { date: '15 Sep', place: 'PHC Raipur', time: '9 AM – 4 PM', vaccines: 'MMR-2, DPT Booster', children: 12, status: 'upcoming' },
  { date: '22 Sep', place: 'Anganwadi Ward 14', time: '10 AM – 2 PM', vaccines: 'BCG, Hep-B, OPV-0', children: 8, status: 'scheduled' },
  { date: '29 Sep', place: 'CHC Dehradun', time: '9 AM – 5 PM', vaccines: 'All pending', children: 20, status: 'scheduled' },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */
function calcAge(dob) {
  if (!dob) return '—';
  const months = Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}mo`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}mo` : `${yrs}y`;
}

function nextVaccineLabel(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return '—';
  if (ageMonths < 1.5) return 'BCG / OPV-0 / Hep-B';
  if (ageMonths < 2.5) return 'DPT-1 / OPV-1 / PCV-1';
  if (ageMonths < 3.5) return 'DPT-2 / OPV-2 / PCV-2';
  if (ageMonths < 4) return 'DPT-3 / OPV-3 / IPV';
  if (ageMonths < 9.5) return 'MMR-1 / JE-1';
  if (ageMonths < 16) return 'Vitamin A';
  if (ageMonths < 24) return 'MMR-2 / DPT Booster';
  if (ageMonths < 30) return 'Typhoid / Hep-A';
  return 'Up to date';
}

function statusBadge(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return { label: 'Unknown', color: '#94a3b8', bg: '#f1f5f9' };
  if (ageMonths < 4) return { label: 'In Progress', color: '#0891b2', bg: '#cffafe' };
  if (ageMonths < 24) return { label: 'Due Soon', color: '#d97706', bg: '#fef3c7' };
  return { label: 'Completed', color: '#16a34a', bg: '#dcfce7' };
}

function vaccinePct(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return 0;
  if (ageMonths < 1.5) return 5;
  if (ageMonths < 2.5) return 25;
  if (ageMonths < 3.5) return 45;
  if (ageMonths < 4) return 60;
  if (ageMonths < 9.5) return 72;
  if (ageMonths < 16) return 82;
  if (ageMonths < 24) return 90;
  return 100;
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function BarMeter({ name, age, pct }) {
  const color = pct >= 90 ? '#16a34a' : pct >= 75 ? '#0891b2' : pct >= 60 ? '#d97706' : '#ef4444';
  const bgColor = pct >= 90 ? '#dcfce7' : pct >= 75 ? '#cffafe' : pct >= 60 ? '#fef3c7' : '#fef2f2';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{name}</span>
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 8, fontWeight: 500 }}>{age}</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color,
          background: bgColor, padding: '2px 8px', borderRadius: 20,
        }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#e2f4f8', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 6, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 12,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: accent || C.light,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
const VaccinationTracker = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState('children');
  const [children, setChildren] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      ashaAPI.getMyChildren().then(r => setChildren(r.data || [])).catch(() => setChildren([])),
      vaccinationAPI.getOverdue().then(r => setOverdue(r.data || [])).catch(() => setOverdue([])),
    ])
      .catch(() => setError('Failed to load data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const userInitial = user?.name ? user.name[0].toUpperCase() : 'A';

  const fullyVaccinated = children.filter(c => (c.ageInMonths || 0) >= 24).length;
  const dueThisWeek = overdue.filter(v => {
    if (!v.dueDate) return false;
    const diff = (new Date(v.dueDate) - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
  const blockCoverage = children.length > 0
    ? Math.round((fullyVaccinated / children.length) * 100)
    : 0;

  const filteredChildren = children.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Navbar ─────────────────────────────── */
  const Navbar = () => (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: `1.5px solid ${C.border}`, height: 64,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <Link to="/asha/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🏥</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>Sishu Arogaya</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>ASHA Worker Portal</div>
        </div>
      </Link>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', padding: '0 8px' }}>
        {NAV.map(([label, path]) => (
          <Link
            key={path}
            to={path}
            className={`an-nav-link${location.pathname === path ? ' active' : ''}`}
          >{label}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff',
            width: 14, height: 14, borderRadius: '50%',
            fontSize: 8, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{overdue.length > 9 ? '9+' : overdue.length || 0}</span>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>{userInitial}</div>
      </div>
    </nav>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        .an-nav-link { padding: 6px 12px; border-radius: 7px; font-size: 13px; font-weight: 500; color: #4a7a8a; text-decoration: none; transition: all 0.15s; white-space: nowrap; }
        .an-nav-link:hover { background: #cffafe; color: #0891b2; }
        .an-nav-link.active { background: #0891b2; color: #fff; }
        .an-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 12px; padding: 20px; }
        .an-spinner { width: 18px; height: 18px; border: 2.5px solid #cffafe; border-top-color: #0891b2; border-radius: 50%; display: inline-block; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .an-spinner { animation: spin 0.7s linear infinite; }
        .vt-tab { padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; }
        .vt-tab.active { background: #0891b2; color: #fff; border-color: #0891b2; }
        .vt-tab:not(.active) { background: #fff; color: #4a7a8a; border-color: #c5e8ef; }
        .vt-tab:not(.active):hover { background: #cffafe; color: #0891b2; border-color: #0891b2; }
        .vt-row:hover { background: #f0fdff !important; }
        .btn-teal-sm { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; border-radius: 7px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-teal-sm:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(8,145,178,0.3); }
        .prog-bar-bg { height: 6px; background: #e2f4f8; border-radius: 4px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; margin-left: 6px; }
        .camp-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 12px; padding: 18px 20px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 16px; transition: box-shadow 0.15s; }
        .camp-card:hover { box-shadow: 0 4px 16px rgba(8,145,178,0.12); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>💉 Vaccination Tracker</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
            Monitor immunisation coverage, track due vaccines, and manage camp schedules
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
            padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#991b1b',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14, marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both',
        }}>
          <StatCard icon="✅" label="Fully Vaccinated" value={loading ? '…' : fullyVaccinated} sub="Children (24m+)" accent="#dcfce7" />
          <StatCard icon="⏰" label="Due This Week" value={loading ? '…' : dueThisWeek} sub="Overdue vaccines" accent="#fef3c7" />
          <StatCard icon="📊" label="Block Coverage" value={loading ? '…' : `${blockCoverage}%`} sub="Of assigned children" accent={C.light} />
          <StatCard icon="📅" label="Next Camp" value="15 Sep" sub="PHC Raipur" accent="#f3e8ff" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, animation: 'fadeUp 0.4s ease 0.1s both' }}>
          {[['children', '👶 Children'], ['vaccines', '📊 Coverage'], ['camps', '📅 Camps']].map(([key, label]) => (
            <button
              key={key}
              className={`vt-tab${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}
            >{label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: C.muted, fontSize: 14 }}>
              <div className="an-spinner" style={{ width: 24, height: 24 }} />
              Loading vaccination data…
            </div>
          </div>
        )}

        {/* TAB: Children */}
        {!loading && tab === 'children' && (
          <div className="an-card" style={{ animation: 'fadeUp 0.35s ease', padding: 0, overflow: 'hidden' }}>
            {/* Search bar */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder="Search children by name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: C.text, background: 'transparent',
                }}
              />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                {filteredChildren.length} of {children.length} children
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {['Child', 'Age', 'Weight', 'Next Vaccine', 'Progress', 'Status', 'Action'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', fontSize: 11, fontWeight: 700,
                        color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em',
                        textAlign: 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredChildren.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontSize: 14 }}>
                        {search ? 'No children match your search.' : 'No children assigned yet.'}
                      </td>
                    </tr>
                  ) : filteredChildren.map((child, i) => {
                    const age = child.ageInMonths ?? 0;
                    const pct = vaccinePct(age);
                    const badge = statusBadge(age);
                    const nextVax = nextVaccineLabel(age);
                    return (
                      <tr
                        key={child._id}
                        className="vt-row"
                        style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : '#fafeff' }}
                      >
                        {/* Child name + initial */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                              background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: 13,
                            }}>{child.name?.[0]?.toUpperCase() || '?'}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{child.name}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{child.village || child.block || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>
                          {child.dateOfBirth ? calcAge(child.dateOfBirth) : `${age}mo`}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>
                          {child.weight ? `${child.weight} kg` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.text, maxWidth: 160 }}>
                          <span style={{
                            display: 'inline-block', background: C.bg,
                            border: `1px solid ${C.border}`, borderRadius: 6,
                            padding: '3px 8px', fontSize: 11, fontWeight: 600, color: C.dark,
                          }}>{nextVax}</span>
                        </td>
                        {/* Progress bar */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 70, height: 6, background: '#e2f4f8', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: pct >= 90 ? '#16a34a' : pct >= 60 ? C.primary : '#f59e0b',
                                borderRadius: 4,
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: badge.bg, color: badge.color,
                            border: `1px solid ${badge.color}33`,
                            borderRadius: 20, padding: '3px 10px',
                            fontSize: 11, fontWeight: 600,
                          }}>{badge.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn-teal-sm"
                            onClick={() => navigate(`/asha/log-visit?childId=${child._id}`)}
                          >
                            ✓ Mark Given
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Vaccine Coverage */}
        {!loading && tab === 'vaccines' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeUp 0.35s ease' }}>
            {/* Bar meters */}
            <div className="an-card">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Block Vaccine Coverage</h3>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 20, marginTop: 0 }}>Coverage percentage by vaccine dose</p>
              {ALL_VACCINES.map(v => (
                <BarMeter key={v.name} name={v.name} age={v.age} pct={v.pct} />
              ))}
            </div>

            {/* Right column: summary + overdue list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Coverage legend */}
              <div className="an-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>Coverage Legend</h3>
                {[
                  { label: 'Excellent (90–100%)', color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Good (75–89%)', color: '#0891b2', bg: '#cffafe' },
                  { label: 'Fair (60–74%)', color: '#d97706', bg: '#fef3c7' },
                  { label: 'Low (Below 60%)', color: '#ef4444', bg: '#fef2f2' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 8, borderRadius: 4,
                      background: `linear-gradient(90deg, ${row.color}, ${row.color}99)`,
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: row.color, background: row.bg,
                      padding: '2px 10px', borderRadius: 20,
                    }}>{row.label}</span>
                  </div>
                ))}
              </div>

              {/* Overdue summary */}
              <div className="an-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Overdue Vaccines</h3>
                  <span style={{
                    background: overdue.length > 0 ? '#fef2f2' : '#dcfce7',
                    color: overdue.length > 0 ? '#ef4444' : '#16a34a',
                    border: `1px solid ${overdue.length > 0 ? '#fca5a5' : '#86efac'}`,
                    borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                  }}>{overdue.length} pending</span>
                </div>
                {overdue.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    No overdue vaccinations!
                  </div>
                ) : overdue.slice(0, 5).map(v => (
                  <div key={v._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: `1px solid ${C.bg}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.childId?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{v.vaccineName}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#ef4444',
                      background: '#fef2f2', border: '1px solid #fca5a5',
                      borderRadius: 6, padding: '2px 8px',
                    }}>
                      {v.dueDate ? new Date(v.dueDate).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </div>
                ))}
                {overdue.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <button
                      onClick={() => setTab('children')}
                      style={{ background: 'none', border: 'none', color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      View all {overdue.length} →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Camps */}
        {!loading && tab === 'camps' && (
          <div style={{ animation: 'fadeUp 0.35s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Upcoming Vaccination Camps</h3>
              <span style={{ fontSize: 12, color: C.muted }}>{CAMPS.length} camps scheduled</span>
            </div>
            {CAMPS.map((camp, i) => {
              const isUpcoming = camp.status === 'upcoming';
              return (
                <div key={i} className="camp-card">
                  {/* Date badge */}
                  <div style={{
                    flexShrink: 0, width: 60, height: 60, borderRadius: 12,
                    background: isUpcoming
                      ? `linear-gradient(135deg, ${C.primary}, ${C.dark})`
                      : `linear-gradient(135deg, #64748b, #475569)`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>
                      {camp.date.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                      {camp.date.split(' ')[1]}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{camp.place}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        background: isUpcoming ? C.light : '#f1f5f9',
                        color: isUpcoming ? C.dark : '#64748b',
                        border: `1px solid ${isUpcoming ? C.border : '#cbd5e1'}`,
                        textTransform: 'capitalize',
                      }}>{camp.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.muted }}>
                      <span>🕐 {camp.time}</span>
                      <span>💉 {camp.vaccines}</span>
                      <span>👶 {camp.children} children registered</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      className="btn-teal-sm"
                      onClick={() => navigate('/asha/log-visit')}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      📋 Log Visit
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty camp info card */}
            <div style={{
              marginTop: 16, background: C.bg, border: `1.5px dashed ${C.border}`,
              borderRadius: 12, padding: '20px 24px', textAlign: 'center',
              color: C.muted, fontSize: 13,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              Camp schedule is updated by your PHC coordinator. Contact them to add new camps.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationTracker;
