import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { ashaAPI, vaccinationAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const StatCard = ({ icon, label, value, color, link }) => (
  <div className="col-6 col-md-3">
    <Link to={link} className="text-decoration-none">
      <div className="card stat-card p-3 h-100">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-2" style={{ background: color + '20' }}>
            <i className={`bi ${icon} fs-4`} style={{ color }}></i>
          </div>
          <div>
            <div className="fw-bold fs-5">{value}</div>
            <div className="text-muted small">{label}</div>
          </div>
        </div>
      </div>
    </Link>
  </div>
);

const AshaDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes, vRes] = await Promise.all([
          ashaAPI.getProfile(),
          ashaAPI.getMyChildren(),
          vaccinationAPI.getOverdue(),
        ]);
        setProfile(pRes.data);
        setChildren(cRes.data);
        setOverdue(vRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const severe = children.filter((c) => c.nutritionStatus === 'severe').length;
  const moderate = children.filter((c) => c.nutritionStatus === 'moderate').length;

  return (
    <Layout role="asha">
      <div className="rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #0d6efd, #0a58ca)' }}>
        <h4 className="fw-bold mb-1">Welcome, {user?.name}</h4>
        <p className="mb-0 opacity-75">
          ASHA Worker · {profile?.block}, {profile?.district}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <StatCard icon="bi-people-fill" label="Assigned Children" value={children.length} color="#1a6b3c" link="/asha/children" />
            <StatCard icon="bi-clipboard-check" label="Total Visits" value={profile?.totalVisits || 0} color="#0d6efd" link="/asha/visit-history" />
            <StatCard icon="bi-exclamation-triangle" label="Severe Cases" value={severe} color="#dc3545" link="/asha/malnutrition-report" />
            <StatCard icon="bi-shield-exclamation" label="Overdue Vaccines" value={overdue.length} color="#fd7e14" link="/asha/vaccination-tracker" />
          </div>

          <div className="row g-4">
            {/* Children Status */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">
                  <i className="bi bi-people me-2 text-success"></i>Children Overview
                </div>
                <div className="card-body">
                  <div className="row text-center g-3">
                    <div className="col-4">
                      <div className="rounded-3 p-3" style={{ background: '#d4edda' }}>
                        <div className="fw-bold fs-4 text-success">{children.filter(c => c.nutritionStatus === 'healthy').length}</div>
                        <div className="small text-muted">Healthy</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="rounded-3 p-3" style={{ background: '#fff3cd' }}>
                        <div className="fw-bold fs-4" style={{ color: '#856404' }}>{moderate}</div>
                        <div className="small text-muted">Moderate</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="rounded-3 p-3" style={{ background: '#f8d7da' }}>
                        <div className="fw-bold fs-4 text-danger">{severe}</div>
                        <div className="small text-muted">Severe</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-white border-0 d-flex gap-2">
                  <Link to="/asha/children" className="btn btn-sm btn-outline-success flex-fill">View Children</Link>
                  <Link to="/asha/log-visit" className="btn btn-sm btn-sa-primary flex-fill">Log Visit</Link>
                </div>
              </div>
            </div>

            {/* Overdue Vaccinations */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">
                  <i className="bi bi-shield-exclamation me-2 text-danger"></i>Overdue Vaccinations
                </div>
                <div className="card-body p-0">
                  {overdue.length === 0 ? (
                    <p className="text-muted text-center p-4">No overdue vaccinations!</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {overdue.map((v) => (
                        <li key={v._id} className="list-group-item d-flex justify-content-between">
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{v.childId?.name}</div>
                            <div className="text-muted small">{v.vaccineName}</div>
                          </div>
                          <span className="badge bg-danger align-self-center">
                            {new Date(v.dueDate).toLocaleDateString('en-IN')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer bg-white border-0">
                  <Link to="/asha/vaccination-tracker" className="btn btn-sm btn-outline-danger w-100">View All Overdue</Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">Quick Actions</div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      { to: '/asha/log-visit', icon: 'bi-clipboard-plus', label: 'Log Home Visit', color: '#1a6b3c' },
                      { to: '/asha/growth-records', icon: 'bi-graph-up-arrow', label: 'Enter Growth Data', color: '#0d6efd' },
                      { to: '/asha/malnutrition-report', icon: 'bi-exclamation-triangle', label: 'Report Malnutrition', color: '#dc3545' },
                      { to: '/asha/generate-report', icon: 'bi-file-earmark-bar-graph', label: 'Generate Report', color: '#6f42c1' },
                    ].map((a) => (
                      <div className="col-6 col-md-3" key={a.to}>
                        <Link to={a.to} className="text-decoration-none">
                          <div className="rounded-3 p-3 text-center h-100" style={{ background: a.color + '15', border: `1px solid ${a.color}30` }}>
                            <i className={`bi ${a.icon} fs-2`} style={{ color: a.color }}></i>
                            <div className="small fw-semibold mt-2" style={{ color: a.color }}>{a.label}</div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default AshaDashboard;
