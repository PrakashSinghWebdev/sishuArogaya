const mongoose = require('mongoose');
const connectDB = require('./config/db');
const DietPlan = require('./models/DietPlan');

const DIET_DATA = [
  {
    ageGroup: 'exclusive-bf',
    minMonths: 0,
    maxMonths: 5,
    label: '0–5 Months',
    intro: 'Exclusive breastfeeding is the ONLY food your baby needs for the first 6 months. No water, no other milk, no solid food.',
    color: '#fce7f3',
    tips: [
      'Breastfeed on demand — at least 8–12 times in 24 hours',
      'Start within 1 hour of birth. Colostrum is vital!',
      'No water, juice, or any other food before 6 months'
    ],
    meals: [{
      time: 'Every 2–3 hours',
      icon: '🌅',
      name: 'Breastfeeding Session',
      items: [{ emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: 'Only food needed' }]
    }],
    avoidFoods: ['Water', 'Formula', 'Cow milk', 'Honey', 'Solid foods'],
    warning: 'Never dilute breast milk or add sugar/salt.'
  },
  {
    ageGroup: '6-8mo',
    minMonths: 6,
    maxMonths: 8,
    label: '6–8 Months',
    intro: 'Start soft complementary foods alongside breastfeeding.',
    color: '#fef9c3',
    tips: ['Continue breastfeeding', 'Start 2–3 tsp once/day', 'No salt/sugar'],
    meals: [
      {
        time: '9–10 AM', 
        icon: '🍚',
        name: 'First Solids',
        items: [
          { emoji: '🍚', name: 'Soft Dal Khichdi', qty: '2–4 tbsp', note: 'Very soft' },
          { emoji: '🍌', name: 'Mashed Banana', qty: '1–2 tbsp', note: '' }
        ]
      }
      // ... more from frontend
    ],
    avoidFoods: ['Salt', 'Sugar', 'Honey', 'Whole nuts'],
    warning: 'Introduce one food at a time, wait 3 days.'
  },
  // Add remaining 9-11mo, 12-23mo, 2-5yr similarly...
  {
    ageGroup: '9-11mo',
    minMonths: 9,
    maxMonths: 11,
    label: '9–11 Months',
    intro: 'Wider variety of mashed family foods. 3 meals + 2 snacks.',
    color: '#dcfce7'
  },
  {
    ageGroup: '12-23mo',
    minMonths: 12,
    maxMonths: 23,
    label: '12–23 Months',
    intro: 'Most family foods. Continue breastfeeding.',
    color: '#dbeafe'
  },
  {
    ageGroup: '2-5yr',
    minMonths: 24,
    maxMonths: 60,
    label: '2–5 Years',
    intro: 'Regular family food with variety.',
    color: '#ede9fe'
  }
];

const seedDietPlans = async () => {
  try {
    await connectDB();
    console.log('Connected to DB, seeding diet plans...');
    
    // Clear existing
    await DietPlan.deleteMany({});
    
    // Insert
    await DietPlan.insertMany(DIET_DATA);
    
    console.log('✅ Diet plans seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedDietPlans();

