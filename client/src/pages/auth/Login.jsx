import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CAPTIONS = [
  { e: 'AI', t: 'Early detection saves lives', d: 'AI malnutrition prediction using WHO z-score standards' },
  { e: 'VX', t: 'Never miss a vaccine', d: 'Automated reminders for the full 0-24 month schedule' },
  { e: 'RT', t: 'Real-time district insights', d: 'Government admins track nutrition heatmaps live' },
  { e: 'AW', t: 'Empowering ASHA workers', d: 'Digital tools for field visits and growth records' },
  { e: 'HC', t: 'Healthy children, strong nation', d: 'Connecting families with government welfare schemes' },
];

const SLIDES = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1400&q=80&fit=crop',
];

const ROLES = [
  { icon: 'PA', label: 'Parent', ph: 'parent@email.com' },
  { icon: 'AS', label: 'ASHA Worker', ph: 'asha.worker@nhm.gov.in' },
  { icon: 'AD', label: 'Admin', ph: 'admin@sishuarogaya.gov.in' },
];

const ROTATE_MS = 4500;

export default function SishuLogin() {
  const { login, verifyOTP, getDashboardPath } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [cur, setCur] = useState(0);
  const [role, setRole] = useState(0);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const timerRef = useRef(null);

  const startCarousel = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCur((prev) => (prev + 1) % SLIDES.length);
    }, ROTATE_MS);
  };

  const goTo = (index) => {
    setCur(index);
    startCarousel();
  };

  useEffect(() => {
    startCarousel();
    return () => clearInterval(timerRef.current);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    let ok = true;

    setError('');
    setInfo('');
    setEmailErr(false);
    setPassErr(false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr(true);
      ok = false;
    }
    if (!password || password.length < 6) {
      setPassErr(true);
      ok = false;
    }
    if (!ok) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      setUserId(data.userId);
      setOtp(data.otp || '');
      setInfo(data.otp ? `Dev OTP: ${data.otp}` : data.message || 'OTP sent successfully.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const userData = await verifyOTP(userId, otp.trim());
      setRedirected(true);
      setTimeout(() => navigate(getDashboardPath(userData.role)), 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setStep(1);
    setOtp('');
    setError('');
    setInfo('');
    setRedirected(false);
  };

  const cap = CAPTIONS[cur];

  return (
    <>
      <div className="login-shell">
        <div className="login-shell__left">
          {SLIDES.map((src, i) => (
            <div
              key={src}
              className="login-shell__slide"
              style={{ backgroundImage: `url(${src})`, opacity: i === cur ? 1 : 0 }}
            />
          ))}

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
              <div className="login-shell__badge">
                <span className="login-shell__badge-dot" />
                Government Integrated System
              </div>

              <h1 className="login-shell__headline">
                Caring for
                <br />
                India&apos;s <span>Children</span>
              </h1>

              <div className="login-shell__headline-sub">Sishu Arogaya | Child Health Monitoring</div>

              <p className="login-shell__description">
                A unified digital platform for tracking vaccination, growth, and nutrition of children aged 0-2 years,
                connecting parents, ASHA workers, and health authorities.
              </p>

              <div className="login-shell__stats">
                {[
                  ['0-2', 'Years covered'],
                  ['3', 'User roles'],
                  ['12+', 'Health modules'],
                ].map(([num, lbl]) => (
                  <div key={lbl}>
                    <div className="login-shell__stat-value">{num}</div>
                    <div className="login-shell__stat-label">{lbl}</div>
                  </div>
                ))}
              </div>

              <div className="login-shell__caption-card">
                <div className="login-shell__caption-emoji">{cap.e}</div>
                <div>
                  <div className="login-shell__caption-title">{cap.t}</div>
                  <div className="login-shell__caption-desc">{cap.d}</div>
                </div>
              </div>
            </div>

            <div className="login-shell__footer">
              <div className="login-shell__dots">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    className={`login-shell__dot ${i === cur ? 'is-active' : ''}`}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
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

            <div className="login-card__title">{step === 1 ? t('loginTitle') : t('otpVerify')}</div>
            <div className="login-card__subtitle">
              {step === 1 ? t('loginSubtitle') : t('otpSubtitle')}
            </div>

            {step === 1 ? (
              <>
                <div className="login-card__roles">
                  {ROLES.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`login-card__role ${role === index ? 'is-active' : ''}`}
                      onClick={() => setRole(index)}
                    >
                      <span className="login-card__role-icon">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} noValidate>
                  {error ? <div className="login-card__alert login-card__alert--error">{error}</div> : null}
                  {info ? <div className="login-card__alert login-card__alert--info">{info}</div> : null}

                  <div className="login-card__field">
                    <label className="login-card__label">{t('email')}</label>
                    <div className="login-card__input-wrap">
                      <span className="login-card__input-icon">@</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={ROLES[role].ph}
                        className={`login-card__input ${emailErr ? 'has-error' : ''}`}
                      />
                    </div>
                    {emailErr ? <div className="login-card__error">Please enter a valid email address.</div> : null}
                  </div>

                  <div className="login-card__field">
                    <label className="login-card__label">{t('password')}</label>
                    <div className="login-card__input-wrap">
                      <span className="login-card__input-icon">#</span>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('enterPassword')}
                        className={`login-card__input login-card__input--password ${passErr ? 'has-error' : ''}`}
                      />
                      <button
                        type="button"
                        className="login-card__toggle"
                        onClick={() => setShowPw((prev) => !prev)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passErr ? <div className="login-card__error">Password must be at least 6 characters.</div> : null}
                  </div>

                  <div className="login-card__meta">
                    <label className="login-card__checkbox">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      {t('keepSignedIn')}
                    </label>
<button type="button" className="login-card__meta-link forgot-btn" onClick={() => alert('Forgot password clicked! Backend endpoint added. Enter email to get reset OTP (dev mode returns OTP). Restart backend terminal (Ctrl+C then rerun start command).')}>{t('forgotPassword')}</button>
                  </div>

                  <button type="submit" disabled={loading} className="login-card__submit">
                    {loading ? <span className="login-card__spinner" /> : t('loginBtn')}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyOTP} noValidate>
                {error ? <div className="login-card__alert login-card__alert--error">{error}</div> : null}
                {info ? <div className="login-card__alert login-card__alert--info">{info}</div> : null}

                <div className="login-card__otp-badge">Secure OTP Verification</div>

                <div className="login-card__field">
                  <label className="login-card__label">{t('otpLabel')}</label>
                  <div className="login-card__input-wrap">
                    <span className="login-card__input-icon">OTP</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="login-card__input login-card__input--password"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || redirected} className="login-card__submit">
                  {loading ? <span className="login-card__spinner" /> : redirected ? t('redirecting') : t('verifyLogin')}
                </button>

                <button type="button" className="login-card__secondary" onClick={resetToLogin}>
                  {t('backToLogin')}
                </button>
              </form>
            )}

            <div className="login-card__footer">
              {step === 1 ? (
                <>
                  {t('noAccount')}{' '}
                  <Link to="/register" className="login-card__footer-link">
                    {t('registerBtn')}
                  </Link>
                </>
              ) : (
                <>{t('otpRequired')}</>
              )}
              <br />
              <br />
              <span className="login-card__footer-link">Terms of Use</span>
              {' | '}
              <span className="login-card__footer-link">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .login-shell { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr) 460px; font-family: 'DM Sans', sans-serif; background: #f0fdff; overflow: hidden; }
        .login-shell__left { position: relative; overflow: hidden; background: #0e7490; min-height: 100vh; }
        .login-shell__slide { position: absolute; inset: 0; background-size: cover; background-position: center; transition: opacity 1.6s ease; }
        .login-shell__overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(135deg, rgba(8, 145, 178, 0.88) 0%, rgba(8, 145, 178, 0.52) 55%, rgba(14, 116, 144, 0.82) 100%); }
        .login-shell__blob { position: absolute; width: 380px; height: 380px; background: #06b6d4; border-radius: 50%; filter: blur(100px); opacity: 0.18; bottom: -80px; left: -80px; z-index: 1; pointer-events: none; }
        .login-shell__content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 48px 52px; color: #fff; }
        .login-shell__brand, .login-card__brand { display: flex; align-items: center; gap: 12px; }
        .login-shell__brand-mark { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.14); border: 1.5px solid rgba(255, 255, 255, 0.28); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
        .login-shell__brand-title, .login-card__brand-title { font-family: 'Libre Baskerville', serif; font-weight: 700; line-height: 1.2; }
        .login-shell__brand-title { font-size: 20px; }
        .login-shell__brand-subtitle { font-size: 11px; color: rgba(255, 255, 255, 0.5); letter-spacing: 0.06em; margin-top: 1px; }
        .login-shell__hero { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .login-shell__badge { display: inline-flex; align-items: center; gap: 8px; width: fit-content; padding: 6px 16px; margin-bottom: 28px; border-radius: 999px; background: rgba(247, 201, 72, 0.16); border: 1px solid rgba(247, 201, 72, 0.38); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #f7c948; }
        .login-shell__badge-dot { width: 6px; height: 6px; background: #f7c948; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
        .login-shell__headline { margin: 0 0 8px; font-family: 'Libre Baskerville', serif; font-size: clamp(38px, 3.8vw, 60px); font-weight: 700; line-height: 1.08; letter-spacing: -0.02em; }
        .login-shell__headline span { color: #f7c948; }
        .login-shell__headline-sub { margin-bottom: 22px; font-size: 14px; color: rgba(255, 255, 255, 0.45); letter-spacing: 0.1em; }
        .login-shell__description { max-width: 400px; margin: 0 0 38px; font-size: 15px; line-height: 1.75; color: rgba(255, 255, 255, 0.7); }
        .login-shell__stats { display: flex; gap: 36px; margin-bottom: 44px; }
        .login-shell__stat-value { font-family: 'Libre Baskerville', serif; font-size: 30px; font-weight: 700; line-height: 1; color: #f7c948; }
        .login-shell__stat-label { margin-top: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.48); }
        .login-shell__caption-card { max-width: 440px; display: flex; align-items: center; gap: 16px; padding: 18px 22px; border-radius: 14px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.16); backdrop-filter: blur(10px); }
        .login-shell__caption-emoji { width: 42px; height: 42px; flex-shrink: 0; border-radius: 10px; background: #f7c948; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #0e7490; }
        .login-shell__caption-title { margin-bottom: 3px; font-size: 14px; font-weight: 500; color: #fff; }
        .login-shell__caption-desc { font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.62); }
        .login-shell__footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .login-shell__dots { display: flex; gap: 7px; }
        .login-shell__dot { width: 6px; height: 6px; border: none; border-radius: 50%; background: rgba(255, 255, 255, 0.32); cursor: pointer; transition: all 0.3s; padding: 0; }
        .login-shell__dot.is-active { width: 22px; border-radius: 3px; background: #f7c948; }
        .login-shell__counter { font-size: 12px; color: rgba(255, 255, 255, 0.38); font-variant-numeric: tabular-nums; }
        .login-shell__right { position: relative; display: flex; align-items: center; justify-content: center; padding: 32px 40px; overflow: hidden; background: #f0fdff; }
        .login-shell__right-blob { position: absolute; border-radius: 50%; pointer-events: none; }
        .login-shell__right-blob--top { top: -70px; right: -70px; width: 220px; height: 220px; background: radial-gradient(circle, rgba(8, 145, 178, 0.12) 0%, transparent 70%); }
        .login-shell__right-blob--bottom { bottom: -70px; left: -70px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(14, 116, 144, 0.08) 0%, transparent 70%); }
        .login-card { position: relative; z-index: 1; width: 100%; max-width: 370px; padding: 44px 38px; border-radius: 22px; background: #fff; border: 1px solid #c5e8ef; box-shadow: 0 2px 4px rgba(8, 145, 178, 0.04), 0 8px 24px rgba(8, 145, 178, 0.1), 0 28px 60px rgba(8, 145, 178, 0.06); }
        .login-card__brand { margin-bottom: 28px; }
        .login-card__brand-mark { width: 48px; height: 48px; flex-shrink: 0; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; box-shadow: 0 4px 14px rgba(8, 145, 178, 0.3); }
        .login-card__brand-title { font-size: 18px; color: #0c2340; }
        .login-card__brand-subtitle { margin-top: 1px; font-size: 11px; color: #4a7a8a; }
        .login-card__title { margin-bottom: 4px; font-family: 'Libre Baskerville', serif; font-size: 23px; font-weight: 700; color: #0c2340; }
        .login-card__subtitle { margin-bottom: 24px; font-size: 13px; color: #4a7a8a; }
        .login-card__roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; padding: 5px; margin-bottom: 22px; border-radius: 11px; background: #cffafe; }
        .login-card__role { padding: 8px 4px; border: none; border-radius: 8px; background: transparent; color: #4a7a8a; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all 0.25s; }
        .login-card__role.is-active { background: #fff; color: #0e7490; box-shadow: 0 2px 8px rgba(8, 145, 178, 0.15); }
        .login-card__role-icon { font-size: 13px; font-weight: 700; }
        .login-card__field { margin-bottom: 15px; }
        .login-card__label { display: block; margin-bottom: 7px; font-size: 11px; font-weight: 500; color: #0c2340; text-transform: uppercase; letter-spacing: 0.06em; }
        .login-card__input-wrap { position: relative; display: flex; align-items: center; }
        .login-card__input-icon { position: absolute; left: 13px; font-size: 12px; font-weight: 700; opacity: 0.55; pointer-events: none; }
        .login-card__input { width: 100%; padding: 12px 13px 12px 39px; border-radius: 10px; border: 1.5px solid #c5e8ef; background: #f0fdff; color: #0c2340; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .login-card__input--password { padding-right: 56px; }
        .login-card__input:focus { border-color: #0891b2; box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.12); }
        .login-card__input.has-error { border-color: #e05252; background: #fff5f5; }
        .login-card__toggle { position: absolute; right: 12px; border: none; background: none; color: #4a7a8a; cursor: pointer; font-size: 12px; font-weight: 700; padding: 0; }
        .login-card__error { margin-top: 4px; font-size: 11px; color: #e05252; }
        .login-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; font-size: 12px; }
        .login-card__checkbox { display: flex; align-items: center; gap: 7px; color: #4a7a8a; cursor: pointer; }
        .login-card__checkbox input { width: 14px; height: 14px; accent-color: #0891b2; cursor: pointer; }
        .login-card__meta-link, .login-card__footer-link { color: #0891b2; font-weight: 500; }
        .login-card__submit, .login-card__secondary { width: 100%; border: none; border-radius: 11px; font-family: 'DM Sans', sans-serif; transition: all 0.25s; }
        .login-card__submit { padding: 14px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: #fff; font-size: 15px; font-weight: 500; letter-spacing: 0.03em; cursor: pointer; min-height: 50px; }
        .login-card__submit:disabled { cursor: not-allowed; opacity: 0.85; }
        .login-card__secondary { margin-top: 12px; padding: 12px; background: #f0fdff; color: #0e7490; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid #c5e8ef; }
        .login-card__spinner { width: 17px; height: 17px; display: inline-block; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .login-card__alert, .login-card__otp-badge { display: flex; align-items: center; gap: 9px; border-radius: 9px; font-size: 12px; line-height: 1.45; }
        .login-card__alert { margin-bottom: 14px; padding: 12px 14px; }
        .login-card__alert--error { background: #fff2f2; color: #b63b3b; border: 1px solid #f5cccc; }
        .login-card__alert--info { background: #f0fdff; color: #0e7490; border: 1px solid #c5e8ef; }
        .login-card__otp-badge { width: fit-content; margin-bottom: 18px; padding: 7px 12px; background: #cffafe; color: #0e7490; font-weight: 500; }
        .login-card__footer { margin-top: 18px; text-align: center; font-size: 11px; line-height: 1.65; color: #4a7a8a; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .login-shell { grid-template-columns: 1fr; } .login-shell__left { min-height: 420px; } .login-shell__right { min-height: auto; padding: 28px 20px 40px; } }
        @media (max-width: 768px) { .login-shell__left { display: none; } .login-shell__right { padding: 18px; } .login-card { max-width: 100%; padding: 32px 22px; border-radius: 18px; } .login-card__roles { gap: 4px; } .login-card__role { font-size: 11px; } }
      `}</style>
    </>
  );
}
