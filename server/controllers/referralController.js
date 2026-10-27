const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const Child = require('../models/Child');
const Pregnancy = require('../models/Pregnancy');
const AshaWorker = require('../models/AshaWorker');
const { alertOversight } = require('../utils/supervision');
const { createAuditLog } = require('../utils/auditLogger');
const { pageParams } = require('../utils/paginate');

const URGENCIES = ['routine', 'urgent', 'emergency'];
const ashaOf = (user) => AshaWorker.findOne({ userId: user._id }).select('_id ashaId district block');

// Shared by the referral form, the "referral required" box on a home visit, and danger signs
// recorded at an ANC / postnatal visit. Pass `child` or `pregnancy` (the mother).
async function createReferral({ req, asha, child, pregnancy, reason, urgency, facility, followUpDate }) {
  const who = child ? child.name : `${pregnancy.womanName} (mother)`;
  const referral = await Referral.create({
    childId: child?._id,
    pregnancyId: pregnancy?._id,
    ashaId: asha._id,
    createdBy: req.user._id,
    reason,
    urgency: URGENCIES.includes(urgency) ? urgency : 'urgent',
    facility,
    followUpDate: followUpDate || undefined,
    history: [{ status: 'pending', note: 'Referral created', by: req.user._id }],
  });
  if (referral.urgency === 'emergency') {
    await alertOversight(asha, `🚨 Emergency referral by ASHA ${asha.ashaId}: ${who} — ${reason}`);
  }
  await createAuditLog({ req, action: 'REFERRAL_CREATED', entityType: 'Referral', entityId: referral._id, details: `${req.user.name} referred ${who} (${referral.urgency})`, metadata: { childId: child?._id, pregnancyId: pregnancy?._id, facility } });
  return referral;
}

// GET /api/referrals — an ASHA sees her own; an admin all (paged), ?status=&escalated=true
const listReferrals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = { $in: String(req.query.status).split(',') }; // e.g. pending,reached
    if (req.user.role === 'asha') {
      const asha = await ashaOf(req.user);
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      filter.ashaId = asha._id;
      const referrals = await Referral.find(filter).sort({ createdAt: -1 }).limit(500)
        .populate('childId', 'name dob gender village motherName contactPhone nutritionStatus')
        .populate('pregnancyId', 'womanName village phone status').lean();
      return res.json(referrals);
    }
    if (req.query.escalated === 'true') filter.escalatedAt = { $ne: null };
    const { limit, skip } = pageParams(req.query);
    const [referrals, total] = await Promise.all([
      Referral.find(filter).sort({ escalatedAt: -1, createdAt: -1 }).skip(skip).limit(limit)
        .populate('childId', 'name dob village district block').populate('pregnancyId', 'womanName village')
        .populate({ path: 'ashaId', select: 'ashaId district block userId', populate: { path: 'userId', select: 'name phone' } }).lean(),
      Referral.countDocuments(filter),
    ]);
    res.set('X-Total-Count', total).json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/referrals — ASHA refers one of her assigned children ({ childId }) or mothers ({ pregnancyId })
const addReferral = async (req, res) => {
  try {
    const { childId, pregnancyId, reason, urgency, facility, followUpDate } = req.body;
    const id = pregnancyId || childId;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Choose who is being referred' });
    if (!reason || !String(reason).trim()) return res.status(400).json({ message: 'Reason for referral is required' });
    const asha = await ashaOf(req.user);
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const [child, pregnancy] = pregnancyId
      ? [null, await Pregnancy.findOne({ _id: id, ashaId: asha._id }).select('womanName')]
      : [await Child.findOne({ _id: id, ashaId: asha._id }).select('name'), null];
    if (!child && !pregnancy) return res.status(403).json({ message: 'Not one of your assigned beneficiaries' });
    const referral = await createReferral({ req, asha, child, pregnancy, reason: String(reason).trim(), urgency, facility, followUpDate });
    res.status(201).json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/referrals/:id — update status / follow-up / note, or { escalate: true }
const updateReferral = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid referral' });
    const filter = { _id: req.params.id };
    let asha = null;
    if (req.user.role === 'asha') {
      asha = await ashaOf(req.user);
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      filter.ashaId = asha._id;
    }
    const referral = await Referral.findOne(filter).populate('childId', 'name').populate('pregnancyId', 'womanName');
    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    const { status, note, followUpDate, facility, escalate } = req.body;
    if (status && !Referral.STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (status && status !== referral.status) {
      referral.status = status;
      referral.history.push({ status, note: note ? String(note) : undefined, by: req.user._id });
    } else if (note) {
      referral.history.push({ status: referral.status, note: String(note), by: req.user._id });
    }
    if (followUpDate !== undefined) referral.followUpDate = followUpDate || undefined;
    if (facility !== undefined) referral.facility = facility;
    if (escalate && !referral.escalatedAt) {
      referral.escalatedAt = new Date();
      const who = referral.childId?.name || `${referral.pregnancyId?.womanName} (mother)`;
      await alertOversight(await AshaWorker.findById(referral.ashaId).select('district block').lean(), `⚠️ Referral escalated by ${req.user.name}: ${who} — ${referral.reason}${note ? ` (${note})` : ''}`);
    }
    await referral.save();
    await createAuditLog({ req, action: escalate ? 'REFERRAL_ESCALATED' : 'REFERRAL_UPDATED', entityType: 'Referral', entityId: referral._id, details: `${req.user.name} updated referral for ${referral.childId?.name || referral.pregnancyId?.womanName}`, metadata: { status, followUpDate, escalate: Boolean(escalate) } });
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { listReferrals, addReferral, updateReferral, createReferral };
