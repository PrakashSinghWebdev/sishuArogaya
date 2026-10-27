// The ASHA's own numbers: home dashboard, vaccination status of her children, monthly report
const ExcelJS = require('exceljs');
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const Vaccination = require('../models/Vaccination');
const GrowthRecord = require('../models/GrowthRecord');
const Pregnancy = require('../models/Pregnancy');
const Referral = require('../models/Referral');
const HealthCamp = require('../models/HealthCamp');
const IncentiveClaim = require('../models/IncentiveClaim');
const Message = require('../models/Message');
const { buildVisitPlan } = require('./ashaController');
const { summarize } = require('../utils/maternal');
const { same } = require('../utils/ashaAssignment');

const DAY = 864e5;
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const pctChange = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);
const familyKey = (c) => (c.parentId ? String(c.parentId._id || c.parentId) : `${c.contactPhone || ''}|${String(c.motherName || '').toLowerCase()}|${String(c.village || '').toLowerCase()}`);

async function myAsha(req, res) {
  const asha = await AshaWorker.findOne({ userId: req.user._id }).select('_id ashaId district block visits').lean();
  if (!asha) res.status(404).json({ message: 'ASHA profile not found' });
  return asha;
}

// GET /api/asha/dashboard — everything on the ASHA home screen, computed from her records
const getDashboard = async (req, res) => {
  try {
    const asha = await myAsha(req, res);
    if (!asha) return undefined;
    const today = startOfDay();
    const tomorrow = new Date(today.getTime() + DAY);
    const weekEnd = new Date(today.getTime() + 7 * DAY);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const children = await Child.find({ ashaId: asha._id }).select('name dob gender village nutritionStatus parentId motherName contactPhone createdAt').lean();
    const ids = children.map((c) => c._id);
    const [pregnancies, pendingDoses, plan, openReferrals, camps, unread] = await Promise.all([
      Pregnancy.find({ ashaId: asha._id, status: { $in: ['pregnant', 'delivered'] } }).lean(),
      Vaccination.find({ childId: { $in: ids }, status: { $ne: 'done' }, dueDate: { $lt: weekEnd } }).select('childId dueDate status').lean(),
      buildVisitPlan(asha._id),
      Referral.find({ ashaId: asha._id, status: { $in: ['pending', 'reached'] } }).populate('childId', 'name').populate('pregnancyId', 'womanName').lean(),
      HealthCamp.find({ district: same(asha.district), block: same(asha.block), status: 'scheduled', date: { $gte: today, $lt: new Date(today.getTime() + 14 * DAY) } }).sort({ date: 1 }).lean(),
      Message.countDocuments({ to: req.user._id, readBy: { $ne: req.user._id } }),
    ]);

    // Families and children, with change since the start of this month
    const before = children.filter((c) => c.createdAt < monthStart);
    const families = new Set(children.map(familyKey)).size;
    const familiesBefore = new Set(before.map(familyKey)).size;

    // Vaccines: due in the next 7 days, and overdue (past due date or marked missed)
    const overdueDoses = pendingDoses.filter((v) => v.dueDate < today || v.status === 'missed');
    const dueThisWeek = pendingDoses.filter((v) => v.dueDate >= today && v.status !== 'missed').length;
    const overdueChildren = new Set(overdueDoses.map((v) => String(v.childId))).size;

    // Maternal
    const pregnant = pregnancies.filter((p) => p.status === 'pregnant');
    const summaries = pregnancies.map((p) => ({ p, s: summarize(p) }));
    const highRiskMothers = summaries.filter(({ p, s }) => p.status === 'pregnant' && s.risk.high.length);
    const ancDue = summaries.filter(({ s }) => s.nextAnc?.dueNow).length;
    const pncDue = summaries.filter(({ s }) => s.nextPnc && !s.nextPnc.complete && new Date(s.nextPnc.dueDate) < tomorrow).length;

    // Today's visits: who was seen today + who is still due today/overdue
    const visitedToday = new Map();
    for (const v of asha.visits || []) if (v.visitDate >= today && v.visitDate < tomorrow) visitedToday.set(String(v.childId), v);
    const byId = new Map(children.map((c) => [String(c._id), c]));
    const schedule = [
      ...[...visitedToday.entries()].map(([id, v]) => ({ child: byId.get(id), status: v.status === 'missed' ? 'missed' : 'completed', at: v.visitDate, reasons: [v.visitType].filter(Boolean) })),
      ...plan.items.filter((i) => ['overdue', 'today'].includes(i.bucket) && !visitedToday.has(String(i.child._id)))
        .map((i) => ({ child: i.child, status: i.bucket === 'overdue' ? 'overdue' : 'pending', at: i.dueDate, reasons: i.reasons })),
    ].filter((x) => x.child);
    const doneToday = schedule.filter((x) => x.status === 'completed').length;

    const severeChildren = children.filter((c) => c.nutritionStatus === 'severe').length;
    const underweight = children.filter((c) => c.nutritionStatus !== 'healthy').length;
    const referralFollowUps = openReferrals.filter((r) => r.urgency === 'emergency' || !r.followUpDate || new Date(r.followUpDate) < tomorrow);

    const alerts = [
      overdueChildren && { kind: 'vaccine', severity: 'high', count: overdueChildren, title: `${overdueChildren} ${overdueChildren > 1 ? 'children' : 'child'} missed vaccination`, subtitle: 'Follow up this week', link: '/asha/vaccination-tracker' },
      underweight && { kind: 'nutrition', severity: severeChildren ? 'high' : 'medium', count: underweight, title: `${underweight} ${underweight > 1 ? 'children' : 'child'} flagged as underweight`, subtitle: severeChildren ? `${severeChildren} severe — PHC referral` : 'Growth review required', link: '/asha/malnutrition-report' },
      ancDue && { kind: 'anc', severity: 'medium', count: ancDue, title: `${ancDue} pregnant ${ancDue > 1 ? 'women' : 'woman'} due for ANC visit`, subtitle: 'Schedule follow-up', link: '/asha/maternal-care' },
      pncDue && { kind: 'pnc', severity: 'medium', count: pncDue, title: `${pncDue} postnatal ${pncDue > 1 ? 'visits' : 'visit'} due`, subtitle: 'Mother and newborn check', link: '/asha/maternal-care' },
      highRiskMothers.length && { kind: 'mother', severity: 'high', count: highRiskMothers.length, title: `${highRiskMothers.length} high-risk ${highRiskMothers.length > 1 ? 'pregnancies' : 'pregnancy'}`, subtitle: 'Plan delivery at CHC / district hospital', link: '/asha/maternal-care' },
      referralFollowUps.length && { kind: 'referral', severity: referralFollowUps.some((r) => r.urgency === 'emergency') ? 'high' : 'medium', count: referralFollowUps.length, title: `${referralFollowUps.length} ${referralFollowUps.length > 1 ? 'referrals need' : 'referral needs'} follow-up`, subtitle: 'Check referral status', link: '/asha/referrals' },
      ...camps.slice(0, 3).map((c) => ({ kind: 'camp', severity: 'info', title: `${c.title} on ${c.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}`, subtitle: [c.village && `Village: ${c.village}`, c.venue].filter(Boolean).join(' · ') || 'Health camp', link: '/asha/camps', at: c.date })),
      unread && { kind: 'message', severity: 'info', count: unread, title: `${unread} unread ${unread > 1 ? 'messages' : 'message'}`, subtitle: 'Open messages', link: '/asha/messages' },
    ].filter(Boolean);

    res.json({
      stats: {
        families: { value: families, changePct: pctChange(families, familiesBefore) },
        children: { value: children.length, changePct: pctChange(children.length, before.length) },
        pregnant: { value: pregnant.length, newThisMonth: pregnant.filter((p) => p.createdAt >= monthStart).length },
        vaccinesDueThisWeek: { value: dueThisWeek, overdue: overdueDoses.length },
        todaysVisits: { done: doneToday, planned: schedule.length },
        highRisk: { value: severeChildren + highRiskMothers.length, children: severeChildren, mothers: highRiskMothers.length },
        // field-work row: visit plan, open referrals, mothers due a check-up
        workload: {
          due: plan.counts.overdue + plan.counts.today,
          overdue: plan.counts.overdue,
          referrals: openReferrals.length,
          emergencies: openReferrals.filter((r) => r.urgency === 'emergency').length,
          mothersDue: ancDue + pncDue,
          highRiskMothers: highRiskMothers.length,
        },
      },
      schedule: schedule.slice(0, 8).map((x) => ({
        status: x.status, at: x.at, reasons: x.reasons,
        child: { _id: x.child._id, name: x.child.name, dob: x.child.dob, gender: x.child.gender, village: x.child.village, nutritionStatus: x.child.nutritionStatus },
      })),
      scheduleTotal: schedule.length,
      alerts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/asha/vaccination-status — per child: doses given / overdue / due soon, plus the pending doses
const getVaccinationStatus = async (req, res) => {
  try {
    const asha = await myAsha(req, res);
    if (!asha) return undefined;
    const today = startOfDay();
    const soon = new Date(today.getTime() + 30 * DAY);
    const children = await Child.find({ ashaId: asha._id }).select('name dob gender village motherName parentId contactPhone').populate('parentId', 'name phone').lean();
    const doses = await Vaccination.find({ childId: { $in: children.map((c) => c._id) } }).select('childId vaccineName dueDate status givenDate ageMonths').sort({ dueDate: 1 }).lean();
    const byChild = new Map(children.map((c) => [String(c._id), []]));
    for (const d of doses) byChild.get(String(d.childId))?.push(d);

    const rows = children.map((c) => {
      const list = byChild.get(String(c._id)) || [];
      const dueByNow = list.filter((d) => d.dueDate < today || d.status === 'missed');
      const overdue = dueByNow.filter((d) => d.status !== 'done');
      const next = list.find((d) => d.status !== 'done' && d.dueDate >= today);
      return {
        child: c,
        given: list.filter((d) => d.status === 'done').length,
        dueByNow: dueByNow.length,
        overdue: overdue.length,
        upToDate: overdue.length === 0,
        next: next ? { _id: next._id, vaccineName: next.vaccineName, dueDate: next.dueDate } : null,
        // doses the ASHA can mark as given: overdue + due within 30 days
        pending: list.filter((d) => d.status !== 'done' && d.dueDate < soon).map((d) => ({ _id: d._id, vaccineName: d.vaccineName, dueDate: d.dueDate, overdue: d.dueDate < today || d.status === 'missed' })),
      };
    }).sort((a, b) => b.overdue - a.overdue || String(a.child.name).localeCompare(String(b.child.name)));

    const weekEnd = new Date(today.getTime() + 7 * DAY);
    res.json({
      summary: {
        children: rows.length,
        upToDate: rows.filter((r) => r.upToDate).length,
        overdueChildren: rows.filter((r) => r.overdue).length,
        dueThisWeek: doses.filter((d) => d.status !== 'done' && d.dueDate >= today && d.dueDate < weekEnd).length,
        coveragePct: rows.length ? Math.round((rows.filter((r) => r.upToDate).length / rows.length) * 100) : 0,
      },
      children: rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Everything in the monthly report for one ASHA
async function buildReport(asha, month) {
  const [y, m] = month.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  const inMonth = (d) => d && new Date(d) >= from && new Date(d) < to;
  const children = await Child.find({ ashaId: asha._id }).select('name nutritionStatus village').lean();
  const ids = children.map((c) => c._id);
  const [dosesGiven, growth, referrals, pregnancies, camps, claims, plan, status] = await Promise.all([
    Vaccination.countDocuments({ childId: { $in: ids }, status: 'done', givenDate: { $gte: from, $lt: to } }),
    GrowthRecord.distinct('childId', { childId: { $in: ids }, recordedDate: { $gte: from, $lt: to } }),
    Referral.find({ ashaId: asha._id, createdAt: { $gte: from, $lt: to } }).populate('childId', 'name').populate('pregnancyId', 'womanName').lean(),
    Pregnancy.find({ ashaId: asha._id }).lean(),
    HealthCamp.find({ district: same(asha.district), block: same(asha.block), date: { $gte: from, $lt: to } }).lean(),
    IncentiveClaim.find({ ashaId: asha._id, month }).lean(),
    buildVisitPlan(asha._id),
    Vaccination.aggregate([
      { $match: { childId: { $in: ids }, dueDate: { $lt: new Date() }, status: { $ne: 'done' } } },
      { $group: { _id: '$childId' } },
    ]),
  ]);
  const visits = (asha.visits || []).filter((v) => inMonth(v.visitDate));
  const completed = visits.filter((v) => v.status !== 'missed');
  const screenedByVisit = new Set(completed.filter((v) => v.weight || v.muac).map((v) => String(v.childId)));
  growth.forEach((id) => screenedByVisit.add(String(id)));
  const sum = (arr, f) => arr.reduce((n, x) => n + (Number(f(x)) || 0), 0);
  return {
    month,
    worker: { ashaId: asha.ashaId, district: asha.district, block: asha.block },
    visits: { completed: completed.length, missed: visits.length - completed.length, childrenVisited: new Set(completed.map((v) => String(v.childId))).size, referredDuringVisits: completed.filter((v) => v.referralId).length },
    vaccination: { dosesGiven, children: ids.length, overdueChildren: status.length, upToDatePct: ids.length ? Math.round(((ids.length - status.length) / ids.length) * 100) : 0 },
    nutrition: {
      screened: screenedByVisit.size,
      healthy: children.filter((c) => c.nutritionStatus === 'healthy').length,
      moderate: children.filter((c) => c.nutritionStatus === 'moderate').length,
      severe: children.filter((c) => c.nutritionStatus === 'severe').length,
    },
    referrals: {
      total: referrals.length,
      emergency: referrals.filter((r) => r.urgency === 'emergency').length,
      completed: referrals.filter((r) => r.status === 'completed').length,
      open: referrals.filter((r) => ['pending', 'reached'].includes(r.status)).length,
      list: referrals.map((r) => ({ date: r.createdAt, who: r.childId?.name || `${r.pregnancyId?.womanName || '—'} (mother)`, reason: r.reason, urgency: r.urgency, facility: r.facility || '', status: r.status })),
    },
    maternal: {
      registered: pregnancies.filter((p) => inMonth(p.createdAt)).length,
      ancVisits: sum(pregnancies, (p) => (p.ancVisits || []).filter((v) => inMonth(v.date)).length),
      deliveries: pregnancies.filter((p) => inMonth(p.delivery?.date)).length,
      institutional: pregnancies.filter((p) => inMonth(p.delivery?.date) && p.delivery.place === 'institutional').length,
      pncVisits: sum(pregnancies, (p) => (p.pncVisits || []).filter((v) => inMonth(v.date)).length),
      highRiskNow: pregnancies.filter((p) => p.status === 'pregnant' && summarize(p).risk.high.length).length,
    },
    camps: { held: camps.filter((c) => c.status === 'completed' || (c.status === 'scheduled' && c.date < new Date())).length },
    incentives: { claims: claims.length, approvedAmount: sum(claims.filter((c) => ['approved', 'paid'].includes(c.status)), (c) => c.amount) },
    followUp: plan.items.filter((i) => ['overdue', 'today'].includes(i.bucket)).slice(0, 100).map((i) => ({ name: i.child.name, village: i.child.village || '', due: i.dueDate, reasons: i.reasons.join(', ') })),
  };
}

// GET /api/asha/report?month=YYYY-MM[&format=xlsx]
const getReport = async (req, res) => {
  try {
    const asha = await myAsha(req, res);
    if (!asha) return undefined;
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
    const r = await buildReport(asha, month);
    if (req.query.format !== 'xlsx') return res.json(r);

    const wb = new ExcelJS.Workbook();
    const summary = wb.addWorksheet('Summary');
    summary.columns = [{ header: 'Section', key: 'a', width: 28 }, { header: 'Indicator', key: 'b', width: 40 }, { header: 'Value', key: 'c', width: 14 }];
    const rows = [
      ['ASHA', 'ASHA ID', r.worker.ashaId], ['ASHA', 'Name', req.user.name], ['ASHA', 'Block / District', `${r.worker.block} / ${r.worker.district}`], ['ASHA', 'Month', month],
      ['Home visits', 'Completed', r.visits.completed], ['Home visits', 'Missed', r.visits.missed], ['Home visits', 'Children visited', r.visits.childrenVisited],
      ['Immunisation', 'Doses given this month', r.vaccination.dosesGiven], ['Immunisation', 'Children up to date (%)', r.vaccination.upToDatePct], ['Immunisation', 'Children with overdue doses', r.vaccination.overdueChildren],
      ['Nutrition', 'Children screened this month', r.nutrition.screened], ['Nutrition', 'Healthy', r.nutrition.healthy], ['Nutrition', 'Moderate (MAM)', r.nutrition.moderate], ['Nutrition', 'Severe (SAM)', r.nutrition.severe],
      ['Referrals', 'Made this month', r.referrals.total], ['Referrals', 'Emergency', r.referrals.emergency], ['Referrals', 'Completed', r.referrals.completed], ['Referrals', 'Still open', r.referrals.open],
      ['Maternal care', 'Pregnancies registered', r.maternal.registered], ['Maternal care', 'ANC check-ups', r.maternal.ancVisits], ['Maternal care', 'Deliveries', r.maternal.deliveries], ['Maternal care', 'Institutional deliveries', r.maternal.institutional], ['Maternal care', 'Postnatal visits', r.maternal.pncVisits], ['Maternal care', 'High-risk pregnancies (now)', r.maternal.highRiskNow],
      ['Outreach', 'Camps held', r.camps.held], ['Incentives', 'Claims', r.incentives.claims], ['Incentives', 'Approved amount (₹)', r.incentives.approvedAmount],
    ];
    rows.forEach(([a, b, c]) => summary.addRow({ a, b, c }));
    summary.getRow(1).font = { bold: true };
    const fu = wb.addWorksheet('Follow-up needed');
    fu.columns = [{ header: 'Child', key: 'name', width: 24 }, { header: 'Village', key: 'village', width: 18 }, { header: 'Due', key: 'due', width: 14 }, { header: 'Why', key: 'reasons', width: 50 }];
    r.followUp.forEach((x) => fu.addRow({ ...x, due: new Date(x.due).toISOString().slice(0, 10) }));
    fu.getRow(1).font = { bold: true };
    const rf = wb.addWorksheet('Referrals');
    rf.columns = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Who', key: 'who', width: 24 }, { header: 'Reason', key: 'reason', width: 40 }, { header: 'Urgency', key: 'urgency', width: 12 }, { header: 'Facility', key: 'facility', width: 24 }, { header: 'Status', key: 'status', width: 12 }];
    r.referrals.list.forEach((x) => rf.addRow({ ...x, date: new Date(x.date).toISOString().slice(0, 10) }));
    rf.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="asha-report-${r.worker.ashaId}-${month}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboard, getVaccinationStatus, getReport };
