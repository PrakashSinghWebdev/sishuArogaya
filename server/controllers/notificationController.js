const Notification = require('../models/Notification');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');

// GET /api/notifications — current user's notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notifications/send — Admin sends notification
const sendNotification = async (req, res) => {
  try {
    const { userId, message, type, link } = req.body;
    const user = await User.findById(userId).select('_id name');
    if (!user) return res.status(404).json({ message: 'Target user not found' });

    const notification = await Notification.create({ userId, message, type, link });
    await createAuditLog({
      req,
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: notification._id,
      targetUserId: user._id,
      details: `${req.user.name} sent a ${type || 'system'} notification to ${user.name}`,
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotifications, sendNotification, markRead, markAllRead };
