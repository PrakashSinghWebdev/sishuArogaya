const express = require('express');
const { getDietPlan, getDietPlanByAge } = require('../controllers/dietController');
const { getChecklist, saveChecklist, getStreak } = require('../controllers/dietChecklistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public — no auth needed to look up diet plans
// NOTE: /age/:months must be registered before /:ageGroup or "age" gets
// mismatched as an ageGroup value
router.get('/age/:months', getDietPlanByAge);

// Checklist endpoints require a logged-in user
router.get('/checklist', protect, getChecklist);
router.put('/checklist', protect, saveChecklist);
router.get('/checklist/streak', protect, getStreak);
router.get('/:ageGroup', getDietPlan);

module.exports = router;
