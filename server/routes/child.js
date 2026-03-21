const express = require('express');
const router = express.Router();
const { addChild, getChild, listChildren, updateChild } = require('../controllers/childController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, listChildren);
router.post('/add', protect, authorize('asha', 'admin', 'parent'), addChild);
router.get('/:id', protect, getChild);
router.put('/update/:id', protect, authorize('asha', 'admin'), updateChild);

module.exports = router;
