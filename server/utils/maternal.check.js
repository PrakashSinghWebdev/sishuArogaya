// node utils/maternal.check.js
const assert = require('assert');
const { eddFromLmp, weeksAt, nextAnc, riskFlags, nextPnc, summarize } = require('./maternal');

const now = new Date('2026-10-15T10:00:00');
const weeksAgo = (w) => new Date(now.getTime() - w * 7 * 864e5);
const daysAgo = (d) => new Date(now.getTime() - d * 864e5);

// EDD = LMP + 280 days
assert.strictEqual(eddFromLmp('2026-01-01').toISOString().slice(0, 10), '2026-10-08');
assert.strictEqual(weeksAt(weeksAgo(10), now), 10);

// 10 weeks, no visit: ANC-1 due now
let a = nextAnc(weeksAgo(10), [], now);
assert.deepStrictEqual([a.number, a.dueNow, a.missed], [1, true, []]);
// 20 weeks, no visits: ANC-1 missed, ANC-2 due now
a = nextAnc(weeksAgo(20), [], now);
assert.deepStrictEqual([a.number, a.dueNow, a.missed], [2, true, [1]]);
// 20 weeks, ANC at 8 and 18 weeks: next is ANC-3, opens at 28 weeks (in 8 weeks)
a = nextAnc(weeksAgo(20), [{ date: weeksAgo(12) }, { date: weeksAgo(2) }], now);
assert.deepStrictEqual([a.number, a.dueNow, a.missed], [3, false, []]);
assert.strictEqual(Math.round((a.dueDate - now) / (7 * 864e5)), 8);
// 13 weeks (between windows) with ANC-1 done: ANC-2 opens next week
a = nextAnc(weeksAgo(13), [{ date: weeksAgo(5) }], now);
assert.deepStrictEqual([a.number, a.dueNow], [2, false]);
// 39 weeks, all 4 done: nothing due
a = nextAnc(weeksAgo(39), [{ date: weeksAgo(30) }, { date: weeksAgo(19) }, { date: weeksAgo(9) }, { date: weeksAgo(2) }], now);
assert.strictEqual(a.number, null);

// Risk flags
let r = riskFlags({ age: 17, gravida: 1, ancVisits: [{ hb: 6.5, bpSys: 120, bpDia: 80 }], status: 'pregnant', lmp: weeksAgo(20) }, now);
assert.ok(r.high.includes('Age under 18') && r.high.includes('Severe anaemia (Hb below 7)'));
r = riskFlags({ age: 25, ancVisits: [{ hb: 10, bpSys: 145, bpDia: 85 }], historyRisks: ['Previous caesarean'], status: 'pregnant', lmp: weeksAgo(20) }, now);
assert.deepStrictEqual(r.high.sort(), ['High BP (140/90 or more)', 'Previous caesarean']);
assert.deepStrictEqual(r.warnings, ['Anaemia (Hb below 11)']);                 // Hb 10: warning, not high risk
r = riskFlags({ age: 28, ancVisits: [{ hb: 12 }], status: 'pregnant', lmp: weeksAgo(42) }, now);
assert.deepStrictEqual(r.high, ['Past due date']);
assert.deepStrictEqual(riskFlags({ age: 28, status: 'pregnant', lmp: weeksAgo(20) }, now), { high: [], warnings: [] });

// PNC: institutional delivery 5 days ago, day-3 visit done → day 7 next, not overdue
let p = nextPnc({ date: daysAgo(5), place: 'institutional' }, [{ day: 3 }], now);
assert.deepStrictEqual([p.day, p.overdue], [7, false]);
// home delivery 2 days ago, nothing done → day 1 overdue
p = nextPnc({ date: daysAgo(2), place: 'home' }, [], now);
assert.deepStrictEqual([p.day, p.overdue], [1, true]);
// all visits done → complete
p = nextPnc({ date: daysAgo(50), place: 'institutional' }, [3, 7, 14, 21, 28, 42].map((day) => ({ day })), now);
assert.strictEqual(p.complete, true);

const s = summarize({ status: 'pregnant', lmp: weeksAgo(30), age: 24, ancVisits: [] }, now);
assert.deepStrictEqual([s.weeks, s.trimester, s.nextAnc.number, s.nextAnc.missed], [30, 3, 3, [1, 2]]);
console.log('maternal ok');
