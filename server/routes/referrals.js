const express = require('express');
const { listReferrals, addReferral, updateReferral } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/', protect, authorize('asha', 'admin'), listReferrals);
router.post('/', protect, authorize('asha'), addReferral);
router.patch('/:id', protect, authorize('asha', 'admin'), updateReferral);

module.exports = router;
