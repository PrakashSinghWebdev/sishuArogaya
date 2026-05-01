import { useState, useEffect, useMemo } from 'react';
import { ashaAPI } from '../../services/api';
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

const outcomeVisuals = {
  healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', badgeBg: '#d1fae5', gradient: 'linear-gradient(90deg,#059669,#34d399)' },
  moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', badgeBg: '#fef3c7', gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', badgeBg: '#fee2e2', gradient: 'linear-gradient(90deg,#ef4444,#f87171)' },
};

const visitTypeColors = {
  'routine':      { bg: '#e0f2fe', color: '#0369a1' },
  'follow-up':    { bg: '#fef3c7', color: '#92400e' },
  'phc-referral': { bg: '#fee2e2', color: '#991b1b' },
  'vaccination':  { bg: '#f0fdf4', color: '#166534' },
  'growth-check': { bg: themeColors.light, color: themeColors.dark },
  'emergency':    { bg: '#fee2e2', color: '#7f1d1d' },
};

// inject styles once into the document head
function injectStyles(css) {
  if (document.getElementById('vh-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'vh-styles';
  tag.textContent = css;
  document.head.appendChild(tag);
}

const sharedCss = `
  .vhl-card { background:#fff; border:1px solid ${themeColors.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
  .vhl-spinner { width:36px;height:36px;border:3.5px solid ${themeColors.light};border-top-color:${themeColors.primary};border-radius:50%;animation:spin .7s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .vhl-filter { padding:7px 16px; border-radius:20px; font-size:13px; font-weight:600; border:1.5px solid transparent; cursor:pointer; transition:all .15s; }
  .vhl-filter.on  { background:${themeColors.primary}; color:#fff; border-color:${themeColors.primary}; }
  .vhl-filter.off { background:#fff; color:${themeColors.muted}; border-color:${themeColors.border}; }
  .vhl-filter.off:hover { border-color:${themeColors.primary}; color:${themeColors.primary}; background:${themeColors.bg}; }
  .vhl-searchbox { width:100%; border:1.5px solid ${themeColors.border}; border-radius:10px; padding:9px 14px 9px 36px; font-size:13.5px; color:${themeColors.text}; outline:none; transition:border .15s; background:#fff; }
  .vhl-searchbox:focus { border-color:${themeColors.primary}; box-shadow:0 0 0 3px rgba(8,145,178,.1); }
  .vhl-row { display:flex; gap:16px; padding:16px 20px; transition:background .12s; animation:fadeUp .35s ease both; }
  .vhl-row:hover { background:${themeColors.bg} !important; }
`;

function formatDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function splitDate(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return { day: '—', month: '', year: '' };
  return {
    day:   dt.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: dt.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    year:  dt.getFullYear(),
  };
}

function VisitTypePill({ type }) {
  const key = (type || 'routine').toLowerCase();
  const cfg = visitTypeColors[key] || { bg: themeColors.light, color: themeColors.dark };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, textTransform: 'capitalize' }}>
      {type || 'Routine'}
    </span>
  );
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div className="vhl-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}`, animation: 'fadeUp .4s ease' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: themeColors.muted, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function VisitRow({ visit, index, outcomeLabels }) {
  const outcome = (visit.outcome || 'healthy').toLowerCase();
  const s = { ...outcomeVisuals[outcome], label: outcomeLabels[outcome] } || { ...outcomeVisuals.healthy, label: outcomeLabels.healthy };
  const dateStr = visit.visitDate || visit.createdAt;
  const { day, month, year } = splitDate(dateStr);
  const childName = visit.childId?.name || visit.childName || 'Unknown Child';

  return (
    <div className="vhl-row" style={{ background: index % 2 === 0 ? '#f0fdff' : '#fff' }}>
      {/* coloured date block */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 52, minHeight: 60, borderRadius: 10,
          background: `linear-gradient(135deg,${themeColors.primary},${themeColors.dark})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 4px', boxShadow: '0 2px 8px rgba(8,145,178,.25)',
        }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{day}</div>
          <div style={{ color: themeColors.light, fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{month}</div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 9, marginTop: 2 }}>{year}</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: themeColors.text }}>{childName}</span>
            <VisitTypePill type={visit.visitType} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: themeColors.muted }}>{formatDate(dateStr)}</span>
            <span style={{ padding: '3px 11px', borderRadius: 99, background: s.badgeBg, color: s.color, fontWeight: 700, fontSize: 11 }}>
              {s.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: visit.notes ? 8 : 0 }}>
          {visit.weight && (
            <span style={{ fontSize: 12, color: themeColors.muted }}>
              ⚖️ <strong style={{ color: themeColors.text }}>{visit.weight} kg</strong>
            </span>
          )}
          {visit.height && (
            <span style={{ fontSize: 12, color: themeColors.muted }}>
              📏 <strong style={{ color: themeColors.text }}>{visit.height} cm</strong>
            </span>
          )}
          {visit.vaccinesGiven?.length > 0 && (
            <span style={{ fontSize: 12, color: themeColors.muted }}>
              💉 <strong style={{ color: '#059669' }}>
                {Array.isArray(visit.vaccinesGiven) ? visit.vaccinesGiven.join(', ') : visit.vaccinesGiven}
              </strong>
            </span>
          )}
        </div>

        {visit.notes && (
          <div style={{ fontSize: 12, color: themeColors.muted, lineHeight: 1.6, background: 'rgba(8,145,178,.04)', borderLeft: `3px solid ${themeColors.border}`, padding: '6px 10px', borderRadius: '0 6px 6px 0', marginTop: 4 }}>
            {visit.notes}
          </div>
        )}
      </div>
    </div>
  );
}

const VisitHistoryLog = () => {
  const { t } = useLanguage();

  const outcomeLabels = {
    healthy:  `✓ ${t('healthy')}`,
    moderate: `⚠ ${t('moderate')}`,
    severe:   `🚨 ${t('severe')}`,
  };

  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  useEffect(() => {
    injectStyles(sharedCss);

    ashaAPI.getVisits()
      .then(r => setVisits(r.data || []))
      .catch(() => setFetchErr('Failed to load visit history.'))
      .finally(() => setLoading(false));
  }, []);

  const totalCount    = visits.length;
  const healthyCount  = useMemo(() => visits.filter(v => (v.outcome || 'healthy').toLowerCase() === 'healthy').length, [visits]);
  const moderateCount = useMemo(() => visits.filter(v => (v.outcome || '').toLowerCase() === 'moderate').length, [visits]);
  const severeCount   = useMemo(() => visits.filter(v => (v.outcome || '').toLowerCase() === 'severe').length, [visits]);

  const displayedVisits = useMemo(() => {
    let list = [...visits].reverse(); // newest first

    if (activeFilter !== 'all') {
      list = list.filter(v => (v.outcome || 'healthy').toLowerCase() === activeFilter);
    }

    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(v =>
        (v.childId?.name || v.childName || '').toLowerCase().includes(q) ||
        (v.visitType || '').toLowerCase().includes(q) ||
        (v.notes || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [visits, activeFilter, searchQ]);

  const filterOptions = [
    { key: 'all',      label: `${t('all')} (${totalCount})` },
    { key: 'healthy',  label: `✓ ${t('healthy')} (${healthyCount})` },
    { key: 'moderate', label: `⚠ ${t('moderate')} (${moderateCount})` },
    { key: 'severe',   label: `🚨 ${t('severe')} (${severeCount})` },
  ];

  return (
    <Layout role="asha">
      <div style={{ background: themeColors.bg, minHeight: '100vh', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: themeColors.text, margin: 0 }}>📋 {t('visitHistory')}</h1>
          <p style={{ fontSize: 13, color: themeColors.muted, margin: '4px 0 0' }}>
            Complete log of all home visits conducted in your area
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label={t('visitHistory')}               value={totalCount}    accent={themeColors.primary} icon="📋" />
          <StatCard label={`${t('healthy')} Outcomes`}     value={healthyCount}  accent="#059669"             icon="✅" />
          <StatCard label={`${t('moderate')} Outcomes`}    value={moderateCount} accent="#f59e0b"             icon="⚠️" />
          <StatCard label={`${t('severe')} Outcomes`}      value={severeCount}   accent="#ef4444"             icon="🚨" />
        </div>

        <div className="vhl-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: themeColors.muted, pointerEvents: 'none' }}>🔍</span>
              <input
                className="vhl-searchbox"
                placeholder={t('searchByName')}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {filterOptions.map(({ key, label }) => (
                <button
                  key={key}
                  className={`vhl-filter ${activeFilter === key ? 'on' : 'off'}`}
                  onClick={() => setActiveFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="vhl-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: themeColors.text }}>Visit Timeline</div>
            <div style={{ fontSize: 12, color: themeColors.muted }}>Showing {displayedVisits.length} of {totalCount} visits</div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
              <div className="vhl-spinner" />
            </div>
          ) : fetchErr ? (
            <div style={{ margin: 20, background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#991b1b', fontWeight: 600, fontSize: 13 }}>
              {fetchErr}
            </div>
          ) : displayedVisits.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: themeColors.muted }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>{totalCount === 0 ? '📋' : '🔍'}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: themeColors.text, marginBottom: 6 }}>
                {totalCount === 0 ? t('noVisitsYet') : t('noRecords')}
              </div>
              <div style={{ fontSize: 13 }}>
                {totalCount === 0
                  ? 'Start logging home visits to see them appear here.'
                  : 'Try a different search term or filter.'}
              </div>
              {searchQ && (
                <button
                  onClick={() => { setSearchQ(''); setActiveFilter('all'); }}
                  style={{ marginTop: 14, padding: '8px 20px', borderRadius: 8, background: themeColors.primary, color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {displayedVisits.map((visit, i) => (
                <div key={visit._id || i} style={{ borderBottom: i < displayedVisits.length - 1 ? `1px solid ${themeColors.border}` : 'none' }}>
                  <VisitRow visit={visit} index={i} outcomeLabels={outcomeLabels} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VisitHistoryLog;
