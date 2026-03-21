const express = require('express');
const router = express.Router();
const { getSchemes, createScheme, updateScheme } = require('../controllers/schemeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getSchemes);
router.post('/', protect, authorize('admin'), createScheme);
router.put('/:id', protect, authorize('admin'), updateScheme);

module.exports = router;
