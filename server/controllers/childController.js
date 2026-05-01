const Child = require('../models/Child');
const Vaccination = require('../models/Vaccination');
const AshaWorker = require('../models/AshaWorker');
const { createAuditLog } = require('../utils/auditLogger');

// Vaccination schedule — India NIS + IAP 2020-2021 recommendations
const VACCINE_SCHEDULE = [
  // Birth
  { name: 'BCG',                          ageMonths: 0   },
  { name: 'Hepatitis B (Birth Dose)',      ageMonths: 0   },
  { name: 'OPV-0 (Birth Dose)',            ageMonths: 0   },
  // 6 weeks (1.5 months)
  { name: 'OPV-1',                         ageMonths: 1.5 },
  { name: 'IPV-1 (Injectable Polio)',      ageMonths: 1.5 },
  { name: 'DPT-1 + Hepatitis B-1',        ageMonths: 1.5 },
  { name: 'PCV-1 (Pneumococcal)',          ageMonths: 1.5 },
  { name: 'Rotavirus-1',                   ageMonths: 1.5 },
  // 10 weeks (2.5 months)
  { name: 'OPV-2',                         ageMonths: 2.5 },
  { name: 'DPT-2 + Hepatitis B-2',        ageMonths: 2.5 },
  { name: 'PCV-2 (Pneumococcal)',          ageMonths: 2.5 },
  { name: 'Rotavirus-2',                   ageMonths: 2.5 },
  // 14 weeks (3.5 months)
  { name: 'OPV-3',                         ageMonths: 3.5 },
  { name: 'IPV-2 (Injectable Polio)',      ageMonths: 3.5 },
  { name: 'DPT-3 + Hepatitis B-3',        ageMonths: 3.5 },
  { name: 'PCV-3 (Pneumococcal)',          ageMonths: 3.5 },
  { name: 'Rotavirus-3',                   ageMonths: 3.5 },
  // 6 months
  { name: 'Influenza (Annual, 1st dose)',  ageMonths: 6   },
  // 9 months
  { name: 'Measles-Rubella (MR-1)',        ageMonths: 9   },
  { name: 'JE-1 (Japanese Encephalitis)', ageMonths: 9   },
  { name: 'Vitamin A (1st dose)',          ageMonths: 9   },
  // 12 months
  { name: 'Hepatitis A (1st dose)',        ageMonths: 12  },
  // 15 months
  { name: 'MMR (Measles-Mumps-Rubella)',  ageMonths: 15  },
  { name: 'Varicella (Chickenpox)-1',      ageMonths: 15  },
  { name: 'PCV Booster',                   ageMonths: 15  },
  // 16-18 months
  { name: 'DPT Booster-1',                ageMonths: 16  },
  { name: 'OPV Booster',                  ageMonths: 16  },
  { name: 'Measles-Rubella (MR-2)',        ageMonths: 16  },
  { name: 'JE-2 (Japanese Encephalitis)', ageMonths: 16  },
  { name: 'Vitamin A (2nd dose)',          ageMonths: 16  },
  // 18 months
  { name: 'Hepatitis A (2nd dose)',        ageMonths: 18  },
  { name: 'Varicella (Chickenpox)-2',      ageMonths: 18  },
  // 24 months
  { name: 'Vitamin A (3rd dose)',          ageMonths: 24  },
  { name: 'Typhoid Conjugate Vaccine',     ageMonths: 24  },
  // 5 years
  { name: 'DPT Booster-2',                ageMonths: 60  },
  { name: 'OPV Booster-2',                ageMonths: 60  },
];

const addMonthsToDate = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Math.floor(months));
  d.setDate(d.getDate() + Math.round((months % 1) * 30));
  return d;
};

// POST /api/child/add
const addChild = async (req, res) => {
  try {
    let payload = { ...req.body };
    let ashaProfile = null;

    if (req.user.role === 'parent') {
      payload.parentId = req.user._id;
    }

    if (req.user.role === 'asha') {
      ashaProfile = await AshaWorker.findOne({ userId: req.user._id });
      if (!ashaProfile) return res.status(404).json({ message: 'ASHA profile not found' });
      payload.ashaId = ashaProfile._id;
      payload.district = payload.district || ashaProfile.district;
      payload.block = payload.block || ashaProfile.block;
    }

    const child = await Child.create(payload);

    // Auto-generate vaccination schedule
    const vaccines = VACCINE_SCHEDULE.map((v) => ({
      childId: child._id,
      vaccineName: v.name,
      ageMonths: v.ageMonths,
      dueDate: addMonthsToDate(child.dob, v.ageMonths),
      status: 'upcoming',
    }));
    await Vaccination.insertMany(vaccines);

    if (ashaProfile) {
      await AshaWorker.findByIdAndUpdate(ashaProfile._id, {
        $addToSet: { assignedChildren: child._id },
      });
    }

    await createAuditLog({
      req,
      action: 'CHILD_CREATED',
      entityType: 'Child',
      entityId: child._id,
      details: `${req.user.name} registered child ${child.name}`,
      metadata: { district: child.district, block: child.block },
    });

    const populatedChild = await Child.findById(child._id)
      .populate('parentId', 'name phone email')
      .populate({ path: 'ashaId', select: 'ashaId district block village', populate: { path: 'userId', select: 'name phone' } });

    res.status(201).json({ message: 'Child registered successfully', child: populatedChild });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/child/:id
const getChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('parentId', 'name phone email')
      .populate({ path: 'ashaId', select: 'ashaId district block village', populate: { path: 'userId', select: 'name phone' } });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    if (req.user.role === 'parent' && String(child.parentId?._id || child.parentId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this child' });
    }

    if (req.user.role === 'asha') {
      const asha = await AshaWorker.findOne({ userId: req.user._id });
      if (!asha || String(child.ashaId?._id || child.ashaId) !== String(asha._id)) {
        return res.status(403).json({ message: 'Not authorized to access this child' });
      }
    }

    res.json(child);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/child/  — list children (parent sees own, asha sees assigned, admin sees all)
const listChildren = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'parent') filter.parentId = req.user._id;
    if (req.user.role === 'asha') {
      const asha = await AshaWorker.findOne({ userId: req.user._id });
      if (!asha) return res.status(404).json({ message: 'ASHA profile not found' });
      filter.ashaId = asha._id;
    }
    // ASHA and admin: optional district/block filter from query
    if (req.query.district) filter.district = req.query.district;
    if (req.query.block) filter.block = req.query.block;

    const children = await Child.find(filter)
      .populate('parentId', 'name phone')
      .populate({ path: 'ashaId', select: 'ashaId district block village', populate: { path: 'userId', select: 'name phone' } })
      .sort('-createdAt');
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/child/update/:id
const updateChild = async (req, res) => {
  try {
    const existing = await Child.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Child not found' });

    if (req.user.role === 'asha') {
      const asha = await AshaWorker.findOne({ userId: req.user._id });
      if (!asha || String(existing.ashaId) !== String(asha._id)) {
        return res.status(403).json({ message: 'Not authorized to update this child' });
      }
    }
    if (req.user.role === 'parent') {
      if (String(existing.parentId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this child' });
      }
    }

    const child = await Child.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('parentId', 'name phone email')
      .populate({ path: 'ashaId', select: 'ashaId district block village', populate: { path: 'userId', select: 'name phone' } });
    await createAuditLog({
      req,
      action: 'CHILD_UPDATED',
      entityType: 'Child',
      entityId: child._id,
      details: `${req.user.name} updated child ${child.name}`,
      metadata: { fields: Object.keys(req.body || {}) },
    });
    res.json(child);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/child/search/parent — parent searches own children
const searchChildren = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ results: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const filter = { parentId: req.user._id };

    const results = await Child.find({
      ...filter,
      $or: [
        { name: searchRegex },
        { childId: searchRegex },
      ],
    })
      .select('_id childId name dob nutritionStatus createdAt')
      .limit(10);

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/child/search/asha — asha searches child by childId
const searchByChildId = async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId || childId.trim().length === 0) {
      return res.json({ result: null });
    }

    const child = await Child.findOne({ childId: childId.toUpperCase() })
      .populate('parentId', 'name phone email')
      .populate({ path: 'ashaId', select: 'ashaId district block village', populate: { path: 'userId', select: 'name phone' } });

    if (!child) {
      return res.status(404).json({ message: 'Invalid Child ID. Please check and try again.' });
    }

    res.json({ result: child });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addChild, getChild, listChildren, updateChild, searchChildren, searchByChildId };
