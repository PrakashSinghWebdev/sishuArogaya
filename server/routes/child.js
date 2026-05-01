const express = require('express');
const router = express.Router();
const { addChild, getChild, listChildren, updateChild, searchChildren, searchByChildId } = require('../controllers/childController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/search/parent', protect, authorize('parent'), searchChildren);
router.get('/search/asha', protect, authorize('asha'), searchByChildId);
router.get('/', protect, listChildren);
router.post('/add', protect, authorize('asha', 'admin', 'parent'), addChild);
router.get('/:id', protect, getChild);
router.put('/update/:id', protect, authorize('asha', 'admin', 'parent'), updateChild);

module.exports = router;
