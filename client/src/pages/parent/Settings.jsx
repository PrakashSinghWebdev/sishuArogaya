import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setError('New passwords do not match.'); return; }
    setSaving(true); setMsg(''); setError('');
    try {
      await authAPI.changePassword({ currentPassword: currentPass, newPassword: newPass });
      setMsg('Password changed successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  return (
    <Layout role="parent">
      <h4 className="fw-bold mb-4"><i className="bi bi-gear me-2 text-secondary"></i>Settings & Profile</h4>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Profile Information</div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{width:64,height:64}}>
                  <i className="bi bi-person-fill text-success" style={{fontSize:30}}></i>
                </div>
                <div><h5 className="fw-bold mb-0">{user?.name}</h5><div className="text-muted small">{user?.email}</div><span className="badge bg-success mt-1 text-capitalize">{user?.role}</span></div>
              </div>
              <div className="mb-2"><label className="form-label small text-muted">Name</label><input className="form-control" value={user?.name || ''} readOnly /></div>
              <div className="mb-2"><label className="form-label small text-muted">Email</label><input className="form-control" value={user?.email || ''} readOnly /></div>
              <small className="text-muted">To update profile info, contact your ASHA worker or Admin.</small>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Change Password</div>
            <div className="card-body">
              {msg && <div className="alert alert-success py-2 small">{msg}</div>}
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <form onSubmit={handleChangePassword}>
                <div className="mb-3"><label className="form-label small">Current Password</label><input type="password" className="form-control" value={currentPass} onChange={e=>setCurrentPass(e.target.value)} required /></div>
                <div className="mb-3"><label className="form-label small">New Password</label><input type="password" className="form-control" value={newPass} onChange={e=>setNewPass(e.target.value)} required /></div>
                <div className="mb-3"><label className="form-label small">Confirm New Password</label><input type="password" className="form-control" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} required /></div>
                <button type="submit" className="btn btn-sa-primary w-100" disabled={saving}>{saving?'Saving...':'Update Password'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
