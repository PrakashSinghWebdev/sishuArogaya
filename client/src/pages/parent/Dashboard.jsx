import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI, schemeAPI, vaccinationAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const slides = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
];

const actions = [
  ['Book Vaccine', '/parent/vaccination'],
  ['Log Growth', '/parent/growth'],
  ['Diet Plan', '/parent/diet-plan'],
  ['Download Report', '/parent/reports'],
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const { children, selectedChild, selectedChildId, setSelectedChild, loading: childLoading } = useSelectedChild();
  const [vaccines, setVaccines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      notificationAPI.list().catch(() => ({ data: [] })),
      schemeAPI.list().catch(() => ({ data: [] })),
    ])
      .then(([n, s]) => {
        setNotifications((n.data || []).slice(0, 5));
        setSchemes((s.data || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild?._id) {
      setVaccines([]);
      return;
    }
    vaccinationAPI.getSchedule(selectedChild._id)
      .then((res) => setVaccines((res.data || []).slice(0, 7)))
      .catch(console.error);
  }, [selectedChild]);

  useEffect(() => {
    timerRef.current = setInterval(() => setCur((p) => (p + 1) % slides.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const due = vaccines.filter((v) => v.status === 'due');
  const unread = notifications.filter((n) => !n.isRead).length;
  const score = selectedChild?.nutritionStatus === 'healthy' ? 86 : selectedChild?.nutritionStatus === 'moderate' ? 62 : selectedChild ? 42 : 0;

  const heroText = useMemo(() => {
    if (!selectedChild) return 'Add a child profile to start tracking vaccination, growth, and nutrition updates.';
    if (due[0]) return `${selectedChild.name} has ${due[0].vaccineName} due soon.`;
    return `${selectedChild.name}'s health records are available and ready to monitor.`;
  }, [selectedChild, due]);

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f2f7f3', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
        .wrap{max-width:1280px;margin:0 auto;padding:28px 20px 60px}
        .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:1000px){.grid4{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}
        @media(max-width:640px){.grid4{grid-template-columns:1fr}}
      `}</style>

      <nav className="navbar navbar-dark" style={{ background: '#0d4a2e' }}>
        <div className="container-fluid px-4">
          <Link to="/parent/dashboard" className="navbar-brand fw-bold">Sishu Arogaya</Link>
          <div className="d-none d-md-flex gap-2">
            <Link to="/parent/dashboard" className="btn btn-warning btn-sm">Dashboard</Link>
            <Link to="/parent/child-profile" className="btn btn-outline-light btn-sm">My Child</Link>
            <Link to="/parent/vaccination" className="btn btn-outline-light btn-sm">Vaccines</Link>
            <Link to="/parent/growth" className="btn btn-outline-light btn-sm">Growth</Link>
            <Link to="/parent/diet-plan" className="btn btn-outline-light btn-sm">Diet</Link>
            <Link to="/parent/reports" className="btn btn-outline-light btn-sm">Reports</Link>
          </div>
        </div>
      </nav>

      <div style={{ position: 'relative', background: '#0d4a2e', color: '#fff', overflow: 'hidden' }}>
        {slides.map((src, index) => (
          <div
            key={src}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(90deg,rgba(13,74,46,.92),rgba(13,74,46,.66)), url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === cur ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          />
        ))}
        <div className="wrap" style={{ position: 'relative', zIndex: 1, paddingTop: 36, paddingBottom: 36 }}>
          <div className="d-flex justify-content-between align-items-end gap-3 flex-wrap">
            <div>
              <div className="text-warning small fw-semibold mb-2">Parent Dashboard</div>
              <h1 style={{ fontFamily: "'Playfair Display',serif" }} className="display-6 fw-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Parent'}
              </h1>
              <p className="text-white-50 mb-0">{heroText}</p>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {children.length > 1 && (
                <select className="form-select" style={{ minWidth: 220 }} value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map((child) => <option key={child._id} value={child._id}>{child.name}</option>)}
                </select>
              )}
              {selectedChild && (
                <div className="text-end">
                  <div className="fs-3 fw-bold text-warning">{score}</div>
                  <div className="small text-white-50">Health Score</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        {loading || childLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
              <div>
                <h2 className="fw-bold mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>Current Baby</h2>
                <div className="text-muted">{selectedChild ? `Viewing ${selectedChild.name}` : 'No child selected yet'}</div>
              </div>
              <div className="text-muted small">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body d-flex justify-content-between align-items-center gap-3 flex-wrap">
                <div>
                  <h3 className="fw-bold mb-1">{selectedChild?.name || 'No child profile yet'}</h3>
                  <div className="text-muted small">
                    {selectedChild ? `${selectedChild.ageInMonths || 0} months · ${selectedChild.gender} · ${selectedChild.bloodGroup || 'Unknown'}` : 'Add a child from My Child page'}
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Link to="/parent/child-profile" className="btn btn-outline-success btn-sm">View Profile</Link>
                  <Link to="/parent/reports" className="btn btn-outline-secondary btn-sm">Download Report</Link>
                </div>
              </div>
            </div>

            <div className="grid4 mb-4">
              <StatCard label="Vaccines Completed" value={`${Math.max(vaccines.filter((v) => v.status === 'done').length, 0)}/${vaccines.length || 0}`} sub={`${due.length} due now`} />
              <StatCard label="Current Weight" value={selectedChild?.currentWeight ? `${selectedChild.currentWeight} kg` : 'N/A'} sub={selectedChild ? `${selectedChild.ageInMonths || 0} months old` : 'No child selected'} />
              <StatCard label="Current Height" value={selectedChild?.currentHeight ? `${selectedChild.currentHeight} cm` : 'N/A'} sub={selectedChild?.gender || 'No records yet'} />
              <StatCard label="Unread Alerts" value={String(unread)} sub={`${schemes.length} schemes available`} />
            </div>

            <div className="grid4 mb-4">
              {actions.map(([label, to]) => (
                <Link key={to} to={to} className="card border-0 shadow-sm text-decoration-none text-dark">
                  <div className="card-body text-center">
                    <div className="fw-bold">{label}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid2">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Vaccination Snapshot</h5>
                    <Link to="/parent/vaccination" className="small text-success text-decoration-none">View all</Link>
                  </div>
                  {vaccines.length === 0 ? (
                    <div className="text-muted">No vaccination records available yet.</div>
                  ) : vaccines.map((v) => (
                    <div key={v._id} className="border rounded-3 px-3 py-2 mb-2 d-flex justify-content-between align-items-center gap-2">
                      <div>
                        <div className="fw-semibold">{v.vaccineName}</div>
                        <div className="text-muted small">{fmt(v.dueDate)}</div>
                      </div>
                      <span className={`badge ${v.status === 'done' ? 'text-bg-success' : v.status === 'due' ? 'text-bg-warning' : 'text-bg-secondary'}`}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Recent Notifications</h5>
                    <Link to="/parent/notifications" className="small text-success text-decoration-none">Open</Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-muted">No notifications available.</div>
                  ) : notifications.slice(0, 4).map((n) => (
                    <div key={n._id} className="border rounded-3 px-3 py-2 mb-2">
                      <div className="fw-semibold">{n.title || 'Health update'}</div>
                      <div className="text-muted small">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="text-muted small mb-2">{label}</div>
        <div className="fs-4 fw-bold">{value}</div>
        <div className="text-muted small mt-1">{sub}</div>
      </div>
    </div>
  );
}

function fmt(date) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? 'Date unavailable'
    : value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
