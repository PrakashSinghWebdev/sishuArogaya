const express = require('express');
const c = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();
router.use(protect, authorize('parent', 'asha', 'admin'));

router.get('/', c.listMessages);
router.get('/unread-count', c.unreadCount);
router.get('/recipients', c.recipients);
router.post('/', c.sendMessage);
router.post('/:id/reply', c.reply);
router.post('/:id/read', c.markRead);
router.post('/:id/resolve', c.resolve);

module.exports = router;
