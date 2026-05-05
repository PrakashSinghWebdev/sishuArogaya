import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, dietAPI, dietChecklistAPI } from '../../services/api';
import { normalizeText, useLanguage } from '../../context/LanguageContext';
import useSelectedChild from '../../hooks/useSelectedChild';

const themeColors = {
  teal: '#0891b2', teal2: '#0e7490', teal3: '#cffafe', teal4: '#f0fdff',
  bg: '#f8fffe', text: '#0c2340', muted: '#4a7a8a', border: '#c5e8ef',
};

const AGE_GROUPS = [
  { minMonths: 0,  maxMonths: 5,  label: '0 – 5 Months',  tag: 'exclusive-bf' },
  { minMonths: 6,  maxMonths: 8,  label: '6 – 8 Months',  tag: '6-8mo' },
  { minMonths: 9,  maxMonths: 11, label: '9 – 11 Months', tag: '9-11mo' },
  { minMonths: 12, maxMonths: 23, label: '12 – 23 Months', tag: '12-23mo' },
  { minMonths: 24, maxMonths: 60, label: '2 – 5 Years',   tag: '2-5yr' },
];

// item types:
//   regular  { emoji, name, qty, note }              → checkbox in checklist
//   options  { type:'options', label, options:[...] } → radio buttons in checklist (pick ONE)

const DIET_PLANS = {
  'exclusive-bf': {
    intro: 'Exclusive breastfeeding is the ONLY food your baby needs for the first 6 months. No water, no other milk, no solid food.',
    color: '#fce7f3',
    tips: [
      'Breastfeed on demand — at least 8–12 times in 24 hours',
      'Start within 1 hour of birth. Colostrum (first yellow milk) is vital — never discard it!',
      'No water, juice, or any other food before 6 months',
      'Feed from both breasts at each feeding session',
      'Night feeds are important for milk supply',
      'Mother should eat well, drink plenty of fluids, and rest',
    ],
    meals: [
      { time: 'Every 2–3 hours (day & night)', icon: '🌅', name: 'Feeding Session', items: [
        { type: 'options', label: 'Choose milk source', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand (both sides)', note: 'Best choice — the only food needed' },
          { emoji: '🍼', name: 'Formula Milk', qty: 'As per tin instructions', note: 'Only if breastfeeding not possible' },
        ]},
      ]},
    ],
    avoidFoods: ['Water (before 6 months)', 'Cow\'s milk', 'Honey', 'Solid foods', 'Juices', 'Glucose water'],
    warning: '⚠️ Never dilute breast milk. Never add sugar or salt. If breastfeeding is difficult, contact your ASHA worker or doctor.',
  },
  '6-8mo': {
    intro: 'At 6 months, start soft complementary foods alongside continued breastfeeding. Begin with small amounts and gradually increase.',
    color: '#fef9c3',
    tips: [
      'Continue breastfeeding — it\'s still the main nutrition source',
      'Start with 2–3 teaspoons of soft food, once a day',
      'Increase to 2–3 meals/day by 7–8 months',
      'Introduce one new food at a time; wait 3 days before introducing another',
      'Add a little ghee or oil to meals for energy',
      'Never add salt or sugar to baby food',
    ],
    meals: [
      { time: '7:00 – 8:00 AM', icon: '🌅', name: 'Morning Milk Feed', items: [
        { type: 'options', label: 'Choose milk source', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'Both sides, on demand', note: 'Always offer breast milk first' },
          { emoji: '🍼', name: 'Formula Milk', qty: '120–150 ml', note: 'If not breastfeeding' },
        ]},
      ]},
      { time: '9:00 – 10:00 AM', icon: '🍚', name: 'First Solid Meal', items: [
        { type: 'options', label: 'Choose one cereal / main', options: [
          { emoji: '🍚', name: 'Soft Dal Khichdi', qty: '2–4 tbsp', note: 'Cooked until very soft, add ghee' },
          { emoji: '🌾', name: 'Ragi Porridge (thin)', qty: '3–4 tbsp', note: 'Cook well with water or breast milk' },
          { emoji: '🥣', name: 'Soft Rice Porridge', qty: '3–4 tbsp', note: 'With a little dal water' },
          { emoji: '🌾', name: 'Oats Porridge (thin)', qty: '3–4 tbsp', note: 'Cooked smooth, no salt/sugar' },
        ]},
        { type: 'options', label: 'Choose one fruit (alongside)', options: [
          { emoji: '🍌', name: 'Mashed Ripe Banana', qty: '1–2 tbsp', note: 'Soft & easily digestible' },
          { emoji: '🍎', name: 'Apple Puree (cooked)', qty: '1–2 tbsp', note: 'Steam, then mash smooth' },
          { emoji: '🧡', name: 'Papaya Puree', qty: '1–2 tbsp', note: 'Ripe, mashed fine' },
          { emoji: '🍑', name: 'Chikoo (Sapota) Puree', qty: '1–2 tbsp', note: 'Sweet & soft' },
        ]},
      ]},
      { time: '12:00 – 1:00 PM', icon: '☀️', name: 'Lunch', items: [
        { type: 'options', label: 'Choose milk feed (before meal)', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand', note: 'Offer before solids' },
          { emoji: '🍼', name: 'Formula Milk', qty: '100 ml', note: '' },
        ]},
        { type: 'options', label: 'Choose one vegetable puree', options: [
          { emoji: '🥕', name: 'Mashed Carrot (cooked)', qty: '2–3 tbsp', note: 'Boil and mash smooth' },
          { emoji: '🎃', name: 'Pumpkin Puree', qty: '2–3 tbsp', note: 'Naturally sweet and easy to digest' },
          { emoji: '🍠', name: 'Sweet Potato Puree', qty: '2–3 tbsp', note: 'Boil and mash well' },
          { emoji: '🥦', name: 'Soft Cooked Peas Mash', qty: '2–3 tbsp', note: 'Press through sieve' },
        ]},
        { emoji: '🍚', name: 'Soft Rice + Dal water', qty: '3–4 tbsp', note: 'Add ½ tsp ghee for energy' },
      ]},
      { time: '4:00 – 5:00 PM', icon: '🌆', name: 'Evening Snack', items: [
        { type: 'options', label: 'Choose one fruit puree', options: [
          { emoji: '🍌', name: 'Mashed Banana', qty: '2–3 tbsp', note: '' },
          { emoji: '🧡', name: 'Papaya Puree', qty: '2–3 tbsp', note: 'Ripe and smooth' },
          { emoji: '🥭', name: 'Mango Puree (seasonal)', qty: '2–3 tbsp', note: 'No added sugar' },
          { emoji: '🍑', name: 'Chikoo Puree', qty: '2–3 tbsp', note: '' },
          { emoji: '🍐', name: 'Pear Puree (cooked)', qty: '2–3 tbsp', note: 'Peel, boil, blend smooth' },
        ]},
        { type: 'options', label: 'Choose one cereal snack', options: [
          { emoji: '🌾', name: 'Ragi Porridge (thin)', qty: '3–4 tbsp', note: 'Good source of calcium' },
          { emoji: '🥣', name: 'Soft Oats Porridge', qty: '3–4 tbsp', note: 'Creamy consistency' },
          { emoji: '🌽', name: 'Corn (maize) Porridge', qty: '3–4 tbsp', note: 'Smooth, no lumps' },
        ]},
      ]},
      { time: '7:00 – 8:00 PM', icon: '🌙', name: 'Dinner', items: [
        { type: 'options', label: 'Choose milk feed (before meal)', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand', note: '' },
          { emoji: '🍼', name: 'Formula Milk', qty: '100 ml', note: '' },
        ]},
        { type: 'options', label: 'Choose one dinner cereal', options: [
          { emoji: '🍚', name: 'Soft Dal Khichdi', qty: '3–4 tbsp', note: 'Add ghee or oil' },
          { emoji: '🥣', name: 'Rice Porridge (Kanji)', qty: '3–4 tbsp', note: 'Thin consistency' },
          { emoji: '🌾', name: 'Suji (Semolina) Porridge', qty: '3–4 tbsp', note: 'No salt, add ghee' },
        ]},
      ]},
      { time: 'During night', icon: '🌛', name: 'Night Feed', items: [
        { type: 'options', label: 'Night milk feed', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand', note: 'Night feeds are important for milk supply' },
          { emoji: '🍼', name: 'Formula Milk', qty: '100–120 ml', note: '' },
        ]},
      ]},
    ],
    avoidFoods: ['Salt', 'Sugar', 'Honey', 'Whole nuts', 'Cow\'s milk as main drink', 'Raw eggs', 'Citrus fruits', 'Processed/packaged food'],
    warning: '⚠️ Introduce one new food at a time. If baby refuses, try again after 2–3 days. Never force-feed.',
  },
  '9-11mo': {
    intro: 'By 9 months, baby can eat a wider variety of mashed or finely chopped family foods. Offer 3 meals and 2 snacks daily.',
    color: '#dcfce7',
    tips: [
      'Continue breastfeeding alongside meals',
      'Gradually increase texture: mashed → soft lumps → finely chopped',
      'Offer 3 main meals + 2 healthy snacks daily',
      'Encourage self-feeding with soft finger foods',
      'Include iron-rich foods daily (dal, meat, fortified cereals)',
      'Always add ghee or oil to meals',
    ],
    meals: [
      { time: '7:00 – 8:00 AM', icon: '🌅', name: 'Breakfast', items: [
        { type: 'options', label: 'Choose milk feed (start the day)', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand', note: 'Offer before solids' },
          { emoji: '🍼', name: 'Formula Milk', qty: '120 ml', note: '' },
        ]},
        { type: 'options', label: 'Choose one cereal', options: [
          { emoji: '🌾', name: 'Ragi Porridge', qty: '5–6 tbsp', note: 'With mashed banana or dates' },
          { emoji: '🥣', name: 'Oats Porridge', qty: '5–6 tbsp', note: 'Creamy with mashed fruit' },
          { emoji: '🌽', name: 'Suji Upma (soft)', qty: '5–6 tbsp', note: 'No salt, add ghee' },
          { emoji: '🍚', name: 'Soft Idli (mashed)', qty: '1–2 small idlis', note: 'With a little dal or coconut chutney' },
        ]},
        { type: 'options', label: 'Choose one protein (3× per week)', options: [
          { emoji: '🍳', name: 'Mashed Egg Yolk', qty: '½ – 1 yolk', note: 'Well cooked' },
          { emoji: '🫘', name: 'Mashed Moong Dal', qty: '2–3 tbsp', note: 'Egg-free option' },
          { emoji: '🧀', name: 'Soft Paneer (mashed)', qty: '2–3 tbsp', note: 'Good protein & calcium' },
        ]},
      ]},
      { time: '10:00 – 10:30 AM', icon: '🍎', name: 'Mid-Morning Snack', items: [
        { type: 'options', label: 'Choose one fruit', options: [
          { emoji: '🍌', name: 'Mashed Banana', qty: '3–4 tbsp', note: 'Soft and easy' },
          { emoji: '🧡', name: 'Papaya (mashed)', qty: '3–4 tbsp', note: '' },
          { emoji: '🥭', name: 'Mango Pulp', qty: '3–4 tbsp', note: 'Seasonal, no sugar added' },
          { emoji: '🍎', name: 'Grated Soft Apple', qty: '3–4 tbsp', note: 'Or cooked apple puree' },
        ]},
        { type: 'options', label: 'Choose one light snack', options: [
          { emoji: '🌾', name: 'Soft Ragi Ladoo (small)', qty: '1 piece', note: 'No jaggery excess' },
          { emoji: '🍪', name: 'Plain Wheat Biscuit', qty: '1–2 pieces', note: 'No-sugar variety' },
          { emoji: '🌾', name: 'Puffed Rice (soft)', qty: 'Small handful', note: 'Easy to hold, self-feed' },
        ]},
      ]},
      { time: '12:00 – 1:00 PM', icon: '☀️', name: 'Lunch', items: [
        { type: 'options', label: 'Choose one main dish', options: [
          { emoji: '🍚', name: 'Dal Rice (soft, mashed)', qty: '6–8 tbsp', note: 'With ½ tsp ghee' },
          { emoji: '🍚', name: 'Khichdi (rice + moong dal)', qty: '6–8 tbsp', note: 'Add ghee + mashed vegetables' },
          { emoji: '🫓', name: 'Soft Roti soaked in Dal', qty: '½ roti + 4 tbsp dal', note: 'Tear and soak until very soft' },
        ]},
        { type: 'options', label: 'Choose one vegetable', options: [
          { emoji: '🥕', name: 'Mashed Carrot', qty: '4–5 tbsp', note: '' },
          { emoji: '🫘', name: 'Soft Green Beans (chopped)', qty: '4–5 tbsp', note: 'Boil very soft' },
          { emoji: '🎃', name: 'Soft Pumpkin', qty: '4–5 tbsp', note: '' },
          { emoji: '🥬', name: 'Mashed Spinach + Dal', qty: '4–5 tbsp', note: 'Good iron source' },
        ]},
        { type: 'options', label: 'Choose one probiotic', options: [
          { emoji: '🥣', name: 'Curd (plain)', qty: '2–3 tbsp', note: 'Good probiotic' },
          { emoji: '🍌', name: 'Mashed Banana', qty: '2–3 tbsp', note: 'If curd not tolerated' },
        ]},
      ]},
      { time: '4:00 – 4:30 PM', icon: '🌆', name: 'Evening Snack', items: [
        { type: 'options', label: 'Choose one starchy snack', options: [
          { emoji: '🥔', name: 'Mashed Potato', qty: '4–5 tbsp', note: 'With a little butter' },
          { emoji: '🍠', name: 'Mashed Sweet Potato', qty: '4–5 tbsp', note: 'Naturally sweet, no sugar needed' },
          { emoji: '🌽', name: 'Soft Boiled Corn (mashed)', qty: '4–5 tbsp', note: '' },
        ]},
        { type: 'options', label: 'Choose one dairy drink', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'As desired', note: '' },
          { emoji: '🍼', name: 'Formula Milk', qty: '100 ml', note: '' },
          { emoji: '🥣', name: 'Plain Curd', qty: '3–4 tbsp', note: 'At room temperature' },
        ]},
      ]},
      { time: '7:00 – 8:00 PM', icon: '🌙', name: 'Dinner', items: [
        { type: 'options', label: 'Choose one dinner main', options: [
          { emoji: '🫓', name: 'Soft Roti + Dal', qty: '½ roti (torn) + 4–5 tbsp dal', note: 'Dip roti in dal to soften' },
          { emoji: '🍚', name: 'Khichdi (soft)', qty: '6–8 tbsp', note: 'With ghee' },
          { emoji: '🌾', name: 'Suji Kheer (no sugar)', qty: '5–6 tbsp', note: 'Use dates for sweetness' },
        ]},
        { emoji: '🥦', name: 'Boiled Soft Vegetables (any)', qty: '4–5 tbsp', note: 'Carrot, beans, peas' },
        { type: 'options', label: 'Bedtime milk (optional)', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: 'On demand', note: '' },
          { emoji: '🍼', name: 'Formula Milk', qty: '100 ml', note: '' },
        ]},
      ]},
    ],
    avoidFoods: ['Salt (limit strictly)', 'Sugar', 'Honey', 'Whole/hard nuts', 'Round hard foods (choking hazard)', 'Cow\'s milk as main drink', 'Junk food / chips'],
    warning: '⚠️ Watch for choking: always stay with baby during meals. Cut soft food into small pieces.',
  },
  '12-23mo': {
    intro: 'Your toddler can eat most family foods now. Offer 3 meals + 2–3 snacks daily. Continue breastfeeding if possible.',
    color: '#dbeafe',
    tips: [
      'Continue breastfeeding up to 2 years and beyond',
      'Offer 3 meals + 2–3 snacks daily',
      'Child needs ~1,000–1,200 kcal/day',
      'Include iron-rich foods every day (dal, meat, green leafy vegetables)',
      'Give cow\'s milk or curd from 1 year (not as main drink before 1 year)',
      'Avoid processed/packaged foods, excessive salt and sugar',
      'Let child self-feed — messy eating is normal and healthy!',
    ],
    meals: [
      { time: '7:00 – 8:00 AM', icon: '🌅', name: 'Breakfast', items: [
        { type: 'options', label: 'Choose one morning milk', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: '100–150 ml', note: 'Continue up to 2 years' },
          { emoji: '🥛', name: 'Cow\'s Milk (warm)', qty: '100–150 ml', note: 'From 1 year onwards' },
          { emoji: '🥣', name: 'Plain Curd', qty: '½ cup', note: 'Good probiotic source' },
        ]},
        { type: 'options', label: 'Choose one breakfast cereal / bread', options: [
          { emoji: '🌾', name: 'Ragi Dosa (small)', qty: '1–2 small pieces', note: 'With dal or chutney' },
          { emoji: '🥞', name: 'Soft Idli (2 small)', qty: '2 idlis', note: 'With sambar' },
          { emoji: '🫓', name: 'Soft Whole Wheat Paratha', qty: '½ – 1 small paratha', note: 'With dal or vegetable stuffing' },
          { emoji: '🌾', name: 'Upma / Poha', qty: '½ cup', note: 'With vegetables, no excess salt' },
        ]},
        { type: 'options', label: 'Choose one protein', options: [
          { emoji: '🍳', name: 'Boiled Egg', qty: '1 whole egg', note: '5× per week for brain development' },
          { emoji: '🍳', name: 'Scrambled Egg', qty: '1 egg', note: 'With a little ghee, no salt' },
          { emoji: '🧀', name: 'Paneer Cubes (soft)', qty: '2–3 cubes', note: 'Egg-free protein option' },
          { emoji: '🫘', name: 'Dal (thick)', qty: '3–4 tbsp', note: 'With breakfast cereal' },
        ]},
      ]},
      { time: '10:30 AM', icon: '🍎', name: 'Mid-Morning Snack', items: [
        { type: 'options', label: 'Choose one fresh fruit', options: [
          { emoji: '🍌', name: 'Banana (sliced)', qty: '½ banana', note: '' },
          { emoji: '🍎', name: 'Apple (grated or soft slices)', qty: '½ cup', note: '' },
          { emoji: '🥭', name: 'Mango Slices (seasonal)', qty: '½ cup', note: 'No added sugar' },
          { emoji: '🧡', name: 'Papaya (chopped)', qty: '½ cup', note: '' },
          { emoji: '🍇', name: 'Grapes (halved)', qty: '½ cup', note: 'Always cut in half — choking risk' },
        ]},
        { type: 'options', label: 'Choose one light snack', options: [
          { emoji: '🌾', name: 'Whole Grain Biscuit', qty: '1–2 pieces', note: 'Low sugar variety' },
          { emoji: '🌾', name: 'Puffed Rice (muri)', qty: 'Small bowl', note: 'Light and easy to eat' },
          { emoji: '🌰', name: 'Finely Ground Nuts (in food)', qty: '1 tsp', note: 'Not whole nuts — choking risk' },
        ]},
      ]},
      { time: '12:30 – 1:30 PM', icon: '☀️', name: 'Lunch', items: [
        { type: 'options', label: 'Choose one carbohydrate', options: [
          { emoji: '🍚', name: 'Soft Cooked Rice', qty: '½ cup', note: 'With dal and sabzi' },
          { emoji: '🫓', name: 'Soft Roti (1–2 small)', qty: '1–2 rotis', note: 'Whole wheat preferred' },
          { emoji: '🍚', name: 'Khichdi', qty: '½ cup', note: 'With vegetables and ghee' },
        ]},
        { type: 'options', label: 'Choose one protein / dal', options: [
          { emoji: '🫘', name: 'Dal (any variety)', qty: '3–4 tbsp', note: 'Toor, moong, masoor — iron-rich' },
          { emoji: '🫘', name: 'Rajma or Chhole (mashed)', qty: '3–4 tbsp', note: 'Good protein' },
          { emoji: '🍗', name: 'Soft Chicken / Fish (shredded)', qty: '2–3 tbsp', note: 'Bone-free, well cooked' },
        ]},
        { emoji: '🥕', name: 'Cooked Vegetable Sabzi', qty: '4–5 tbsp', note: 'Varied colours for nutrients' },
        { emoji: '🥣', name: 'Curd / Raita', qty: '3–4 tbsp', note: '' },
      ]},
      { time: '4:00 – 4:30 PM', icon: '🌆', name: 'Afternoon Snack', items: [
        { type: 'options', label: 'Choose one snack', options: [
          { emoji: '🌽', name: 'Boiled Sweet Corn', qty: 'Small portion', note: 'No salt, no butter excess' },
          { emoji: '🍠', name: 'Boiled Sweet Potato', qty: 'Small portion', note: 'Natural sweetness' },
          { emoji: '🥜', name: 'Groundnut Chutney (finely ground)', qty: '2 tbsp', note: 'With roti piece' },
          { emoji: '🧀', name: 'Paneer Cubes + Roti', qty: '2 cubes + ½ roti', note: '' },
        ]},
        { type: 'options', label: 'Choose one dairy drink', options: [
          { emoji: '🥛', name: 'Cow\'s Milk (warm)', qty: '100 ml', note: '' },
          { emoji: '🥣', name: 'Thin Lassi (no sugar)', qty: '100 ml', note: '' },
          { emoji: '🤱', name: 'Breast Milk', qty: 'As desired', note: '' },
        ]},
      ]},
      { time: '7:30 – 8:30 PM', icon: '🌙', name: 'Dinner', items: [
        { type: 'options', label: 'Choose one dinner main', options: [
          { emoji: '🫓', name: 'Soft Roti + Dal / Paneer curry', qty: '1 roti + 4 tbsp', note: '' },
          { emoji: '🍚', name: 'Soft Khichdi', qty: '½ cup', note: 'If roti is difficult' },
          { emoji: '🍚', name: 'Rice + Dal + Sabzi', qty: '½ cup rice + 3 tbsp dal', note: '' },
        ]},
        { emoji: '🥦', name: 'Cooked Green Vegetables', qty: '4–5 tbsp', note: 'Spinach, beans, peas' },
      ]},
      { time: 'Bedtime', icon: '🌛', name: 'Bedtime Feed', items: [
        { type: 'options', label: 'Choose bedtime milk', options: [
          { emoji: '🤱', name: 'Breast Milk', qty: '100–150 ml', note: 'Continue as long as possible' },
          { emoji: '🥛', name: 'Warm Cow\'s Milk', qty: '100–150 ml', note: 'Plain, no flavours' },
        ]},
      ]},
    ],
    avoidFoods: ['Added salt (limit)', 'Added sugar (limit)', 'Honey (before 1 yr)', 'Whole nuts (choking)', 'Junk food, chips, biscuits', 'Aerated drinks', 'Unpasteurised milk'],
    warning: '⚠️ Never give whole nuts — grinding or nut butter is safe. Always supervise meals.',
  },
  '2-5yr': {
    intro: 'Children 2–5 years eat regular family food. Focus on variety, iron-rich foods, and healthy snacks. 3 meals + 2 snacks daily.',
    color: '#ede9fe',
    tips: [
      'Offer 3 meals + 2 snacks. Don\'t skip meals',
      'Child needs ~1,200–1,400 kcal/day',
      'Include protein at every meal: dal, egg, paneer, meat, milk',
      'Fruits and vegetables: at least 2 portions daily',
      'Whole grains (ragi, bajra, oats) are better than refined flour',
      'Limit salt, sugar, fried food, and packaged snacks',
      'Encourage eating with family — good for appetite and development',
    ],
    meals: [
      { time: '7:30 – 8:30 AM', icon: '🌅', name: 'Breakfast', items: [
        { type: 'options', label: 'Choose one morning milk', options: [
          { emoji: '🥛', name: 'Cow\'s Milk (warm)', qty: '1 cup (200 ml)', note: '' },
          { emoji: '🥛', name: 'Toned Milk with Ragi', qty: '1 cup', note: 'Extra calcium' },
          { emoji: '🥣', name: 'Curd', qty: '½ cup', note: 'If milk not preferred' },
        ]},
        { type: 'options', label: 'Choose one breakfast dish', options: [
          { emoji: '🌾', name: 'Upma (vegetable)', qty: '1 cup', note: 'With vegetables, low salt' },
          { emoji: '🌾', name: 'Poha (flattened rice)', qty: '1 cup', note: 'With peanuts & vegetables' },
          { emoji: '🥞', name: 'Idli + Sambar', qty: '2 idlis', note: '' },
          { emoji: '🫓', name: 'Whole Wheat Paratha', qty: '1 paratha', note: 'With dal or vegetable stuffing' },
          { emoji: '🌾', name: 'Ragi Dosa', qty: '1–2 dosas', note: 'With chutney or dal' },
        ]},
        { type: 'options', label: 'Choose one protein', options: [
          { emoji: '🍳', name: 'Boiled Egg', qty: '1 egg', note: '5× per week' },
          { emoji: '🍳', name: 'Omelette (no salt)', qty: '1 egg', note: 'With vegetables' },
          { emoji: '🧀', name: 'Paneer Bhurji', qty: '2–3 tbsp', note: 'Egg-free option' },
          { emoji: '🫘', name: 'Dal / Sprouts', qty: '3–4 tbsp', note: 'With breakfast cereal' },
        ]},
      ]},
      { time: '10:30 – 11:00 AM', icon: '🍎', name: 'Morning Snack', items: [
        { type: 'options', label: 'Choose one seasonal fruit', options: [
          { emoji: '🍌', name: 'Banana', qty: '1 medium', note: 'Quick energy' },
          { emoji: '🍎', name: 'Apple (sliced)', qty: '½ – 1 apple', note: '' },
          { emoji: '🍈', name: 'Guava (chopped)', qty: '½ cup', note: 'High vitamin C' },
          { emoji: '🥭', name: 'Mango (seasonal)', qty: '½ cup', note: '' },
          { emoji: '🍊', name: 'Orange / Mosambi', qty: '1 small', note: 'Vitamin C boosts iron absorption' },
        ]},
        { type: 'options', label: 'Choose one snack', options: [
          { emoji: '🌰', name: 'Roasted Groundnuts', qty: 'Small handful', note: 'Healthy protein snack' },
          { emoji: '🫘', name: 'Roasted Chana', qty: 'Small handful', note: 'Iron & protein rich' },
          { emoji: '🌾', name: 'Makhana (fox nuts)', qty: '½ cup', note: 'Light and calcium-rich' },
        ]},
      ]},
      { time: '1:00 – 2:00 PM', icon: '☀️', name: 'Lunch', items: [
        { type: 'options', label: 'Choose one carbohydrate', options: [
          { emoji: '🍚', name: 'Rice (cooked)', qty: '¾ cup', note: 'With dal and sabzi' },
          { emoji: '🫓', name: 'Whole Wheat Roti', qty: '2 rotis', note: 'Preferred over maida' },
          { emoji: '🌾', name: 'Bajra / Jowar Roti', qty: '1–2 rotis', note: 'More iron than wheat' },
        ]},
        { type: 'options', label: 'Choose one dal / legume', options: [
          { emoji: '🫘', name: 'Toor / Moong / Masoor Dal', qty: '½ cup', note: 'Iron-rich' },
          { emoji: '🫘', name: 'Rajma (kidney beans)', qty: '½ cup', note: '' },
          { emoji: '🫘', name: 'Chhole (chickpeas)', qty: '½ cup', note: '' },
          { emoji: '🍗', name: 'Chicken / Fish curry', qty: '2–3 tbsp', note: 'Well cooked, bone-free' },
        ]},
        { emoji: '🥬', name: 'Green Vegetable Sabzi', qty: '½ cup', note: 'Spinach, beans, broccoli — iron-rich' },
        { emoji: '🥣', name: 'Curd', qty: '½ cup', note: 'Probiotics for digestion' },
      ]},
      { time: '4:30 – 5:00 PM', icon: '🌆', name: 'Evening Snack', items: [
        { type: 'options', label: 'Choose one healthy snack', options: [
          { emoji: '🥜', name: 'Peanut Butter on Roti', qty: '1 tbsp on 1 piece', note: '' },
          { emoji: '🍠', name: 'Boiled Sweet Potato', qty: '1 medium', note: 'Naturally sweet, no sugar' },
          { emoji: '🌽', name: 'Boiled Corn', qty: '½ cob', note: '' },
          { emoji: '🧀', name: 'Paneer + Roti', qty: '2 cubes + 1 small roti', note: '' },
          { emoji: '🌾', name: 'Makhana (roasted)', qty: '½ cup', note: 'Light and calcium-rich' },
        ]},
        { type: 'options', label: 'Choose one drink', options: [
          { emoji: '🥛', name: 'Lassi (plain, no sugar)', qty: '1 glass', note: '' },
          { emoji: '🥛', name: 'Buttermilk (chaas)', qty: '1 glass', note: 'Good for digestion' },
          { emoji: '🥛', name: 'Warm Cow\'s Milk', qty: '1 cup', note: '' },
        ]},
      ]},
      { time: '8:00 – 9:00 PM', icon: '🌙', name: 'Dinner', items: [
        { type: 'options', label: 'Choose one dinner carbohydrate', options: [
          { emoji: '🫓', name: 'Soft Roti + Dal', qty: '1–2 rotis + ½ cup dal', note: '' },
          { emoji: '🍚', name: 'Rice + Dal + Sabzi', qty: '½ cup rice + ½ cup dal', note: '' },
          { emoji: '🍚', name: 'Vegetable Khichdi', qty: '1 cup', note: 'One-pot balanced meal' },
        ]},
        { emoji: '🥦', name: 'Cooked Vegetables (any)', qty: '½ cup', note: 'Varied colours for vitamins' },
        { type: 'options', label: 'Choose bedtime milk', options: [
          { emoji: '🥛', name: 'Warm Cow\'s Milk', qty: '1 cup', note: 'Before sleep for calcium' },
          { emoji: '🥛', name: 'Warm Turmeric Milk', qty: '1 cup', note: 'Immunity boost' },
        ]},
      ]},
    ],
    avoidFoods: ['Chips, namkeen, biscuits (limit)', 'Aerated drinks', 'Excessive sugar (sweets, candy)', 'Excessive salt', 'Fast food (occasionally only)', 'Unpasteurised products'],
    warning: '⚠️ Iron deficiency is common at this age. Include dal, green vegetables, and vitamin C with each meal.',
  },
};

const normalizeUiData = (value) => {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizeUiData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeUiData(entry)]));
  }
  return value;
};

const hasRenderableDietPlan = (plan) =>
  !!plan &&
  typeof plan === 'object' &&
  typeof plan.intro === 'string' &&
  Array.isArray(plan.meals) &&
  plan.meals.length > 0 &&
  plan.meals.some((meal) => Array.isArray(meal?.items) && meal.items.length > 0);

const SUPERFOODS = [
  { name: 'Ragi (Finger Millet)', desc: 'Rich in calcium & iron — excellent for bone development', emoji: '🌾' },
  { name: 'Spinach (Palak)', desc: 'High in iron & folate — supports brain and blood', emoji: '🥬' },
  { name: 'Egg Yolk', desc: 'DHA & choline for brain and eye development', emoji: '🍳' },
  { name: 'Ghee / Sesame Oil', desc: 'Healthy fats for brain development and weight gain', emoji: '🫙' },
  { name: 'Moong Dal', desc: 'Easily digestible protein and B vitamins', emoji: '🫘' },
  { name: 'Banana', desc: 'Potassium, B6, instant energy — perfect first food', emoji: '🍌' },
];

function getAgeGroup(months) {
  if (months == null) return null;
  return AGE_GROUPS.find(g => months >= g.minMonths && months <= g.maxMonths) || AGE_GROUPS[AGE_GROUPS.length - 1];
}

function calcAgeMonths(dob) {
  if (!dob) return null;
  const ms = Date.now() - new Date(dob).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
}

const NAV = [
  ['🏠 Dashboard', '/parent/dashboard'],
  ['👶 My Child', '/parent/child-profile'],
  ['💉 Vaccines', '/parent/vaccination'],
  ['📈 Growth', '/parent/growth'],
  ['🥗 Diet Plan', '/parent/diet-plan'],
  ['🏛️ Schemes', '/parent/schemes'],
  ['📋 Reports', '/parent/reports'],
  ['🔔 Notifications', '/parent/notifications'],
];

export default function DietPlan() {
  const { navLinks, t } = useLanguage();
  const { selectedChild, children, loading: childLoading } = useSelectedChild();
  const [dietData, setDietData] = useState(null);
  const [dietLoading, setDietLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plan');
  const [error, setError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMeal, setCustomMeal] = useState({ name: '', time: '', items: '' });

  // Checklist state
  const [checks, setChecks] = useState([]);
  const [checkNotes, setCheckNotes] = useState('');
  const [checkCompletedAt, setCheckCompletedAt] = useState(null);
  const [streak, setStreak] = useState(0);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkSaving, setCheckSaving] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSaveCustomDiet = () => {
    console.log('Saving custom diet:', customMeal);
    alert(normalizeText(`Custom diet "${customMeal.name}" saved for ${selectedChild?.name}!`));
    setShowCustomForm(false);
    setCustomMeal({ name: '', time: '', items: '' });
  };

  const ageMonths = useMemo(() => {
    if (!selectedChild) return null;
    return selectedChild.ageInMonths ?? calcAgeMonths(selectedChild.dob);
  }, [selectedChild]);

  const ageGroup = useMemo(() => normalizeUiData(getAgeGroup(ageMonths)), [ageMonths]);

  useEffect(() => {
    if (!ageGroup?.tag) return;
    
    const fetchDiet = async () => {
      const staticFallback = ageGroup?.tag ? normalizeUiData(DIET_PLANS[ageGroup.tag]) : null;

      try {
        setDietLoading(true);
        setError('');
        const res = await dietAPI.getByAgeGroup(ageGroup.tag);
        const normalized = normalizeUiData(res.data);

        if (hasRenderableDietPlan(normalized)) {
          setDietData(normalized);
        } else if (staticFallback) {
          setDietData(staticFallback);
        } else {
          setDietData(normalized);
          setError('Diet data unavailable for age group');
        }
      } catch (err) {
        if (staticFallback) {
          setDietData(staticFallback);
        } else {
          setError('Diet data unavailable for age group');
        }
      } finally {
        setDietLoading(false);
      }
    };
    
    fetchDiet();
  }, [ageGroup]);

  const totalMeals = dietData?.meals?.length || 0;

  // Total checklist slots across all meals (each item or options-group = 1 slot)
  const totalCheckItems = useMemo(
    () => dietData?.meals?.reduce((s, m) => s + m.items.length, 0) ?? 0,
    [dietData]
  );

  // Count how many slots are "done" — options slot: any key "mi-ii:*" present; regular: "mi-ii" present
  const doneCount = useMemo(() => {
    if (!dietData?.meals) return 0;
    let count = 0;
    dietData.meals.forEach((meal, mi) => {
      meal.items.forEach((item, ii) => {
        if (item.type === 'options') {
          if (checks.some(k => k.startsWith(`${mi}-${ii}:`))) count++;
        } else {
          if (checks.includes(`${mi}-${ii}`)) count++;
        }
      });
    });
    return count;
  }, [checks, dietData]);

  // Load today's checklist + streak when child / diet data is ready
  useEffect(() => {
    if (!selectedChild?._id || !ageGroup?.tag) return;
    const childId = selectedChild._id;

    const load = async () => {
      setCheckLoading(true);
      try {
        const [clRes, stRes] = await Promise.all([
          dietChecklistAPI.get(childId, todayStr),
          dietChecklistAPI.streak(childId),
        ]);
        setChecks(clRes.data.checks ?? []);
        setCheckNotes(clRes.data.notes ?? '');
        setCheckCompletedAt(clRes.data.completedAt ?? null);
        setStreak(stRes.data.streak ?? 0);
      } catch {
        // silently ignore — checklist is optional
      } finally {
        setCheckLoading(false);
      }
    };
    load();
  }, [selectedChild?._id, ageGroup?.tag, todayStr]);

  // Save checklist to backend
  const saveChecklist = async (newChecks, newNotes) => {
    if (!selectedChild?._id || !ageGroup?.tag) return;
    setCheckSaving(true);
    try {
      const res = await dietChecklistAPI.save({
        childId: selectedChild._id,
        date: todayStr,
        ageGroup: ageGroup.tag,
        checks: newChecks,
        notes: newNotes,
        totalItems: totalCheckItems,
      });
      setCheckCompletedAt(res.data.completedAt ?? null);
    } catch {
      // silent
    } finally {
      setCheckSaving(false);
    }
  };

  // For regular items: toggle "mi-ii". For options: set "mi-ii:optIdx", clearing other options in same slot.
  const selectCheck = (key, isOption, slotPrefix) => {
    let next;
    if (isOption) {
      // remove any existing selection for this slot, then add new one
      const alreadySelected = checks.includes(key);
      next = checks.filter(k => !k.startsWith(slotPrefix + ':'));
      if (!alreadySelected) next = [...next, key];
    } else {
      next = checks.includes(key) ? checks.filter(k => k !== key) : [...checks, key];
    }
    setChecks(next);
    saveChecklist(next, checkNotes);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: themeColors.bg, minHeight: '100vh', color: themeColors.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dp-card{background:#fff;border:1.5px solid ${themeColors.border};border-radius:16px;box-shadow:0 2px 12px rgba(8,145,178,.07);padding:20px}
        .dp-tab{padding:9px 22px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:1.5px solid ${themeColors.border};background:#fff;color:${themeColors.muted};transition:all .2s;font-family:inherit}
        .dp-tab.active{background:${themeColors.teal};color:#fff;border-color:${themeColors.teal}}
        .dp-nav-link{padding:5px 11px;border-radius:6px;font-size:13px;font-weight:500;color:${themeColors.text};text-decoration:none;white-space:nowrap;transition:background .15s}
        .dp-nav-link:hover{background:${themeColors.teal3};color:${themeColors.teal2}}
        .dp-nav-link.active{background:${themeColors.teal4};color:${themeColors.teal};font-weight:600}
        @media(max-width:700px){.dp-nav-links{display:none!important}}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 62, boxShadow: '0 2px 12px rgba(8,145,178,.08)', gap: 16 }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${themeColors.teal},${themeColors.teal2})`, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: themeColors.teal2, lineHeight: 1.1 }}>Shishu Aarogya</div>
            <div style={{ fontSize: 9, color: '#4a7a8a', fontWeight: 500, lineHeight: 1 }}>National Child Health Portal</div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} style={{ padding: '5px 11px', borderRadius: 6, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background .15s', ...(to === '/parent/diet-plan' ? { background: themeColors.teal4, color: themeColors.teal, fontWeight: 600 } : { background: 'transparent', color: themeColors.text, fontWeight: 500 }) }}>
              {normalizeText(label)}
            </Link>
          ))}
        </div>
        {children.length > 1 && selectedChild && (
          <select value={selectedChild._id || ''} style={{ padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${themeColors.border}`, fontSize: 13, color: themeColors.text, outline: 'none', cursor: 'pointer' }} disabled>
            {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 26, fontWeight: 700, color: themeColors.text, margin: 0 }}>
            🥗 {t('dietPlan')}
          </h1>
          {selectedChild && ageMonths != null && (
            <p style={{ color: themeColors.muted, marginTop: 6, fontSize: 14 }}>
              {t('dietPlanFor')} <strong>{selectedChild.name}</strong> — {ageGroup?.label} ({ageMonths} {t('ageMonths')})
            </p>
          )}
        </div>

        {childLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: themeColors.muted }}>{t('loading')}...</div>
        ) : !selectedChild ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👶</div>
            <p style={{ color: themeColors.muted }}>{t('noRecords')}. <Link to="/parent/child-profile" style={{ color: themeColors.teal }}>{t('addChild')}</Link></p>
          </div>
        ) : dietLoading ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #c5e8ef', borderTopColor: themeColors.teal, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: 16, color: themeColors.muted }}>{t('loading')} {t('dietPlan').toLowerCase()}...</div>
          </div>
        ) : error ? (
          <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>⚠️ {error}</div>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: themeColors.teal, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              {t('refresh')}
            </button>
          </div>
        ) : !dietData ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 40, textAlign: 'center', color: themeColors.muted }}>
            {t('noData')}
          </div>
        ) : (
          <div>
            <button 
              onClick={() => setShowCustomForm(!showCustomForm)}
              style={{ padding: '10px 20px', background: themeColors.teal, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginBottom: 24 }}
            >
              {showCustomForm ? t('cancel') : t('add')}
            </button>
            
            {showCustomForm && (
              <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h5 style={{ marginBottom: 16, color: themeColors.teal2 }}>Create Custom Diet for {selectedChild?.name}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <input 
                    placeholder="Meal name (e.g. Breakfast)" 
                    value={customMeal.name} 
                    onChange={e => setCustomMeal({...customMeal, name: e.target.value})}
                    style={{ padding: 12, border: `1.5px solid ${themeColors.border}`, borderRadius: 10, fontSize: 13 }}
                  />
                  <input 
                    placeholder="Time (e.g. 8 AM)" 
                    value={customMeal.time} 
                    onChange={e => setCustomMeal({...customMeal, time: e.target.value})}
                    style={{ padding: 12, border: `1.5px solid ${themeColors.border}`, borderRadius: 10, fontSize: 13 }}
                  />
                  <textarea 
                    placeholder="Foods (e.g. Oatmeal, banana, milk)" 
                    value={customMeal.items} 
                    onChange={e => setCustomMeal({...customMeal, items: e.target.value})}
                    rows={3}
                    style={{ padding: 12, border: `1.5px solid ${themeColors.border}`, borderRadius: 10, fontSize: 13, gridColumn: '1 / -1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleSaveCustomDiet}
                    disabled={!customMeal.name || !customMeal.items}
                    style={{ padding: '12px 24px', background: themeColors.teal, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: customMeal.name && customMeal.items ? 'pointer' : 'not-allowed' }}
                  >
                    💾 Save Custom Diet
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: dietData.color, border: `1.5px solid ${themeColors.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: themeColors.text, marginBottom: 6 }}>
                📅 {ageGroup.label} — {totalMeals} feeding sessions per day
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { key: 'plan', label: '📋 Daily Meal Plan' },
                { key: 'checklist', label: `✅ Daily Checklist${doneCount > 0 ? ` (${doneCount}/${totalCheckItems})` : ''}` },
                { key: 'superfoods', label: '⭐ Superfoods & Tips' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1.5px solid #c5e8ef', background: activeTab === tab.key ? themeColors.teal : '#fff', color: activeTab === tab.key ? '#fff' : themeColors.muted }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'plan' && (
              <div style={{ display: 'grid', gap: 16 }}>
                {dietData.meals.map((meal, mi) => (
                  <div key={mi} style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ background: dietData.color, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{meal.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: themeColors.text }}>{meal.name}</div>
                          <div style={{ fontSize: 12, color: themeColors.muted }}>🕐 {meal.time}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      {meal.items.map((item, ii) => {
                        const border = ii < meal.items.length - 1 ? `1px solid ${themeColors.border}` : 'none';
                        if (item.type === 'options') {
                          return (
                            <div key={ii} style={{ padding: '10px 0', borderBottom: border }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: themeColors.teal2, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                                🔀 {item.label}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {item.options.map((opt, oi) => (
                                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: themeColors.teal4, border: `1px solid ${themeColors.border}`, borderRadius: 10 }}>
                                    <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: 13, color: themeColors.text }}>{opt.name}</div>
                                      <div style={{ fontSize: 11, color: themeColors.muted }}>📏 {opt.qty}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: border }}>
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: themeColors.text }}>{item.name}</div>
                              <div style={{ fontSize: 12, color: themeColors.teal, fontWeight: 500 }}>📏 {item.qty}</div>
                              {item.note && <div style={{ fontSize: 11, color: themeColors.muted, marginTop: 2 }}>💡 {item.note}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 16, marginTop: 20, padding: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c2410c', marginBottom: 12 }}>🚫 Foods to Avoid</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {dietData.avoidFoods.map((f, i) => (
                      <span key={i} style={{ padding: '5px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        ✕ {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div>
                {/* Day complete banner */}
                {doneCount === totalCheckItems && totalCheckItems > 0 && (
                  <div style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 36 }}>🎉</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#065f46' }}>Day Complete! Amazing job!</div>
                      <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
                        All {totalCheckItems} feeding slots completed today for {selectedChild?.name}.
                        {streak > 0 && <span> 🔥 <strong>{streak}-day streak!</strong></span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ background: '#fff', border: `1.5px solid ${themeColors.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: themeColors.text }}>Today's Progress</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: themeColors.teal }}>{doneCount} / {totalCheckItems} slots</span>
                  </div>
                  <div style={{ background: themeColors.teal3, borderRadius: 99, height: 12, overflow: 'hidden' }}>
                    <div style={{
                      background: `linear-gradient(90deg,${themeColors.teal},${themeColors.teal2})`,
                      height: '100%',
                      borderRadius: 99,
                      width: `${totalCheckItems > 0 ? Math.round((doneCount / totalCheckItems) * 100) : 0}%`,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                  {streak > 0 && doneCount < totalCheckItems && (
                    <div style={{ marginTop: 8, fontSize: 12, color: themeColors.muted }}>🔥 Current streak: <strong>{streak} day{streak !== 1 ? 's' : ''}</strong></div>
                  )}
                </div>

                {checkLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: themeColors.muted }}>Loading checklist...</div>
                ) : (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {dietData.meals.map((meal, mi) => {
                      const mealDone = meal.items.filter((item, ii) => {
                        const slot = `${mi}-${ii}`;
                        return item.type === 'options'
                          ? checks.some(k => k.startsWith(slot + ':'))
                          : checks.includes(slot);
                      }).length;
                      return (
                        <div key={mi} style={{ background: '#fff', border: `1.5px solid ${themeColors.border}`, borderRadius: 16, overflow: 'hidden' }}>
                          <div style={{ background: dietData.color, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{meal.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: themeColors.text }}>{meal.name}</div>
                              <div style={{ fontSize: 12, color: themeColors.muted }}>🕐 {meal.time}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: 12, color: themeColors.teal, fontWeight: 600 }}>
                              {mealDone}/{meal.items.length} done
                            </div>
                          </div>
                          <div style={{ padding: '10px 20px' }}>
                            {meal.items.map((item, ii) => {
                              const slot = `${mi}-${ii}`;
                              const borderStyle = ii < meal.items.length - 1 ? `1px solid ${themeColors.border}` : 'none';

                              if (item.type === 'options') {
                                const selected = checks.find(k => k.startsWith(slot + ':'));
                                const slotDone = !!selected;
                                return (
                                  <div key={ii} style={{ padding: '10px 0', borderBottom: borderStyle }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                      {slotDone
                                        ? <span style={{ fontSize: 16 }}>✅</span>
                                        : <span style={{ fontSize: 15, color: themeColors.muted }}>⬜</span>}
                                      <span style={{ fontSize: 12, fontWeight: 700, color: themeColors.teal2, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                        {item.label}
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gap: 6, paddingLeft: 8 }}>
                                      {item.options.map((opt, oi) => {
                                        const optKey = `${slot}:${oi}`;
                                        const isSelected = checks.includes(optKey);
                                        return (
                                          <label key={oi} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                            borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${isSelected ? themeColors.teal : themeColors.border}`,
                                            background: isSelected ? themeColors.teal4 : '#fafafa', transition: 'all .15s',
                                          }}>
                                            <input
                                              type="radio"
                                              name={`slot-${slot}`}
                                              checked={isSelected}
                                              onChange={() => selectCheck(optKey, true, slot)}
                                              style={{ accentColor: themeColors.teal, cursor: 'pointer', flexShrink: 0 }}
                                            />
                                            <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? themeColors.teal2 : themeColors.text }}>{opt.name}</div>
                                              <div style={{ fontSize: 11, color: themeColors.muted }}>📏 {opt.qty}{opt.note ? ` · ${opt.note}` : ''}</div>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                              // Regular item — checkbox
                              const checked = checks.includes(slot);
                              return (
                                <label key={ii} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: borderStyle, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => selectCheck(slot, false, slot)}
                                    style={{ width: 18, height: 18, accentColor: themeColors.teal, cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: checked ? themeColors.muted : themeColors.text, textDecoration: checked ? 'line-through' : 'none' }}>{item.name}</div>
                                    <div style={{ fontSize: 12, color: themeColors.teal, fontWeight: 500 }}>📏 {item.qty}</div>
                                    {item.note && <div style={{ fontSize: 11, color: themeColors.muted }}>💡 {item.note}</div>}
                                  </div>
                                  {checked && <span style={{ fontSize: 18 }}>✅</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notes */}
                <div style={{ background: '#fff', border: `1.5px solid ${themeColors.border}`, borderRadius: 14, padding: 20, marginTop: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: 14, color: themeColors.text, display: 'block', marginBottom: 8 }}>📝 Notes for today</label>
                  <textarea
                    rows={3}
                    placeholder="Any observations about meals today... (e.g. baby refused spinach)"
                    value={checkNotes}
                    onChange={e => {
                      setCheckNotes(e.target.value);
                      saveChecklist(checks, e.target.value);
                    }}
                    style={{ width: '100%', padding: 12, border: `1.5px solid ${themeColors.border}`, borderRadius: 10, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                  />
                  {checkSaving && <div style={{ fontSize: 11, color: themeColors.muted, marginTop: 4 }}>Saving...</div>}
                </div>
              </div>
            )}

            {activeTab === 'superfoods' && (
              <div>
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginBottom: 24 }}>
                  {SUPERFOODS.map((sf, i) => (
                    <div key={i} style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{sf.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: themeColors.text, marginBottom: 4 }}>{sf.name}</div>
                        <div style={{ fontSize: 12, color: themeColors.muted, lineHeight: 1.5 }}>{sf.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: themeColors.teal2, marginBottom: 14 }}>
                    💡 Feeding Tips for {ageGroup.label}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {dietData.tips.map((tip, i) => (
                      <li key={i} style={{ fontSize: 13, color: themeColors.text, lineHeight: 1.7, marginBottom: 6 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{ background: themeColors.teal2, color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '16px 24px', fontSize: 12 }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </div>
  );
}
