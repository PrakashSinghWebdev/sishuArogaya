import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ashaAPI, vaccinationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Layout from '../../components/Layout';

const palette = {
  primary: '#0891b2',
  dark:    '#0e7490',
  bg:      '#f0fdff',
  light:   '#cffafe',
  border:  '#c5e8ef',
  text:    '#0c2340',
  muted:   '#4a7a8a',
};

// WHO schedule — coverage percentages are approximate for the area
const vaccineSchedule = [
  { name: 'BCG',                         age: 'Birth',         pct: 100 },
  { name: 'OPV-0',                        age: 'Birth',         pct: 98  },
  { name: 'Hepatitis B (1st)',            age: 'Birth',         pct: 95  },
  { name: 'DPT-1+OPV-1+Hib-1+PCV-1+Rota-1', age: '6 Weeks',  pct: 92  },
  { name: 'DPT-2+OPV-2+Hib-2+PCV-2+Rota-2', age: '10 Weeks', pct: 90  },
  { name: 'DPT-3+OPV-3+Hib-3+IPV+Hep-B',    age: '14 Weeks', pct: 88  },
  { name: 'MMR-1+MR+JE-1',               age: '9 Months',      pct: 84  },
  { name: 'MMR-2+DPT Booster',           age: '16–24 Months',  pct: 72  },
  { name: 'Typhoid+Hepatitis A',         age: '24 Months',     pct: 65  },
];

// upcoming camp schedule — ideally this would come from the backend eventually
const campSchedule = [
  { date: '15 Sep', place: 'PHC Raipur',       time: '9 AM – 4 PM',  vaccines: 'MMR-2, DPT Booster',   children: 12, status: 'upcoming'  },
  { date: '22 Sep', place: 'Anganwadi Ward 14', time: '10 AM – 2 PM', vaccines: 'BCG, Hep-B, OPV-0',    children: 8,  status: 'scheduled' },
  { date: '29 Sep', place: 'CHC Dehradun',      time: '9 AM – 5 PM',  vaccines: 'All pending',           children: 20, status: 'scheduled' },
];

function childAgeLabel(dob) {
  if (!dob) return '—';
  const totalMonths = Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.44));
  if (totalMonths < 12) return `${totalMonths}mo`;
  const years = Math.floor(totalMonths / 12);
  const rem   = totalMonths % 12;
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

// next scheduled vaccine based on child's age in months
function nextVaccineLabel(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return '—';
  if (ageMonths < 1.5)  return 'BCG / OPV-0 / Hep-B';
  if (ageMonths < 2.5)  return 'DPT-1 / OPV-1 / PCV-1';
  if (ageMonths < 3.5)  return 'DPT-2 / OPV-2 / PCV-2';
  if (ageMonths < 4)    return 'DPT-3 / OPV-3 / IPV';
  if (ageMonths < 9.5)  return 'MMR-1 / JE-1';
  if (ageMonths < 16)   return 'Vitamin A';
  if (ageMonths < 24)   return 'MMR-2 / DPT Booster';
  if (ageMonths < 30)   return 'Typhoid / Hep-A';
  return 'Up to date';
}

function vaccinationBadge(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return { label: 'Unknown',     color: '#94a3b8', bg: '#f1f5f9' };
  if (ageMonths < 4)  return { label: 'In Progress', color: '#0891b2', bg: '#cffafe' };
  if (ageMonths < 24) return { label: 'Due Soon',    color: '#d97706', bg: '#fef3c7' };
  return               { label: 'Completed',         color: '#16a34a', bg: '#dcfce7' };
}

// rough coverage percentage by age — assumes full schedule completion
function coveragePct(ageMonths) {
  if (ageMonths === undefined || ageMonths === null) return 0;
  if (ageMonths < 1.5)  return 5;
  if (ageMonths < 2.5)  return 25;
  if (ageMonths < 3.5)  return 45;
  if (ageMonths < 4)    return 60;
  if (ageMonths < 9.5)  return 72;
  if (ageMonths < 16)   return 82;
  if (ageMonths < 24)   return 90;
  return 100;
}

function CoverageBar({ name, age, pct }) {
  const barColor = pct >= 90 ? '#16a34a' : pct >= 75 ? '#0891b2' : pct >= 60 ? '#d97706' : '#ef4444';
  const barBg    = pct >= 90 ? '#dcfce7' : pct >= 75 ? '#cffafe' : pct >= 60 ? '#fef3c7' : '#fef2f2';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{name}</span>
          <span style={{ fontSize: 11, color: palette.muted, marginLeft: 8, fontWeight: 500 }}>{age}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, background: barBg, padding: '2px 8px', borderRadius: 20 }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 8, background: '#e2f4f8', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          borderRadius: 6, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accentBg }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${palette.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: accentBg || palette.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: palette.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: palette.muted, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: palette.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

const VaccinationTracker = () => {
  const navigate  = useNavigate();
  const { t }     = useLanguage();

  const [activeTab, setActiveTab]   = useState('children');
  const [children, setChildren]     = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      ashaAPI.getMyChildren().then(r => setChildren(r.data || [])).catch(() => setChildren([])),
      vaccinationAPI.getOverdue().then(r => setOverdueList(r.data || [])).catch(() => setOverdueList([])),
    ])
      .catch(() => setLoadError('Failed to load data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const fullyVaccinatedCount = children.filter(c => (c.ageInMonths || 0) >= 24).length;
  const dueSoonCount = overdueList.filter(v => {
    if (!v.dueDate) return false;
    const daysLeft = (new Date(v.dueDate) - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;
  const blockCoveragePct = children.length > 0
    ? Math.round((fullyVaccinatedCount / children.length) * 100)
    : 0;

  const visibleChildren = children.filter(c =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout role="asha">
      <div style={{ minHeight: '100%', background: 'transparent', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        <style>{`
          .an-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 12px; padding: 20px; }
          .an-spinner { width: 18px; height: 18px; border: 2.5px solid #cffafe; border-top-color: #0891b2; border-radius: 50%; display: inline-block; animation: spin 0.7s linear infinite; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .vt-tab { padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; }
          .vt-tab.active { background: #0891b2; color: #fff; border-color: #0891b2; }
          .vt-tab:not(.active) { background: #fff; color: #4a7a8a; border-color: #c5e8ef; }
          .vt-tab:not(.active):hover { background: #cffafe; color: #0891b2; border-color: #0891b2; }
          .vt-row:hover { background: #f0fdff !important; }
          .btn-teal-sm { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; border-radius: 7px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
          .btn-teal-sm:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(8,145,178,0.3); }
          .camp-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 12px; padding: 18px 20px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 16px; transition: box-shadow 0.15s; }
          .camp-card:hover { box-shadow: 0 4px 16px rgba(8,145,178,0.12); }
        `}</style>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: palette.text, margin: 0 }}>💉 {t('vaccinationTracker')}</h1>
            <p style={{ fontSize: 13, color: palette.muted, margin: '4px 0 0' }}>{t('vaccineCoverage')}</p>
          </div>

          {loadError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#991b1b' }}>
              ⚠️ {loadError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both' }}>
            <StatCard icon="✅" label={t('completed')}      value={loading ? '…' : fullyVaccinatedCount} sub={t('myChildren')}       accentBg="#dcfce7" />
            <StatCard icon="⏰" label={t('overdueVaccines')} value={loading ? '…' : dueSoonCount}         sub={t('followUpNeeded')}   accentBg="#fef3c7" />
            <StatCard icon="📊" label={t('vaccineCoverage')} value={loading ? '…' : `${blockCoveragePct}%`} sub={t('assignedChildren')} accentBg={palette.light} />
            <StatCard icon="📅" label={t('upcomingCamps')}  value="15 Sep"                               sub="PHC Raipur"            accentBg="#f3e8ff" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, animation: 'fadeUp 0.4s ease 0.1s both' }}>
            {[
              ['children', `👶 ${t('myChildren')}`],
              ['vaccines',  `📊 ${t('vaccineCoverage')}`],
              ['camps',     `📅 ${t('upcomingCamps')}`],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`vt-tab${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeUp 0.3s ease' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: palette.muted, fontSize: 14 }}>
                <div className="an-spinner" style={{ width: 24, height: 24 }} />
                Loading vaccination data…
              </div>
            </div>
          )}

          {!loading && activeTab === 'children' && (
            <div className="an-card" style={{ animation: 'fadeUp 0.35s ease', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <input
                  type="text"
                  placeholder={t('searchByName')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: palette.text, background: 'transparent' }}
                />
                <span style={{ fontSize: 12, color: palette.muted, fontWeight: 500 }}>
                  {visibleChildren.length} of {children.length} children
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: palette.bg }}>
                      {[t('childName'), t('age'), t('weight'), t('nextVaccine'), t('progressLabel') || 'Progress', t('status'), t('action')].map(heading => (
                        <th key={heading} style={{
                          padding: '10px 16px', fontSize: 11, fontWeight: 700,
                          color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.05em',
                          textAlign: 'left', borderBottom: `1px solid ${palette.border}`, whiteSpace: 'nowrap',
                        }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleChildren.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: palette.muted, fontSize: 14 }}>
                          {searchTerm ? t('noRecords') : t('noChildrenAssigned')}
                        </td>
                      </tr>
                    ) : visibleChildren.map((child, rowIdx) => {
                      const ageMonths = child.ageInMonths ?? 0;
                      const pct       = coveragePct(ageMonths);
                      const badge     = vaccinationBadge(ageMonths);
                      const nextVax   = nextVaccineLabel(ageMonths);
                      return (
                        <tr
                          key={child._id}
                          className="vt-row"
                          style={{ borderBottom: `1px solid ${palette.border}`, background: rowIdx % 2 === 0 ? '#fff' : '#fafeff' }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${palette.primary}, ${palette.dark})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 13,
                              }}>
                                {child.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: palette.text }}>{child.name}</div>
                                <div style={{ fontSize: 11, color: palette.muted }}>{child.village || child.block || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: palette.text }}>
                            {child.dateOfBirth ? childAgeLabel(child.dateOfBirth) : `${ageMonths}mo`}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: palette.text }}>
                            {child.weight ? `${child.weight} kg` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: palette.text, maxWidth: 160 }}>
                            <span style={{
                              display: 'inline-block', background: palette.bg,
                              border: `1px solid ${palette.border}`, borderRadius: 6,
                              padding: '3px 8px', fontSize: 11, fontWeight: 600, color: palette.dark,
                            }}>
                              {nextVax}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 70, height: 6, background: '#e2f4f8', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${pct}%`,
                                  background: pct >= 90 ? '#16a34a' : pct >= 60 ? palette.primary : '#f59e0b',
                                  borderRadius: 4,
                                }} />
                              </div>
                              <span style={{ fontSize: 11, color: palette.muted, fontWeight: 600 }}>{pct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: badge.bg, color: badge.color,
                              border: `1px solid ${badge.color}33`,
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              className="btn-teal-sm"
                              onClick={() => navigate(`/asha/log-visit?childId=${child._id}`)}
                            >
                              ✓ {t('markGiven')}
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

          {!loading && activeTab === 'vaccines' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeUp 0.35s ease' }}>
              <div className="an-card">
                <h3 style={{ fontSize: 15, fontWeight: 700, color: palette.text, marginBottom: 6 }}>{t('vaccineCoverage')}</h3>
                <p style={{ fontSize: 12, color: palette.muted, marginBottom: 20, marginTop: 0 }}>{t('coverageLegend')}</p>
                {vaccineSchedule.map(v => (
                  <CoverageBar key={v.name} name={v.name} age={v.age} pct={v.pct} />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="an-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: palette.text, marginBottom: 14 }}>{t('coverageLegend')}</h3>
                  {[
                    { label: 'Excellent (90–100%)', color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Good (75–89%)',        color: '#0891b2', bg: '#cffafe' },
                    { label: 'Fair (60–74%)',        color: '#d97706', bg: '#fef3c7' },
                    { label: 'Low (Below 60%)',      color: '#ef4444', bg: '#fef2f2' },
                  ].map(tier => (
                    <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}99)` }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: tier.color, background: tier.bg, padding: '2px 10px', borderRadius: 20 }}>
                        {tier.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="an-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: palette.text, margin: 0 }}>{t('overdueVaccines')}</h3>
                    <span style={{
                      background: overdueList.length > 0 ? '#fef2f2' : '#dcfce7',
                      color:      overdueList.length > 0 ? '#ef4444' : '#16a34a',
                      border:     `1px solid ${overdueList.length > 0 ? '#fca5a5' : '#86efac'}`,
                      borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                    }}>
                      {overdueList.length} pending
                    </span>
                  </div>
                  {overdueList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: palette.muted, fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                      No overdue vaccinations!
                    </div>
                  ) : (
                    overdueList.slice(0, 5).map(v => (
                      <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${palette.bg}` }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{v.childId?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: palette.muted }}>{v.vaccineName}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '2px 8px' }}>
                          {v.dueDate ? new Date(v.dueDate).toLocaleDateString('en-IN') : '—'}
                        </span>
                      </div>
                    ))
                  )}
                  {overdueList.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                      <button
                        onClick={() => setActiveTab('children')}
                        style={{ background: 'none', border: 'none', color: palette.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {t('viewAll')} {overdueList.length} →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'camps' && (
            <div style={{ animation: 'fadeUp 0.35s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: palette.text, margin: 0 }}>{t('upcomingCamps')}</h3>
                <span style={{ fontSize: 12, color: palette.muted }}>{campSchedule.length} {t('upcoming')}</span>
              </div>
              {campSchedule.map((camp, i) => {
                const isNext = camp.status === 'upcoming';
                return (
                  <div key={i} className="camp-card">
                    <div style={{
                      flexShrink: 0, width: 60, height: 60, borderRadius: 12,
                      background: isNext
                        ? `linear-gradient(135deg, ${palette.primary}, ${palette.dark})`
                        : 'linear-gradient(135deg, #64748b, #475569)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{camp.date.split(' ')[0]}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>{camp.date.split(' ')[1]}</div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: palette.text }}>{camp.place}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, textTransform: 'capitalize',
                          background: isNext ? palette.light : '#f1f5f9',
                          color:      isNext ? palette.dark  : '#64748b',
                          border:     `1px solid ${isNext ? palette.border : '#cbd5e1'}`,
                        }}>
                          {camp.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: palette.muted }}>
                        <span>🕐 {camp.time}</span>
                        <span>💉 {camp.vaccines}</span>
                        <span>👶 {camp.children} children registered</span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <button
                        className="btn-teal-sm"
                        onClick={() => navigate('/asha/log-visit')}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        📋 {t('logVisit')}
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{
                marginTop: 16, background: palette.bg,
                border: `1.5px dashed ${palette.border}`,
                borderRadius: 12, padding: '20px 24px', textAlign: 'center',
                color: palette.muted, fontSize: 13,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                Camp schedule is updated by your PHC coordinator. Contact them to add new camps.
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VaccinationTracker;
