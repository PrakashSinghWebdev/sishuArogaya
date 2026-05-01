import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ashaAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Layout from '../../components/Layout';

const colors = {
  primary: '#0891b2',
  dark:    '#0e7490',
  bg:      '#f0fdff',
  light:   '#cffafe',
  border:  '#c5e8ef',
  text:    '#0c2340',
  muted:   '#4a7a8a',
};

const nutritionVisuals = {
  healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', badgeBg: '#d1fae5', grad: 'linear-gradient(90deg,#059669,#34d399)' },
  moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', badgeBg: '#fef3c7', grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', badgeBg: '#fee2e2', grad: 'linear-gradient(90deg,#ef4444,#f87171)' },
};

const severeSteps = [
  'Immediately refer to PHC / CMAM centre',
  'Initiate RUTF (Ready-to-Use Therapeutic Food)',
  'Visit family DAILY for 7 days',
  'Report to District Health Officer',
  'Document in MCPC register within 24 hours',
];

const moderateSteps = [
  'Counsel mother on nutrition & breastfeeding',
  'Add energy-dense foods: dal, egg, ghee, ragi',
  'Visit WEEKLY for 4 weeks',
  'Enrol in ICDS supplementary nutrition programme',
  'Monitor weight every 2 weeks',
];

function injectPageStyles() {
  if (document.getElementById('mr-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'mr-styles';
  tag.textContent = `
    .mr-card { background:#fff; border:1px solid ${colors.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
    .mr-spinner { width:36px;height:36px;border:3.5px solid ${colors.light};border-top-color:${colors.primary};border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    .case-card { border-radius:12px; overflow:hidden; transition:box-shadow .15s; }
    .case-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); }
    .toggle-btn { background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; padding:4px 8px; border-radius:6px; transition:background .12s; }
    .toggle-btn:hover { background:rgba(0,0,0,.06); }
    .action-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px; font-size:12.5px; font-weight:600; border:none; cursor:pointer; text-decoration:none; transition:all .15s; }
  `;
  document.head.appendChild(tag);
}

function childAgeMonths(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function StatCard({ label, value, accent, icon, sub }) {
  return (
    <div className="mr-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}`, animation: 'fadeUp .4s ease' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.muted, fontWeight: 500, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CaseCard({ child, caseType, statusLabels }) {
  const [expanded, setExpanded] = useState(false);
  const nav = useNavigate();
  const { t } = useLanguage();
  const s = { ...nutritionVisuals[caseType], label: statusLabels[caseType] };
  const ageMonths = child.ageInMonths ?? childAgeMonths(child.dateOfBirth);

  return (
    <div className="case-card mr-card" style={{ border: `1.5px solid ${s.border}`, marginBottom: 12, animation: 'fadeUp .3s ease' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: caseType === 'severe' ? 'linear-gradient(90deg,#fff1f2,#fff)' : 'linear-gradient(90deg,#fffbeb,#fff)',
        borderBottom: expanded ? `1px solid ${s.border}` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.badgeBg, border: `2px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {caseType === 'severe' ? '🚨' : '⚠️'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: colors.text }}>{child.name}</div>
            <div style={{ fontSize: 12, color: colors.muted }}>
              {ageMonths != null ? `${ageMonths} months` : '—'}
              {child.gender ? ` · ${child.gender}` : ''}
              {child.parentId?.name ? ` · Parent: ${child.parentId.name}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ padding: '4px 12px', borderRadius: 99, background: s.badgeBg, color: s.color, fontWeight: 700, fontSize: 12 }}>
            {s.label}
          </span>
          <button className="toggle-btn" onClick={() => setExpanded(prev => !prev)} style={{ color: colors.muted }}>
            {expanded ? '▲ Less' : '▼ Details'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '10px 18px', gap: 8, borderBottom: expanded ? `1px solid ${s.border}` : 'none' }}>
        {[
          [t('weight'), child.currentWeight ? `${child.currentWeight} kg` : (child.weight ? `${child.weight} kg` : '—')],
          [t('height'), child.currentHeight ? `${child.currentHeight} cm` : (child.height ? `${child.height} cm` : '—')],
          ['Blood Grp', child.bloodGroup || '—'],
          ['Village',   child.village || child.address || '—'],
        ].map(([label, value]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{value}</div>
            <div style={{ fontSize: 11, color: colors.muted }}>{label}</div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ padding: '14px 18px', animation: 'fadeUp .2s ease' }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: s.color }}>
            <strong>Nutrition Status:</strong> {child.nutritionStatus?.toUpperCase() || caseType.toUpperCase()} —{' '}
            {caseType === 'severe'
              ? 'This child requires immediate medical attention and PHC referral.'
              : 'This child needs enhanced nutrition support and weekly monitoring.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              ['Date of Birth', child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['ASHA Zone',     child.zone || '—'],
              ['Last Visit',    child.lastVisit ? new Date(child.lastVisit).toLocaleDateString('en-IN') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: colors.muted, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="action-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => nav(`/asha/log-visit?childId=${child._id}&type=phc-referral`)}>
              🏥 PHC Referral
            </button>
            <button className="action-btn" style={{ background: colors.primary, color: '#fff' }} onClick={() => nav(`/asha/log-visit?childId=${child._id}`)}>
              📝 Log Follow-up
            </button>
            {(child.parentId?.phone || child.phone) && (
              <a className="action-btn" href={`tel:${child.parentId?.phone || child.phone}`} style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #6ee7b7' }}>
                📞 Call Family
              </a>
            )}
            <button className="action-btn" style={{ background: colors.bg, color: colors.primary, border: `1px solid ${colors.border}` }} onClick={() => nav(`/asha/growth-records?childId=${child._id}`)}>
              📈 Growth Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ title, steps, accent, icon }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${accent}20`, borderTop: `4px solid ${accent}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: accent, marginBottom: 14 }}>{icon} {title}</div>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, i) => (
          <li key={i} style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

const MalnutritionReport = () => {
  const { t } = useLanguage();
  const statusLabels = {
    healthy:  `✓ ${t('healthy')}`,
    moderate: `⚠ ${t('moderate')}`,
    severe:   `🚨 ${t('severe')}`,
  };

  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');

  useEffect(() => {
    injectPageStyles();
    ashaAPI.getMyChildren()
      .then(r => setAllChildren(r.data || []))
      .catch(() => setFetchError('Failed to load children data.'))
      .finally(() => setLoading(false));
  }, []);

  const severeCases   = allChildren.filter(c => c.nutritionStatus === 'severe');
  const moderateCases = allChildren.filter(c => c.nutritionStatus === 'moderate');
  const healthyCases  = allChildren.filter(c => !['severe', 'moderate'].includes(c.nutritionStatus));

  if (loading) {
    return (
      <Layout role="asha">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', background: colors.bg }}>
          <div className="mr-spinner" />
        </div>
      </Layout>
    );
  }

  if (fetchError) {
    return (
      <Layout role="asha">
        <div style={{ background: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '24px 32px', color: '#991b1b', fontWeight: 600 }}>
            {fetchError}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="asha">
      <div style={{ background: colors.bg, minHeight: '100vh', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.text, margin: 0 }}>🚨 {t('malnutritionReport')}</h1>
          <p style={{ fontSize: 13, color: colors.muted, margin: '4px 0 0' }}>
            Active malnutrition cases in your assigned area — {allChildren.length} total children monitored
          </p>
        </div>

        {/* urgent banner if any severe cases */}
        {severeCases.length > 0 && (
          <div style={{ background: 'linear-gradient(90deg,#991b1b,#dc2626)', color: '#fff', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, animation: 'fadeUp .3s ease', boxShadow: '0 4px 16px rgba(220,38,38,.3)' }}>
            <span style={{ fontSize: 28 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {severeCases.length} {t('severe')} Case{severeCases.length > 1 ? 's' : ''} — Immediate Action Required
              </div>
              <div style={{ fontSize: 12, opacity: .9, marginTop: 2 }}>
                {severeCases.map(c => c.name).join(', ')} require urgent referral today.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label={t('severeCases')}       value={severeCases.length}   accent="#ef4444"      icon="🚨" sub={severeCases.length   > 0 ? t('urgentAction')    : undefined} />
          <StatCard label={t('moderateCases')}     value={moderateCases.length} accent="#f59e0b"      icon="⚠️" sub={moderateCases.length > 0 ? 'Weekly monitoring'  : undefined} />
          <StatCard label={t('healthy')}           value={healthyCases.length}  accent="#059669"      icon="✅" />
          <StatCard label={t('phcReferralNeeded')} value={severeCases.length}   accent={colors.primary} icon="🏥" sub={severeCases.length > 0 ? 'Pending referrals' : 'None pending'} />
        </div>

        {severeCases.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #fca5a5' }}>
              <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '4px 14px', fontWeight: 800, fontSize: 14, color: '#991b1b' }}>
                🚨 {t('severeCases')} ({severeCases.length})
              </div>
              <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 500 }}>Requires immediate referral and daily home visits</span>
            </div>
            {severeCases.map(child => <CaseCard key={child._id} child={child} caseType="severe" statusLabels={statusLabels} />)}
          </section>
        )}

        {moderateCases.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #fcd34d' }}>
              <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '4px 14px', fontWeight: 800, fontSize: 14, color: '#92400e' }}>
                ⚠️ {t('moderateCases')} ({moderateCases.length})
              </div>
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>Weekly home visits and enhanced nutrition counselling</span>
            </div>
            {moderateCases.map(child => <CaseCard key={child._id} child={child} caseType="moderate" statusLabels={statusLabels} />)}
          </section>
        )}

        {severeCases.length === 0 && moderateCases.length === 0 && (
          <div className="mr-card" style={{ padding: '48px 24px', textAlign: 'center', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#059669' }}>No Active Malnutrition Cases</div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
              All {allChildren.length} children in your area are healthy. Keep up the great work!
            </div>
          </div>
        )}

        <div className="mr-card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: colors.text, marginBottom: 4 }}>📋 ASHA Action Protocol</div>
          <div style={{ fontSize: 12, color: colors.muted, marginBottom: 18 }}>Standard operating procedures for managing malnutrition cases</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ProtocolCard title="Severe Malnutrition Protocol"   steps={severeSteps}   accent="#ef4444" icon="🚨" />
            <ProtocolCard title="Moderate Malnutrition Protocol" steps={moderateSteps} accent="#f59e0b" icon="⚠️" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MalnutritionReport;
