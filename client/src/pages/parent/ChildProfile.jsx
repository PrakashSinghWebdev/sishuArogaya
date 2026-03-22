import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { childAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

export default function ChildProfile() {
  const { children, selectedChild, selectedChildId, setSelectedChild, setChildren, loading } = useSelectedChild();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: 'male',
    bloodGroup: 'Unknown',
    birthWeight: '',
    birthHeight: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await childAPI.add(form);
      const refreshed = await childAPI.list();
      setChildren(refreshed.data);
      if (refreshed.data[refreshed.data.length - 1]?._id) {
        setSelectedChild(refreshed.data[refreshed.data.length - 1]._id);
      }
      setShowForm(false);
      setForm({
        name: '',
        dob: '',
        gender: 'male',
        bloodGroup: 'Unknown',
        birthWeight: '',
        birthHeight: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add child.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f0f7f3', minHeight: '100vh' }}>
      <nav className="navbar navbar-dark" style={{ background: '#0d4a2e' }}>
        <div className="container-fluid px-4">
          <Link to="/parent/dashboard" className="navbar-brand fw-bold">Sishu Arogaya</Link>
          <div className="d-none d-md-flex gap-2">
            <Link to="/parent/dashboard" className="btn btn-outline-light btn-sm">Dashboard</Link>
            <Link to="/parent/child-profile" className="btn btn-warning btn-sm">My Child</Link>
            <Link to="/parent/vaccination" className="btn btn-outline-light btn-sm">Vaccines</Link>
            <Link to="/parent/growth" className="btn btn-outline-light btn-sm">Growth</Link>
            <Link to="/parent/diet-plan" className="btn btn-outline-light btn-sm">Diet</Link>
            <Link to="/parent/reports" className="btn btn-outline-light btn-sm">Reports</Link>
          </div>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg,#0a3520 0%,#145c38 50%,#1e8050 100%)', color: '#fff' }}>
        <div className="container py-5">
          <div className="d-flex justify-content-between align-items-end gap-3 flex-wrap">
            <div>
              <div className="small text-warning fw-semibold mb-2">Child Profile</div>
              <h1 className="display-6 fw-bold mb-2">{selectedChild?.name || 'My Child'}</h1>
              <p className="text-white-50 mb-0">Choose a baby here and use the same selection across the parent pages.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {children.length > 1 && (
                <select className="form-select" style={{ minWidth: 220 }} value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map((child) => <option key={child._id} value={child._id}>{child.name}</option>)}
                </select>
              )}
              <button className="btn btn-warning" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Close Form' : 'Add Another Child'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
        ) : (
          <>
            {showForm && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Register Child</h5>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Child Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <input type="date" className="form-control" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <select className="form-select" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                          {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <input type="number" step="0.1" className="form-control" placeholder="Birth Weight (kg)" value={form.birthWeight} onChange={(e) => setForm({ ...form, birthWeight: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <input type="number" step="0.1" className="form-control" placeholder="Birth Height (cm)" value={form.birthHeight} onChange={(e) => setForm({ ...form, birthHeight: e.target.value })} />
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button type="submit" className="btn btn-success" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Register Child'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!selectedChild ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="fs-1 mb-3">👶</div>
                  <h4 className="fw-bold">No child registered yet</h4>
                  <p className="text-muted">Add a child profile to start tracking growth, vaccines, and reports.</p>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h4 className="fw-bold mb-3">{selectedChild.name}</h4>
                      <div className="text-muted mb-3">Selected baby for the parent portal</div>
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        <span className="badge text-bg-success">{selectedChild.nutritionStatus || 'healthy'}</span>
                        <span className="badge text-bg-light">{selectedChild.ageInMonths || 0} months</span>
                        <span className="badge text-bg-light">{selectedChild.gender}</span>
                        <span className="badge text-bg-light">{selectedChild.bloodGroup || 'Unknown'}</span>
                      </div>
                      <div className="row g-3">
                        <Info label="Date of Birth" value={fmt(selectedChild.dob)} />
                        <Info label="Birth Weight" value={selectedChild.birthWeight ? `${selectedChild.birthWeight} kg` : 'N/A'} />
                        <Info label="Birth Height" value={selectedChild.birthHeight ? `${selectedChild.birthHeight} cm` : 'N/A'} />
                        <Info label="Current Weight" value={selectedChild.currentWeight ? `${selectedChild.currentWeight} kg` : 'N/A'} />
                        <Info label="Current Height" value={selectedChild.currentHeight ? `${selectedChild.currentHeight} cm` : 'N/A'} />
                        <Info label="Registered" value={fmt(selectedChild.createdAt)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                      <h5 className="fw-bold mb-3">Quick Links</h5>
                      <div className="d-flex gap-2 flex-wrap">
                        <Link to="/parent/vaccination" className="btn btn-outline-success btn-sm">Vaccination Schedule</Link>
                        <Link to="/parent/growth" className="btn btn-outline-primary btn-sm">Growth Monitoring</Link>
                        <Link to="/parent/diet-plan" className="btn btn-outline-warning btn-sm">Diet Plan</Link>
                        <Link to="/parent/reports" className="btn btn-outline-danger btn-sm">Health Report</Link>
                      </div>
                    </div>
                  </div>
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="fw-bold mb-3">Important Note</h5>
                      <p className="text-muted mb-0">
                        The baby selected here is the same baby used on Dashboard, Diet Plan, Reports, and other synced parent pages.
                      </p>
                    </div>
                  </div>

                  {/* Assigned ASHA Worker */}
                  <div className="card border-0 shadow-sm mt-4">
                    <div className="card-body">
                      <h5 className="fw-bold mb-3"><i className="bi bi-person-badge me-2 text-success"></i>Assigned ASHA Worker</h5>
                      {selectedChild.ashaId ? (
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: '#e8f5e9' }}>
                          <div className="rounded-circle bg-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48 }}>
                            <i className="bi bi-person-badge-fill text-white fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold fs-6">{selectedChild.ashaId.userId?.name || 'ASHA Worker'}</div>
                            <div className="text-muted small">
                              ID: {selectedChild.ashaId.ashaId} &nbsp;·&nbsp;
                              {selectedChild.ashaId.block}{selectedChild.ashaId.village ? `, ${selectedChild.ashaId.village}` : ''}
                            </div>
                          </div>
                          {selectedChild.ashaId.userId?.phone && (
                            <a href={`tel:${selectedChild.ashaId.userId.phone}`} className="btn btn-success btn-sm">
                              <i className="bi bi-telephone-fill me-1"></i>Call
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: '#fff3e0' }}>
                          <i className="bi bi-person-x text-warning fs-4"></i>
                          <div>
                            <div className="fw-semibold text-warning">No ASHA Worker Assigned</div>
                            <div className="text-muted small">An ASHA worker will be assigned by your health centre admin.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="col-sm-6">
      <div className="border rounded-3 p-3 h-100">
        <div className="text-muted small">{label}</div>
        <div className="fw-semibold">{value}</div>
      </div>
    </div>
  );
}

function fmt(date) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? 'N/A' : value.toLocaleDateString('en-IN');
}
