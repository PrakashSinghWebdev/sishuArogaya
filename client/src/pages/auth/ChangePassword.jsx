import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Shown after logging in with an admin-issued one-time password (or from Settings): the user sets
// their own password. Standalone page: the rest of the app (and API) is locked until this is done.
export default function ChangePassword() {
  const { user, setUser, logout, getDashboardPath } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const forced = Boolean(user?.mustChangePassword);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  async function submit(e) {
    e.preventDefault();
    if (form.next.length < 8) return setError(t('pwTooShort'));
    if (form.next !== form.confirm) return setError(t('pwMismatch'));
    if (form.next === form.current) return setError(t('pwSameAsOld'));
    setBusy(true);
    try {
      const { data } = await authAPI.changePassword({ currentPassword: form.current, newPassword: form.next });
      setUser((u) => ({ ...u, ...data.user, mustChangePassword: false }));
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the password');
      setBusy(false);
    }
  }

  const input = (k, label, autoComplete) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold" htmlFor={`cp-${k}`}>{label}</label>
      <input id={`cp-${k}`} type={show ? 'text' : 'password'} className="form-control form-control-lg" required autoComplete={autoComplete} value={form[k]} onChange={set(k)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} className="card border-0 shadow p-4" style={{ width: '100%', maxWidth: 420, borderRadius: 16 }}>
        <div className="text-center mb-3">
          <div style={{ fontSize: 40 }}>🔐</div>
          <h4 className="fw-bold mb-1" style={{ color: '#0c2340' }}>{t('setNewPassword')}</h4>
          <div className="small" style={{ color: '#4a7a8a' }}>{user?.name}</div>
        </div>
        {forced && <div className="alert alert-info small py-2">{t('pwForcedHint')}</div>}
        {error && <div className="alert alert-danger small py-2">{error}</div>}
        {input('current', forced ? t('pwOneTime') : t('pwCurrent'), 'current-password')}
        {input('next', t('pwNew'), 'new-password')}
        {input('confirm', t('pwConfirm'), 'new-password')}
        <div className="form-check mb-3">
          <input id="cp-show" type="checkbox" className="form-check-input" checked={show} onChange={(e) => setShow(e.target.checked)} />
          <label htmlFor="cp-show" className="form-check-label small">{t('pwShow')}</label>
        </div>
        <ul className="small text-muted ps-3 mb-3">
          <li>{t('pwRuleLength')}</li>
          <li>{t('pwRuleShare')}</li>
        </ul>
        <button className="btn btn-sa-primary btn-lg w-100" disabled={busy}>{busy ? '…' : t('setNewPassword')}</button>
        <button type="button" className="btn btn-link btn-sm mt-2" onClick={() => { logout(); navigate('/login', { replace: true }); }}>{t('logout')}</button>
      </form>
    </div>
  );
}
