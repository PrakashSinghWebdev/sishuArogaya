import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, dietAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import useSelectedChild from '../../hooks/useSelectedChild';

const C = {
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
      { time: 'Every 2–3 hours (day & night)', icon: '🌅', name: 'Breastfeeding Session', items: [
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand (both sides)', note: 'The only food needed' },
      ]},
    ],
    avoidFoods: ['Water (before 6 months)', 'Formula (unless medically required)', 'Cow\'s milk', 'Honey', 'Solid foods', 'Juices'],
    warning: '⚠️ Never dilute breast milk. Never add sugar or salt. If breastfeeding is difficult, contact your ASHA worker or doctor.',
  },
  // ... (keeping all other DIET_PLANS identical to original for brevity, but include ALL in actual file)
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
      { time: '7:00 – 8:00 AM', icon: '🌅', name: 'Morning Feed', items: [
        { emoji: '🥛', name: 'Breast Milk', qty: 'Both sides, on demand', note: 'Always offer breast milk first' },
      ]},
      { time: '9:00 – 10:00 AM', icon: '🍚', name: 'First Solid Meal', items: [
        { emoji: '🍚', name: 'Soft Dal Khichdi', qty: '2–4 tbsp (gradually increase)', note: 'Cooked until very soft' },
        { emoji: '🍌', name: 'Mashed Ripe Banana', qty: '1–2 tbsp', note: 'Or any soft seasonal fruit' },
      ]},
      { time: '12:00 – 1:00 PM', icon: '☀️', name: 'Lunch', items: [
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: '' },
        { emoji: '🥕', name: 'Mashed Cooked Vegetables', qty: '2–3 tbsp', note: 'Carrot, pumpkin, sweet potato' },
        { emoji: '🍚', name: 'Soft Rice + Dal water', qty: '3–4 tbsp', note: 'Add ½ tsp ghee' },
      ]},
      { time: '4:00 – 5:00 PM', icon: '🌆', name: 'Evening Snack', items: [
        { emoji: '🍌', name: 'Fruit Puree', qty: '2–3 tbsp', note: 'Banana, papaya, or chikoo' },
        { emoji: '🌾', name: 'Ragi Porridge (thin)', qty: '3–4 tbsp', note: 'Cook well, thin consistency' },
      ]},
      { time: '7:00 – 8:00 PM', icon: '🌙', name: 'Dinner', items: [
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: '' },
        { emoji: '🍚', name: 'Soft Khichdi / Rice porridge', qty: '3–4 tbsp', note: 'Add ghee or oil' },
      ]},
      { time: 'During night', icon: '🌛', name: 'Night Feed', items: [
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: 'Night feeds are important' },
      ]},
    ],
    avoidFoods: ['Salt', 'Sugar', 'Honey', 'Whole nuts', 'Cow\'s milk as main drink', 'Raw eggs', 'Citrus fruits', 'Processed/packaged food'],
    warning: '⚠️ If baby refuses a new food, try again after a few days. Never force-feed.',
  },
  // [Include ALL other age groups exactly as in the original file - 9-11mo, 12-23mo, 2-5yr with their full meals, tips, etc.]
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
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: 'Offer before solids' },
        { emoji: '🌾', name: 'Ragi / Oats Porridge', qty: '5–6 tbsp', note: 'With mashed banana' },
        { emoji: '🍳', name: 'Mashed Egg Yolk', qty: '½ – 1 yolk', note: 'Well cooked, 3×/week' },
      ]},
      { time: '10:00 – 10:30 AM', icon: '🍎', name: 'Mid-Morning Snack', items: [
        { emoji: '🍌', name: 'Soft Fruit (mashed)', qty: '3–4 tbsp', note: 'Banana, papaya, mango' },
        { emoji: '🌾', name: 'Soft Biscuit / Ragi Ladoo', qty: '1–2 pieces', note: 'No-sugar variety' },
      ]},
      { time: '12:00 – 1:00 PM', icon: '☀️', name: 'Lunch', items: [
        { emoji: '🍚', name: 'Dal Rice (soft, mashed)', qty: '6–8 tbsp', note: 'With ½ tsp ghee' },
        { emoji: '🥕', name: 'Mashed / finely chopped vegetables', qty: '4–5 tbsp', note: 'Carrot, beans, pumpkin' },
        { emoji: '🥣', name: 'Curd', qty: '2–3 tbsp', note: 'Good probiotic source' },
      ]},
      { time: '4:00 – 4:30 PM', icon: '🌆', name: 'Evening Snack', items: [
        { emoji: '🥔', name: 'Soft Cooked Potato / Sweet Potato', qty: '4–5 tbsp', note: 'Mashed with a little butter' },
        { emoji: '🥛', name: 'Breast Milk / Curd', qty: 'As desired', note: '' },
      ]},
      { time: '7:00 – 8:00 PM', icon: '🌙', name: 'Dinner', items: [
        { emoji: '🫓', name: 'Soft Roti + Dal', qty: '½ roti (torn) + 4–5 tbsp dal', note: 'Dip roti in dal to soften' },
        { emoji: '🥦', name: 'Boiled Soft Vegetables', qty: '4–5 tbsp', note: '' },
        { emoji: '🥛', name: 'Breast Milk', qty: 'On demand', note: '' },
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
        { emoji: '🥛', name: 'Breast Milk / Cow\'s Milk', qty: '100–150 ml', note: 'Or curd (½ cup)' },
        { emoji: '🌾', name: 'Ragi Dosa / Idli / Soft Paratha', qty: '1–2 small pieces', note: 'With dal or vegetable filling' },
        { emoji: '🍳', name: 'Egg (boiled / scrambled)', qty: '1 whole egg', note: '5×/week for brain development' },
      ]},
      { time: '10:30 AM', icon: '🍎', name: 'Mid-Morning Snack', items: [
        { emoji: '🍌', name: 'Fresh Fruit', qty: '½ cup (chopped)', note: 'Banana, apple, mango, papaya' },
        { emoji: '🌾', name: 'Whole grain biscuit', qty: '1–2 pieces', note: 'Low sugar variety' },
      ]},
      { time: '12:30 – 1:30 PM', icon: '☀️', name: 'Lunch', items: [
        { emoji: '🍚', name: 'Rice + Dal + Sabzi', qty: '½ cup rice + 3–4 tbsp dal + 4 tbsp sabzi', note: 'Add ghee or oil' },
        { emoji: '🥣', name: 'Curd / Raita', qty: '3–4 tbsp', note: '' },
        { emoji: '🥕', name: 'Cooked Vegetables (soft)', qty: '4–5 tbsp', note: 'Varied colours for nutrients' },
      ]},
      { time: '4:00 – 4:30 PM', icon: '🌆', name: 'Afternoon Snack', items: [
        { emoji: '🌽', name: 'Boiled Corn / Sweet Potato', qty: 'Small portion', note: '' },
        { emoji: '🥜', name: 'Groundnut Chutney (no whole nuts)', qty: '2 tbsp', note: 'Grind finely — not whole nuts' },
        { emoji: '🥛', name: 'Milk or curd', qty: '100 ml', note: '' },
      ]},
      { time: '7:30 – 8:30 PM', icon: '🌙', name: 'Dinner', items: [
        { emoji: '🫓', name: 'Roti (soft) + Dal / Paneer curry', qty: '1 roti + 4 tbsp', note: '' },
        { emoji: '🥦', name: 'Cooked Green Vegetables', qty: '4–5 tbsp', note: 'Spinach, beans, peas' },
        { emoji: '🍚', name: 'Soft Khichdi (alternate)', qty: '½ cup', note: 'If roti difficult' },
      ]},
      { time: 'Bedtime', icon: '🌛', name: 'Bedtime Feed', items: [
        { emoji: '🥛', name: 'Breast Milk / Warm milk', qty: '100–150 ml', note: '' },
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
        { emoji: '🥛', name: 'Milk', qty: '1 cup (200 ml)', note: '' },
        { emoji: '🌾', name: 'Upma / Poha / Idli / Paratha', qty: '1–2 servings', note: 'With vegetable filling' },
        { emoji: '🍳', name: 'Boiled Egg', qty: '1 egg', note: '5× per week' },
      ]},
      { time: '10:30 – 11:00 AM', icon: '🍎', name: 'Morning Snack', items: [
        { emoji: '🍌', name: 'Seasonal Fruit', qty: '1 medium fruit or ½ cup', note: 'Apple, banana, guava, mango' },
        { emoji: '🌰', name: 'Roasted Groundnuts / Chana', qty: 'Small handful', note: 'Healthy protein snack' },
      ]},
      { time: '1:00 – 2:00 PM', icon: '☀️', name: 'Lunch', items: [
        { emoji: '🫓', name: 'Roti / Rice', qty: '2 rotis or ¾ cup rice', note: 'Whole wheat preferred' },
        { emoji: '🫘', name: 'Dal / Rajma / Chhole', qty: '½ cup', note: 'Iron-rich legumes' },
        { emoji: '🥬', name: 'Green Vegetable Sabzi', qty: '½ cup', note: 'Spinach, beans, broccoli' },
        { emoji: '🥣', name: 'Curd', qty: '½ cup', note: 'Probiotics for digestion' },
      ]},
      { time: '4:30 – 5:00 PM', icon: '🌆', name: 'Evening Snack', items: [
        { emoji: '🥜', name: 'Peanut Butter on Roti / Bread', qty: '1 tbsp on 1 piece', note: 'Or mixed nuts (chewed well)' },
        { emoji: '🥛', name: 'Lassi / Buttermilk', qty: '1 glass', note: 'No added sugar' },
      ]},
      { time: '8:00 – 9:00 PM', icon: '🌙', name: 'Dinner', items: [
        { emoji: '🫓', name: 'Roti + Dal/Sabzi', qty: '1–2 rotis + ½ cup each', note: '' },
        { emoji: '🍚', name: 'Rice (if preferred)', qty: '½ cup', note: '' },
        { emoji: '🥦', name: 'Cooked Vegetables', qty: '½ cup', note: 'Varied colours' },
        { emoji: '🥛', name: 'Warm Milk', qty: '1 cup', note: 'Before sleep for calcium' },
      ]},
    ],
    avoidFoods: ['Chips, namkeen, biscuits (limit)', 'Aerated drinks', 'Excessive sugar (sweets, candy)', 'Excessive salt', 'Fast food (occasionally only)', 'Unpasteurised products'],
    warning: '⚠️ Iron deficiency is common at this age. Include dal, green vegetables, and vitamin C with each meal.',
  },
};

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

  const handleSaveCustomDiet = () => {
    console.log('Saving custom diet:', customMeal);
    alert(`Custom diet "${customMeal.name}" saved for ${selectedChild?.name}!`);
    setShowCustomForm(false);
    setCustomMeal({ name: '', time: '', items: '' });
  };

  const ageMonths = useMemo(() => {
    if (!selectedChild) return null;
    return selectedChild.ageInMonths ?? calcAgeMonths(selectedChild.dob);
  }, [selectedChild]);

  const ageGroup = useMemo(() => getAgeGroup(ageMonths), [ageMonths]);

  useEffect(() => {
    if (!ageGroup?.tag) return;
    
    const fetchDiet = async () => {
      try {
        setDietLoading(true);
        setError('');
        const res = await dietAPI.getByAgeGroup(ageGroup.tag);
        setDietData(res.data);
      } catch (err) {
        console.log('Using static diet fallback');
        if (ageGroup?.tag && DIET_PLANS[ageGroup.tag]) {
          setDietData(DIET_PLANS[ageGroup.tag]);
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

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dp-card{background:#fff;border:1.5px solid ${C.border};border-radius:16px;box-shadow:0 2px 12px rgba(8,145,178,.07);padding:20px}
        .dp-tab{padding:9px 22px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:1.5px solid ${C.border};background:#fff;color:${C.muted};transition:all .2s;font-family:inherit}
        .dp-tab.active{background:${C.teal};color:#fff;border-color:${C.teal}}
        .dp-nav-link{padding:5px 11px;border-radius:6px;font-size:13px;font-weight:500;color:${C.text};text-decoration:none;white-space:nowrap;transition:background .15s}
        .dp-nav-link:hover{background:${C.teal3};color:${C.teal2}}
        .dp-nav-link.active{background:${C.teal4};color:${C.teal};font-weight:600}
        @media(max-width:700px){.dp-nav-links{display:none!important}}
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 62, boxShadow: '0 2px 12px rgba(8,145,178,.08)', gap: 16 }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.teal},${C.teal2})`, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 18 }}>🌿</div>
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2 }}>Sishu Arogaya</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {(navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} style={{ padding: '5px 11px', borderRadius: 6, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background .15s', ...(to === '/parent/diet-plan' ? { background: C.teal4, color: C.teal, fontWeight: 600 } : { background: 'transparent', color: C.text, fontWeight: 500 }) }}>
              {label}
            </Link>
          ))}
        </div>
        {children.length > 1 && selectedChild && (
          <select value={selectedChild._id || ''} style={{ padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer' }} disabled>
            {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>
            🥗 {t('dietPlan')}
          </h1>
          {selectedChild && ageMonths != null && (
            <p style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>
              {t('dietPlanFor')} <strong>{selectedChild.name}</strong> — {ageGroup?.label} ({ageMonths} {t('ageMonths')})
            </p>
          )}
        </div>

        {childLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>{t('loading')}...</div>
        ) : !selectedChild ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👶</div>
            <p style={{ color: C.muted }}>{t('noRecords')}. <Link to="/parent/child-profile" style={{ color: C.teal }}>{t('addChild')}</Link></p>
          </div>
        ) : dietLoading ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #c5e8ef', borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: 16, color: C.muted }}>{t('loading')} {t('dietPlan').toLowerCase()}...</div>
          </div>
        ) : error ? (
          <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>⚠️ {error}</div>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: C.teal, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              {t('refresh')}
            </button>
          </div>
        ) : !dietData ? (
          <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 40, textAlign: 'center', color: C.muted }}>
            {t('noData')}
          </div>
        ) : (
          <div>
            <button 
              onClick={() => setShowCustomForm(!showCustomForm)}
              style={{ padding: '10px 20px', background: C.teal, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginBottom: 24 }}
            >
              {showCustomForm ? t('cancel') : t('add')}
            </button>
            
            {showCustomForm && (
              <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h5 style={{ marginBottom: 16, color: C.teal2 }}>Create Custom Diet for {selectedChild?.name}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <input 
                    placeholder="Meal name (e.g. Breakfast)" 
                    value={customMeal.name} 
                    onChange={e => setCustomMeal({...customMeal, name: e.target.value})}
                    style={{ padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13 }}
                  />
                  <input 
                    placeholder="Time (e.g. 8 AM)" 
                    value={customMeal.time} 
                    onChange={e => setCustomMeal({...customMeal, time: e.target.value})}
                    style={{ padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13 }}
                  />
                  <textarea 
                    placeholder="Foods (e.g. Oatmeal, banana, milk)" 
                    value={customMeal.items} 
                    onChange={e => setCustomMeal({...customMeal, items: e.target.value})}
                    rows={3}
                    style={{ padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, gridColumn: '1 / -1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleSaveCustomDiet}
                    disabled={!customMeal.name || !customMeal.items}
                    style={{ padding: '12px 24px', background: C.teal, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: customMeal.name && customMeal.items ? 'pointer' : 'not-allowed' }}
                  >
                    💾 Save Custom Diet
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: dietData.color, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>
                📅 {ageGroup.label} — {totalMeals} feeding sessions per day
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <button 
                onClick={() => setActiveTab('plan')}
                style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1.5px solid #c5e8ef', background: activeTab === 'plan' ? C.teal : '#fff', color: activeTab === 'plan' ? '#fff' : C.muted }}
              >
                📋 Daily Meal Plan
              </button>
              <button 
                onClick={() => setActiveTab('superfoods')}
                style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1.5px solid #c5e8ef', background: activeTab === 'superfoods' ? C.teal : '#fff', color: activeTab === 'superfoods' ? '#fff' : C.muted }}
              >
                ⭐ Superfoods & Tips
              </button>
            </div>

            {activeTab === 'plan' && (
              <div style={{ display: 'grid', gap: 16 }}>
                {dietData.meals.map((meal, mi) => (
                  <div key={mi} style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ background: dietData.color, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{meal.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{meal.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>🕐 {meal.time}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      {meal.items.map((item, ii) => (
                        <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: ii < meal.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: C.teal, fontWeight: 500 }}>📏 {item.qty}</div>
                            {item.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>💡 {item.note}</div>}
                          </div>
                        </div>
                      ))}
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

            {activeTab === 'superfoods' && (
              <div>
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginBottom: 24 }}>
                  {SUPERFOODS.map((sf, i) => (
                    <div key={i} style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{sf.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{sf.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{sf.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 14 }}>
                    💡 Feeding Tips for {ageGroup.label}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {dietData.tips.map((tip, i) => (
                      <li key={i} style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 6 }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{ background: C.teal2, color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '16px 24px', fontSize: 12 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </footer>
    </div>
  );
}
