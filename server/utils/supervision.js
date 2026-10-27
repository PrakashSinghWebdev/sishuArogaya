// Emergency / escalated cases are flagged to every active admin
const User = require('../models/User');
const Notification = require('../models/Notification');

async function alertOversight(_asha, message) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  if (admins.length) await Notification.insertMany(admins.map((u) => ({ userId: u._id, message, type: 'health_alert', link: '/admin/referrals' })));
}

module.exports = { alertOversight };
