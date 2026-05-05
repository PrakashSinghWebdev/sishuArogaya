const GrowthRecord = require('../models/GrowthRecord');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const { predictMalnutrition } = require('../utils/zScore');
const { createAuditLog } = require('../utils/auditLogger');

const getAgeMonthsFromDates = (dob, recordedDate = new Date()) => {
  const start = new Date(dob);
  const end = new Date(recordedDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
};

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

const addGrowthRecord = async (req, res) => {
  try {
    const {
      childId,
      weight,
      height,
      headCircumference,
      hc,
      ageMonths,
      notes,
      date,
      recordedDate,
    } = req.body;

    const access = await assertChildAccess(childId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });
    const child = access.child;

    if (weight == null || height == null) {
      return res.status(400).json({ message: 'Weight and height are required to save a growth record' });
    }

    // Weight limit validation based on child gender (0-24 month range)
    const MAX_WEIGHT = { male: 14, female: 13 };
    const maxAllowed = MAX_WEIGHT[child.gender] || 14;
    if (Number(weight) > maxAllowed) {
      return res.status(400).json({
        message: `Invalid weight: ${weight} kg exceeds the maximum allowed weight of ${maxAllowed} kg for ${child.gender === 'female' ? 'girls' : 'boys'} (0-24 months).`,
      });
    }

    const normalizedRecordedDate = recordedDate || date || new Date();
    const normalizedAgeMonths =
      ageMonths != null && ageMonths !== ''
        ? Number(ageMonths)
        : getAgeMonthsFromDates(child.dob, normalizedRecordedDate);

    if (normalizedAgeMonths == null || Number.isNaN(normalizedAgeMonths)) {
      return res.status(400).json({ message: 'A valid age in months or recorded date is required' });
    }

    const numericWeight = Number(weight);
    const numericHeight = Number(height);
    const result = predictMalnutrition(numericWeight, numericHeight, normalizedAgeMonths, child.gender);

    const record = await GrowthRecord.create({
      childId,
      recordedBy: req.user._id,
      recordedDate: normalizedRecordedDate,
      ageMonths: normalizedAgeMonths,
      weight: numericWeight,
      height: numericHeight,
      ...(headCircumference || hc ? { headCircumference: Number(headCircumference || hc) } : {}),
      wazScore: result.waz,
      hazScore: result.haz,
      whzScore: result.whz,
      prediction: result.prediction,
      notes,
    });

    await Child.findByIdAndUpdate(childId, {
      currentWeight: numericWeight,
      currentHeight: numericHeight,
      nutritionStatus: result.prediction,
    });

    await createAuditLog({
      req,
      action: 'GROWTH_RECORDED',
      entityType: 'GrowthRecord',
      entityId: record._id,
      details: `${req.user.name} recorded growth for ${child.name}`,
      metadata: { childId, weight: numericWeight, height: numericHeight, ageMonths: normalizedAgeMonths, prediction: result.prediction },
    });

    res.status(201).json({ record, prediction: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const getPrediction = async (req, res) => {
  try {
    const access = await assertChildAccess(req.params.childId, req.user);
    if (access.error) return res.status(access.error.status).json({ message: access.error.message });

    // Import GNN prediction module
    const { predictGrowthWithGNN } = require('../utils/gnnPrediction');

    // Use GNN + Gemini for prediction
    const result = await predictGrowthWithGNN(req.params.childId);

    if (result.error) {
      return res.status(result.status || 500).json({ message: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addGrowthRecord, getGrowthHistory, getPrediction };
