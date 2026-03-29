import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const ROLES = [
  { value: 'parent', label: 'Parent / Guardian', icon: 'bi-person-heart',     color: '#1a6b3c' },
  { value: 'asha',   label: 'ASHA Worker',        icon: 'bi-person-badge-fill', color: '#0d6efd' },
  { value: 'admin',  label: 'Govt. Admin',         icon: 'bi-shield-lock-fill', color: '#6f42c1' },
];

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState('parent');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', ashaId: '', district: '', block: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: selectedRole });
      setSuccess('Registered successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-4"
      style={{ background: 'linear-gradient(135deg, #1a6b3c 0%, #0a3d22 50%, #145230 100%)' }}
    >
      <div className="container" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 72, height: 72 }}
          >
            <i className="bi bi-heart-pulse-fill text-success" style={{ fontSize: 32 }}></i>
          </div>
          <h2 className="text-white fw-bold mb-1">Sishu Arogaya</h2>
          <p className="text-white-50 mb-0" style={{ fontSize: '0.85rem' }}>{t('registerTitle')}</p>
        </div>

        <div className="card border-0 shadow-lg rounded-4">
          <div className="card-body p-4">
            {/* Role Selector */}
            <p className="text-muted small mb-2 fw-semibold">{t('selectRole')}</p>
            <div className="row g-2 mb-3">
              {ROLES.map((r) => (
                <div className="col-4" key={r.value}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`btn w-100 py-2 border rounded-3 ${selectedRole === r.value ? 'text-white' : 'btn-outline-secondary'}`}
                    style={{ background: selectedRole === r.value ? r.color : '', borderColor: selectedRole === r.value ? r.color : '' }}
                  >
                    <i className={`bi ${r.icon} d-block mb-1`} style={{ fontSize: 20 }}></i>
                    <span style={{ fontSize: '0.72rem' }}>{r.label}</span>
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('fullName')}</label>
                <input type="text" name="name" className="form-control" placeholder={t('fullName')}
                  value={form.name} onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('email')}</label>
                <input type="email" name="email" className="form-control" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('phone')}</label>
                <input type="tel" name="phone" className="form-control" placeholder="10-digit mobile number"
                  value={form.phone} onChange={handleChange} required />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('password')}</label>
                <input type="password" name="password" className="form-control" placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} required minLength={6} />
              </div>

              {selectedRole === 'asha' && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">ASHA ID</label>
                    <input type="text" name="ashaId" className="form-control" placeholder="e.g. ASHA-UK-001"
                      value={form.ashaId} onChange={handleChange} />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label small fw-semibold">District</label>
                      <input type="text" name="district" className="form-control" placeholder="District"
                        value={form.district} onChange={handleChange} />
                    </div>
                    <div className="col">
                      <label className="form-label small fw-semibold">Block</label>
                      <input type="text" name="block" className="form-control" placeholder="Block"
                        value={form.block} onChange={handleChange} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-sa-primary w-100 py-2 fw-semibold" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {t('registerBtn')}
              </button>

              <p className="text-center text-muted small mt-3 mb-0">
                {t('alreadyAccount')}{' '}
                <Link to="/login" className="text-success fw-semibold">{t('login')}</Link>
              </p>
            </form>
          </div>
        </div>

        <p className="text-white-50 text-center mt-3" style={{ fontSize: '0.75rem' }}>
          Dev Bhoomi Uttrakhand University · BCA 2026–27
        </p>
      </div>
    </div>
  );
};

export default Register;
