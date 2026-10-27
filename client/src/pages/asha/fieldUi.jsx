// Small helpers shared by the ASHA field pages (Families, My Visits, Referrals, Register Child)

export const palette = {
  primary: '#0891b2',
  dark: '#0e7490',
  bg: '#f0fdff',
  border: '#c5e8ef',
  text: '#0c2340',
  muted: '#4a7a8a',
};

export const STATUS = {
  healthy: { color: '#059669', bg: '#d1fae5', label: 'healthy' },
  moderate: { color: '#92400e', bg: '#fef3c7', label: 'moderate' },
  severe: { color: '#991b1b', bg: '#fee2e2', label: 'severe' },
};

export const URGENCY = {
  emergency: { color: '#fff', bg: '#dc2626', label: 'urgencyEmergency' },
  urgent: { color: '#92400e', bg: '#fef3c7', label: 'urgencyUrgent' },
  routine: { color: '#0e7490', bg: '#cffafe', label: 'urgencyRoutine' },
};

// National helplines, free from any phone
export const EMERGENCY_NUMBERS = [
  { number: '108', labelKey: 'ambulance108' },
  { number: '102', labelKey: 'transport102' },
  { number: '112', labelKey: 'emergency112' },
  { number: '104', labelKey: 'helpline104' },
];

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ageText(dob) {
  if (!dob) return '—';
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (30.44 * 864e5));
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr ${months % 12} mo`;
}

// yyyy-mm-dd for <input type="date">, n days from today
export function isoDay(n = 0) {
  const d = new Date(Date.now() + n * 864e5);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

export function Badge({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// ── Maternal care (kept in step with server/utils/maternal.js) ───────────────
export const HISTORY_RISKS = [
  'Previous caesarean',
  'Previous stillbirth or miscarriage',
  'Twins / multiple pregnancy',
  'Height below 145 cm',
  'Diabetes',
  'HIV or syphilis',
  'Heart, kidney or thyroid disease',
  'Bleeding in this pregnancy',
];

export const ANC_DANGER_SIGNS = [
  'Bleeding from vagina',
  'Fits / convulsions',
  'Severe headache or blurred vision',
  'Swelling of face and hands',
  'High fever',
  'Severe abdominal pain',
  'Water leaking before labour',
  'Baby moving less',
  'Breathless or very pale',
];

export const MOTHER_PNC_DANGER_SIGNS = [
  'Heavy bleeding',
  'Fever or foul-smelling discharge',
  'Fits / convulsions',
  'Breast pain with fever',
  'Very sad or thoughts of self-harm',
];

export const BABY_DANGER_SIGNS = [
  'Not feeding well',
  'Fast or difficult breathing',
  'Fever or very cold',
  'Yellow palms or soles',
  'Convulsions',
  'Red or pus-filled cord',
  'Very sleepy / not moving',
];
