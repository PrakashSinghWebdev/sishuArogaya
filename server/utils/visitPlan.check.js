// node utils/visitPlan.check.js
const assert = require('assert');
const { planVisits } = require('./visitPlan');

const now = new Date('2026-10-15T10:00:00');
const daysAgo = (n) => new Date(now.getTime() - n * 864e5);
const kids = [
  { _id: 'healthy-recent', nutritionStatus: 'healthy' },
  { _id: 'healthy-old', nutritionStatus: 'healthy' },
  { _id: 'severe', nutritionStatus: 'severe' },
  { _id: 'new', nutritionStatus: 'healthy' },
  { _id: 'followup', nutritionStatus: 'healthy' },
  { _id: 'emergency', nutritionStatus: 'healthy' },
];
const visits = [
  { childId: 'healthy-recent', visitDate: daysAgo(3), status: 'completed' },
  { childId: 'healthy-old', visitDate: daysAgo(40), status: 'completed' },
  { childId: 'severe', visitDate: daysAgo(8), status: 'completed' },
  { childId: 'followup', visitDate: daysAgo(2), status: 'completed', followUpDate: now },
  { childId: 'emergency', visitDate: daysAgo(1), status: 'completed' },
];
const plan = planVisits({ children: kids, visits, dueVaccines: { 'healthy-recent': 2 }, referrals: [{ childId: 'emergency', urgency: 'emergency' }], now });
const by = Object.fromEntries(plan.map((p) => [p.child._id, p]));

assert.strictEqual(plan[0].child._id, 'emergency');                       // open emergency referral first
assert.strictEqual(by.severe.bucket, 'overdue');                          // severe: due every 7 days, seen 8 days ago
assert.strictEqual(by['healthy-old'].bucket, 'overdue');                  // routine 30 days passed
assert.strictEqual(by.new.bucket, 'today');                               // never visited
assert.ok(by.new.reasons.includes('Never visited'));
assert.strictEqual(by['healthy-recent'].bucket, 'today');                 // vaccines due today despite recent visit
assert.ok(by['healthy-recent'].reasons.includes('2 vaccines due'));
assert.strictEqual(by.followup.bucket, 'today');                          // follow-up date set to today
assert.ok(by.severe.priority > by['healthy-old'].priority);               // both overdue, severe ranks higher
const calm = planVisits({ children: [{ _id: 'x', nutritionStatus: 'healthy' }], visits: [{ childId: 'x', visitDate: daysAgo(1), status: 'completed' }], now });
assert.strictEqual(calm[0].bucket, 'later');                              // visited yesterday, next routine in 29 days
const missed = planVisits({ children: [{ _id: 'm' }], visits: [{ childId: 'm', visitDate: daysAgo(5), status: 'completed' }, { childId: 'm', visitDate: daysAgo(1), status: 'missed', followUpDate: daysAgo(-2) }], now });
assert.ok(missed[0].reasons.includes('Last visit missed'));
assert.strictEqual(missed[0].bucket, 'week');                             // rescheduled 2 days ahead
assert.strictEqual(missed[0].lastVisit.getTime(), daysAgo(5).getTime());  // a missed visit doesn't count as seen
console.log('visitPlan ok');
