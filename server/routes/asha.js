const express = require('express');
const router = express.Router();
const { getProfile, logVisit, getVisits, getMyChildren, listWorkers } = require('../controllers/ashaController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/profile', protect, authorize('asha'), getProfile);
router.get('/children', protect, authorize('asha'), getMyChildren);
router.post('/visit', protect, authorize('asha'), logVisit);
router.get('/visits', protect, authorize('asha'), getVisits);
router.get('/workers', protect, authorize('admin'), listWorkers);

module.exports = router;
