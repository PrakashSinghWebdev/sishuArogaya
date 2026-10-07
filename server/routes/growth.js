const express = require('express');
const router = express.Router();
const { addGrowthRecord, getGrowthHistory, getPrediction } = require('../controllers/growthController');
const { protect } = require('../middleware/auth');

router.post('/add', protect, addGrowthRecord);
router.get('/:childId', protect, getGrowthHistory);
router.get('/:childId/predict', protect, getPrediction);

module.exports = router;
