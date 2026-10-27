const mongoose = require('mongoose');
const IncentiveClaim = require('../models/IncentiveClaim');
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const Pregnancy = require('../models/Pregnancy');
const Vaccination = require('../models/Vaccination');
const Referral = require('../models/Referral');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLogger');
const User = require('../models/User');
const { PNC_DAYS } = require('../utils/maternal');
const { pageParams } = require('../utils/paginate');

const { ACTIVITIES } = IncentiveClaim;
const monthRange = (m) => { const [y, mo] = m.split('-').map(Number); return [new Date(y, mo - 1, 1), new Date(y, mo, 1)]; };
const thisMonth = () => new Date().toISOString().slice(0, 7);
const ashaOf = (user) => AshaWorker.findOne({ userId: user._id }).select('_id ashaId district block userId').lean();
const OPEN = ['pending', 'submitted', 'approved', 'paid']; // a rejected claim may be claimed again

// GET /api/incentives — ASHA: hers; admin: all (?status=submitted), paged.
const listClaims = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };
    if (req.query.month) filter.month = String(req.query.month);
    if (req.user.role === 'asha') {
      const asha = await ashaOf(req.user);
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      const rows = await IncentiveClaim.find({ ...filter, ashaId: asha._id }).sort({ month: -1, createdAt: -1 }).limit(500).populate('history.by', 'name role').lean();
      return res.json(rows);
    }
    const { limit, skip } = pageParams(req.query);
    const [rows, total] = await Promise.all([
      IncentiveClaim.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)
        .populate({ path: 'ashaId', select: 'ashaId block userId', populate: { path: 'userId', select: 'name phone' } })
        .populate('history.by', 'name role').lean(),
      IncentiveClaim.countDocuments(filter),
    ]);
    res.set('X-Total-Count', total).json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/incentives/suggestions?month=YYYY-MM — eligible activities found in the ASHA's own records
// that she has not claimed yet. Amounts are left for her to enter (rates differ by state).
const getSuggestions = async (req, res) => {
  try {
    const asha = await ashaOf(req.user);
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : thisMonth();
    const [from, to] = monthRange(month);
    const inMonth = (d) => d && new Date(d) >= from && new Date(d) < to;
    const out = [];

    const pregnancies = await Pregnancy.find({ ashaId: asha._id }).select('womanName lmp createdAt status delivery pncVisits').lean();
    for (const p of pregnancies) {
      if (p.delivery?.place === 'institutional' && inMonth(p.delivery.date)) out.push({ activity: ACTIVITIES[2], pregnancyId: p._id, beneficiary: p.womanName, evidence: `Hospital delivery on ${p.delivery.date.toISOString().slice(0, 10)}` });
      const days = new Set((p.pncVisits || []).map((v) => v.day));
      const lastPnc = (p.pncVisits || []).reduce((m, v) => (!m || v.date > m ? v.date : m), null);
      if (p.status === 'delivered' && PNC_DAYS.every((d) => days.has(d)) && inMonth(lastPnc)) out.push({ activity: ACTIVITIES[3], pregnancyId: p._id, beneficiary: p.womanName, evidence: 'All HBNC home visits recorded' });
      const weeksAtRegistration = (new Date(p.createdAt) - new Date(p.lmp)) / (7 * 864e5);
      if (inMonth(p.createdAt) && weeksAtRegistration <= 12) out.push({ activity: ACTIVITIES[5], pregnancyId: p._id, beneficiary: p.womanName, evidence: `Registered at ${Math.floor(weeksAtRegistration)} weeks` });
    }

    // Full immunisation by 1 year: every dose scheduled up to 9 months given, the last one this month
    const childIds = (await Child.find({ ashaId: asha._id }).select('_id').lean()).map((c) => c._id);
    const fic = await Vaccination.aggregate([
      { $match: { childId: { $in: childIds }, ageMonths: { $lte: 9 } } },
      { $group: { _id: '$childId', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }, last: { $max: '$givenDate' } } },
      { $match: { $expr: { $and: [{ $eq: ['$total', '$done'] }, { $gte: ['$last', from] }, { $lt: ['$last', to] }] } } },
      { $lookup: { from: 'children', localField: '_id', foreignField: '_id', as: 'child', pipeline: [{ $project: { name: 1 } }] } },
    ]);
    for (const f of fic) out.push({ activity: ACTIVITIES[0], childId: f._id, beneficiary: f.child[0]?.name, evidence: 'All doses up to 9 months given' });

    const refs = await Referral.find({ ashaId: asha._id, childId: { $ne: null }, status: 'completed', updatedAt: { $gte: from, $lt: to } }).populate('childId', 'name').lean();
    for (const r of refs) out.push({ activity: ACTIVITIES[6], childId: r.childId?._id, beneficiary: r.childId?.name, evidence: r.reason });

    // Drop what is already claimed (anything but rejected)
    const claimed = await IncentiveClaim.find({ ashaId: asha._id, status: { $in: OPEN } }).select('activity childId pregnancyId').lean();
    const key = (c) => `${c.activity}|${c.childId || ''}|${c.pregnancyId || ''}`;
    const taken = new Set(claimed.map(key));
    res.json({ month, suggestions: out.filter((s) => !taken.has(key(s))) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/incentives — ASHA records a claim ({ submit: true } submits it straight away)
const createClaim = async (req, res) => {
  try {
    const asha = await ashaOf(req.user);
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const { activity, month, childId, pregnancyId, beneficiary, amount, notes, submit } = req.body;
    if (!ACTIVITIES.includes(activity)) return res.status(400).json({ message: 'Choose an activity' });
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '') || month > thisMonth()) return res.status(400).json({ message: 'Choose the month the work was done' });
    if (childId && !(mongoose.isValidObjectId(childId) && await Child.exists({ _id: childId, ashaId: asha._id }))) return res.status(403).json({ message: 'Child is not assigned to you' });
    if (pregnancyId && !(mongoose.isValidObjectId(pregnancyId) && await Pregnancy.exists({ _id: pregnancyId, ashaId: asha._id }))) return res.status(403).json({ message: 'Not one of your pregnancy records' });
    if ((childId || pregnancyId) && await IncentiveClaim.exists({ ashaId: asha._id, activity, childId: childId || null, pregnancyId: pregnancyId || null, status: { $in: OPEN } })) {
      return res.status(409).json({ message: 'This activity is already claimed for this beneficiary' });
    }
    const status = submit ? 'submitted' : 'pending';
    const claim = await IncentiveClaim.create({
      ashaId: asha._id, activity, month, childId: childId || undefined, pregnancyId: pregnancyId || undefined,
      beneficiary, amount: amount === '' || amount == null ? undefined : Number(amount), notes, status,
      history: [{ status, note: submit ? 'Submitted' : 'Saved', by: req.user._id }],
    });
    if (submit) await notifyAdmins(`🧾 ${req.user.name} submitted an incentive claim: ${activity}`);
    await createAuditLog({ req, action: 'INCENTIVE_CLAIM_CREATED', entityType: 'IncentiveClaim', entityId: claim._id, details: `${req.user.name} claimed ${activity} (${month})` });
    res.status(201).json(claim);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

async function notifyAdmins(message) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  if (admins.length) await Notification.insertMany(admins.map((u) => ({ userId: u._id, message, type: 'system', link: '/admin/claims' })));
}

// PATCH /api/incentives/:id { action, note }
//   ASHA: submit | delete (pending only)   Admin: approve | reject | paid (approved only)
const updateClaim = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid claim' });
    const claim = await IncentiveClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    const { action } = req.body;
    const note = req.body.note ? String(req.body.note).trim().slice(0, 500) : undefined;
    const asha = await AshaWorker.findById(claim.ashaId).select('userId district block ashaId').lean();
    const role = req.user.role;
    const transitions = {
      asha: { submit: ['pending', 'submitted'], delete: ['pending', null] },
      admin: { approve: ['submitted', 'approved'], reject: ['submitted', 'rejected'], paid: ['approved', 'paid'] },
    }[role] || {};
    // Ownership / scope
    if (role === 'asha' && String(asha?.userId) !== String(req.user._id)) return res.status(404).json({ message: 'Claim not found' });
    const step = transitions[action];
    if (!step) return res.status(400).json({ message: 'Action not allowed' });
    if (claim.status !== step[0]) return res.status(400).json({ message: `Only a ${step[0]} claim can be changed this way` });
    if (action === 'reject' && !note) return res.status(400).json({ message: 'Give a reason for rejecting' });

    if (action === 'delete') {
      await claim.deleteOne();
      return res.json({ deleted: true });
    }
    claim.status = step[1];
    claim.history.push({ status: step[1], note, by: req.user._id });
    await claim.save();
    if (action === 'submit') await notifyAdmins(`🧾 ${req.user.name} submitted an incentive claim: ${claim.activity}`);
    else await Notification.create({ userId: asha.userId, type: 'system', link: '/asha/incentives', message: `🧾 Your claim "${claim.activity}" (${claim.month}) was ${step[1]}${note ? `: ${note}` : ''}` });
    await createAuditLog({ req, action: `INCENTIVE_CLAIM_${step[1].toUpperCase()}`, entityType: 'IncentiveClaim', entityId: claim._id, details: `${req.user.name} marked claim ${step[1]}`, metadata: { note } });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/incentives/activities
const listActivities = (req, res) => res.json(ACTIVITIES);

module.exports = { listClaims, getSuggestions, createClaim, updateClaim, listActivities };
