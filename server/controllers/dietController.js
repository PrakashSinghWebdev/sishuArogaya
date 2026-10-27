const DietPlan = require('../models/DietPlan');
const { cached } = require('../utils/cache');

// Diet plans are seeded reference data (a handful of docs): load them all once, pick in memory
const allPlans = () => cached('diet:all', 60 * 60_000, () => DietPlan.find({}).sort({ minMonths: 1 }).lean());

const hasRenderableDietPlan = (plan) =>
  !!plan &&
  Array.isArray(plan.meals) &&
  plan.meals.length > 0 &&
  plan.meals.some((meal) => Array.isArray(meal?.items) && meal.items.length > 0);

// GET /api/diet/:ageGroup - e.g. /diet/6-8mo
const getDietPlan = async (req, res) => {
  try {
    const { ageGroup } = req.params;
    const plans = await allPlans();
    const plan = plans.find((p) => p.ageGroup === ageGroup);

    if (!hasRenderableDietPlan(plan)) {
      return res.status(404).json({
        message: 'Diet plan not found or incomplete for this age group',
        available: plans.map(({ _id, ageGroup: group, label, minMonths, maxMonths }) => ({ _id, ageGroup: group, label, minMonths, maxMonths })),
      });
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/diet/age/:months - auto-selects ageGroup
const getDietPlanByAge = async (req, res) => {
  try {
    const { months } = req.params;
    if (!/^\d+$/.test(months)) {
      return res.status(400).json({ message: 'Age in months must be a non-negative integer.' });
    }

    const ageMonths = Number(months);

    const plans = await allPlans();
    const plan = plans.find((p) => p.minMonths <= ageMonths && p.maxMonths >= ageMonths);

    if (!hasRenderableDietPlan(plan)) {
      return res.status(404).json({
        message: 'No complete diet plan found for this age',
        closest: plans.slice(0, 2),
      });
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDietPlan, getDietPlanByAge };
