const express = require('express');
const c = require('../controllers/incentiveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();
router.use(protect);

router.get('/', authorize('asha', 'admin'), c.listClaims);
router.get('/activities', authorize('asha', 'admin'), c.listActivities);
router.get('/suggestions', authorize('asha'), c.getSuggestions);
router.post('/', authorize('asha'), c.createClaim);
router.patch('/:id', authorize('asha', 'admin'), c.updateClaim);

module.exports = router;
