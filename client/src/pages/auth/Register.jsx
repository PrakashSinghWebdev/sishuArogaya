import { useEffect, useRef, useState } from 'react';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Register.css';

import { INDIA_DISTRICTS, INDIA_STATES } from '../../data/indiaDistricts';

const CAPTIONS = [
  { e: 'AI', t: 'Early detection saves lives', d: 'AI malnutrition prediction using WHO z-score standards' },
  { e: 'VX', t: 'Never miss a vaccine', d: 'Automated reminders for the full 0-24 month schedule' },
  { e: 'RT', t: 'Real-time district insights', d: 'Government admins track nutrition heatmaps live' },
  { e: 'AW', t: 'Empowering ASHA workers', d: 'Digital tools for field visits and growth records' },
  { e: 'HC', t: 'Healthy children, strong nation', d: 'Connecting families with government welfare schemes' },
];




function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  const colors = ['', '#ef4444', '#f59e0b', '#facc15', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { width: `${score * 25}%`, color: colors[score], label: labels[score] };
}

export default function Register() {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [cur, setCur] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', mobile: '', dob: '', state: '', district: '', block: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    timerRef.current = setInterval(() => setCur((prev) => (prev + 1) % MEDIA_ARRAY.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const update = (key) => (e) => {
    const value = e.target.value;
    // a new state invalidates the chosen district
    setForm((prev) => ({ ...prev, [key]: value, ...(key === 'state' ? { district: '' } : {}) }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = () => {
    const nextErrors = {};
    const email = form.email.trim().toLowerCase();
    const phone = form.mobile.replace(/\D/g, '');
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (phone.length !== 10) nextErrors.mobile = 'Enter a valid 10-digit mobile number.';
    if (!form.dob) nextErrors.dob = 'Date of birth is required.';
    if (!form.state) nextErrors.state = 'Select a state.';
    if (!form.district) nextErrors.district = 'Select a district.';
    if (!form.block.trim()) nextErrors.block = 'Enter your block or PHC.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) nextErrors.confirm = 'Passwords do not match.';
    if (!agreed) nextErrors.agreed = 'Please accept the Terms of Use and Privacy Policy.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.mobile.replace(/\D/g, ''),
        mobile: form.mobile.replace(/\D/g, ''),
        dob: form.dob,
        state: form.state,
        district: form.district,
        block: form.block.trim(),
        password: form.password,
        role: 'parent', // ASHA accounts are created by admins
      };
      const { data } = await authAPI.register(payload);
      setSuccess(data.message || 'Registered successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);
  const cap = CAPTIONS[cur % CAPTIONS.length];

  return (
    <div className="login-shell">
      <div className="login-shell__left">
        <MediaCarousel currentSlideIndex={cur} />
        <div className="login-shell__overlay" />
        <div className="login-shell__blob" />
        <div className="login-shell__content">
          <div className="login-shell__brand">
            <div className="login-shell__brand-mark">SA</div>
            <div>
              <div className="login-shell__brand-title">Sishu Arogaya</div>
              <div className="login-shell__brand-subtitle">Government of India | Health Portal</div>
            </div>
          </div>
          <div className="login-shell__hero">
            <div className="login-shell__badge"><span className="login-shell__badge-dot" />Government Integrated System</div>
            <h1 className="login-shell__headline">Caring for<br />India&apos;s <span>Children</span></h1>
            <div className="login-shell__headline-sub">Sishu Arogaya | Child Health Monitoring</div>
            <p className="login-shell__description">A unified digital platform for tracking vaccination, growth, and nutrition of children aged 0-2 years, connecting parents, ASHA workers, and health authorities.</p>
            <div className="login-shell__stats">{[['0-2', 'Years covered'], ['3', 'User roles'], ['12+', 'Health modules']].map(([num, lbl]) => <div key={lbl}><div className="login-shell__stat-value">{num}</div><div className="login-shell__stat-label">{lbl}</div></div>)}</div>
            <div className="login-shell__caption-card"><div className="login-shell__caption-emoji">{cap.e}</div><div><div className="login-shell__caption-title">{cap.t}</div><div className="login-shell__caption-desc">{cap.d}</div></div></div>
          </div>
          <div className="login-shell__footer">
            <div className="login-shell__dots">{MEDIA_ARRAY.map((_, i) => <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} className={`login-shell__dot ${i === cur ? 'is-active' : ''}`} onClick={() => setCur(i)} />)}</div>
            <div className="login-shell__counter">{String(cur + 1).padStart(2, '0')} / 05</div>
          </div>
        </div>
      </div>

      <div className="login-shell__right">
        <div className="login-shell__right-blob login-shell__right-blob--top" />
        <div className="login-shell__right-blob login-shell__right-blob--bottom" />
        <div className="login-card">
          <div className="login-card__brand">
            <div className="login-card__brand-mark">SA</div>
            <div>
              <div className="login-card__brand-title">Sishu Arogaya</div>
              <div className="login-card__brand-subtitle">Integrated Child Health Monitoring System</div>
            </div>
          </div>
          <div className="login-card__title">Create your account</div>
          <div className="login-card__subtitle">Register for secure access to the child health portal</div>
          <form onSubmit={handleSubmit} noValidate>
            {error ? <div className="login-card__alert login-card__alert--error">{error}</div> : null}
            {success ? <div className="login-card__alert login-card__alert--info">{success}</div> : null}
            <div className="register-form__grid">
              <div className="login-card__field"><label className="login-card__label">First Name</label><div className="login-card__input-wrap"><span className="login-card__input-icon">ID</span><input type="text" value={form.firstName} onChange={update('firstName')} placeholder="Ravi" className={`login-card__input ${fieldErrors.firstName ? 'has-error' : ''}`} /></div>{fieldErrors.firstName ? <div className="login-card__error">{fieldErrors.firstName}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Last Name</label><div className="login-card__input-wrap"><span className="login-card__input-icon">ID</span><input type="text" value={form.lastName} onChange={update('lastName')} placeholder="Sharma" className={`login-card__input ${fieldErrors.lastName ? 'has-error' : ''}`} /></div>{fieldErrors.lastName ? <div className="login-card__error">{fieldErrors.lastName}</div> : null}</div>
              <div className="login-card__field register-form__full"><label className="login-card__label">Email Address</label><div className="login-card__input-wrap"><span className="login-card__input-icon">@</span><input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className={`login-card__input ${fieldErrors.email ? 'has-error' : ''}`} /></div>{fieldErrors.email ? <div className="login-card__error">{fieldErrors.email}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Mobile Number</label><div className="login-card__input-wrap"><span className="login-card__input-icon">+91</span><input type="tel" value={form.mobile} onChange={update('mobile')} placeholder="9876543210" className={`login-card__input ${fieldErrors.mobile ? 'has-error' : ''}`} /></div>{fieldErrors.mobile ? <div className="login-card__error">{fieldErrors.mobile}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Date of Birth</label><div className="login-card__input-wrap"><span className="login-card__input-icon">DT</span><input type="date" max={new Date().toLocaleDateString('en-CA')} value={form.dob} onChange={update('dob')} className={`login-card__input ${fieldErrors.dob ? 'has-error' : ''}`} /></div>{fieldErrors.dob ? <div className="login-card__error">{fieldErrors.dob}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">State / UT</label><div className="login-card__input-wrap"><select value={form.state} onChange={update('state')} className={`register-form__select ${fieldErrors.state ? 'has-error' : ''}`}><option value="">Select state</option>{INDIA_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></div>{fieldErrors.state ? <div className="login-card__error">{fieldErrors.state}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">District</label><div className="login-card__input-wrap"><select value={form.district} onChange={update('district')} disabled={!form.state} className={`register-form__select ${fieldErrors.district ? 'has-error' : ''}`}><option value="">{form.state ? 'Select district' : 'Select state first'}</option>{(INDIA_DISTRICTS[form.state] || []).map((district) => <option key={district} value={district}>{district}</option>)}</select></div>{fieldErrors.district ? <div className="login-card__error">{fieldErrors.district}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Block / PHC</label><div className="login-card__input-wrap"><span className="login-card__input-icon">BL</span><input type="text" value={form.block} onChange={update('block')} placeholder="Enter your block" className={`login-card__input ${fieldErrors.block ? 'has-error' : ''}`} /></div>{fieldErrors.block ? <div className="login-card__error">{fieldErrors.block}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Password</label><div className="login-card__input-wrap"><span className="login-card__input-icon">#</span><input type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Minimum 8 characters" className={`login-card__input login-card__input--password ${fieldErrors.password ? 'has-error' : ''}`} /><button type="button" className="login-card__toggle" onClick={() => setShowPw((prev) => !prev)}>{showPw ? 'Hide' : 'Show'}</button></div>{form.password ? <div className="register-form__strength"><div className="register-form__strength-bar"><div className="register-form__strength-fill" style={{ width: strength.width, background: strength.color }} /></div><div className="register-form__strength-label" style={{ color: strength.color || '#4a7a8a' }}>{strength.label || 'Add a stronger password'}</div></div> : null}{fieldErrors.password ? <div className="login-card__error">{fieldErrors.password}</div> : null}</div>
              <div className="login-card__field"><label className="login-card__label">Confirm Password</label><div className="login-card__input-wrap"><span className="login-card__input-icon">#</span><input type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} placeholder="Re-enter password" className={`login-card__input login-card__input--password ${fieldErrors.confirm ? 'has-error' : ''}`} /><button type="button" className="login-card__toggle" onClick={() => setShowConfirm((prev) => !prev)}>{showConfirm ? 'Hide' : 'Show'}</button></div>{fieldErrors.confirm ? <div className="login-card__error">{fieldErrors.confirm}</div> : null}</div>
            </div>
            <div className="register-form__terms"><label className="login-card__checkbox register-form__checkbox"><input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setFieldErrors((prev) => ({ ...prev, agreed: '' })); }} /><span>I agree to the <Link to="/terms" target="_blank">Terms of Use</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>, and I am the parent or lawful guardian of any child I register</span></label>{fieldErrors.agreed ? <div className="login-card__error">{fieldErrors.agreed}</div> : null}</div>
            <button type="submit" disabled={loading} className="login-card__submit">{loading ? <span className="login-card__spinner" /> : 'Create Account'}</button>
          </form>
          <div className="login-card__footer">Already have an account? <Link to="/login" className="login-card__footer-link">Sign In</Link><br /><br /><Link to="/terms" className="login-card__footer-link">Terms of Use</Link>{' | '}<Link to="/privacy" className="login-card__footer-link">Privacy Policy</Link></div>
        </div>
      </div>
    </div>
  );
}
