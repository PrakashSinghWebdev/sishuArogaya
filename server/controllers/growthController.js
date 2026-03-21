const GrowthRecord = require('../models/GrowthRecord');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const { predictMalnutrition } = require('../utils/zScore');
const { createAuditLog } = require('../utils/auditLogger');

const assertChildAccess = async (childId, user) => {
  const child = await Child.findById(childId);
  if (!child) return { error: { status: 404, message: 'Child not found' } };

  if (user.role === 'parent' && String(child.parentId) !== String(user._id)) {
    return { error: { status: 403, message: 'Not authorized to access this child' } };
  }

  if (user.role === 'asha') {
    const asha = await AshaWorker.findOne({ userId: user._id });
    if (!asha || String(child.ashaId) !== String(asha._id)) {
      return { error: { status: 403, message: 'Not authorized to access this child' } };
    }
  }

  return { child };
};

// POST /api/growth/add
const addGrowthRecord = async (req, res) => {
  try {
    const { childId, weight, height, ageMonths, notes } = req.body;

    const access = await assertChildAccess(childId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const child = access.child;

    const gender = child.gender;
    const result = predictMalnutrition(weight, height, ageMonths, gender);

    const record = await GrowthRecord.create({
      childId,
      recordedBy: req.user._id,
      ageMonths,
      weight,
      height,
      wazScore: result.waz,
      hazScore: result.haz,
      whzScore: result.whz,
      prediction: result.prediction,
      notes,
    });

    // Update child's current weight, height, and nutrition status
    await Child.findByIdAndUpdate(childId, {
      currentWeight: weight,
      currentHeight: height,
      nutritionStatus: result.prediction,
    });

    await createAuditLog({
      req,
      action: 'GROWTH_RECORDED',
      entityType: 'GrowthRecord',
      entityId: record._id,
      details: `${req.user.name} recorded growth for ${child.name}`,
      metadata: { childId, weight, height, ageMonths, prediction: result.prediction },
    });

    res.status(201).json({ record, prediction: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/growth/:childId
const getGrowthHistory = async (req, res) => {
  try {
    const access = await assertChildAccess(req.params.childId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });

    const records = await GrowthRecord.find({ childId: req.params.childId })
      .sort('recordedDate')
      .populate('recordedBy', 'name role');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/growth/:childId/predict  — latest prediction
const getPrediction = async (req, res) => {
  try {
    const access = await assertChildAccess(req.params.childId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });

    const latest = await GrowthRecord.findOne({ childId: req.params.childId }).sort('-recordedDate');
    if (!latest) return res.status(404).json({ message: 'No growth records found' });

    const child = access.child;
    const result = predictMalnutrition(latest.weight, latest.height, latest.ageMonths, child.gender);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addGrowthRecord, getGrowthHistory, getPrediction };
