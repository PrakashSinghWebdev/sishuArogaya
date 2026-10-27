// Pregnancy and postnatal rules for the ASHA maternal care register (national MCH guidance:
// 4 ANC contacts, HBNC home visits, high-risk pregnancy criteria). Pure functions: see maternal.check.js.
// ponytail: thresholds are the national defaults; move to config if a state uses different norms.
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

// ANC contacts: 1st by 12 weeks, 2nd 14–26, 3rd 28–34, 4th 36 weeks onwards
const ANC_WINDOWS = [
  { n: 1, from: 0, to: 12 },
  { n: 2, from: 14, to: 26 },
  { n: 3, from: 28, to: 34 },
  { n: 4, from: 36, to: 42 },
];
// HBNC home visits after delivery (day 1 is added for home deliveries)
const PNC_DAYS = [3, 7, 14, 21, 28, 42];

// History the ASHA ticks at registration (high-risk pregnancy criteria)
const HISTORY_RISKS = [
  'Previous caesarean',
  'Previous stillbirth or miscarriage',
  'Twins / multiple pregnancy',
  'Height below 145 cm',
  'Diabetes',
  'HIV or syphilis',
  'Heart, kidney or thyroid disease',
  'Bleeding in this pregnancy',
];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const eddFromLmp = (lmp) => new Date(new Date(lmp).getTime() + 280 * DAY);
const weeksAt = (lmp, at) => Math.floor((new Date(at) - new Date(lmp)) / WEEK);

// Which ANC contact is next, when, and which windows were missed
function nextAnc(lmp, ancVisits = [], now = new Date()) {
  const weeks = weeksAt(lmp, now);
  const done = new Set(ANC_WINDOWS.filter((w) => ancVisits.some((v) => {
    const wk = weeksAt(lmp, v.date);
    return wk >= w.from && wk <= w.to;
  })).map((w) => w.n));
  const missed = ANC_WINDOWS.filter((w) => !done.has(w.n) && weeks > w.to).map((w) => w.n);
  const next = ANC_WINDOWS.find((w) => !done.has(w.n) && weeks <= w.to);
  if (!next) return { number: null, dueDate: null, dueNow: false, missed, done: [...done] };
  const opens = new Date(new Date(lmp).getTime() + next.from * WEEK);
  const dueNow = weeks >= next.from;
  return { number: next.n, dueDate: dueNow ? startOfDay(now) : opens, dueBy: new Date(new Date(lmp).getTime() + (next.to + 1) * WEEK - DAY), dueNow, missed, done: [...done] };
}

// High-risk flags (refer to / deliver at a CHC or district hospital) and softer warnings
function riskFlags(p, now = new Date()) {
  const high = [...(p.historyRisks || [])];
  const warnings = [];
  if (p.age && p.age < 18) high.push('Age under 18');
  if (p.age && p.age > 35) high.push('Age over 35');
  if (p.gravida >= 5) high.push('5 or more pregnancies');
  const anc = p.ancVisits || [];
  const latestHb = [...anc].reverse().find((v) => v.hb != null)?.hb;
  if (latestHb != null && latestHb < 7) high.push('Severe anaemia (Hb below 7)');
  else if (latestHb != null && latestHb < 11) warnings.push('Anaemia (Hb below 11)');
  if (anc.some((v) => v.bpSys >= 140 || v.bpDia >= 90)) high.push('High BP (140/90 or more)');
  if (anc.some((v) => v.dangerSigns?.length)) high.push('Danger sign reported');
  if (p.status === 'pregnant' && weeksAt(p.lmp, now) >= 41) high.push('Past due date');
  return { high: [...new Set(high)], warnings };
}

// Next postnatal home visit after delivery
function nextPnc(delivery, pncVisits = [], now = new Date()) {
  if (!delivery?.date) return null;
  const days = delivery.place === 'home' ? [1, ...PNC_DAYS] : PNC_DAYS;
  const done = new Set(pncVisits.map((v) => v.day));
  const day = days.find((d) => !done.has(d));
  if (day == null) return { day: null, dueDate: null, overdue: false, complete: true };
  const dueDate = startOfDay(new Date(new Date(delivery.date).getTime() + day * DAY));
  return { day, dueDate, overdue: dueDate < startOfDay(now), complete: false };
}

// Everything the list and detail pages show about one pregnancy
function summarize(p, now = new Date()) {
  const pregnant = p.status === 'pregnant';
  const weeks = pregnant ? weeksAt(p.lmp, now) : null;
  return {
    weeks,
    trimester: weeks == null ? null : weeks < 13 ? 1 : weeks < 27 ? 2 : 3,
    edd: p.edd || eddFromLmp(p.lmp),
    nextAnc: pregnant ? nextAnc(p.lmp, p.ancVisits, now) : null,
    nextPnc: p.status === 'delivered' ? nextPnc(p.delivery, p.pncVisits, now) : null,
    risk: riskFlags(p, now),
  };
}

module.exports = { ANC_WINDOWS, PNC_DAYS, HISTORY_RISKS, eddFromLmp, weeksAt, nextAnc, riskFlags, nextPnc, summarize };
