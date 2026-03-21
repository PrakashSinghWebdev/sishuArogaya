import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSelectedChild from '../../hooks/useSelectedChild';

const NAV = [['Dashboard', '/parent/dashboard'], ['My Child', '/parent/child-profile'], ['Vaccines', '/parent/vaccination'], ['Growth', '/parent/growth'], ['Diet Plan', '/parent/diet-plan'], ['Schemes', '/parent/schemes'], ['Reports', '/parent/reports']];
const MEALS = [
  ['morning', 'Morning', '7:00 - 8:00 AM', [['Milk', '150-200 ml', 100], ['Fruit puree', '2-3 tbsp', 40], ['Soft dal khichdi', '4-5 tbsp', 80]]],
  ['mid', 'Mid-Morning Snack', '10:00 - 10:30 AM', [['Seasonal fruit', '3-4 tbsp', 35], ['Ragi biscuit', '2-3 pcs', 25]]],
  ['lunch', 'Lunch', '12:00 - 1:00 PM', [['Soft rice + dal', '5-6 tbsp', 110], ['Mashed vegetables', '3-4 tbsp', 45], ['Curd', '2-3 tbsp', 30]]],
  ['evening', 'Evening Snack', '4:00 - 4:30 PM', [['Suji halwa', '4-5 tbsp', 70], ['Mashed potato', '3-4 tbsp', 60]]],
  ['dinner', 'Dinner', '7:00 - 8:00 PM', [['Soft roti + dal', '1/2 roti + 4 tbsp', 95], ['Boiled vegetables', '4-5 tbsp', 40], ['Milk', '150-200 ml', 100]]],
];
const FOODS = ['Milk', 'Banana', 'Dal khichdi', 'Curd', 'Rice+dal', 'Egg yolk', 'Ragi porridge', 'Fruit puree', 'Paneer', 'Suji halwa'];

function MyDietPlan() {
  const init = Object.fromEntries(MEALS.map((m) => [m[0], []]));
  const [plan, setPlan] = useState(init);
  const [edit, setEdit] = useState(null);
  const [title, setTitle] = useState('');
  const [food, setFood] = useState({ name: '', qty: '', cal: '' });
  const [saved, setSaved] = useState([]);
  const ref = useRef(null);
  const total = Object.values(plan).flat().reduce((sum, item) => sum + (parseInt(item.cal, 10) || 0), 0);

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">My Diet Plan</h5>
            <input
              className="form-control mb-3"
              placeholder="Plan name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {MEALS.map((meal) => (
              <div key={meal[0]} className="border rounded-3 p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <div className="fw-semibold">{meal[1]}</div>
                    <div className="text-muted small">{meal[2]}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-success" onClick={() => setEdit(edit === meal[0] ? null : meal[0])}>
                    {edit === meal[0] ? 'Close' : 'Add Food'}
                  </button>
                </div>
                {(plan[meal[0]] || []).map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center bg-light rounded-3 px-3 py-2 mb-2">
                    <div>
                      <div className="fw-semibold">{item.name}</div>
                      <div className="text-muted small">{item.qty}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge text-bg-success">{item.cal} kcal</span>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setPlan((prev) => ({ ...prev, [meal[0]]: prev[meal[0]].filter((x) => x.id !== item.id) }))}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {edit === meal[0] && (
                  <div className="bg-light rounded-3 p-3 mt-2">
                    <div className="row g-2">
                      <div className="col-md-5 position-relative">
                        <input
                          ref={ref}
                          className="form-control"
                          placeholder="Food name"
                          value={food.name}
                          onChange={(e) => setFood((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        {food.name && (
                          <div className="d-flex gap-1 flex-wrap mt-2">
                            {FOODS.filter((x) => x.toLowerCase().includes(food.name.toLowerCase())).slice(0, 4).map((x) => (
                              <button key={x} className="btn btn-sm btn-outline-secondary" onClick={() => { setFood((prev) => ({ ...prev, name: x })); ref.current?.focus(); }}>
                                {x}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <input className="form-control" placeholder="Quantity" value={food.qty} onChange={(e) => setFood((prev) => ({ ...prev, qty: e.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <input className="form-control" type="number" placeholder="kcal" value={food.cal} onChange={(e) => setFood((prev) => ({ ...prev, cal: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      className="btn btn-success btn-sm mt-3"
                      onClick={() => {
                        if (!food.name.trim() || !food.qty.trim()) return;
                        setPlan((prev) => ({
                          ...prev,
                          [meal[0]]: [...prev[meal[0]], { id: Date.now(), ...food, cal: parseInt(food.cal, 10) || 0 }],
                        }));
                        setFood({ name: '', qty: '', cal: '' });
                      }}
                    >
                      Add to {meal[1]}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={() => {
                  if (!title.trim()) return;
                  setSaved((prev) => [{ id: Date.now(), title, total }, ...prev]);
                }}
              >
                Save Diet Plan
              </button>
              <button className="btn btn-outline-danger" onClick={() => { setPlan(init); setTitle(''); }}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold">Daily Summary</h5>
            <div className="text-muted small mb-3">Custom total calories</div>
            <div className="display-6 fw-bold text-success">{total}</div>
            <div className="text-muted">kcal</div>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Saved Plans</h5>
            {saved.length === 0 ? (
              <div className="text-muted small">No saved plans yet.</div>
            ) : saved.map((item) => (
              <div key={item.id} className="border rounded-3 p-3 mb-2">
                <div className="fw-semibold">{item.title}</div>
                <div className="text-muted small">{item.total} kcal</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DietPlan() {
  const [section, setSection] = useState('plan');
  const { children, selectedChild, selectedChildId, setSelectedChild, loading } = useSelectedChild();
  const total = MEALS.reduce((sum, meal) => sum + meal[3].reduce((x, item) => x + item[2], 0), 0);

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f0f7f3', minHeight: '100vh' }}>
      <nav className="navbar navbar-dark" style={{ background: '#0d4a2e' }}>
        <div className="container-fluid px-4">
          <Link to="/parent/dashboard" className="navbar-brand fw-bold">Sishu Arogaya</Link>
          <div className="d-none d-md-flex gap-2">
            {NAV.map(([label, to]) => <Link key={to} to={to} className={`btn btn-sm ${to === '/parent/diet-plan' ? 'btn-warning' : 'btn-outline-light'}`}>{label}</Link>)}
          </div>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,#0a3520 0%,#145c38 50%,#1e8050 100%)', color: '#fff' }}>
        <div className="container py-5">
          <div className="d-flex justify-content-between align-items-end gap-3 flex-wrap">
            <div>
              <div className="small text-warning fw-semibold mb-2">
                {selectedChild ? `${selectedChild.name} · ${selectedChild.ageInMonths || 0} months` : 'Diet Plan'}
              </div>
              <h1 className="display-6 fw-bold">Daily Diet & Nutrition Plan</h1>
              <p className="mb-0 text-white-50">Meal plan, food guidance, and a custom planner for your selected baby.</p>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {children.length > 1 && (
                <select className="form-select" style={{ minWidth: 220 }} value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map((child) => <option key={child._id} value={child._id}>{child.name}</option>)}
                </select>
              )}
              <div className="text-center">
                <div className="fs-2 fw-bold text-warning">{total}</div>
                <div className="small text-white-50">kcal/day</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div></div> : (
          <>
            <div className="d-flex gap-2 flex-wrap bg-white rounded-4 shadow-sm p-2 mb-4">
              {[
                ['plan', 'Daily Plan'],
                ['myplan', 'My Diet Plan'],
              ].map(([id, label]) => (
                <button key={id} className={`btn ${section === id ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => setSection(id)}>
                  {label}
                </button>
              ))}
            </div>

            {section === 'plan' ? (
              <div className="row g-4">
                <div className="col-lg-8">
                  {MEALS.map((meal) => (
                    <div key={meal[0]} className="card border-0 shadow-sm mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <h5 className="fw-bold mb-1">{meal[1]}</h5>
                            <div className="text-muted small">{meal[2]}</div>
                          </div>
                          <span className="badge text-bg-success">
                            {meal[3].reduce((sum, item) => sum + item[2], 0)} kcal
                          </span>
                        </div>
                        {meal[3].map((item) => (
                          <div key={item[0]} className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 mb-2">
                            <div>
                              <div className="fw-semibold">{item[0]}</div>
                              <div className="text-muted small">{item[1]}</div>
                            </div>
                            <span className="badge text-bg-light">{item[2]} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="fw-bold">Selected Baby</h5>
                      <div className="text-muted small mb-2">Current diet view</div>
                      <div className="fs-5 fw-semibold">{selectedChild?.name || 'No child selected'}</div>
                      <div className="text-muted small">{selectedChild?.ageInMonths || 0} months</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <MyDietPlan />
            )}
          </>
        )}
      </div>
    </div>
  );
}
