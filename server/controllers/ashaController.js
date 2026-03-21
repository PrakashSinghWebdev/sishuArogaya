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

module.exports = { getProfile, logVisit, getVisits, getMyChildren, listWorkers };
