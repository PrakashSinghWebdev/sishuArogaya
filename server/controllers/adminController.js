const Child = require('../models/Child');
const { completedMonths } = require('../utils/zScore');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');
const Vaccination = require('../models/Vaccination');
const GrowthRecord = require('../models/GrowthRecord');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../utils/auditLogger');
const escapeRegex = require('../utils/escapeRegex');
const { sendEmail } = require('../utils/otp');
const { uniqueAshaId, randomPassword } = require('../utils/ashaCredentials');
const { sendSMS, sendWhatsApp } = require('../utils/messaging');
const { cached } = require('../utils/cache');
const { pageParams, countCached, countKey } = require('../utils/paginate');

// ponytail: dashboard numbers may lag up to 30s behind writes; fine for KPIs, invalidate on writes if not
const KPI_TTL = 30_000;

// GET /api/admin/dashboard — district-level KPIs
const getDashboardStats = async (req, res) => {
  try {
    const body = await cached('admin:dashboard', KPI_TTL, async () => {
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

      return { totalChildren, totalAshaWorkers, malnutritionCases, missedVaccinations, blockStats };
    });
    res.json(body);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/heatmap — district/block malnutrition data for Leaflet
const getHeatmapData = async (req, res) => {
  try {
    const data = await cached('admin:heatmap', KPI_TTL, () => Child.aggregate([
      {
        $group: {
          _id: { block: '$block', district: '$district' },
          total: { $sum: 1 },
          severe: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'severe'] }, 1, 0] } },
          moderate: { $sum: { $cond: [{ $eq: ['$nutritionStatus', 'moderate'] }, 1, 0] } },
        },
      },
    ]));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users — list all users
const listUsers = async (req, res) => {
  try {
    const { role, q } = req.query;
    const filter = role ? { role: String(role) } : {};
    if (q) {
      const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { username: rx }];
    }
    const { limit, skip } = pageParams(req.query);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort('-createdAt').skip(skip).limit(limit),
      countCached(User, filter, countKey(req.query)),
    ]);
    res.set('X-Total-Count', total).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/user/:id/toggle — activate/deactivate user
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
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
    const { limit, skip } = pageParams(req.query);
    const [cases, total] = await Promise.all([
      Child.find(filter)
        .populate('parentId', 'name phone')
        .populate('ashaId', 'ashaId district block')
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      countCached(Child, filter, `malnutrition:${countKey(req.query)}`),
    ]);
    res.set('X-Total-Count', total).json(cases.map((c) => ({ ...c, id: String(c._id), ageInMonths: completedMonths(c.dob) })));
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

    const searchRegex = new RegExp(escapeRegex(q.trim()), 'i');

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

// POST /api/admin/asha — admin creates an ASHA worker; username + password are generated and sent to them
const createAshaWorker = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const { dob, aadhar, state, district, block, village } = req.body;

    if (!name || !email || !phone || !dob || !district?.trim() || !block?.trim()) {
      return res.status(400).json({ message: 'Name, email, phone, date of birth, district and block are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email' });
    if (phone.length !== 10) return res.status(400).json({ message: 'Phone must be 10 digits' });
    const adultCutoff = new Date();
    adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
    if (Number.isNaN(Date.parse(dob)) || new Date(dob) > adultCutoff) {
      return res.status(400).json({ message: 'Invalid date of birth (ASHA worker must be at least 18)' });
    }
    if (await User.exists({ $or: [{ email }, { phone }] })) {
      return res.status(400).json({ message: 'Email or phone already registered' });
    }

    const ashaId = await uniqueAshaId();
    const password = randomPassword();

    const user = await User.create({
      name, email, phone, dob, password, role: 'asha', mustChangePassword: true,
      username: ashaId,
      aadhar: aadhar?.trim(),
      state: state?.trim(),
      district: district.trim(),
      block: block.trim(),
    });
    try {
      await AshaWorker.create({
        userId: user._id, ashaId,
        state: state?.trim(),
        district: district.trim(),
        block: block.trim(),
        village: village?.trim(),
      });
    } catch (ashaErr) {
      await User.deleteOne({ _id: user._id });
      throw ashaErr;
    }

    const { delivery, text } = await sendCredentials({ name, phone, email, username: ashaId, password, roleLabel: 'ASHA' });

    await createAuditLog({
      req,
      action: 'ASHA_CREATED',
      entityType: 'User',
      entityId: user._id,
      targetUserId: user._id,
      details: `${req.user.name} created ASHA worker ${name} (${ashaId})`,
    });

    res.status(201).json({ message: 'ASHA worker created', username: ashaId, password, delivery, phone, text });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Login details by SMS, WhatsApp and email. Each channel is best-effort: the account exists either way
// and the admin also sees the credentials on screen.
async function sendCredentials({ name, phone, email, username, password, roleLabel }) {
  const text = `Sishu Arogaya: Namaste ${name}, your ${roleLabel} account is ready. Username: ${username} Password: ${password}. Login at ${process.env.CLIENT_URL || ''}/login and change your password after first login.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#0891b2">Sishu Arogaya</h2>
      <p>Namaste <strong>${escapeHtml(name)}</strong>, your ${escapeHtml(roleLabel)} account has been created.</p>
      <p>Username: <strong>${escapeHtml(username)}</strong><br>Password: <strong>${escapeHtml(password)}</strong></p>
      <p>Please change your password after your first login.</p></div>`;
  const results = await Promise.allSettled([
    sendSMS(phone, text),
    sendWhatsApp(phone, text),
    sendEmail(email, `Your Sishu Arogaya ${roleLabel} login`, html),
  ]);
  const delivery = Object.fromEntries(['sms', 'whatsapp', 'email'].map((ch, i) => [
    ch, results[i].status === 'fulfilled' ? 'sent' : results[i].reason.message,
  ]));
  return { delivery, text };
}

// POST /api/admin/user/:id/reset-password — An ASHA forgot their password (most ASHAs have no email
// for the self-service reset): new one-time password, every session signed out, details sent to the user
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+sessionVersion');
    if (!user || user.role !== 'asha') return res.status(404).json({ message: 'ASHA account not found' });
    const password = randomPassword();
    user.password = password;
    user.mustChangePassword = true;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    const username = user.username || user.email;
    const { delivery, text } = await sendCredentials({ name: user.name, phone: user.phone, email: user.email, username, password, roleLabel: 'ASHA' });
    await createAuditLog({ req, action: 'PASSWORD_RESET_BY_ADMIN', entityType: 'User', entityId: user._id, targetUserId: user._id, details: `${req.user.name} reset the password of ${user.name}` });
    res.json({ message: 'Password reset', username, password, delivery, phone: user.phone, text });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

module.exports = { resetUserPassword, getDashboardStats, getHeatmapData, listUsers, toggleUser, getMalnutritionCases, getAuditLogs, searchAshaWorkers, createAshaWorker };
