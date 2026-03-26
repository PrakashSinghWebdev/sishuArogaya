const DietPlan = require('../models/DietPlan');

// GET /api/diet/:ageGroup  — e.g. /diet/6-8mo
const getDietPlan = async (req, res) => {
  try {
    const { ageGroup } = req.params;
    const plan = await DietPlan.findOne({ ageGroup });
    
    if (!plan) {
      return res.status(404).json({ 
        message: 'Diet plan not found for this age group',
        available: await DietPlan.find({}, 'ageGroup label minMonths maxMonths')
      });
    }
    
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/diet/age/:months  — auto-selects ageGroup
const getDietPlanByAge = async (req, res) => {
  try {
    const { months } = req.params;
    const ageMonths = parseInt(months);
    
    const plan = await DietPlan.findOne({
      minMonths: { $lte: ageMonths },
      maxMonths: { $gte: ageMonths }
    });
    
    if (!plan) {
      return res.status(404).json({ 
        message: 'No diet plan found for this age',
        closest: await DietPlan.find({}).sort({ minMonths: 1 }).limit(2)
      });
    }
    
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDietPlan, getDietPlanByAge };

