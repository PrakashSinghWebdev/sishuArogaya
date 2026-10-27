// Works out when each assigned child next needs a home visit, and why — the ASHA's daily work list.
// Pure function (no DB) so the rules are easy to read and check: see visitPlan.check.js.
const DAY = 24 * 60 * 60 * 1000;
// ponytail: fixed routine intervals by nutrition status; move to config if the state's visit norms differ
const ROUTINE_DAYS = { severe: 7, moderate: 14, healthy: 30 };

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/**
 * children:  [{ _id, name, nutritionStatus, ... }]
 * visits:    the ASHA's visit log [{ childId, visitDate, status: 'completed'|'missed', followUpDate }]
 * dueVaccines: { [childId]: count of due/overdue doses }
 * referrals: open referrals [{ childId, urgency, followUpDate }]
 * Returns items sorted most urgent first: { child, dueDate, bucket, reasons[], lastVisit, priority }
 */
function planVisits({ children, visits, dueVaccines = {}, referrals = [], now = new Date() }) {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY);
  const byChild = new Map();
  for (const v of visits) {
    const id = String(v.childId?._id || v.childId);
    if (!byChild.has(id)) byChild.set(id, []);
    byChild.get(id).push(v);
  }

  return children.map((child) => {
    const id = String(child._id);
    const own = (byChild.get(id) || []).sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
    const completed = own.filter((v) => v.status !== 'missed');
    const lastVisit = completed.length ? new Date(completed[completed.length - 1].visitDate) : null;
    const latest = own[own.length - 1];
    const status = child.nutritionStatus || 'healthy';
    const reasons = [];
    const dates = [];
    let priority = 0;

    // Routine visit, sooner for malnourished children; never visited = due now
    if (!lastVisit) { dates.push(today); reasons.push('Never visited'); priority += 15; }
    else dates.push(new Date(lastVisit.getTime() + (ROUTINE_DAYS[status] || 30) * DAY));
    if (status === 'severe') { reasons.push('Severe malnutrition'); priority += 50; }
    if (status === 'moderate') { reasons.push('Moderate malnutrition'); priority += 15; }

    if (latest?.followUpDate) { dates.push(new Date(latest.followUpDate)); reasons.push('Follow-up'); }
    if (latest?.status === 'missed') { reasons.push('Last visit missed'); priority += 10; }

    const vaccines = dueVaccines[id] || 0;
    if (vaccines) { dates.push(today); reasons.push(`${vaccines} vaccine${vaccines > 1 ? 's' : ''} due`); priority += 20; }

    for (const r of referrals.filter((ref) => String(ref.childId?._id || ref.childId) === id)) {
      reasons.push(r.urgency === 'emergency' ? 'Emergency referral open' : 'Referral follow-up');
      priority += r.urgency === 'emergency' ? 100 : 25;
      dates.push(r.followUpDate ? new Date(r.followUpDate) : today);
    }

    const dueDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const bucket = dueDate < today ? 'overdue' : dueDate < tomorrow ? 'today' : dueDate < new Date(today.getTime() + 8 * DAY) ? 'week' : 'later';
    priority += { overdue: 40, today: 10, week: 0, later: -100 }[bucket];
    return { child, dueDate, bucket, reasons, lastVisit, priority };
  }).sort((a, b) => b.priority - a.priority || a.dueDate - b.dueDate);
}

module.exports = { planVisits, ROUTINE_DAYS };
