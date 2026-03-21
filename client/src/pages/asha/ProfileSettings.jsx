import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { ashaAPI, authAPI } from '../../services/api';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pass, setPass] = useState({ current:'', new_:'', confirm:'' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { ashaAPI.getProfile().then(r=>setProfile(r.data)).catch(console.error); }, []);

  const handlePass = async (e) => {
    e.preventDefault();
    if (pass.new_ !== pass.confirm) { setError('Passwords do not match.'); return; }
    try {
      await authAPI.changePassword({ currentPassword: pass.current, newPassword: pass.new_ });
      setMsg('Password updated!'); setPass({current:'',new_:'',confirm:''});
    } catch(err) { setError(err.response?.data?.message || 'Failed.'); }
  };

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-gear me-2 text-secondary"></i>Profile & Settings</h4>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">ASHA Profile</div>
            <div className="card-body">
              <div className="text-center mb-3"><div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{width:64,height:64}}><i className="bi bi-person-badge-fill text-primary" style={{fontSize:28}}></i></div><h6 className="fw-bold mt-2">{user?.name}</h6><span className="badge bg-primary">ASHA Worker</span></div>
              {[{l:'ASHA ID',v:profile?.ashaId},{l:'District',v:profile?.district},{l:'Block',v:profile?.block},{l:'Email',v:user?.email},{l:'Total Visits',v:profile?.totalVisits}].map(f=>(
                <div className="mb-2" key={f.l}><label className="form-label small text-muted">{f.l}</label><input className="form-control form-control-sm" value={f.v||''} readOnly /></div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Change Password</div>
            <div className="card-body">
              {msg && <div className="alert alert-success py-2 small">{msg}</div>}
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <form onSubmit={handlePass}>
                <div className="mb-3"><label className="form-label small">Current Password</label><input type="password" className="form-control" value={pass.current} onChange={e=>setPass({...pass,current:e.target.value})} required /></div>
                <div className="mb-3"><label className="form-label small">New Password</label><input type="password" className="form-control" value={pass.new_} onChange={e=>setPass({...pass,new_:e.target.value})} required /></div>
                <div className="mb-3"><label className="form-label small">Confirm Password</label><input type="password" className="form-control" value={pass.confirm} onChange={e=>setPass({...pass,confirm:e.target.value})} required /></div>
                <button type="submit" className="btn btn-sa-primary w-100">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
