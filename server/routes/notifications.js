const express = require('express');
const router = express.Router();
const { getNotifications, sendNotification, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getNotifications);
router.post('/send', protect, authorize('admin'), sendNotification);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);

module.exports = router;
