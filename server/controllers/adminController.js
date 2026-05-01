const Child = require('../models/Child');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');
const Vaccination = require('../models/Vaccination');
const GrowthRecord = require('../models/GrowthRecord');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../utils/auditLogger');

// GET /api/admin/dashboard — district-level KPIs
const getDashboardStats = async (req, res) => {
  try {
    const [totalChildren, totalAshaWorkers, malnutritionCases, missedVaccinations] =
      await Promise.all([
        Child.countDocuments({ isActive: true }),
        AshaWorker.countDocuments({ isActive: true }),
        Child.countDocuments({ nutritionStatus: { $in: ['moderate', 'severe'] } }),
        Vaccination.countDocuments({ status: { $in: ['due', 'missed'] } }),
      ]);

    // Block-wise malnutrition summary
    const blockStats = await Child.aggregate([
      { $group: { _id: '$block', total: { $sum: 1 }, severe: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'severe'] }, 1, 0] } }, moderate: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'moderate'] }, 1, 0] } } } },
      { $sort: { severe: -1 } },
    ]);

    res.json({ totalChildren, totalAshaWorkers, malnutritionCases, missedVaccinations, blockStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/heatmap — district/block malnutrition data for Leaflet
const getHeatmapData = async (req, res) => {
  try {
    const data = await Child.aggregate([
      {
        $group: {
          _id: { block: '$block', district: '$district' },
          total: { $sum: 1 },
          severe: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'severe'] }, 1, 0] } },
          moderate: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'moderate'] }, 1, 0] } },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users — list all users
const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/user/:id/toggle — activate/deactivate user
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    await createAuditLog({
      req,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user._id,
      targetUserId: user._id,
      details: `${req.user.name} ${user.isActive ? 'activated' : 'deactivated'} ${user.name}`,
    });
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/malnutrition — all flagged cases
const getMalnutritionCases = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { nutritionStatus: status } : { nutritionStatus: { $in: ['moderate', 'severe'] } };
    const cases = await Child.find(filter)
      .populate('parentId', 'name phone')
      .populate('ashaId', 'ashaId district block')
      .sort('-updatedAt');
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, actorId, limit = 100 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorId) filter.actorId = actorId;

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .populate('targetUserId', 'name email role')
      .sort('-createdAt')
      .limit(Math.min(Number(limit) || 100, 250));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/search/asha — search ASHA workers by ashaId, name, or region
const searchAshaWorkers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ results: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const results = await AshaWorker.find({
      $or: [
        { ashaId: searchRegex },
        { district: searchRegex },
        { block: searchRegex },
        { village: searchRegex },
      ],
    })
      .populate('userId', 'name phone email')
      .select('_id ashaId district block village totalVisits assignedChildren createdAt')
      .limit(10);

    // Enrich results with user info
    const enrichedResults = results.map((asha) => ({
      _id: asha._id,
      ashaId: asha.ashaId,
      name: asha.userId?.name || 'N/A',
      phone: asha.userId?.phone || 'N/A',
      region: `${asha.district}, ${asha.block}${asha.village ? ', ' + asha.village : ''}`,
      totalChildren: asha.assignedChildren?.length || 0,
      totalVisits: asha.totalVisits || 0,
      createdAt: asha.createdAt,
    }));

    res.json({ results: enrichedResults });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardStats, getHeatmapData, listUsers, toggleUser, getMalnutritionCases, getAuditLogs, searchAshaWorkers };
