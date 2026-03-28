import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ashaAPI } from '../../services/api';
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

const VISIT_TYPES = [
  'Growth Check',
  'Vaccination',
  'Growth + Vaccination',
  'Nutrition Counselling',
  'Emergency Visit',
  'Follow-up Visit',
  'PHC Referral Follow-up',
];

const VACCINE_OPTIONS = [
  'BCG', 'OPV-0', 'Hepatitis B (1st)',
  'DPT-1', 'OPV-1', 'Hib-1', 'PCV-1', 'Rota-1',
  'DPT-2', 'OPV-2', 'Hib-2', 'PCV-2', 'Rota-2',
  'DPT-3', 'OPV-3', 'Hib-3', 'IPV', 'Hepatitis B (3rd)',
  'MMR-1', 'JE-1', 'MMR-2', 'DPT Booster', 'OPV Booster', 'Typhoid',
];

const OUTCOME_OPTIONS = [
  { value: 'healthy', label: 'Healthy — No concerns' },
  { value: 'monitor', label: 'Monitor — Mild concern' },
  { value: 'follow-up', label: 'Follow-up Required' },
  { value: 'referred', label: 'Referred to PHC / CHC' },
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

const EMPTY_FORM = {
  childId: '',
  visitType: '',
  weight: '',
  height: '',
  headCircumference: '',
  temperature: '',
  muac: '',
  vaccinesGiven: [],
  notes: '',
  outcome: 'healthy',
  referralRequired: false,
};

/* ─── WAZ helper ─────────────────────────────────────────────────── */
function calcWAZ(weight) {
  if (!weight) return null;
  return parseFloat(((parseFloat(weight) - 8.2) / 1.1).toFixed(1));
}
function wazStatus(waz) {
  if (waz === null) return null;
  if (waz >= -1) return 'healthy';
  if (waz >= -2) return 'moderate';
  return 'severe';
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function StepIndicator({ step }) {
  const steps = ['Select Child', 'Measurements', 'Vaccines', 'Notes & Save'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                fontSize: 14, transition: 'all 0.2s',
                background: done ? C.dark : active ? C.primary : '#e2f4f8',
                color: done || active ? '#fff' : C.muted,
                border: active ? `3px solid ${C.dark}` : done ? `3px solid ${C.dark}` : `2px solid ${C.border}`,
                boxShadow: active ? `0 0 0 4px ${C.light}` : 'none',
              }}>
                {done ? '✓' : idx}
              </div>
              <span style={{
                marginTop: 6, fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? C.primary : done ? C.dark : C.muted,
                textAlign: 'center', whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 2, height: 3, borderRadius: 2, marginBottom: 18,
                background: i + 1 < step ? C.dark : C.border,
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, unit, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            width: '100%', padding: unit ? '9px 44px 9px 12px' : '9px 12px',
            border: `1.5px solid ${focused ? C.primary : C.border}`,
            borderRadius: 8, fontSize: 14, color: C.text,
            background: focused ? '#fff' : C.bg,
            outline: 'none', boxSizing: 'border-box',
            boxShadow: focused ? `0 0 0 3px ${C.light}` : 'none',
            transition: 'all 0.15s',
          }}
        />
        {unit && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: C.muted, fontWeight: 600,
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
const LogHomeVisit = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedId = new URLSearchParams(location.search).get('childId') || '';

  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM, childId: preSelectedId });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    ashaAPI.getMyChildren()
      .then(r => setChildren(r.data || []))
      .catch(() => setChildren([]))
      .finally(() => setLoadingChildren(false));
  }, []);

  const patch = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleVaccine = (v) => {
    setForm(f => ({
      ...f,
      vaccinesGiven: f.vaccinesGiven.includes(v)
        ? f.vaccinesGiven.filter(x => x !== v)
        : [...f.vaccinesGiven, v],
    }));
  };

  const selectedChild = children.find(c => c._id === form.childId) || null;

  const waz = calcWAZ(form.weight);
  const aiStatus = wazStatus(waz);

  const wazColors = {
    healthy: { bg: '#f0fdf4', border: '#86efac', text: '#166534', badge: '#22c55e' },
    moderate: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#f59e0b' },
    severe: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', badge: '#ef4444' },
  };

  const canProceed1 = form.childId && form.visitType;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await ashaAPI.logVisit({
        childId: form.childId,
        visitType: form.visitType,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        headCircumference: form.headCircumference ? parseFloat(form.headCircumference) : undefined,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        muac: form.muac ? parseFloat(form.muac) : undefined,
        vaccinesGiven: form.vaccinesGiven,
        notes: form.notes,
        outcome: form.outcome,
        referralRequired: form.referralRequired,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ ...EMPTY_FORM, childId: preSelectedId });
        setStep(1);
        navigate('/asha/visit-history');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const userInitial = user?.name ? user.name[0].toUpperCase() : 'A';

  /* ── Sidebar ─────────────────────────────── */
  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selected Child Card */}
      <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Selected Child
        </div>
        {selectedChild ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 16,
              }}>
                {selectedChild.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{selectedChild.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{selectedChild.ageInMonths} months old</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Gender', selectedChild.gender || '—'],
                ['Block', selectedChild.block || '—'],
                ['Guardian', selectedChild.parentName || '—'],
                ['Village', selectedChild.village || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>👶</div>
            No child selected yet
          </div>
        )}
      </div>

      {/* Visit Summary */}
      <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Visit Summary
        </div>
        {[
          ['Visit Type', form.visitType || '—'],
          ['Weight', form.weight ? `${form.weight} kg` : '—'],
          ['Height', form.height ? `${form.height} cm` : '—'],
          ['MUAC', form.muac ? `${form.muac} cm` : '—'],
          ['Vaccines', form.vaccinesGiven.length > 0 ? `${form.vaccinesGiven.length} selected` : '—'],
          ['Outcome', form.outcome || '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.bg}` }}>
            <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
          </div>
        ))}
        {form.referralRequired && (
          <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
            🏥 PHC Referral Required
          </div>
        )}
      </div>

      {/* Checklist */}
      <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Step Checklist
        </div>
        {[
          ['Child & Visit Type', canProceed1],
          ['Measurements recorded', !!(form.weight || form.height)],
          ['Vaccines noted', form.vaccinesGiven.length > 0],
          ['Outcome documented', !!(form.notes || form.outcome)],
        ].map(([label, done]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: done ? C.primary : C.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff', fontWeight: 700,
            }}>
              {done ? '✓' : ''}
            </div>
            <span style={{ fontSize: 12, color: done ? C.text : C.muted, fontWeight: done ? 600 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
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
        .vaccine-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; user-select: none; border: 1.5px solid #c5e8ef; background: #f0fdff; color: #4a7a8a; }
        .vaccine-chip.selected { background: #0891b2; border-color: #0891b2; color: #fff; }
        .vaccine-chip:hover { border-color: #0891b2; }
        .btn-primary-teal { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; border-radius: 9px; padding: 11px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary-teal:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(8,145,178,0.35); }
        .btn-primary-teal:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost { background: #f0fdff; color: #0891b2; border: 1.5px solid #c5e8ef; border-radius: 9px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover { background: #cffafe; }
      `}</style>

      {/* Navbar */}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
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
            }}>3</span>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>{userInitial}</div>
        </div>
      </nav>

      {/* Page Body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>📝 Log Home Visit</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>Record a field visit in 4 easy steps</p>
        </div>

        {/* Success overlay */}
        {success && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(8,145,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '40px 48px',
              textAlign: 'center', boxShadow: '0 20px 60px rgba(8,145,178,0.25)',
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>Visit Logged!</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Redirecting to visit history…</div>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Main Form Card */}
          <div className="an-card" style={{ animation: 'fadeUp 0.4s ease 0.05s both' }}>
            <StepIndicator step={step} />

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#991b1b',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                  Step 1 — Select Child & Visit Type
                </h3>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Child <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  {loadingChildren ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: C.muted }}>
                      <div className="an-spinner" /> Loading children…
                    </div>
                  ) : (
                    <select
                      value={form.childId}
                      onChange={e => patch('childId', e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: `1.5px solid ${form.childId ? C.primary : C.border}`,
                        borderRadius: 8, fontSize: 14, color: form.childId ? C.text : C.muted,
                        background: C.bg, outline: 'none', cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">— Choose a child —</option>
                      {children.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.ageInMonths} months) — {c.village || c.block || ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Visit Type <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                    {VISIT_TYPES.map(vt => (
                      <div
                        key={vt}
                        onClick={() => patch('visitType', vt)}
                        style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${form.visitType === vt ? C.primary : C.border}`,
                          background: form.visitType === vt ? C.light : '#fff',
                          fontSize: 13, fontWeight: form.visitType === vt ? 600 : 500,
                          color: form.visitType === vt ? C.dark : C.text,
                          transition: 'all 0.15s',
                          boxShadow: form.visitType === vt ? `0 0 0 3px ${C.light}` : 'none',
                        }}
                      >
                        {vt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                  Step 2 — Measurements
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <InputField label="Weight" type="number" value={form.weight} onChange={e => patch('weight', e.target.value)} placeholder="e.g. 7.5" unit="kg" />
                  <InputField label="Height" type="number" value={form.height} onChange={e => patch('height', e.target.value)} placeholder="e.g. 68.5" unit="cm" />
                  <InputField label="Head Circumference" type="number" value={form.headCircumference} onChange={e => patch('headCircumference', e.target.value)} placeholder="e.g. 42" unit="cm" />
                  <InputField label="Temperature" type="number" value={form.temperature} onChange={e => patch('temperature', e.target.value)} placeholder="e.g. 98.6" unit="°F" />
                  <InputField label="MUAC" type="number" value={form.muac} onChange={e => patch('muac', e.target.value)} placeholder="e.g. 12.5" unit="cm" />
                </div>

                {/* AI WAZ Assessment */}
                {aiStatus && (
                  <div style={{
                    marginTop: 16,
                    background: wazColors[aiStatus].bg,
                    border: `1.5px solid ${wazColors[aiStatus].border}`,
                    borderRadius: 12, padding: 16,
                    animation: 'fadeUp 0.25s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: wazColors[aiStatus].badge,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>
                        {aiStatus === 'healthy' ? '✅' : aiStatus === 'moderate' ? '⚠️' : '🚨'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: wazColors[aiStatus].text }}>
                          AI Assessment: {aiStatus === 'healthy' ? 'Normal Weight-for-Age' : aiStatus === 'moderate' ? 'Moderate Underweight' : 'Severe Underweight'}
                        </div>
                        <div style={{ fontSize: 12, color: wazColors[aiStatus].text, opacity: 0.8, marginTop: 2 }}>
                          WAZ Score: {waz} &nbsp;|&nbsp;
                          {aiStatus === 'healthy' ? 'Child is growing well.' : aiStatus === 'moderate' ? 'Enhanced nutrition counselling recommended.' : 'Immediate PHC referral advised.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  Step 3 — Vaccines Given
                </h3>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
                  Select all vaccines administered during this visit. ({form.vaccinesGiven.length} selected)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {VACCINE_OPTIONS.map(v => (
                    <div
                      key={v}
                      className={`vaccine-chip${form.vaccinesGiven.includes(v) ? ' selected' : ''}`}
                      onClick={() => toggleVaccine(v)}
                    >
                      {form.vaccinesGiven.includes(v) && <span style={{ fontSize: 11 }}>✓</span>}
                      {v}
                    </div>
                  ))}
                </div>
                {form.vaccinesGiven.length === 0 && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: C.bg, borderRadius: 8, fontSize: 13, color: C.muted }}>
                    No vaccines selected — skip this step if no vaccination was done today.
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                  Step 4 — Notes, Outcome & Save
                </h3>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Visit Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => patch('notes', e.target.value)}
                    placeholder="Describe child's condition, observations, counselling given, family concerns…"
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: `1.5px solid ${C.border}`, borderRadius: 8,
                      fontSize: 14, color: C.text, background: C.bg,
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.border = `1.5px solid ${C.primary}`; e.target.style.boxShadow = `0 0 0 3px ${C.light}`; }}
                    onBlur={e => { e.target.style.border = `1.5px solid ${C.border}`; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Visit Outcome
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {OUTCOME_OPTIONS.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => patch('outcome', opt.value)}
                        style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${form.outcome === opt.value ? C.primary : C.border}`,
                          background: form.outcome === opt.value ? C.light : '#fff',
                          fontSize: 13, fontWeight: form.outcome === opt.value ? 600 : 500,
                          color: form.outcome === opt.value ? C.dark : C.text,
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHC Referral */}
                <div
                  onClick={() => patch('referralRequired', !form.referralRequired)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${form.referralRequired ? '#fca5a5' : C.border}`,
                    background: form.referralRequired ? '#fef2f2' : '#fff',
                    marginBottom: 24, transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${form.referralRequired ? '#ef4444' : C.border}`,
                    background: form.referralRequired ? '#ef4444' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {form.referralRequired && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: form.referralRequired ? '#991b1b' : C.text }}>
                      🏥 PHC Referral Required
                    </div>
                    <div style={{ fontSize: 12, color: form.referralRequired ? '#b91c1c' : C.muted, marginTop: 2 }}>
                      Check if this child needs to be referred to Primary Health Centre
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button
                className="btn-ghost"
                onClick={() => setStep(s => s - 1)}
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              >
                ← Back
              </button>
              <span style={{ fontSize: 12, color: C.muted }}>Step {step} of 4</span>
              {step < 4 ? (
                <button
                  className="btn-primary-teal"
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && !canProceed1}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn-primary-teal"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <><div className="an-spinner" /> Saving…</> : '💾 Save Visit'}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogHomeVisit;
