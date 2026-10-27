const mongoose = require('mongoose');
const Vaccination = require('../models/Vaccination');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLogger');
const { pageParams, countCached, countKey } = require('../utils/paginate');

// Child ids the user may see; undefined = no restriction (admin without an area filter)
const getAccessibleChildIds = async (user, query = {}) => {
  if (user.role === 'admin') {
    const filter = {};
    if (query.district) filter.district = query.district;
    if (query.block) filter.block = query.block;
    if (!filter.district && !filter.block) return undefined;
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

// One indexed lookup instead of loading every accessible child id (an admin would load 50k+ per request)
const canAccessChild = async (user, childId) => {
  if (!mongoose.isValidObjectId(childId)) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'asha') {
    const asha = await AshaWorker.findOne({ userId: user._id }).select('_id');
    return Boolean(asha && (await Child.exists({ _id: childId, ashaId: asha._id })));
  }
  return Boolean(await Child.exists({ _id: childId, parentId: user._id }));
};

// GET /api/vaccination/:childId
const getSchedule = async (req, res) => {
  try {
    if (!(await canAccessChild(req.user, req.params.childId))) {
      return res.status(403).json({ message: 'Not authorized to access this vaccination schedule' });
    }

    const vaccines = await Vaccination.find({ childId: req.params.childId })
      .sort('dueDate')
      .populate('givenBy', 'name');

    // Flip past-due 'upcoming' doses to 'due' in one write
    const now = new Date();
    await Vaccination.updateMany({ childId: req.params.childId, status: 'upcoming', dueDate: { $lt: now } }, { status: 'due' });
    vaccines.forEach((v) => { if (v.status === 'upcoming' && v.dueDate < now) v.status = 'due'; });

    res.json(vaccines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vaccination/update
const updateVaccination = async (req, res) => {
  try {
    const { vaccineId, givenDate, notes } = req.body;
    if (!mongoose.isValidObjectId(vaccineId)) return res.status(400).json({ message: 'Invalid vaccination record' });
    if (givenDate && (Number.isNaN(new Date(givenDate).getTime()) || new Date(givenDate) > new Date())) {
      return res.status(400).json({ message: 'Date given cannot be in the future' });
    }
    const existing = await Vaccination.findById(vaccineId).select('childId');
    if (!existing) return res.status(404).json({ message: 'Vaccination record not found' });

    // ASHA workers may only update vaccines of children assigned to them
    if (!(await canAccessChild(req.user, existing.childId))) {
      return res.status(403).json({ message: 'Not authorized to update this vaccination' });
    }

    const vaccine = await Vaccination.findByIdAndUpdate(
      vaccineId,
      { status: 'done', givenDate: givenDate || new Date(), givenBy: req.user._id, notes },
      { new: true }
    );

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

    const query = Vaccination.find(filter).populate('childId', 'name dob district block').sort('dueDate');
    // Admins see every district: page it and send the counts separately (an ASHA's list is small)
    if (req.user.role === 'admin') {
      const { limit, skip } = pageParams(req.query);
      const [rows, total, due] = await Promise.all([
        query.skip(skip).limit(limit).lean(), // the admin table only shows plain fields
        countCached(Vaccination, filter, `overdue:${countKey(req.query)}`),
        countCached(Vaccination, { ...filter, status: 'due' }, `overdue-due:${countKey(req.query)}`),
      ]);
      res.set({ 'X-Total-Count': total, 'X-Due-Count': due, 'X-Missed-Count': total - due });
      return res.json(rows);
    }
    res.json(await query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/vaccination/parent-mark-done  (parent self-report)
const parentMarkDone = async (req, res) => {
  try {
    const { vaccineId } = req.body;
    const vaccine = await Vaccination.findById(vaccineId).populate('childId');
    if (!vaccine) return res.status(404).json({ message: 'Vaccination record not found' });

    // Verify the parent owns this child
    if (String(vaccine.childId?.parentId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (vaccine.status === 'done') return res.json(vaccine);

    vaccine.status = 'done';
    vaccine.givenDate = vaccine.givenDate || new Date();
    vaccine.notes = (vaccine.notes || '') + ' [Self-reported by parent]';
    await vaccine.save();

    res.json(vaccine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSchedule, updateVaccination, parentMarkDone, getOverdue };
