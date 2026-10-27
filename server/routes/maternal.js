const express = require('express');
const c = require('../controllers/maternalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.get('/', protect, authorize('asha', 'admin'), c.listPregnancies);
router.post('/', protect, authorize('asha'), c.registerPregnancy);
router.get('/:id', protect, authorize('asha', 'admin'), c.getPregnancy);
router.patch('/:id', protect, authorize('asha'), c.updatePregnancy);
router.post('/:id/anc', protect, authorize('asha'), c.addAncVisit);
router.post('/:id/delivery', protect, authorize('asha'), c.recordDelivery);
router.post('/:id/pnc', protect, authorize('asha'), c.addPncVisit);

module.exports = router;
