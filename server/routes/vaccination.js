const express = require('express');
const router = express.Router();
const { getSchedule, updateVaccination, getOverdue } = require('../controllers/vaccinationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/overdue', protect, authorize('asha', 'admin'), getOverdue);
router.get('/:childId', protect, getSchedule);
router.put('/update', protect, authorize('asha', 'admin'), updateVaccination);

module.exports = router;
