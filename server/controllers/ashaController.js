const escapeRegex = require('../utils/escapeRegex');
const Pregnancy = require('../models/Pregnancy');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const { createAuditLog } = require('../utils/auditLogger');
const { completedMonths, validateMeasurements } = require('../utils/zScore');
const { claimUnassignedInArea } = require('../utils/ashaAssignment');
const Vaccination = require('../models/Vaccination');
const Referral = require('../models/Referral');
const { createReferral } = require('./referralController');
const { planVisits } = require('../utils/visitPlan');

const normalizeVisitOutcome = (value) => {
  switch (String(value || '').toLowerCase()) {
    case 'normal':
      return 'healthy';
    case 'monitor':
      return 'moderate';
    case 'healthy':
    case 'moderate':
    case 'severe':
    case 'referred':
    case 'follow-up':
      return String(value).toLowerCase();
    default:
      return 'healthy';
  }
};

const getProfile = async (req, res) => {
  try {
    const found = await AshaWorker.findOne({ userId: req.user._id });
    if (!found) return res.status(404).json({ message: 'ASHA profile not found' });
    await claimUnassignedInArea(found);
    const asha = await AshaWorker.findById(found._id).populate('assignedChildren');
    res.json(asha);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logVisit = async (req, res) => {
  try {
    const {
      childId,
      visitType,
      weight,
      height,
      headCircumference,
      temperature,
      muac,
      vaccineGiven,
      vaccinesGiven,
      observations,
      notes,
      outcome,
      status,
      followUpDate,
      referralRequired,
      referralReason,
      referralUrgency,
      facility,
    } = req.body;
    const missed = status === 'missed';

    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });

    const child = await Child.findOne({ _id: childId, ashaId: asha._id });
    if (!child) return res.status(403).json({ message: 'Child is not assigned to this ASHA worker' });

    const normalizedOutcome = normalizeVisitOutcome(outcome);
    const normalizedVaccines = Array.isArray(vaccinesGiven) ? vaccinesGiven.filter(Boolean) : [];

    if (followUpDate && Number.isNaN(new Date(followUpDate).getTime())) return res.status(400).json({ message: 'Invalid follow-up date' });

    // Weight/height are optional on a visit; validate only when both were measured
    if (!missed && weight != null && weight !== '' && height != null && height !== '') {
      const measurementError = validateMeasurements(weight, height, completedMonths(child.dob), child.gender);
      if (measurementError) return res.status(400).json({ message: measurementError });
    }

    // "Referral required" on the visit opens a tracked referral (it used to be dropped)
    const referral = !missed && referralRequired
      ? await createReferral({ req, asha, child, reason: String(referralReason || observations || notes || visitType || 'Referred during home visit').trim(), urgency: referralUrgency, facility, followUpDate })
      : null;

    asha.visits.push({
      childId,
      status: missed ? 'missed' : 'completed',
      followUpDate: followUpDate || undefined,
      referralId: referral?._id,
      visitType,
      weight,
      height,
      headCircumference,
      temperature,
      muac,
      vaccineGiven: vaccineGiven || normalizedVaccines.join(', '),
      vaccinesGiven: normalizedVaccines,
      observations: observations || notes,
      outcome: normalizedOutcome,
    });
    if (!missed) asha.totalVisits += 1;
    await asha.save();

    await createAuditLog({
      req,
      action: 'ASHA_VISIT_LOGGED',
      entityType: 'AshaVisit',
      entityId: asha.visits[asha.visits.length - 1]._id,
      details: `${req.user.name} logged a visit for child ${childId}`,
      metadata: { childId, visitType, vaccinesGiven: normalizedVaccines, outcome: normalizedOutcome },
    });

    res.status(201).json({ message: missed ? 'Missed visit recorded' : 'Visit logged successfully', referralId: referral?._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVisits = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id })
      .populate('visits.childId', 'name dob gender');
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    res.json(asha.visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Today's work list for one ASHA (see utils/visitPlan.js); shared by My Visits and the dashboard
async function buildVisitPlan(ashaId) {
  const asha = await AshaWorker.findById(ashaId).select('visits.childId visits.visitDate visits.status visits.followUpDate').lean();
  const children = await Child.find({ ashaId, isActive: { $ne: false } })
    .select('name dob gender village motherName contactPhone nutritionStatus childId parentId')
    .populate('parentId', 'name phone')
    .lean();
  const ids = children.map((c) => c._id);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const [vaccineCounts, referrals] = await Promise.all([
    Vaccination.aggregate([
      { $match: { childId: { $in: ids }, $or: [{ status: { $in: ['due', 'missed'] } }, { status: 'upcoming', dueDate: { $lte: endOfToday } }] } },
      { $group: { _id: '$childId', n: { $sum: 1 } } },
    ]),
    Referral.find({ ashaId, status: { $in: ['pending', 'reached'] } }).select('childId urgency followUpDate').lean(),
  ]);
  const dueVaccines = Object.fromEntries(vaccineCounts.map((v) => [String(v._id), v.n]));
  const items = planVisits({ children, visits: asha?.visits || [], dueVaccines, referrals });
  const counts = items.reduce((acc, i) => ({ ...acc, [i.bucket]: (acc[i.bucket] || 0) + 1 }), { overdue: 0, today: 0, week: 0, later: 0 });
  return { counts, items, visits: asha?.visits || [] };
}

// GET /api/asha/search?q= — navbar search over the ASHA's own records: children (name / Child ID / parent
// name or phone), mothers in her pregnancy register, and families (by parent or mother name / phone)
const search = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 50);
    if (q.length < 2) return res.json({ children: [], mothers: [] });
    const asha = await AshaWorker.findOne({ userId: req.user._id }).select('_id').lean();
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const rx = new RegExp(escapeRegex(q), 'i');
    const parentIds = await User.find({ role: 'parent', $or: [{ name: rx }, { phone: rx }] }).distinct('_id');
    const [children, mothers] = await Promise.all([
      Child.find({ ashaId: asha._id, $or: [{ name: rx }, { childId: rx }, { motherName: rx }, { fatherName: rx }, { contactPhone: rx }, { parentId: { $in: parentIds } }] })
        .select('name childId dob gender village motherName nutritionStatus').limit(8).lean(),
      Pregnancy.find({ ashaId: asha._id, $or: [{ womanName: rx }, { husbandName: rx }, { phone: rx }, { rchId: rx }] })
        .select('womanName village status lmp').limit(5).lean(),
    ]);
    res.json({ children, mothers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/asha/visit-plan — today's work list: who to visit, by when, and why
const getVisitPlan = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id }).select('_id').lean();
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const { counts, items } = await buildVisitPlan(asha._id);
    res.json({ counts, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/asha/families — assigned children grouped into households, with possible duplicate registrations
const getFamilies = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id }).select('visits.childId visits.visitDate visits.status').lean();
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const children = await Child.find({ ashaId: asha._id })
      .select('name dob gender village motherName fatherName contactPhone nutritionStatus childId parentId')
      .populate('parentId', 'name phone')
      .lean();
    const openReferrals = new Set((await Referral.find({ ashaId: asha._id, status: { $in: ['pending', 'reached'] } }).select('childId').lean()).map((r) => String(r.childId)));
    const lastVisit = {};
    for (const v of asha.visits || []) {
      if (v.status === 'missed') continue;
      const id = String(v.childId);
      if (!lastVisit[id] || v.visitDate > lastVisit[id]) lastVisit[id] = v.visitDate;
    }

    // Household = the registering parent's account; children added without one fall back to phone + mother + village
    const norm = (s) => String(s || '').trim().toLowerCase();
    const families = new Map();
    for (const c of children) {
      const key = c.parentId?._id ? String(c.parentId._id) : `${norm(c.contactPhone)}|${norm(c.motherName)}|${norm(c.village)}`;
      if (!families.has(key)) {
        families.set(key, {
          familyId: `FAM-${(c.parentId?._id ? String(c.parentId._id).slice(-6) : Buffer.from(key).toString('hex').slice(-6)).toUpperCase()}`,
          headName: c.parentId?.name || c.motherName || c.fatherName || 'Unknown',
          phone: c.parentId?.phone || c.contactPhone || '',
          motherName: c.motherName || '',
          fatherName: c.fatherName || '',
          village: c.village || '',
          children: [],
          lastVisit: null,
          needsFollowUp: false,
        });
      }
      const fam = families.get(key);
      const lv = lastVisit[String(c._id)] || null;
      fam.children.push({ _id: c._id, childId: c.childId, name: c.name, dob: c.dob, gender: c.gender, nutritionStatus: c.nutritionStatus, lastVisit: lv, openReferral: openReferrals.has(String(c._id)) });
      if (lv && (!fam.lastVisit || lv > fam.lastVisit)) fam.lastVisit = lv;
      if (c.nutritionStatus !== 'healthy' || openReferrals.has(String(c._id))) fam.needsFollowUp = true;
      fam.motherName ||= c.motherName || '';
      fam.village ||= c.village || '';
    }

    // Possible duplicate registration: same name and a birth date within 3 days, anywhere in the caseload
    const duplicates = [];
    const sorted = [...children].sort((a, b) => norm(a.name).localeCompare(norm(b.name)) || new Date(a.dob) - new Date(b.dob));
    for (let i = 1; i < sorted.length; i += 1) {
      const a = sorted[i - 1]; const b = sorted[i];
      if (norm(a.name) === norm(b.name) && Math.abs(new Date(a.dob) - new Date(b.dob)) <= 3 * 864e5) {
        duplicates.push([{ _id: a._id, name: a.name, childId: a.childId }, { _id: b._id, name: b.name, childId: b.childId }]);
      }
    }

    const list = [...families.values()].sort((a, b) => Number(b.needsFollowUp) - Number(a.needsFollowUp) || a.headName.localeCompare(b.headName));
    res.json({ families: list, duplicates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyChildren = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    await claimUnassignedInArea(asha);
    const children = await Child.find({ ashaId: asha._id }).populate('parentId', 'name phone');
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignChild = async (req, res) => {
  try {
    const { childId, ashaWorkerId } = req.body;
    if (!childId || !ashaWorkerId) {
      return res.status(400).json({ message: 'childId and ashaWorkerId are required' });
    }

    const asha = await AshaWorker.findById(ashaWorkerId);
    if (!asha) return res.status(404).json({ message: 'ASHA worker not found' });

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: 'Child not found' });

    if (child.ashaId && String(child.ashaId) !== String(asha._id)) {
      await AshaWorker.findByIdAndUpdate(child.ashaId, { $pull: { assignedChildren: child._id, checkupQueue: child._id } });
    }

    child.ashaId = asha._id;
    await child.save();

    if (!asha.assignedChildren.includes(childId)) {
      asha.assignedChildren.push(childId);
      await asha.save();
    }

    await createAuditLog({
      req,
      action: 'CHILD_ASSIGNED',
      entityType: 'Child',
      entityId: child._id,
      details: `Admin assigned child ${child.name} to ASHA ${asha.ashaId}`,
      metadata: { ashaWorkerId },
    });

    res.json({ message: 'Child assigned successfully', child });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unassignChild = async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ message: 'childId is required' });

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: 'Child not found' });

    if (child.ashaId) {
      await AshaWorker.findByIdAndUpdate(child.ashaId, { $pull: { assignedChildren: child._id, checkupQueue: child._id } });
    }
    child.ashaId = undefined;
    await child.save();

    res.json({ message: 'Child unassigned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listWorkers = async (req, res) => {
  try {
    // Visits and child-id arrays made this 1.7 MB for 1,000 workers; the list only needs counts
    const workers = await AshaWorker.aggregate([
      { $sort: { totalVisits: -1 } },
      { $addFields: { assignedCount: { $size: { $ifNull: ['$assignedChildren', []] } } } },
      { $project: { visits: 0, checkupQueue: 0, assignedChildren: 0 } },
    ]);
    res.json(await AshaWorker.populate(workers, { path: 'userId', select: 'name email phone username' }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCheckupQueue = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id })
      .populate({ path: 'checkupQueue', populate: { path: 'parentId', select: 'name phone' } });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    res.json(asha.checkupQueue || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleCheckupQueue = async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ message: 'childId is required' });

    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    if (!(await Child.exists({ _id: childId, ashaId: asha._id }))) {
      return res.status(403).json({ message: 'Child is not assigned to this ASHA worker' });
    }

    const idx = asha.checkupQueue.findIndex((id) => id.toString() === childId);
    let action;
    if (idx === -1) {
      asha.checkupQueue.push(childId);
      action = 'added';
    } else {
      asha.checkupQueue.splice(idx, 1);
      action = 'removed';
    }
    await asha.save();
    res.json({ message: `Child ${action} from checkup queue`, action });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { search, buildVisitPlan, getProfile, logVisit, getVisits, getVisitPlan, getFamilies, getMyChildren, listWorkers, assignChild, unassignChild, getCheckupQueue, toggleCheckupQueue };
