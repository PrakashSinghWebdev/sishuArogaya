const express = require('express');
const { listCamps, createCamp, updateCamp } = require('../controllers/campController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();
router.use(protect, authorize('asha', 'admin'));

router.get('/', listCamps);
router.post('/', createCamp);
router.patch('/:id', updateCamp);

module.exports = router;
