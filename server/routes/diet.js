const express = require('express');
const { getDietPlan, getDietPlanByAge } = require('../controllers/dietController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth needed for diet plans)
router.get('/diet/:ageGroup', getDietPlan);
router.get('/diet/age/:months', getDietPlanByAge);

module.exports = router;

