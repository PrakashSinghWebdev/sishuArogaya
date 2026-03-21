import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const StatCard = ({ icon, label, value, color, sub, link }) => (
  <div className="col-6 col-md-3">
    <Link to={link} className="text-decoration-none">
      <div className="card stat-card p-3">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-2" style={{ background: color + '20' }}>
            <i className={`bi ${icon} fs-4`} style={{ color }}></i>
          </div>
          <div>
            <div className="fw-bold fs-4">{value}</div>
            <div className="text-muted small">{label}</div>
            {sub && <div style={{ fontSize: '0.7rem', color }}>{sub}</div>}
          </div>
        </div>
      </div>
    </Link>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const blockNames = stats?.blockStats?.map((b) => b._id) || [];
  const severeData = stats?.blockStats?.map((b) => b.severe) || [];
  const moderateData = stats?.blockStats?.map((b) => b.moderate) || [];

  const barData = {
    labels: blockNames,
    datasets: [
      { label: 'Severe', data: severeData, backgroundColor: '#dc3545' },
      { label: 'Moderate', data: moderateData, backgroundColor: '#ffc107' },
    ],
  };

  const doughnutData = {
    labels: ['Healthy', 'Moderate Risk', 'Severe'],
    datasets: [{
      data: [
        (stats?.totalChildren || 0) - (stats?.malnutritionCases || 0),
        stats?.blockStats?.reduce((s, b) => s + b.moderate, 0) || 0,
        stats?.blockStats?.reduce((s, b) => s + b.severe, 0) || 0,
      ],
      backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
      borderWidth: 0,
    }],
  };

  return (
    <Layout role="admin">
      <div className="rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #6f42c1, #495057)' }}>
        <h4 className="fw-bold mb-1">Admin Dashboard</h4>
        <p className="mb-0 opacity-75">District-level health analytics · {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-purple"></div></div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <StatCard icon="bi-people-fill" label="Total Children" value={stats?.totalChildren || 0} color="#1a6b3c" link="/admin/children" />
            <StatCard icon="bi-person-badge-fill" label="ASHA Workers" value={stats?.totalAshaWorkers || 0} color="#0d6efd" link="/admin/asha-workers" />
            <StatCard icon="bi-exclamation-octagon" label="Malnutrition Cases" value={stats?.malnutritionCases || 0} color="#dc3545" sub="Moderate + Severe" link="/admin/malnutrition" />
            <StatCard icon="bi-shield-x" label="Missed Vaccines" value={stats?.missedVaccinations || 0} color="#fd7e14" link="/admin/vaccination-data" />
          </div>

          <div className="row g-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">
                  <i className="bi bi-bar-chart-line me-2 text-primary"></i>Block-wise Malnutrition
                </div>
                <div className="card-body" style={{ height: 280 }}>
                  {blockNames.length > 0 ? (
                    <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">No block data available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">
                  <i className="bi bi-pie-chart me-2 text-success"></i>Nutrition Status
                </div>
                <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 280 }}>
                  <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 fw-semibold">Quick Access</div>
                <div className="card-body">
                  <div className="row g-3">
                    {[
                      { to: '/admin/heatmap', icon: 'bi-map-fill', label: 'Malnutrition Heatmap', color: '#dc3545' },
                      { to: '/admin/asha-workers', icon: 'bi-person-badge-fill', label: 'ASHA Performance', color: '#0d6efd' },
                      { to: '/admin/children', icon: 'bi-people-fill', label: 'Children Registry', color: '#1a6b3c' },
                      { to: '/admin/block-reports', icon: 'bi-file-earmark-excel', label: 'Export Reports', color: '#6f42c1' },
                      { to: '/admin/users', icon: 'bi-person-gear', label: 'User Management', color: '#fd7e14' },
                      { to: '/admin/audit-logs', icon: 'bi-journal-text', label: 'Audit Logs', color: '#6c757d' },
                    ].map((a) => (
                      <div className="col-6 col-md-2" key={a.to}>
                        <Link to={a.to} className="text-decoration-none">
                          <div className="rounded-3 p-3 text-center" style={{ background: a.color + '10', border: `1px solid ${a.color}20` }}>
                            <i className={`bi ${a.icon} fs-3`} style={{ color: a.color }}></i>
                            <div style={{ fontSize: '0.75rem', color: a.color, marginTop: 4 }}>{a.label}</div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Block Table */}
            {stats?.blockStats?.length > 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 fw-semibold">Block-wise Summary</div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr><th>Block</th><th>Total Children</th><th>Moderate</th><th>Severe</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {stats.blockStats.map((b) => (
                          <tr key={b._id}>
                            <td>{b._id || 'Unknown'}</td>
                            <td>{b.total}</td>
                            <td><span className="badge bg-warning text-dark">{b.moderate}</span></td>
                            <td><span className="badge bg-danger">{b.severe}</span></td>
                            <td>
                              <span className={`badge ${b.severe > 5 ? 'bg-danger' : b.moderate > 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {b.severe > 5 ? 'Critical' : b.moderate > 10 ? 'At Risk' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminDashboard;
