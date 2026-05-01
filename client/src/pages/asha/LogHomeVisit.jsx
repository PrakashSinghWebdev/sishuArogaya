import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ashaAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Layout from '../../components/Layout';

const visitTypeOptions = [
  'Growth Check',
  'Vaccination',
  'Growth + Vaccination',
  'Nutrition Counselling',
  'Emergency Visit',
  'Follow-up Visit',
  'PHC Referral Follow-up',
];

const vaccineList = [
  'BCG', 'OPV-0', 'Hepatitis B (1st)',
  'DPT-1', 'OPV-1', 'Hib-1', 'PCV-1', 'Rota-1',
  'DPT-2', 'OPV-2', 'Hib-2', 'PCV-2', 'Rota-2',
  'DPT-3', 'OPV-3', 'Hib-3', 'IPV', 'Hepatitis B (3rd)',
  'MMR-1', 'JE-1', 'MMR-2', 'DPT Booster', 'OPV Booster', 'Typhoid',
];

const outcomeOptions = [
  { value: 'healthy',   label: 'Healthy — No concerns'    },
  { value: 'monitor',   label: 'Monitor — Mild concern'   },
  { value: 'follow-up', label: 'Follow-up Required'       },
  { value: 'referred',  label: 'Referred to PHC / CHC'    },
];

const palette = {
  primary: '#0891b2',
  dark:    '#0e7490',
  bg:      '#f0fdff',
  light:   '#cffafe',
  border:  '#c5e8ef',
  text:    '#0c2340',
  muted:   '#4a7a8a',
};

const blankForm = {
  childId:          '',
  visitType:        '',
  weight:           '',
  height:           '',
  headCircumference:'',
  temperature:      '',
  muac:             '',
  vaccinesGiven:    [],
  notes:            '',
  outcome:          'healthy',
  referralRequired: false,
};

// rough WAZ estimate — not a real WHO lookup, just a quick field flag
function estimateWAZ(weightKg) {
  if (!weightKg) return null;
  return parseFloat(((parseFloat(weightKg) - 8.2) / 1.1).toFixed(1));
}

function wazToStatus(waz) {
  if (waz === null) return null;
  if (waz >= -1) return 'healthy';
  if (waz >= -2) return 'moderate';
  return 'severe';
}

// Step progress bar at the top of the form
function StepIndicator({ currentStep }) {
  const stepLabels = ['Select Child', 'Measurements', 'Vaccines', 'Notes & Save'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {stepLabels.map((label, i) => {
        const num    = i + 1;
        const done   = num < currentStep;
        const active = num === currentStep;
        return (
          <Fragment key={num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                background: done || active ? (done ? palette.dark : palette.primary) : '#e2f4f8',
                color:      done || active ? '#fff' : palette.muted,
                border:     active || done ? `3px solid ${palette.dark}` : `2px solid ${palette.border}`,
                boxShadow:  active ? `0 0 0 4px ${palette.light}` : 'none',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                marginTop: 6, fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? palette.primary : done ? palette.dark : palette.muted,
                textAlign: 'center', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{
                flex: 2, height: 3, borderRadius: 2, marginBottom: 18,
                background: i + 1 < currentStep ? palette.dark : palette.border,
                transition: 'background 0.3s',
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, unit, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: palette.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          step={type === 'number' ? '0.1' : undefined}
          min={type === 'number' ? '0' : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          style={{
            width: '100%',
            padding: unit ? '9px 44px 9px 12px' : '9px 12px',
            border: `1.5px solid ${focused ? palette.primary : palette.border}`,
            borderRadius: 8, fontSize: 14, color: palette.text,
            background: focused ? '#fff' : palette.bg,
            outline: 'none', boxSizing: 'border-box',
            boxShadow: focused ? `0 0 0 3px ${palette.light}` : 'none',
            transition: 'all 0.15s',
          }}
        />
        {unit && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: palette.muted, fontWeight: 600,
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

const LogHomeVisit = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { t }     = useLanguage();

  // pre-fill childId if coming from another page with ?childId=xxx
  const prefillChildId = new URLSearchParams(location.search).get('childId') || '';

  const [childList, setChildList]   = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]     = useState({ ...blankForm, childId: prefillChildId });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    ashaAPI.getMyChildren()
      .then(r => setChildList(r.data || []))
      .catch(() => setChildList([]))
      .finally(() => setChildrenLoading(false));
  }, []);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function toggleVaccine(vaccineName) {
    setFormData(prev => ({
      ...prev,
      vaccinesGiven: prev.vaccinesGiven.includes(vaccineName)
        ? prev.vaccinesGiven.filter(v => v !== vaccineName)
        : [...prev.vaccinesGiven, vaccineName],
    }));
  }

  const chosenChild  = childList.find(c => c._id === formData.childId) || null;
  const wazScore     = estimateWAZ(formData.weight);
  const wazStatus    = wazToStatus(wazScore);
  const step1Valid   = formData.childId && formData.visitType;

  // Weight limit validation
  const getMaxWeight = () => {
    if (!chosenChild) return 14;
    return chosenChild.gender === 'female' ? 13 : 14;
  };
  const isWeightInvalid = formData.weight && parseFloat(formData.weight) > getMaxWeight();

  // colour scheme for the AI WAZ assessment box
  const wazTheme = {
    healthy:  { bg: '#f0fdf4', border: '#86efac', text: '#166534', badge: '#22c55e' },
    moderate: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#f59e0b' },
    severe:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', badge: '#ef4444' },
  };

  async function submitVisit() {
    if (isWeightInvalid) {
      setSubmitError(`Invalid weight: ${formData.weight} kg exceeds max ${getMaxWeight()} kg for ${chosenChild?.gender === 'female' ? 'girls' : 'boys'}.`);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await ashaAPI.logVisit({
        childId:          formData.childId,
        visitType:        formData.visitType,
        weight:           formData.weight           ? parseFloat(formData.weight)           : undefined,
        height:           formData.height           ? parseFloat(formData.height)           : undefined,
        headCircumference:formData.headCircumference? parseFloat(formData.headCircumference): undefined,
        temperature:      formData.temperature      ? parseFloat(formData.temperature)      : undefined,
        muac:             formData.muac             ? parseFloat(formData.muac)             : undefined,
        vaccinesGiven:    formData.vaccinesGiven,
        notes:            formData.notes,
        outcome:          formData.outcome,
        referralRequired: formData.referralRequired,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ ...blankForm, childId: prefillChildId });
        setCurrentStep(1);
        navigate('/asha/visit-history');
      }, 2000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // sidebar showing child info + visit summary + checklist
  const SidePanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: `1.5px solid ${palette.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {t('selectChild')}
        </div>
        {chosenChild ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: `linear-gradient(135deg, ${palette.primary}, ${palette.dark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 16,
              }}>
                {chosenChild.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: palette.text }}>{chosenChild.name}</div>
                <div style={{ fontSize: 12, color: palette.muted }}>{chosenChild.ageInMonths} months old</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Gender',   chosenChild.gender     || '—'],
                ['Block',    chosenChild.block       || '—'],
                ['Guardian', chosenChild.parentName  || '—'],
                ['Village',  chosenChild.village     || '—'],
              ].map(([key, val]) => (
                <div key={key} style={{ background: palette.bg, borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: 10, color: palette.muted, fontWeight: 600, textTransform: 'uppercase' }}>{key}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: palette.text, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0', color: palette.muted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>👶</div>
            {t('noChildrenAssigned')}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1.5px solid ${palette.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {t('recentVisitLog')}
        </div>
        {[
          [t('visitType'),    formData.visitType || '—'],
          [t('weight'),       formData.weight    ? `${formData.weight} kg` : '—'],
          [t('height'),       formData.height    ? `${formData.height} cm` : '—'],
          ['MUAC',            formData.muac      ? `${formData.muac} cm`   : '—'],
          [t('vaccination'),  formData.vaccinesGiven.length > 0 ? `${formData.vaccinesGiven.length} selected` : '—'],
          [t('visitOutcome'), formData.outcome || '—'],
        ].map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${palette.bg}` }}>
            <span style={{ fontSize: 12, color: palette.muted }}>{key}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>{val}</span>
          </div>
        ))}
        {formData.referralRequired && (
          <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
            🏥 {t('phcReferralNeeded')}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1.5px solid ${palette.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Step Checklist
        </div>
        {[
          ['Child & Visit Type',    step1Valid],
          ['Measurements recorded', !!(formData.weight || formData.height)],
          ['Vaccines noted',        formData.vaccinesGiven.length > 0],
          ['Outcome documented',    !!(formData.notes || formData.outcome)],
        ].map(([label, completed]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: completed ? palette.primary : palette.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff', fontWeight: 700,
            }}>
              {completed ? '✓' : ''}
            </div>
            <span style={{ fontSize: 12, color: completed ? palette.text : palette.muted, fontWeight: completed ? 600 : 400 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout role="asha">
      <div style={{ minHeight: '100%', background: 'transparent', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        <style>{`
          .an-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 12px; padding: 20px; }
          .an-spinner { width: 18px; height: 18px; border: 2.5px solid #cffafe; border-top-color: #0891b2; border-radius: 50%; display: inline-block; animation: spin 0.7s linear infinite; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .vaccine-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; user-select: none; border: 1.5px solid #c5e8ef; background: #f0fdff; color: #4a7a8a; }
          .vaccine-chip.selected { background: #0891b2; border-color: #0891b2; color: #fff; }
          .vaccine-chip:hover { border-color: #0891b2; }
          .btn-primary-teal { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; border-radius: 9px; padding: 11px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 8px; }
          .btn-primary-teal:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(8,145,178,0.35); }
          .btn-primary-teal:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-ghost { background: #f0fdff; color: #0891b2; border: 1.5px solid #c5e8ef; border-radius: 9px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
          .btn-ghost:hover { background: #cffafe; }
        `}</style>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: palette.text, margin: 0 }}>📝 {t('logVisitPage')}</h1>
            <p style={{ fontSize: 13, color: palette.muted, margin: '4px 0 0' }}>{t('logVisit')}</p>
          </div>

          {/* full-screen success overlay */}
          {submitted && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(8,145,178,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: '#fff', borderRadius: 16, padding: '40px 48px',
                textAlign: 'center', boxShadow: '0 20px 60px rgba(8,145,178,0.25)',
                animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.dark }}>{t('logVisit')}!</div>
                <div style={{ fontSize: 13, color: palette.muted, marginTop: 6 }}>{t('redirecting')}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
            {/* main form */}
            <div className="an-card" style={{ animation: 'fadeUp 0.4s ease 0.05s both' }}>
              <StepIndicator currentStep={currentStep} />

              {submitError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#991b1b',
                }}>
                  ⚠️ {submitError}
                </div>
              )}

              {currentStep === 1 && (
                <div style={{ animation: 'fadeUp 0.3s ease' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 20 }}>
                    Step 1 — Select Child &amp; Visit Type
                  </h3>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: palette.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('selectChild')} <span style={{ color: '#e53e3e' }}>*</span>
                    </label>
                    {childrenLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: palette.muted }}>
                        <div className="an-spinner" /> Loading children…
                      </div>
                    ) : (
                      <select
                        value={formData.childId}
                        onChange={e => updateField('childId', e.target.value)}
                        style={{
                          width: '100%', padding: '9px 12px',
                          border: `1.5px solid ${formData.childId ? palette.primary : palette.border}`,
                          borderRadius: 8, fontSize: 14,
                          color: formData.childId ? palette.text : palette.muted,
                          background: palette.bg, outline: 'none', cursor: 'pointer',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">— Choose a child —</option>
                        {childList.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.ageInMonths} months) — {c.village || c.block || ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: palette.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('visitType')} <span style={{ color: '#e53e3e' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                      {visitTypeOptions.map(vt => (
                        <div
                          key={vt}
                          onClick={() => updateField('visitType', vt)}
                          style={{
                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                            border: `1.5px solid ${formData.visitType === vt ? palette.primary : palette.border}`,
                            background: formData.visitType === vt ? palette.light : '#fff',
                            fontSize: 13, fontWeight: formData.visitType === vt ? 600 : 500,
                            color: formData.visitType === vt ? palette.dark : palette.text,
                            transition: 'all 0.15s',
                            boxShadow: formData.visitType === vt ? `0 0 0 3px ${palette.light}` : 'none',
                          }}
                        >
                          {vt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div style={{ animation: 'fadeUp 0.3s ease' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 20 }}>
                    Step 2 — Measurements
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                    <FormField label="Weight"             type="number" value={formData.weight}            onChange={e => updateField('weight', e.target.value)}            placeholder="e.g. 7.5"  unit="kg"  />
                    {isWeightInvalid && (
                      <div style={{
                        marginTop: -10, marginBottom: 16, padding: '6px 12px',
                        background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, color: '#ef4444',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        ❌ Invalid: Max weight for {chosenChild?.gender === 'female' ? 'girls' : 'boys'} is {getMaxWeight()} kg
                      </div>
                    )}
                    <FormField label="Height"             type="number" value={formData.height}            onChange={e => updateField('height', e.target.value)}            placeholder="e.g. 68.5" unit="cm"  />
                    <FormField label="Head Circumference" type="number" value={formData.headCircumference} onChange={e => updateField('headCircumference', e.target.value)} placeholder="e.g. 42"   unit="cm"  />
                    <FormField label="Temperature"        type="number" value={formData.temperature}       onChange={e => updateField('temperature', e.target.value)}       placeholder="e.g. 98.6" unit="°F" />
                    <FormField label="MUAC"               type="number" value={formData.muac}              onChange={e => updateField('muac', e.target.value)}              placeholder="e.g. 12.5" unit="cm"  />
                  </div>

                  {wazStatus && (
                    <div style={{
                      marginTop: 16,
                      background: wazTheme[wazStatus].bg,
                      border: `1.5px solid ${wazTheme[wazStatus].border}`,
                      borderRadius: 12, padding: 16,
                      animation: 'fadeUp 0.25s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: wazTheme[wazStatus].badge,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>
                          {wazStatus === 'healthy' ? '✅' : wazStatus === 'moderate' ? '⚠️' : '🚨'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: wazTheme[wazStatus].text }}>
                            AI Assessment:{' '}
                            {wazStatus === 'healthy' ? 'Normal Weight-for-Age' : wazStatus === 'moderate' ? 'Moderate Underweight' : 'Severe Underweight'}
                          </div>
                          <div style={{ fontSize: 12, color: wazTheme[wazStatus].text, opacity: 0.8, marginTop: 2 }}>
                            WAZ Score: {wazScore} &nbsp;|&nbsp;
                            {wazStatus === 'healthy'
                              ? 'Child is growing well.'
                              : wazStatus === 'moderate'
                                ? 'Enhanced nutrition counselling recommended.'
                                : 'Immediate PHC referral advised.'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div style={{ animation: 'fadeUp 0.3s ease' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 6 }}>
                    Step 3 — Vaccines Given
                  </h3>
                  <p style={{ fontSize: 13, color: palette.muted, marginBottom: 18 }}>
                    Select all vaccines administered during this visit. ({formData.vaccinesGiven.length} selected)
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {vaccineList.map(vax => (
                      <div
                        key={vax}
                        className={`vaccine-chip${formData.vaccinesGiven.includes(vax) ? ' selected' : ''}`}
                        onClick={() => toggleVaccine(vax)}
                      >
                        {formData.vaccinesGiven.includes(vax) && <span style={{ fontSize: 11 }}>✓</span>}
                        {vax}
                      </div>
                    ))}
                  </div>
                  {formData.vaccinesGiven.length === 0 && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: palette.bg, borderRadius: 8, fontSize: 13, color: palette.muted }}>
                      No vaccines selected — skip this step if no vaccination was done today.
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div style={{ animation: 'fadeUp 0.3s ease' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 20 }}>
                    Step 4 — Notes, Outcome &amp; Save
                  </h3>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: palette.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('visitNotes')}
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e => updateField('notes', e.target.value)}
                      placeholder="Describe child's condition, observations, counselling given, family concerns…"
                      rows={4}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: `1.5px solid ${palette.border}`, borderRadius: 8,
                        fontSize: 14, color: palette.text, background: palette.bg,
                        outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e  => { e.target.style.border = `1.5px solid ${palette.primary}`; e.target.style.boxShadow = `0 0 0 3px ${palette.light}`; }}
                      onBlur={e   => { e.target.style.border = `1.5px solid ${palette.border}`;  e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: palette.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('visitOutcome')}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {outcomeOptions.map(opt => (
                        <div
                          key={opt.value}
                          onClick={() => updateField('outcome', opt.value)}
                          style={{
                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                            border: `1.5px solid ${formData.outcome === opt.value ? palette.primary : palette.border}`,
                            background: formData.outcome === opt.value ? palette.light : '#fff',
                            fontSize: 13, fontWeight: formData.outcome === opt.value ? 600 : 500,
                            color: formData.outcome === opt.value ? palette.dark : palette.text,
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    onClick={() => updateField('referralRequired', !formData.referralRequired)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${formData.referralRequired ? '#fca5a5' : palette.border}`,
                      background: formData.referralRequired ? '#fef2f2' : '#fff',
                      marginBottom: 24, transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${formData.referralRequired ? '#ef4444' : palette.border}`,
                      background: formData.referralRequired ? '#ef4444' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {formData.referralRequired && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: formData.referralRequired ? '#991b1b' : palette.text }}>
                        🏥 {t('phcReferralNeeded')}
                      </div>
                      <div style={{ fontSize: 12, color: formData.referralRequired ? '#b91c1c' : palette.muted, marginTop: 2 }}>
                        Check if this child needs to be referred to Primary Health Centre
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
                <button
                  className="btn-ghost"
                  onClick={() => setCurrentStep(s => s - 1)}
                  style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
                >
                  ← {t('back')}
                </button>
                <span style={{ fontSize: 12, color: palette.muted }}>{t('step') || 'Step'} {currentStep} / 4</span>
                {currentStep < 4 ? (
                  <button
                    className="btn-primary-teal"
                    onClick={() => setCurrentStep(s => s + 1)}
                    disabled={currentStep === 1 && !step1Valid}
                  >
                    {t('next')} →
                  </button>
                ) : (
                  <button
                    className="btn-primary-teal"
                    onClick={submitVisit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><div className="an-spinner" /> {t('loading')}</>
                      : `💾 ${t('save')} ${t('logVisit')}`
                    }
                  </button>
                )}
              </div>
            </div>

            <div style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
              <SidePanel />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LogHomeVisit;
