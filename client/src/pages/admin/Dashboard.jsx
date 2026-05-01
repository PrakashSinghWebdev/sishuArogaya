import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { adminAPI, searchAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import SearchBar from '../../components/SearchBar';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// counts up from 0 to target using requestAnimationFrame
function AnimatedCount({ target }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!target) { setDisplay(0); return; }
    const duration = 900;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return <>{display.toLocaleString('en-IN')}</>;
}

function PulseDot({ color = '#059669' }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, marginRight: 6,
      boxShadow: `0 0 0 3px ${color}30`,
      animation: 'adminPulse 2s infinite',
    }} />
  );
}

const AdminDashboard = () => {
  const { t } = useLanguage();

  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [lastRefresh, setLastRefresh]       = useState(new Date());
  const [ashaSearchResults, setAshaSearchResults] = useState([]);
  const [ashaSearchLoading, setAshaSearchLoading] = useState(false);

  function fetchDashboard() {
    setLoading(true);
    adminAPI.getDashboard()
      .then(r => { setDashboardStats(r.data); setLastRefresh(new Date()); })
      .catch(() => setDashboardStats(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDashboard(); }, []);

  /* ── search ASHA workers ── */
  const handleSearchAsha = async (query) => {
    setAshaSearchLoading(true);
    try {
      const res = await searchAPI.adminSearchAsha(query);
      setAshaSearchResults(res.data?.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setAshaSearchResults([]);
    } finally {
      setAshaSearchLoading(false);
    }
  };

  const blockStats    = dashboardStats?.blockStats || [];
  const moderateTotal = blockStats.reduce((sum, b) => sum + (b.moderate || 0), 0);
  const severeTotal   = blockStats.reduce((sum, b) => sum + (b.severe   || 0), 0);
  const healthyTotal  = Math.max((dashboardStats?.totalChildren || 0) - moderateTotal - severeTotal, 0);

  const barChartData = useMemo(() => ({
    labels: blockStats.map(b => b._id || 'Unknown'),
    datasets: [
      {
        label: t('moderate') || 'Moderate',
        data: blockStats.map(b => b.moderate || 0),
        backgroundColor: 'rgba(245,158,11,.85)',
        borderRadius: 8, borderSkipped: false,
      },
      {
        label: t('severe') || 'Severe',
        data: blockStats.map(b => b.severe || 0),
        backgroundColor: 'rgba(220,38,38,.85)',
        borderRadius: 8, borderSkipped: false,
      },
    ],
  }), [blockStats, t]);

  const doughnutData = useMemo(() => ({
    labels: [t('healthy') || 'Healthy', t('moderate') || 'Moderate', t('severe') || 'Severe'],
    datasets: [{
      data: [healthyTotal, moderateTotal, severeTotal],
      backgroundColor: ['#059669', '#f59e0b', '#dc2626'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }), [healthyTotal, moderateTotal, severeTotal, t]);

  const kpiCards = [
    { to: '/admin/children',         emoji: '👶', label: t('totalChildren')    || 'Total Children',     value: dashboardStats?.totalChildren    || 0, color: '#0891b2', bg: 'linear-gradient(135deg,#cffafe,#e0f7fa)', trend: '+4.2%', trendUp: true  },
    { to: '/admin/asha-workers',     emoji: '👩‍⚕️', label: t('ashaWorkers')      || 'ASHA Workers',        value: dashboardStats?.totalAshaWorkers || 0, color: '#059669', bg: 'linear-gradient(135deg,#d1fae5,#ecfdf5)', trend: '+1.8%', trendUp: true  },
    { to: '/admin/malnutrition',     emoji: '🚨', label: t('malnutrition')     || 'Malnutrition Cases', value: dashboardStats?.malnutritionCases || 0, color: '#dc2626', bg: 'linear-gradient(135deg,#fee2e2,#fff1f2)', trend: '-3.1%', trendUp: false },
    { to: '/admin/vaccination-data', emoji: '💉', label: t('missedVaccinations')|| 'Missed Vaccinations',value: dashboardStats?.missedVaccinations|| 0, color: '#f59e0b', bg: 'linear-gradient(135deg,#fef3c7,#fffbeb)', trend: '-2.4%', trendUp: false },
  ];

  const quickLinks = [
    { to: '/admin/children',      emoji: '👦', title: t('childrenRegistry') || 'Children Registry',  hint: 'Live child records'      },
    { to: '/admin/asha-workers',  emoji: '👩‍⚕️', title: t('ashaWorkers')      || 'ASHA Workers',       hint: 'Assignment & capacity'   },
    { to: '/admin/malnutrition',  emoji: '🚨', title: t('malnutritionCasesAdmin') || 'Malnutrition', hint: 'Moderate & severe cases' },
    { to: '/admin/users',         emoji: '⚙️', title: t('userManagement')    || 'User Management',   hint: 'Account roles & status'  },
    { to: '/admin/heatmap',       emoji: '🗺️', title: t('districtHeatmap')   || 'District Heatmap',  hint: 'Spatial case intensity'  },
    { to: '/admin/block-reports', emoji: '📊', title: t('blockwiseReports')  || 'Blockwise Reports', hint: 'Download Excel summaries' },
    { to: '/admin/audit-logs',    emoji: '📋', title: t('auditLogs')         || 'Audit Logs',         hint: 'Full system trail'       },
    { to: '/admin/notifications', emoji: '🔔', title: t('notificationsPanel')|| 'Notifications',     hint: 'Broadcast alerts'        },
  ];

  const cardBase = {
    background: 'rgba(255,255,255,0.96)',
    border: '1.5px solid #c5e8ef',
    borderRadius: 20,
    boxShadow: '0 6px 28px rgba(8,145,178,0.07)',
  };

  const sectionHeader = {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: 16, fontWeight: 700, color: '#0c2340',
    marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
  };

  return (
    <Layout role="admin">
      <style>{`
        @keyframes adminPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(8,145,178,.25); }
          50%       { box-shadow: 0 0 0 6px rgba(8,145,178,.08); }
        }
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .admin-kpi-card { transition: transform .22s, box-shadow .22s; }
        .admin-kpi-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(8,145,178,.14) !important; }
        .admin-ql-card { transition: border-color .2s, background .2s, transform .2s; }
        .admin-ql-card:hover { border-color: #0891b2 !important; background: #f0fdff !important; transform: translateY(-2px); }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '4px solid #cffafe', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <div style={{ color: '#4a7a8a', fontSize: 13 }}>{t('loading') || 'Loading dashboard…'}</div>
        </div>
      ) : (
        <div style={{ fontFamily: "'DM Sans', sans-serif", animation: 'adminFadeUp .4s ease' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a7a8a', marginBottom: 4 }}>
                <PulseDot /> Live data · Last refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <h2 style={{ ...sectionHeader, marginBottom: 0, fontSize: 20 }}>District Health Overview</h2>
            </div>
            <button
              onClick={fetchDashboard}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 12, color: '#0e7490', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              <i className="bi bi-arrow-clockwise" /> {t('refresh') || 'Refresh'}
            </button>
          </div>

          {/* ── Search ASHA Workers ── */}
          <div style={{ ...cardBase, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...sectionHeader, marginBottom: 16 }}>🔍 Search ASHA Workers</div>
            </div>
            <SearchBar
              placeholder="Search by ASHA ID, name, or region..."
              onSearch={handleSearchAsha}
              results={ashaSearchResults}
              isLoading={ashaSearchLoading}
              noResultsMessage="No ASHA workers found"
              searchType="asha"
            />
            {ashaSearchResults.length > 0 && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {ashaSearchResults.map(asha => (
                  <Link
                    key={asha._id}
                    to={`/admin/asha-workers`}
                    style={{
                      padding: '14px 16px',
                      background: 'linear-gradient(135deg, #f0f9ff, #e0f7fa)',
                      border: '1.5px solid #0891b2',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: '#0c2340',
                      transition: 'all .2s',
                      display: 'block',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(8,145,178,.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{asha.ashaId}</div>
                      <div style={{ fontSize: 20 }}>👩‍⚕️</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#0891b2' }}>{asha.name}</div>
                    <div style={{ fontSize: 12, color: '#4a7a8a', marginBottom: 8 }}>{asha.region}</div>
                    <div style={{ fontSize: 11, color: '#059669', display: 'flex', gap: 12 }}>
                      <span>👶 {asha.totalChildren} children</span>
                      <span>✅ {asha.totalVisits} visits</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {kpiCards.map(({ to, emoji, label, value, color, bg, trend, trendUp }) => (
              <Link to={to} key={label} style={{ textDecoration: 'none' }}>
                <div className="admin-kpi-card" style={{ ...cardBase, padding: '22px 20px', background: bg, borderColor: `${color}30`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, background: `${color}18`, borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: `${color}cc`, marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, fontFamily: "'Libre Baskerville',serif" }}>
                        <AnimatedCount target={value} />
                      </div>
                      <div style={{
                        marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 700,
                        color: trendUp ? '#059669' : '#dc2626',
                        background: trendUp ? '#ecfdf5' : '#fef2f2',
                        padding: '3px 8px', borderRadius: 999,
                      }}>
                        <i className={`bi bi-arrow-${trendUp ? 'up' : 'down'}-right`} />
                        {trend} vs last month
                      </div>
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                      {emoji}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 22, marginBottom: 22 }}>
            <div style={{ ...cardBase, padding: 24 }}>
              <h3 style={sectionHeader}>
                📊 {t('blockMalnutrition') || 'Block-wise Malnutrition'}
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>
                  {blockStats.length} blocks
                </span>
              </h3>
              <div style={{ height: 300 }}>
                {blockStats.length > 0 ? (
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top', labels: { font: { family: "'DM Sans',sans-serif", size: 12 }, padding: 14 } },
                        tooltip: { backgroundColor: '#0c2340', titleFont: { family: "'DM Sans',sans-serif" }, bodyFont: { family: "'DM Sans',sans-serif" } },
                      },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { family: "'DM Sans',sans-serif", size: 11 } } },
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0, font: { family: "'DM Sans',sans-serif" } } },
                      },
                    }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8' }}>
                    <div style={{ fontSize: 36 }}>📊</div>
                    <div style={{ fontSize: 13 }}>No block data yet. Register children to see district stats.</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...cardBase, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 style={sectionHeader}>🥗 {t('nutritionDist') || 'Nutrition Distribution'}</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true, maintainAspectRatio: false, cutout: '74%',
                    plugins: {
                      legend: { position: 'right', labels: { font: { family: "'DM Sans',sans-serif", size: 12 }, padding: 18 } },
                      tooltip: { backgroundColor: '#0c2340' },
                    },
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                {[
                  { label: t('healthy')  || 'Healthy',  count: healthyTotal,  color: '#059669' },
                  { label: t('moderate') || 'Moderate', count: moderateTotal, color: '#f59e0b' },
                  { label: t('severe')   || 'Severe',   count: severeTotal,   color: '#dc2626' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8fafc', borderRadius: 10, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'Libre Baskerville',serif" }}>
                      {item.count.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 10, color: '#4a7a8a', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* priority blocks + quick access */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, marginBottom: 22 }}>
            <div style={{ ...cardBase, padding: 24 }}>
              <h3 style={sectionHeader}>🚨 {t('priorityBlocks') || 'Priority Blocks Overview'}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      {[t('block') || 'Block', t('totalChildren') || 'Total', t('moderate') || 'Moderate', t('severe') || 'Severe', t('status') || 'Status'].map(heading => (
                        <th key={heading} style={{ padding: '10px 12px', color: '#4a7a8a', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {blockStats.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>No block data available</td></tr>
                    ) : blockStats.map(b => {
                      const riskScore = (b.severe || 0) * 2 + (b.moderate || 0);
                      const blockStatus = (b.severe || 0) >= 5
                        ? { label: t('blockCritical')   || 'Critical',  color: '#dc2626', bg: '#fef2f2' }
                        : riskScore >= 8
                        ? { label: t('blockWatchlist')  || 'Watchlist', color: '#d97706', bg: '#fffbeb' }
                        : { label: t('blockStable')     || 'Stable',    color: '#059669', bg: '#ecfdf5' };
                      return (
                        <tr
                          key={b._id}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fdff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '13px 12px', fontWeight: 700, color: '#0f172a' }}>{b._id || 'Unknown'}</td>
                          <td style={{ padding: '13px 12px', color: '#0891b2', fontWeight: 600 }}>{b.total    || 0}</td>
                          <td style={{ padding: '13px 12px', color: '#f59e0b', fontWeight: 600 }}>{b.moderate || 0}</td>
                          <td style={{ padding: '13px 12px', color: '#dc2626', fontWeight: 600 }}>{b.severe   || 0}</td>
                          <td style={{ padding: '13px 12px' }}>
                            <span style={{ background: blockStatus.bg, color: blockStatus.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {blockStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ ...cardBase, padding: 24 }}>
              <h3 style={sectionHeader}>⚡ {t('quickAccess') || 'Quick Access'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {quickLinks.map(link => (
                  <Link to={link.to} key={link.to} style={{ textDecoration: 'none' }}>
                    <div className="admin-ql-card" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 12px', cursor: 'pointer' }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{link.emoji}</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, marginBottom: 3 }}>{link.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{link.hint}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* system status bar */}
          <div style={{ ...cardBase, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0c2340', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PulseDot color="#059669" /> System Online
            </div>
            {[
              { label: 'API',        value: 'Connected'  },
              { label: 'Database',   value: 'MongoDB'    },
              { label: 'AI Chatbot', value: 'Gemini 1.5' },
              { label: 'Reports',    value: 'PDF + Excel'},
            ].map(sys => (
              <div key={sys.label} style={{ fontSize: 12, color: '#4a7a8a' }}>
                <span style={{ fontWeight: 700, color: '#0c2340' }}>{sys.label}: </span>{sys.value}
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
              Shishu Aarogya · {t('adminPortal') || 'Admin Portal'} · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
