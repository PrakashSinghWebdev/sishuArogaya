import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSelectedChild from '../../hooks/useSelectedChild';

const C = {
  teal: '#0891b2', teal2: '#0e7490', teal3: '#cffafe', teal4: '#f0fdff',
  bg: '#f8fffe', text: '#0c2340', muted: '#4a7a8a', border: '#c5e8ef',
};

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

const SLIDES = [
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1400&q=80&fit=crop',
];

// Recommended meal plan (6–9 months age range baseline)
const MEAL_PLAN = [
  {
    id: 'morning', icon: '🌅', name: 'Morning', time: '7:00 – 8:00 AM', kcal: 220, headerBg: '#fef9c3',
    items: [
      { emoji: '🥛', name: 'Breast Milk / Formula', qty: '150–200 ml', kcal: 100 },
      { emoji: '🍌', name: 'Mashed Banana', qty: '2–3 tbsp', kcal: 40 },
      { emoji: '🍚', name: 'Soft Dal Khichdi', qty: '4–5 tbsp', kcal: 80 },
    ],
  },
  {
    id: 'midmorning', icon: '🍎', name: 'Mid-Morning Snack', time: '10:00 – 10:30 AM', kcal: 80, headerBg: '#dcfce7',
    items: [
      { emoji: '🍊', name: 'Seasonal Fruit Puree', qty: '3–4 tbsp', kcal: 35 },
      { emoji: '🌾', name: 'Ragi Biscuit', qty: '2–3 pcs', kcal: 45 },
    ],
  },
  {
    id: 'lunch', icon: '☀️', name: 'Lunch', time: '12:00 – 1:00 PM', kcal: 185, headerBg: '#dbeafe',
    items: [
      { emoji: '🍚', name: 'Soft Rice + Dal', qty: '5–6 tbsp', kcal: 110 },
      { emoji: '🥕', name: 'Mashed Vegetables', qty: '3–4 tbsp', kcal: 45 },
      { emoji: '🥣', name: 'Curd', qty: '2–3 tbsp', kcal: 30 },
    ],
  },
  {
    id: 'evening', icon: '🌆', name: 'Evening Snack', time: '4:00 – 4:30 PM', kcal: 130, headerBg: '#ede9fe',
    items: [
      { emoji: '🌾', name: 'Suji Halwa', qty: '4–5 tbsp', kcal: 70 },
      { emoji: '🥔', name: 'Mashed Potato', qty: '3–4 tbsp', kcal: 60 },
    ],
  },
  {
    id: 'dinner', icon: '🌙', name: 'Dinner', time: '7:00 – 8:00 PM', kcal: 235, headerBg: C.teal3,
    items: [
      { emoji: '🫓', name: 'Soft Roti + Dal', qty: '½ roti + 4 tbsp', kcal: 95 },
      { emoji: '🥦', name: 'Boiled Vegetables', qty: '4–5 tbsp', kcal: 40 },
      { emoji: '🥛', name: 'Milk', qty: '150–200 ml', kcal: 100 },
    ],
  },
  {
    id: 'bedtime', icon: '🌛', name: 'Bedtime Feed', time: '9:00 – 9:30 PM', kcal: 100, headerBg: '#fce7f3',
    items: [
      { emoji: '🥛', name: 'Breast Milk / Formula', qty: '120–150 ml', kcal: 100 },
    ],
  },
];

const TOTAL_KCAL = MEAL_PLAN.reduce((s, m) => s + m.kcal, 0);

const AVOID_FOODS = [
  { name: 'Honey', reason: 'Risk of botulism' },
  { name: 'Whole Nuts', reason: 'Choking hazard' },
  { name: 'Salt & Sugar', reason: 'Kidney strain' },
  { name: 'Cow\'s Milk (as main)', reason: 'Not before 1 year' },
  { name: 'Citrus Fruits', reason: 'Acidity risk' },
  { name: 'Raw Egg Whites', reason: 'Allergy risk' },
];

const SUPERFOODS = [
  { name: 'Ragi (Finger Millet)', desc: 'Rich in calcium & iron, excellent for bone development' },
  { name: 'Spinach', desc: 'High in iron & folate, supports brain growth' },
  { name: 'Egg Yolk', desc: 'Packed with DHA, choline for cognitive development' },
  { name: 'Ghee', desc: 'Healthy fats for brain & weight gain' },
  { name: 'Moong Dal', desc: 'Easily digestible protein and B vitamins' },
];

const FOODS_LIST = ['Milk', 'Banana', 'Dal Khichdi', 'Curd', 'Rice + Dal', 'Egg Yolk', 'Ragi Porridge', 'Fruit Puree', 'Paneer', 'Suji Halwa'];
const MEAL_DEFS = [
  ['morning', 'Morning', '7:00 – 8:00 AM'],
  ['mid', 'Mid-Morning', '10:00 AM'],
  ['lunch', 'Lunch', '12:00 – 1:00 PM'],
  ['evening', 'Evening', '4:00 PM'],
  ['dinner', 'Dinner', '7:00 – 8:00 PM'],
];

function MyDietPlan() {
  const init = Object.fromEntries(MEAL_DEFS.map((m) => [m[0], []]));
  const [plan, setPlan] = useState(init);
  const [edit, setEdit] = useState(null);
  const [title, setTitle] = useState('');
  const [food, setFood] = useState({ name: '', qty: '', cal: '' });
  const [saved, setSaved] = useState([]);
  const ref = useRef(null);
  const total = Object.values(plan).flat().reduce((sum, item) => sum + (parseInt(item.cal, 10) || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
      <div>
        <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(8,145,178,.07)' }}>
          <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2, marginBottom: 16 }}>✏️ Build My Diet Plan</h5>
          <input placeholder="Plan name (e.g. Arjun's Custom Plan)"
            value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16, color: C.text }} />

          {MEAL_DEFS.map((meal) => (
            <div key={meal[0]} style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{meal[1]}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{meal[2]}</div>
                </div>
                <button onClick={() => setEdit(edit === meal[0] ? null : meal[0])}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${C.border}`, background: edit === meal[0] ? C.teal4 : '#fff', color: C.teal, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {edit === meal[0] ? 'Close' : '+ Add Food'}
                </button>
              </div>

              {(plan[meal[0]] || []).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.teal4, borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.qty}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 100, background: C.teal3, color: C.teal2, fontSize: 11, fontWeight: 700 }}>{item.cal} kcal</span>
                    <button onClick={() => setPlan((p) => ({ ...p, [meal[0]]: p[meal[0]].filter((x) => x.id !== item.id) }))}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center' }}>×</button>
                  </div>
                </div>
              ))}

              {edit === meal[0] && (
                <div style={{ background: C.teal4, borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <input ref={ref} placeholder="Food name" value={food.name}
                        onChange={(e) => setFood((p) => ({ ...p, name: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text }} />
                      {food.name && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                          {FOODS_LIST.filter((x) => x.toLowerCase().includes(food.name.toLowerCase())).slice(0, 4).map((x) => (
                            <button key={x} onClick={() => { setFood((p) => ({ ...p, name: x })); ref.current?.focus(); }}
                              style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, background: '#fff', color: C.teal, cursor: 'pointer', fontFamily: 'inherit' }}>{x}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input placeholder="Quantity (e.g. 4 tbsp)" value={food.qty}
                      onChange={(e) => setFood((p) => ({ ...p, qty: e.target.value }))}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text }} />
                    <input type="number" placeholder="kcal" value={food.cal}
                      onChange={(e) => setFood((p) => ({ ...p, cal: e.target.value }))}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text }} />
                  </div>
                  <button onClick={() => {
                    if (!food.name.trim() || !food.qty.trim()) return;
                    setPlan((p) => ({ ...p, [meal[0]]: [...p[meal[0]], { id: Date.now(), ...food, cal: parseInt(food.cal, 10) || 0 }] }));
                    setFood({ name: '', qty: '', cal: '' });
                  }} style={{ marginTop: 10, padding: '8px 18px', background: C.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Add to {meal[1]}
                  </button>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => { if (!title.trim()) return; setSaved((p) => [{ id: Date.now(), title, total }, ...p]); }}
              style={{ padding: '10px 22px', background: C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              💾 Save Plan
            </button>
            <button onClick={() => { setPlan(init); setTitle(''); }}
              style={{ padding: '10px 18px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(8,145,178,.07)', marginBottom: 14 }}>
          <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: C.teal2, marginBottom: 8 }}>Daily Summary</h5>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Custom total calories</div>
          <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 42, fontWeight: 700, color: C.teal, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>kcal</div>
        </div>
        <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(8,145,178,.07)' }}>
          <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: C.teal2, marginBottom: 12 }}>📁 Saved Plans</h5>
          {saved.length === 0 ? (
            <div style={{ fontSize: 13, color: C.muted }}>No saved plans yet.</div>
          ) : saved.map((item) => (
            <div key={item.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.total} kcal / day</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DietPlan() {
  const { children, selectedChild, selectedChildId, setSelectedChild, loading } = useSelectedChild();
  const [tab, setTab] = useState('recommended');
  const [slide, setSlide] = useState(0);

  // Auto slide
  React.useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const ageMonths = selectedChild?.ageInMonths || 0;
  const ageNote = ageMonths < 6 ? 'Exclusive breastfeeding recommended under 6 months'
    : ageMonths < 12 ? 'Complementary foods + breastfeeding (6–12 months)'
    : ageMonths < 24 ? 'Family foods + milk (12–24 months)'
    : 'Regular family diet with nutritious additions';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dp-meal-card{background:#fff;border:1.5px solid ${C.border};border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(8,145,178,.07);transition:transform .2s,box-shadow .2s}
        .dp-meal-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(8,145,178,.13)!important}
        .dp-btn{padding:9px 18px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all .2s;font-family:inherit}
        .dp-btn-teal{background:${C.teal};color:#fff} .dp-btn-teal:hover{background:${C.teal2}}
        .dp-btn-out{background:#fff;color:${C.teal};border:1.5px solid ${C.border}} .dp-btn-out:hover{background:${C.teal4}}
        @media(max-width:900px){.dp-meal-grid{grid-template-columns:repeat(2,1fr)!important}.dp-bottom-grid{grid-template-columns:1fr!important}}
        @media(max-width:600px){.dp-meal-grid{grid-template-columns:1fr!important}.dp-cal-grid{grid-template-columns:repeat(2,1fr)!important}.dp-nav-links{display:none!important}}
        @media(max-width:420px){.dp-cal-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 62, boxShadow: '0 2px 12px rgba(8,145,178,.08)' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 20, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.teal},${C.teal2})`, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 18 }}>🌿</div>
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2 }}>Sishu Arogaya</span>
        </Link>
        <div className="dp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {NAV.map(([label, to]) => (
            <Link key={to} to={to} style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: to === '/parent/diet-plan' ? C.teal4 : 'transparent', color: to === '/parent/diet-plan' ? C.teal : C.muted, borderBottom: to === '/parent/diet-plan' ? `2px solid ${C.teal}` : '2px solid transparent' }}>
              {label}
            </Link>
          ))}
        </div>
        {children.length > 1 && (
          <select value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)}
            style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: '#fff', fontFamily: 'inherit' }}>
            {children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === slide ? 1 : 0, transition: 'opacity 1s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${C.teal2}ee,${C.teal}bb)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 14 }}>🥗 Nutrition Plan</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
            Diet Plan for <span style={{ color: C.teal3 }}>{selectedChild?.name || 'Your Child'}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginTop: 8, textAlign: 'center' }}>{ageNote}</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
          {SLIDES.map((_, i) => <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 4, background: i === slide ? '#fff' : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>🥗 Recommended Diet Plan</h2>
            {selectedChild && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>For {selectedChild.name} · {ageMonths} months</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="dp-btn dp-btn-out">⬇️ Download</button>
            <button className="dp-btn dp-btn-teal" onClick={() => setTab('myplan')}>✏️ Customise</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #c5e8ef', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Tab Switch */}
            <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 5, border: `1.5px solid ${C.border}`, marginBottom: 24, width: 'fit-content', boxShadow: '0 1px 4px rgba(8,145,178,.07)' }}>
              {[['recommended', '📋 Recommended Plan'], ['myplan', '✏️ My Diet Plan']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: tab === id ? C.teal : 'transparent', color: tab === id ? '#fff' : C.muted, transition: 'all .2s' }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'myplan' ? <MyDietPlan /> : (
              <>
                {/* Calorie Summary */}
                <div className="dp-cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '⚡', val: `${TOTAL_KCAL}`, label: 'kcal / day', color: C.teal, top: C.teal },
                    { icon: '💪', val: '13g', label: 'Protein', color: '#16a34a', top: '#16a34a' },
                    { icon: '🦴', val: '500mg', label: 'Calcium', color: '#d97706', top: '#f59e0b' },
                    { icon: '🩸', val: '11mg', label: 'Iron', color: '#dc2626', top: '#ef4444' },
                    { icon: '🍽️', val: '6', label: 'Meals / day', color: '#7c3aed', top: '#8b5cf6' },
                  ].map(({ icon, val, label, color, top }) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '18px 14px', borderTop: `3px solid ${top}`, boxShadow: '0 2px 8px rgba(8,145,178,.06)', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Meal Cards */}
                <div className="dp-meal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
                  {MEAL_PLAN.map((meal, idx) => (
                    <div key={meal.id} className="dp-meal-card" style={{ animation: `fadeUp .45s ease ${idx * 0.07}s both` }}>
                      {/* Card header */}
                      <div style={{ background: meal.headerBg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 26 }}>{meal.icon}</div>
                        <div>
                          <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: C.text }}>{meal.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{meal.time}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 100, background: C.teal3, color: C.teal2, fontSize: 11, fontWeight: 700 }}>{meal.kcal} kcal</div>
                      </div>
                      {/* Items */}
                      <div style={{ padding: '12px 16px' }}>
                        {meal.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < meal.items.length - 1 ? 8 : 0, marginBottom: i < meal.items.length - 1 ? 8 : 0, borderBottom: i < meal.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</div>
                              <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 100, background: C.teal4, color: C.muted, fontSize: 10, marginTop: 2 }}>{item.qty}</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, flexShrink: 0 }}>{item.kcal} kcal</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom 2-col */}
                <div className="dp-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  {/* Foods to Avoid */}
                  <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(8,145,178,.06)' }}>
                    <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 14 }}>🚫 Foods to Avoid</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {AVOID_FOODS.map(({ name, reason }) => (
                        <div key={name} style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>⛔ {name}</div>
                          <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>{reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Superfoods */}
                  <div style={{ background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(8,145,178,.06)' }}>
                    <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 14 }}>⭐ Superfoods</h5>
                    {SUPERFOODS.map(({ name, desc }) => (
                      <div key={name} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: C.teal4, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal, flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WHO Guidelines */}
                <div style={{ background: `linear-gradient(135deg,${C.teal4},#e0f7fa)`, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>🌍</div>
                  <div>
                    <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: C.teal2, marginBottom: 6 }}>WHO Feeding Guidelines</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                      The World Health Organization recommends exclusive breastfeeding for the first 6 months of life. After 6 months, introduce safe, age-appropriate complementary foods while continuing breastfeeding up to 2 years and beyond. Ensure dietary diversity with foods from at least 5 out of 8 food groups daily.
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: 14, fontSize: 12 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </div>
    </div>
  );
}
