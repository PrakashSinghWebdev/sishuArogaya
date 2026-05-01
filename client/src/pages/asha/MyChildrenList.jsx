import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ashaAPI } from '../../services/api';
import Layout from '../../components/Layout';
import { MEDIA_ARRAY } from '../../components/MediaCarousel';

const statusVisuals = {
  healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', badgeBg: '#d1fae5', gradient: 'linear-gradient(90deg,#059669,#34d399)' },
  moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', badgeBg: '#fef3c7', gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', badgeBg: '#fee2e2', gradient: 'linear-gradient(90deg,#ef4444,#f87171)' },
};

function ageLabel(dob, ageInMonths) {
  if (ageInMonths) {
    return ageInMonths < 24
      ? `${ageInMonths} mo`
      : `${Math.floor(ageInMonths / 12)} yr ${ageInMonths % 12} mo`;
  }
  if (!dob) return '—';
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr`;
}

function formatDate(d) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MyChildrenList() {
  const { t } = useLanguage();

  // merge i18n labels into the visual config at runtime
  const statusWithLabels = {
    healthy:  { ...statusVisuals.healthy,  label: `✓ ${t('healthy')}` },
    moderate: { ...statusVisuals.moderate, label: `⚠️ ${t('moderate')}` },
    severe:   { ...statusVisuals.severe,   label: `🚨 ${t('severe')}` },
  };
  const getStatus = status => statusWithLabels[status] || statusWithLabels.healthy;

  const [children, setChildren] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText]     = useState('');
  const [viewMode, setViewMode]         = useState('grid');
  const [expanded, setExpanded]         = useState(null);

  useEffect(() => {
    ashaAPI.getMyChildren()
      .then(res => setChildren(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = {
    all:      children.length,
    healthy:  children.filter(c => c.nutritionStatus === 'healthy').length,
    moderate: children.filter(c => c.nutritionStatus === 'moderate').length,
    severe:   children.filter(c => c.nutritionStatus === 'severe').length,
  };

  const visibleChildren = children.filter(c => {
    const matchesFilter = activeFilter === 'all' || c.nutritionStatus === activeFilter;
    const matchesSearch = (c.name || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Layout role="asha">
      <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#0c2340' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
          *,*::before,*::after{box-sizing:border-box}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          .child-card{background:#fff;border:1.5px solid #c5e8ef;border-radius:14px;box-shadow:0 2px 12px rgba(8,145,178,.07)}
          .spinner{width:44px;height:44px;border:4px solid #cffafe;border-top-color:#0891b2;border-radius:50%;animation:spin .8s linear infinite}
        `}</style>

        {/* banner */}
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${MEDIA_ARRAY[0].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,145,178,.92),rgba(14,116,144,.7))' }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>{t('ashaPortal')}</div>
              <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{t('myChildren')}</h1>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: 0 }}>{children.length} {t('childrenAssignedLabel')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['✅', statusCounts.healthy, t('healthy')], ['⚠️', statusCounts.moderate, t('moderate')], ['🚨', statusCounts.severe, t('severe')]].map(([icon, count, label]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', minWidth: 64 }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, color: '#cffafe' }}>{count}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 60px' }}>
          {/* heading row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, animation: 'fadeUp .4s ease' }}>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, margin: 0 }}>👶 {t('myChildren')}</h2>
            <Link to="/asha/log-visit" style={{ padding: '9px 20px', borderRadius: 9, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              ➕ {t('logVisit')}
            </Link>
          </div>

          {/* quick-stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20, animation: 'fadeUp .45s ease' }}>
            {[
              ['👶', '#0891b2', statusCounts.all,      t('totalChildren'), t('assignedChildren')],
              ['✅', '#059669', statusCounts.healthy,  t('healthy'),       'WAZ ≥ −1'],
              ['⚠️', '#f59e0b', statusCounts.moderate, t('moderate'),      t('followUpNeeded')],
              ['🚨', '#ef4444', statusCounts.severe,   t('severe'),        t('phcReferralNeeded')],
            ].map(([icon, accent, value, label, sub]) => (
              <div key={label} className="child-card" style={{ padding: '16px 18px', borderLeft: `4px solid ${accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#4a7a8a', fontWeight: 500 }}>{label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0c2340' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* search + filters + view toggle */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeUp .5s ease' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: .4 }}>🔍</span>
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder={t('searchByName')}
                style={{ width: '100%', padding: '11px 12px 11px 38px', border: '1.5px solid #c5e8ef', borderRadius: 11, fontSize: 13, color: '#0c2340', background: '#f0fdff', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#0891b2'}
                onBlur={e => e.target.style.borderColor = '#c5e8ef'}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                ['all',      `👥 ${t('viewAll')}`,   statusCounts.all],
                ['healthy',  `✅ ${t('healthy')}`,   statusCounts.healthy],
                ['moderate', `⚠️ ${t('moderate')}`,  statusCounts.moderate],
                ['severe',   `🚨 ${t('severe')}`,    statusCounts.severe],
              ].map(([key, label, count]) => (
                <button key={key} onClick={() => setActiveFilter(key)} style={{
                  padding: '9px 12px', borderRadius: 10,
                  border: `1.5px solid ${activeFilter === key ? '#0891b2' : '#c5e8ef'}`,
                  background: activeFilter === key ? '#e0f7fa' : '#fff',
                  color: activeFilter === key ? '#0891b2' : '#4a7a8a',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {label}
                  <span style={{ marginLeft: 4, background: activeFilter === key ? '#0891b2' : '#c5e8ef', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: 10 }}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', border: '1px solid #c5e8ef', borderRadius: 10, overflow: 'hidden' }}>
              {[['grid', '⊞'], ['table', '☰']].map(([key, icon]) => (
                <button key={key} onClick={() => setViewMode(key)} style={{
                  padding: '9px 14px', border: 'none',
                  background: viewMode === key ? '#e0f7fa' : '#fff',
                  color: viewMode === key ? '#0891b2' : '#4a7a8a',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : visibleChildren.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#0c2340' }}>{t('noRecords')}</div>
              <div style={{ fontSize: 13, color: '#4a7a8a', marginTop: 6 }}>{t('filter')}</div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, animation: 'fadeUp .55s ease' }}>
              {visibleChildren.map(child => {
                const s = getStatus(child.nutritionStatus);
                const open = expanded === child._id;
                return (
                  <div
                    key={child._id}
                    style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${open ? '#0891b2' : s.border}`, boxShadow: '0 2px 12px rgba(8,145,178,.08)', overflow: 'hidden', transition: 'all .3s' }}
                    onMouseEnter={e => { if (!open) e.currentTarget.style.boxShadow = '0 8px 28px rgba(8,145,178,.16)'; }}
                    onMouseLeave={e => { if (!open) e.currentTarget.style.boxShadow = '0 2px 12px rgba(8,145,178,.08)'; }}
                  >
                    <div style={{ height: 4, background: s.gradient }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.badgeBg, border: `2px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👶</div>
                          <div>
                            <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: '#0c2340' }}>{child.name}</div>
                            <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>{ageLabel(child.dob, child.ageInMonths)}</div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: s.badgeBg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 12 }}>
                        {[['⚖️', `${child.currentWeight ?? '—'} kg`, 'Weight'], ['📏', `${child.currentHeight ?? '—'} cm`, 'Height'], ['🩸', child.bloodGroup || '—', 'Blood']].map(([icon, val, lbl]) => (
                          <div key={lbl} style={{ padding: 8, borderRadius: 9, background: s.bg, textAlign: 'center', border: `1px solid ${s.border}` }}>
                            <div style={{ fontSize: 13 }}>{icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340' }}>{val}</div>
                            <div style={{ fontSize: 9, color: '#4a7a8a' }}>{lbl}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: 12, color: '#4a7a8a', marginBottom: 12 }}>
                        ⚥ {child.gender || '—'}{child.dob ? ` · 📅 DOB: ${formatDate(child.dob)}` : ''}
                      </div>

                      <button
                        onClick={() => setExpanded(open ? null : child._id)}
                        style={{ width: '100%', padding: 7, borderRadius: 9, border: `1px solid ${s.border}`, background: open ? s.badgeBg : '#fff', color: open ? s.color : '#4a7a8a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {open ? `▲ ${t('close')}` : `▼ ${t('view')}`}
                      </button>
                    </div>

                    {open && (
                      <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.border}` }}>
                        <div style={{ padding: '10px 12px', background: s.badgeBg, borderRadius: 9, fontSize: 12, fontWeight: 700, color: s.color }}>
                          {child.nutritionStatus === 'healthy'
                            ? '✅ Normal growth — continue current plan'
                            : child.nutritionStatus === 'moderate'
                            ? '⚠️ Moderate risk — increase nutrients + weekly follow-up'
                            : '🚨 Severe malnutrition — PHC referral required TODAY'}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
                      <Link to="/asha/log-visit" style={{ flex: 1, padding: 9, borderRadius: 9, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>📝 {t('logVisit')}</Link>
                      <Link to="/asha/growth-records" style={{ padding: '9px 12px', borderRadius: 9, border: `1px solid ${s.border}`, background: '#fff', fontSize: 11, fontWeight: 700, color: '#4a7a8a', textDecoration: 'none' }}>📈</Link>
                      <Link to={`/asha/child/${child._id}`} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #c5e8ef', background: '#f0fdff', fontSize: 11, fontWeight: 700, color: '#0891b2', textDecoration: 'none' }}>👁️</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // table view
            <div className="child-card" style={{ padding: '20px 22px', animation: 'fadeUp .55s ease' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f0fdff' }}>
                      {['#', t('childName'), t('age'), t('weight'), t('height'), t('bloodGroup'), t('gender'), t('status'), t('actions')].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#4a7a8a', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #c5e8ef', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleChildren.map((child, i) => {
                      const s = getStatus(child.nutritionStatus);
                      return (
                        <tr key={child._id} style={{ background: i % 2 ? '#f0fdff' : '#fff', borderBottom: '1px solid #e0f7fa' }}>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0c2340' }}>👶 {child.name}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{ageLabel(child.dob, child.ageInMonths)}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>{child.currentWeight ?? '—'} kg</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>{child.currentHeight ?? '—'} cm</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{child.bloodGroup || '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a' }}>{child.gender || '—'}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: s.badgeBg, color: s.color }}>{s.label}</span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Link to="/asha/log-visit" style={{ padding: '4px 10px', borderRadius: 7, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>📝 {t('logVisit')}</Link>
                              <Link to={`/asha/child/${child._id}`} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid #c5e8ef', background: '#f0fdff', color: '#0891b2', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>👁️</Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
