import { useState, useEffect, useCallback } from 'react';
import { ashaAPI, growthAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Layout from '../../components/Layout';

const themeColors = {
  primary: '#0891b2',
  dark:    '#0e7490',
  bg:      '#f0fdff',
  light:   '#cffafe',
  border:  '#c5e8ef',
  text:    '#0c2340',
  muted:   '#4a7a8a',
};

// determines nutrition severity from WHO weight-for-age z-score
function nutritionStatusFromZ(zScore) {
  if (zScore == null || isNaN(zScore)) return 'healthy';
  if (zScore < -3) return 'severe';
  if (zScore < -2) return 'moderate';
  return 'healthy';
}

function formatDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// shorter form, just day + month — used in chart axis labels
function shortFmtDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const pageStyles = `
  .an-nav-link { color:${themeColors.muted}; text-decoration:none; padding:6px 10px; border-radius:8px; font-size:13.5px; font-weight:500; transition:background .15s,color .15s; white-space:nowrap; }
  .an-nav-link:hover { background:${themeColors.light}; color:${themeColors.dark}; }
  .an-nav-link.active { background:${themeColors.primary}; color:#fff; }
  .an-card { background:#fff; border:1px solid ${themeColors.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
  .an-spinner { width:36px;height:36px;border:3.5px solid ${themeColors.light};border-top-color:${themeColors.primary};border-radius:50%;animation:spin .7s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .gr-child-item { cursor:pointer; padding:10px 14px; border-radius:10px; border:1px solid transparent; transition:all .15s; }
  .gr-child-item:hover { border-color:${themeColors.border}; background:${themeColors.bg}; }
  .gr-child-item.selected { border-color:${themeColors.primary}; background:${themeColors.light}; }
  .gr-bar { transition:height .4s cubic-bezier(.4,0,.2,1); border-radius:4px 4px 0 0; cursor:pointer; }
  .gr-bar:hover { filter:brightness(1.12); }
  .gr-input { width:100%; border:1px solid ${themeColors.border}; border-radius:8px; padding:8px 12px; font-size:13px; color:${themeColors.text}; outline:none; transition:border .15s; }
  .gr-input:focus { border-color:${themeColors.primary}; box-shadow:0 0 0 3px rgba(8,145,178,.12); }
  .gr-btn { display:inline-flex;align-items:center;gap:6px; padding:8px 18px; border-radius:9px; font-size:13.5px; font-weight:600; border:none; cursor:pointer; transition:all .15s; }
  .gr-btn-primary { background:${themeColors.primary}; color:#fff; }
  .gr-btn-primary:hover:not(:disabled) { background:${themeColors.dark}; }
  .gr-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
  .gr-btn-outline { background:#fff; color:${themeColors.primary}; border:1.5px solid ${themeColors.primary}; }
  .gr-btn-outline:hover { background:${themeColors.light}; }
`;

function injectStyles() {
  if (document.getElementById('gr-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'gr-styles';
  tag.textContent = pageStyles;
  document.head.appendChild(tag);
}

function BarChart({ records }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!records.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: themeColors.muted, fontSize: 13 }}>
        No growth data to chart yet.
      </div>
    );
  }

  const maxWeight = Math.max(...records.map(r => Number(r.weight) || 0), 1);
  // only show last 8 entries so the bars don't get too thin
  const recentRecords = records.slice(-8);

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, marginBottom: 10 }}>
        Weight Over Time (kg)
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
        {recentRecords.map((rec, idx) => {
          const heightPct = ((Number(rec.weight) || 0) / (maxWeight * 1.15)) * 100;
          const isHovered = hoveredBar === idx;
          return (
            <div
              key={rec._id || idx}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {isHovered && (
                <div style={{
                  background: themeColors.text, color: '#fff', fontSize: 10, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                }}>
                  {rec.weight} kg
                </div>
              )}
              <div
                className="gr-bar"
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: 4,
                  background: isHovered
                    ? `linear-gradient(180deg,${themeColors.light},${themeColors.dark})`
                    : 'linear-gradient(180deg,#cffafe,#0891b2)',
                  boxShadow: isHovered ? `0 0 0 2px ${themeColors.primary}` : 'none',
                }}
              />
              <div style={{ fontSize: 10, color: themeColors.muted, textAlign: 'center', lineHeight: 1.2 }}>
                {shortFmtDate(rec.date || rec.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// visual z-score slider — maps WHO z-score range [-4, +4] onto a gradient bar
function ZScoreBar({ label, z, statusMap }) {
  if (z == null || isNaN(z)) return null;

  const clamp = (val, lo, hi) => Math.min(Math.max(val, lo), hi);
  const markerPct = ((clamp(z, -4, 4) + 4) / 8) * 100;
  const status = nutritionStatusFromZ(z);
  const statusStyle = statusMap[status];

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
        <span style={{ color: themeColors.text }}>{label}</span>
        <span style={{ color: statusStyle.color }}>z = {z.toFixed(2)}</span>
      </div>
      <div style={{ height: 10, background: '#e5e7eb', borderRadius: 99, position: 'relative', overflow: 'visible' }}>
        <div style={{
          width: `${markerPct}%`,
          height: '100%',
          background: 'linear-gradient(90deg,#ef4444 0%,#f59e0b 40%,#22c55e 80%)',
          borderRadius: 99,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${markerPct}%`,
          transform: 'translate(-50%,-50%)',
          width: 14, height: 14, borderRadius: '50%',
          background: statusStyle.color, border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: themeColors.muted, marginTop: 3 }}>
        <span>−4 (Severe)</span>
        <span>0 (Median)</span>
        <span>+4 (Above)</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div className="an-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}`, animation: 'fadeUp .4s ease' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: themeColors.muted, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const GrowthRecords = () => {
  const { t } = useLanguage();

  // status visuals with translated labels — built here so t() is available
  const statusVisuals = {
    healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', badgeBg: '#d1fae5', grad: 'linear-gradient(90deg,#059669,#34d399)', label: `✓ ${t('healthy')}`  },
    moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', badgeBg: '#fef3c7', grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)', label: `⚠ ${t('moderate')}` },
    severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', badgeBg: '#fee2e2', grad: 'linear-gradient(90deg,#ef4444,#f87171)', label: `🚨 ${t('severe')}`   },
  };

  const [children, setChildren]               = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [growthRecords, setGrowthRecords]     = useState([]);
  const [formOpen, setFormOpen]               = useState(false);
  const [formData, setFormData]               = useState({ weight: '', height: '', hc: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving]                   = useState(false);
  const [pageLoading, setPageLoading]         = useState(true);
  const [growthLoading, setGrowthLoading]     = useState(false);
  const [pageError, setPageError]             = useState('');
  const [formError, setFormError]             = useState('');
  const [nameSearch, setNameSearch]           = useState('');

  useEffect(() => {
    injectStyles();
    ashaAPI.getMyChildren()
      .then(r => {
        const list = r.data || [];
        setChildren(list);
        if (list.length) {
          setSelectedChildIndex(0);
          setSelectedChildId(list[0]._id);
        }
      })
      .catch(() => setPageError('Failed to load children.'))
      .finally(() => setPageLoading(false));
  }, []);

  const loadGrowthHistory = useCallback((childId) => {
    if (!childId) return;
    setGrowthLoading(true);
    growthAPI.getHistory(childId)
      .then(r => setGrowthRecords(r.data || []))
      .catch(() => setGrowthRecords([]))
      .finally(() => setGrowthLoading(false));
  }, []);

  useEffect(() => {
    if (selectedChildId) loadGrowthHistory(selectedChildId);
  }, [selectedChildId, loadGrowthHistory]);

  function pickChild(listIndex) {
    setSelectedChildIndex(listIndex);
    setSelectedChildId(children[listIndex]._id);
    setFormOpen(false);
  }

  async function saveGrowthEntry() {
    if (!formData.weight || !formData.height || !formData.date) {
      setFormError('Weight, height and date are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await growthAPI.add({
        childId: selectedChildId,
        weight:  Number(formData.weight),
        height:  Number(formData.height),
        headCircumference: formData.hc ? Number(formData.hc) : undefined,
        date: formData.date,
      });
      await loadGrowthHistory(selectedChildId);
      setFormOpen(false);
      setFormData({ weight: '', height: '', hc: '', date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save measurement.');
    } finally {
      setSaving(false);
    }
  }

  const selectedChild = children[selectedChildIndex] || null;
  const latestRecord  = growthRecords.length ? growthRecords[growthRecords.length - 1] : null;

  // quick summary counts for the top stat cards
  const normalChildCount   = children.filter(c => { const z = c.weightForAgeZ ?? c.waz; return z == null || z >= -1; }).length;
  const moderateChildCount = children.filter(c => { const z = c.weightForAgeZ ?? c.waz; return z != null && z < -1 && z >= -3; }).length;
  const severeChildCount   = children.filter(c => { const z = c.weightForAgeZ ?? c.waz; return z != null && z < -3; }).length;

  const matchingChildren = children.filter(c =>
    c.name?.toLowerCase().includes(nameSearch.toLowerCase())
  );

  // z-score color helper used inline in the history table
  function zScoreColor(z) {
    const s = nutritionStatusFromZ(z);
    return s === 'healthy' ? '#059669' : s === 'moderate' ? '#92400e' : '#991b1b';
  }

  if (pageLoading) {
    return (
      <Layout role="asha">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', background: themeColors.bg }}>
          <div className="an-spinner" />
        </div>
      </Layout>
    );
  }

  if (pageError) {
    return (
      <Layout role="asha">
        <div style={{ background: themeColors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '24px 32px', color: '#991b1b', fontWeight: 600 }}>
            {pageError}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="asha">
      <div style={{ background: themeColors.bg, minHeight: '100vh', padding: '28px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: themeColors.text, margin: 0 }}>📈 {t('growthRecords')}</h1>
            <p style={{ fontSize: 13, color: themeColors.muted, margin: '4px 0 0' }}>
              Monitor weight, height and z-scores for your assigned children
            </p>
          </div>
          {selectedChild && (
            <button className="gr-btn gr-btn-primary" onClick={() => setFormOpen(o => !o)}>
              {formOpen ? `✕ ${t('cancel')}` : `+ ${t('growthEntry')}`}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label={`${t('healthy')} (WAZ ≥ −1)`} value={normalChildCount}   accent="#059669"          icon="✅" />
          <StatCard label={t('moderate')}                 value={moderateChildCount} accent="#f59e0b"          icon="⚠️" />
          <StatCard label={`${t('severe')} Cases`}        value={severeChildCount}   accent="#ef4444"          icon="🚨" />
          <StatCard label={t('totalChildren')}            value={children.length}    accent={themeColors.primary} icon="👶" />
        </div>

        {/* inline log form, slides in when formOpen */}
        {formOpen && selectedChild && (
          <div className="an-card" style={{ padding: 20, marginBottom: 20, animation: 'fadeUp .3s ease' }}>
            <div style={{ fontWeight: 700, color: themeColors.text, marginBottom: 14, fontSize: 15 }}>
              📋 {t('growthEntry')} — {selectedChild.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { key: 'weight', label: `${t('weight')} (kg)`, placeholder: 'e.g. 8.5' },
                { key: 'height', label: `${t('height')} (cm)`, placeholder: 'e.g. 70'  },
                { key: 'hc',     label: 'Head Circ. (cm)',      placeholder: 'e.g. 42'  },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, display: 'block', marginBottom: 5 }}>
                    {label}
                  </label>
                  <input
                    className="gr-input"
                    type="number"
                    placeholder={placeholder}
                    value={formData[key]}
                    onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, display: 'block', marginBottom: 5 }}>
                  {t('date')}
                </label>
                <input
                  className="gr-input"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            {formError && (
              <div style={{ color: '#991b1b', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="gr-btn gr-btn-primary" onClick={saveGrowthEntry} disabled={saving}>
                {saving ? `💾 ${t('loading')}…` : `💾 ${t('save')}`}
              </button>
              <button className="gr-btn gr-btn-outline" onClick={() => { setFormOpen(false); setFormError(''); }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* left: child selector + weight chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="an-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: themeColors.text, marginBottom: 10 }}>
                👶 {t('myChildren')} ({children.length})
              </div>
              <input
                className="gr-input"
                placeholder={t('searchByName')}
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              {matchingChildren.length === 0 ? (
                <div style={{ color: themeColors.muted, fontSize: 13, padding: '12px 0', textAlign: 'center' }}>
                  {t('noChildrenAssigned')}
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {matchingChildren.map(child => {
                    const realIdx   = children.indexOf(child);
                    const isActive  = realIdx === selectedChildIndex;
                    const zVal      = child.weightForAgeZ ?? child.waz;
                    const childStatus = nutritionStatusFromZ(zVal);
                    const sv        = statusVisuals[childStatus];
                    return (
                      <div
                        key={child._id}
                        className={`gr-child-item${isActive ? ' selected' : ''}`}
                        onClick={() => pickChild(realIdx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: themeColors.text }}>{child.name}</div>
                            <div style={{ fontSize: 11, color: themeColors.muted }}>
                              {child.ageInMonths != null ? `${child.ageInMonths} months` : '—'}
                              {child.gender ? ` · ${child.gender}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sv.badgeBg, color: sv.color }}>
                            {sv.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="an-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: themeColors.text, marginBottom: 6 }}>
                📊 {t('weight')} Chart
                {selectedChild && (
                  <span style={{ fontWeight: 400, color: themeColors.muted, fontSize: 12 }}> — {selectedChild.name}</span>
                )}
              </div>
              {growthLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <div className="an-spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : (
                <BarChart records={growthRecords} />
              )}
            </div>
          </div>

          {/* right: vitals card + history table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!selectedChild ? (
              <div className="an-card" style={{ padding: 40, textAlign: 'center', color: themeColors.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div style={{ fontWeight: 600 }}>Select a child to view {t('growthRecords')}</div>
              </div>
            ) : (
              <>
                <div className="an-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, color: themeColors.text }}>{selectedChild.name}</div>
                      <div style={{ fontSize: 12, color: themeColors.muted }}>
                        {selectedChild.ageInMonths != null ? `${selectedChild.ageInMonths} months old` : '—'}
                        {selectedChild.gender ? ` · ${selectedChild.gender}` : ''}
                        {selectedChild.bloodGroup ? ` · Blood: ${selectedChild.bloodGroup}` : ''}
                      </div>
                    </div>
                    {(() => {
                      const zVal     = latestRecord?.weightForAgeZ ?? selectedChild?.weightForAgeZ;
                      const st       = nutritionStatusFromZ(zVal);
                      const sv       = statusVisuals[st];
                      return (
                        <span style={{ padding: '5px 14px', borderRadius: 99, background: sv.badgeBg, color: sv.color, fontWeight: 700, fontSize: 12 }}>
                          {sv.label}
                        </span>
                      );
                    })()}
                  </div>

                  {latestRecord ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: t('weight'),  value: latestRecord.weight            ? `${latestRecord.weight} kg`            : '—', icon: '⚖️' },
                        { label: t('height'),  value: latestRecord.height            ? `${latestRecord.height} cm`            : '—', icon: '📏' },
                        { label: 'Head Circ.', value: latestRecord.headCircumference ? `${latestRecord.headCircumference} cm` : '—', icon: '🔵' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                          background: themeColors.bg,
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: themeColors.text }}>{value}</div>
                          <div style={{ fontSize: 11, color: themeColors.muted, fontWeight: 500 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: themeColors.bg, border: `1px solid ${themeColors.border}`,
                      borderRadius: 10, padding: 14, color: themeColors.muted,
                      fontSize: 13, textAlign: 'center', marginBottom: 16,
                    }}>
                      {t('noRecords')}
                    </div>
                  )}

                  {latestRecord && (
                    <div style={{ borderTop: `1px solid ${themeColors.border}`, paddingTop: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: themeColors.text, marginBottom: 12 }}>
                        WHO Z-Scores
                      </div>
                      <ZScoreBar label="Weight-for-Age Z (WAZ)" z={latestRecord.weightForAgeZ} statusMap={statusVisuals} />
                      <ZScoreBar label="Height-for-Age Z (HAZ)" z={latestRecord.heightForAgeZ} statusMap={statusVisuals} />
                    </div>
                  )}
                </div>

                <div className="an-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeColors.border}`, fontWeight: 700, fontSize: 14, color: themeColors.text }}>
                    📋 {t('growthRecords')}
                  </div>
                  {growthLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                      <div className="an-spinner" />
                    </div>
                  ) : growthRecords.length === 0 ? (
                    <div style={{ padding: '28px 20px', textAlign: 'center', color: themeColors.muted, fontSize: 13 }}>
                      {t('noRecords')}<br />
                      <span style={{ fontSize: 12 }}>Click "{t('growthEntry')}" to add the first record.</span>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: themeColors.bg }}>
                            {[
                              t('date'),
                              `${t('weight')} (kg)`,
                              `${t('height')} (cm)`,
                              'Head Circ.',
                              `${t('weight')} Z`,
                              `${t('height')} Z`,
                              t('status'),
                            ].map(heading => (
                              <th key={heading} style={{
                                padding: '10px 14px', textAlign: 'left',
                                color: themeColors.muted, fontWeight: 600, fontSize: 12,
                                borderBottom: `1px solid ${themeColors.border}`,
                                whiteSpace: 'nowrap',
                              }}>
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...growthRecords].reverse().map((rec, rowIdx) => {
                            const wz = rec.weightForAgeZ;
                            const hz = rec.heightForAgeZ;
                            const rowStatus = nutritionStatusFromZ(wz);
                            const sv = statusVisuals[rowStatus];
                            return (
                              <tr key={rec._id || rowIdx} style={{ background: rowIdx % 2 === 0 ? '#fff' : themeColors.bg, transition: 'background .1s' }}>
                                <td style={{ padding: '10px 14px', color: themeColors.text, fontWeight: 500 }}>{formatDate(rec.date || rec.createdAt)}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 700, color: themeColors.text }}>{rec.weight ?? '—'}</td>
                                <td style={{ padding: '10px 14px', color: themeColors.text }}>{rec.height ?? '—'}</td>
                                <td style={{ padding: '10px 14px', color: themeColors.text }}>{rec.headCircumference ?? '—'}</td>
                                <td style={{ padding: '10px 14px' }}>
                                  {wz != null
                                    ? <span style={{ fontWeight: 700, color: zScoreColor(wz) }}>{wz.toFixed(2)}</span>
                                    : '—'
                                  }
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  {hz != null
                                    ? <span style={{ fontWeight: 700, color: zScoreColor(hz) }}>{hz.toFixed(2)}</span>
                                    : '—'
                                  }
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ padding: '3px 10px', borderRadius: 99, background: sv.badgeBg, color: sv.color, fontWeight: 700, fontSize: 11 }}>
                                    {sv.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GrowthRecords;
