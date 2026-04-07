const express = require('express');
const { getDietPlan, getDietPlanByAge } = require('../controllers/dietController');
const { getChecklist, saveChecklist, getStreak } = require('../controllers/dietChecklistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth needed for diet plans)
router.get('/diet/:ageGroup', getDietPlan);
router.get('/diet/age/:months', getDietPlanByAge);

// Checklist routes (auth required)
router.get('/checklist', protect, getChecklist);
router.put('/checklist', protect, saveChecklist);
router.get('/checklist/streak', protect, getStreak);

module.exports = router;

