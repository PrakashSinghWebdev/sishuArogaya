const Vaccination = require('../models/Vaccination');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLogger');

const getAccessibleChildIds = async (user, query = {}) => {
  if (user.role === 'admin') {
    const filter = {};
    if (query.district) filter.district = query.district;
    if (query.block) filter.block = query.block;
    const children = await Child.find(filter).select('_id');
    return children.map((child) => child._id);
  }

  if (user.role === 'asha') {
    const asha = await AshaWorker.findOne({ userId: user._id });
    if (!asha) return null;

    const filter = { ashaId: asha._id };
    if (query.district) filter.district = query.district;
    if (query.block) filter.block = query.block;
    const children = await Child.find(filter).select('_id');
    return children.map((child) => child._id);
  }

  const children = await Child.find({ parentId: user._id }).select('_id');
  return children.map((child) => child._id);
};

// GET /api/vaccination/:childId
const getSchedule = async (req, res) => {
  try {
    const childIds = await getAccessibleChildIds(req.user);
    if (req.user.role === 'asha' && childIds === null) {
      return res.status(404).json({ message: 'ASHA profile not found' });
    }
    if (!childIds.some((id) => String(id) === String(req.params.childId))) {
      return res.status(403).json({ message: 'Not authorized to access this vaccination schedule' });
    }

    const vaccines = await Vaccination.find({ childId: req.params.childId })
      .sort('dueDate')
      .populate('givenBy', 'name');

    const now = new Date();
    for (const vaccine of vaccines) {
      if (vaccine.status === 'upcoming' && vaccine.dueDate < now) {
        vaccine.status = 'due';
        await vaccine.save();
      }
    }

    res.json(vaccines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vaccination/update
const updateVaccination = async (req, res) => {
  try {
    const { vaccineId, givenDate, notes } = req.body;
    const vaccine = await Vaccination.findByIdAndUpdate(
      vaccineId,
      { status: 'done', givenDate: givenDate || new Date(), givenBy: req.user._id, notes },
      { new: true }
    );
    if (!vaccine) return res.status(404).json({ message: 'Vaccination record not found' });

    const child = await Child.findById(vaccine.childId).populate('parentId', '_id name');
    if (child?.parentId?._id) {
      await Notification.create({
        userId: child.parentId._id,
        message: `${vaccine.vaccineName} was marked as completed for ${child.name}.`,
        type: 'vaccine_reminder',
        link: '/parent/vaccination',
      });
    }

    await createAuditLog({
      req,
      action: 'VACCINATION_COMPLETED',
      entityType: 'Vaccination',
      entityId: vaccine._id,
      details: `${req.user.name} marked ${vaccine.vaccineName} as completed`,
      metadata: { childId: vaccine.childId, givenDate: vaccine.givenDate },
    });

    res.json(vaccine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/vaccination/overdue
const getOverdue = async (req, res) => {
  try {
    const childIds = await getAccessibleChildIds(req.user, req.query);
    if (req.user.role === 'asha' && childIds === null) {
      return res.status(404).json({ message: 'ASHA profile not found' });
    }
    if (childIds && childIds.length === 0) return res.json([]);

    const filter = { status: { $in: ['due', 'missed'] } };
    if (childIds?.length) filter.childId = { $in: childIds };

    const overdue = await Vaccination.find(filter)
      .populate('childId', 'name dob district block')
      .sort('dueDate');

    res.json(overdue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSchedule, updateVaccination, getOverdue };
