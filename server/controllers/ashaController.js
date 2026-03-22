const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const { createAuditLog } = require('../utils/auditLogger');

// GET /api/asha/profile — current ASHA's profile
const getProfile = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id }).populate('assignedChildren');
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    res.json(asha);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/asha/visit — log a home visit
const logVisit = async (req, res) => {
  try {
    const { childId, weight, height, vaccineGiven, observations, outcome } = req.body;

    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });

    const child = await Child.findOne({ _id: childId, ashaId: asha._id });
    if (!child) return res.status(403).json({ message: 'Child is not assigned to this ASHA worker' });

    asha.visits.push({ childId, weight, height, vaccineGiven, observations, outcome });
    asha.totalVisits += 1;
    await asha.save();

    await createAuditLog({
      req,
      action: 'ASHA_VISIT_LOGGED',
      entityType: 'AshaVisit',
      entityId: asha.visits[asha.visits.length - 1]._id,
      details: `${req.user.name} logged a visit for child ${childId}`,
      metadata: { childId, vaccineGiven, outcome },
    });

    res.status(201).json({ message: 'Visit logged successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/asha/visits — all visits by this ASHA worker
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

// GET /api/asha/children — children assigned to this ASHA
const getMyChildren = async (req, res) => {
  try {
    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
    const children = await Child.find({ ashaId: asha._id }).populate('parentId', 'name phone');
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/asha/assign — assign a child to an ASHA worker (Admin only)
const assignChild = async (req, res) => {
  try {
    const { childId, ashaWorkerId } = req.body;
    if (!childId || !ashaWorkerId) {
      return res.status(400).json({ message: 'childId and ashaWorkerId are required' });
    }

    const asha = await AshaWorker.findById(ashaWorkerId);
    if (!asha) return res.status(404).json({ message: 'ASHA worker not found' });

    // Remove from previous ASHA if any
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

// POST /api/asha/unassign — remove a child from ASHA (Admin only)
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

// GET /api/asha/workers — all ASHA workers (Admin only)
const listWorkers = async (req, res) => {
  try {
    const workers = await AshaWorker.find()
      .populate('userId', 'name email phone')
      .sort('-totalVisits');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/asha/checkup-queue — ASHA gets their checkup queue
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

// POST /api/asha/checkup-queue — ASHA toggles a child in/out of checkup queue
const toggleCheckupQueue = async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ message: 'childId is required' });

    const asha = await AshaWorker.findOne({ userId: req.user._id });
    if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });

    const idx = asha.checkupQueue.findIndex(id => id.toString() === childId);
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

module.exports = { getProfile, logVisit, getVisits, getMyChildren, listWorkers, assignChild, unassignChild, getCheckupQueue, toggleCheckupQueue };
