import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import RoleShell from '../../components/RoleShell';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { ashaAPI, authAPI, messageAPI } from '../../services/api';
import { TEXT_SIZES, getTextSize, applyTextSize } from '../../utils/textSize';

const ROLE_LABEL = { parent: 'roleParent', asha: 'ashaWorkerRole', admin: 'roleAdmin' };
const NOTIF_TYPES = [
  { key: 'vaccine_reminder', labelKey: 'prefVaccines', icon: 'bi-eyedropper' },
  { key: 'visit_reminder', labelKey: 'prefVisits', icon: 'bi-calendar-check' },
  { key: 'scheme_update', labelKey: 'prefSchemes', icon: 'bi-bank' },
  { key: 'system', labelKey: 'prefMessages', icon: 'bi-chat-left-text' },
];
const HELPLINES = [['104', 'helpline104'], ['108', 'ambulance108'], ['102', 'transport102'], ['1098', 'childline1098'], ['14416', 'teleManas']];
const FAQ = {
  parent: [['faqParentAddQ', 'faqParentAddA'], ['faqParentVaccQ', 'faqParentVaccA'], ['faqParentAshaQ', 'faqParentAshaA'], ['faqForgotQ', 'faqForgotParentA']],
  asha: [['faqAshaVisitQ', 'faqAshaVisitA'], ['faqAshaVaccQ', 'faqAshaVaccA'], ['faqAshaReferQ', 'faqAshaReferA'], ['faqForgotQ', 'faqForgotStaffA']],
  admin: [['faqAdminCreateQ', 'faqAdminCreateA'], ['faqSupClaimsQ', 'faqSupClaimsA'], ['faqSupMsgQ', 'faqSupMsgA'], ['faqAdminResetQ', 'faqAdminResetA']],
};
const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function Row({ icon, label, value, onClick, danger }) {
  return (
    <button type="button" className="as-row" onClick={onClick} style={danger ? { color: '#dc2626' } : undefined}>
      <i className={`bi ${icon} as-row-icon`}></i>
      <span className="as-row-label">{label}</span>
      {value && <span className="as-row-value">{value}</span>}
      <i className="bi bi-arrow-right as-row-arrow"></i>
    </button>
  );
}

// One settings screen for every role: profile, security, notifications, language, text size, about, help
export default function AccountSettings() {
  const { user, setUser, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const panel = params.get('s'); // open detail panel, kept in the URL so Back works
  const open = (s) => setParams(s ? { s } : {});
  const role = user?.role;

  const [me, setMe] = useState(null); // full account from /auth/me (+ ASHA profile)
  const [asha, setAsha] = useState(null);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [prefs, setPrefs] = useState(null);
  const [textSize, setTextSize] = useState(getTextSize());
  const [report, setReport] = useState({ subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  useEffect(() => {
    authAPI.getMe().then((r) => {
      setMe(r.data.user);
      setProfile({ name: r.data.user.name || '', phone: r.data.user.phone || '' });
      setPrefs({ vaccine_reminder: true, visit_reminder: true, scheme_update: true, system: true, ...(r.data.user.notificationPrefs || {}) });
    }).catch(() => {});
    if (role === 'asha') ashaAPI.getProfile().then((r) => setAsha(r.data)).catch(() => {});
  }, [role]);
  useEffect(() => setMsg({ text: '', error: false }), [panel]);

  async function run(fn, okText) {
    setBusy(true);
    setMsg({ text: '', error: false });
    try { await fn(); setMsg({ text: okText, error: false }); return true; }
    catch (err) { setMsg({ text: err.response?.data?.message || 'Something went wrong', error: true }); return false; }
    finally { setBusy(false); }
  }

  const saveProfile = (e) => {
    e.preventDefault();
    run(async () => {
      const { data } = await authAPI.updateProfile({ name: profile.name, phone: profile.phone });
      setMe(data.user);
      setUser((u) => ({ ...u, name: data.user.name }));
    }, t('profileSaved'));
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (pass.next.length < 8) return setMsg({ text: t('pwTooShort'), error: true });
    if (pass.next !== pass.confirm) return setMsg({ text: t('pwMismatch'), error: true });
    if (pass.next === pass.current) return setMsg({ text: t('pwSameAsOld'), error: true });
    return run(async () => {
      await authAPI.changePassword({ currentPassword: pass.current, newPassword: pass.next });
      setPass({ current: '', next: '', confirm: '' });
    }, t('passwordChanged'));
  };

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    run(() => authAPI.updatePreferences({ [key]: next[key] }), t('saved'));
  };

  const sendReport = (e) => {
    e.preventDefault();
    run(async () => {
      await messageAPI.send({ support: true, subject: `[Problem] ${report.subject}`, body: report.body });
      setReport({ subject: '', body: '' });
    }, t('problemReported'));
  };

  const signOutEverywhere = () => {
    if (!window.confirm(t('signOutAllConfirm'))) return;
    logout(); // the server revokes every session for this account
    navigate('/login');
  };

  const langLabel = LANGUAGES.find((l) => l.code === language)?.label || language;
  const PANEL_TITLE = { profile: 'manageProfile', security: 'passwordSecurity', notifications: 'notificationsNav', language: 'languageNav', text: 'textSize', about: 'aboutUs', help: 'helpCenter' };
  const area = role === 'asha' && asha
    ? [[t('ashaIdLabel'), asha.ashaId], [t('block'), asha.block], [t('district'), asha.district], [t('village'), asha.village]]
    : role === 'parent' ? [[t('district'), me?.district], [t('block'), me?.block]] : [];

  return (
    <RoleShell role={role}>
      <style>{`
        .as-wrap{max-width:620px;margin:0 auto;font-family:'DM Sans','Segoe UI',sans-serif}
        .as-card{background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06),0 6px 20px rgba(15,23,42,.04);overflow:hidden}
        .as-head{display:flex;align-items:center;gap:16px;padding:18px 20px;margin-bottom:22px}
        .as-avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#0891b2,#16a34a);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0}
        .as-section{font-size:14px;color:#64748b;margin:0 4px 8px}
        .as-group{margin-bottom:22px}
        .as-row{display:flex;align-items:center;gap:14px;width:100%;padding:16px 20px;background:none;border:0;border-bottom:1px solid #f1f5f9;text-align:left;color:#0f172a;font-size:16px}
        .as-row:last-child{border-bottom:0}
        .as-row:hover{background:#f8fafc}
        .as-row-icon{font-size:20px;width:22px;text-align:center;color:#334155}
        .as-row-label{flex:1}
        .as-row-value{font-size:14px;color:#64748b}
        .as-row-arrow{font-size:14px;color:#334155}
        .as-panel{padding:20px}
        .as-back{display:inline-flex;align-items:center;gap:8px;border:0;background:none;color:#0f172a;font-size:18px;font-weight:700;padding:0;margin-bottom:16px}
        .as-switch{width:46px;height:26px;border-radius:999px;border:0;position:relative;transition:background .2s;flex-shrink:0}
        .as-switch::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
        .as-switch[aria-checked="true"]{background:#16a34a}.as-switch[aria-checked="true"]::after{left:23px}
        .as-switch[aria-checked="false"]{background:#cbd5e1}
        .as-switch:disabled{opacity:.6}
        .as-choice{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:8px;font-size:15px}
        .as-choice.is-on{border-color:#16a34a;background:#f0fdf4;color:#166534;font-weight:600}
      `}</style>

      <div className="as-wrap">
        {msg.text && <div className={`alert py-2 small ${msg.error ? 'alert-danger' : 'alert-success'}`}>{msg.text}</div>}

        {!panel && (
          <>
            <div className="as-card as-head">
              <div className="as-avatar">{initials(me?.name || user?.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold" style={{ fontSize: 20, color: '#0f172a' }}>{me?.name || user?.name}</div>
                <div className="text-truncate" style={{ color: '#64748b' }}>{me?.username || me?.email || user?.email}</div>
                <span className="badge rounded-pill mt-1" style={{ background: '#ecfdf5', color: '#166534' }}>{t(ROLE_LABEL[role])}</span>
              </div>
            </div>

            <div className="as-section">{t('accountSection')}</div>
            <div className="as-card as-group">
              <Row icon="bi-person-circle" label={t('manageProfile')} onClick={() => open('profile')} />
              <Row icon="bi-lock" label={t('passwordSecurity')} onClick={() => open('security')} />
              <Row icon="bi-bell" label={t('notificationsNav')} onClick={() => open('notifications')} />
              <Row icon="bi-translate" label={t('languageNav')} value={langLabel} onClick={() => open('language')} />
            </div>

            <div className="as-section">{t('preferencesSection')}</div>
            <div className="as-card as-group">
              <Row icon="bi-info-square" label={t('aboutUs')} onClick={() => open('about')} />
              <Row icon="bi-fonts" label={t('textSize')} value={t(`textSize_${textSize}`)} onClick={() => open('text')} />
            </div>

            <div className="as-section">{t('supportSection')}</div>
            <div className="as-card as-group">
              <Row icon="bi-question-circle" label={t('helpCenter')} onClick={() => open('help')} />
              <Row icon="bi-box-arrow-right" label={t('logout').replace(/^[^\p{L}]+/u, '')} danger onClick={() => { logout(); navigate('/login'); }} />
            </div>
          </>
        )}

        {panel && (
          <div className="as-card as-panel">
            <button type="button" className="as-back" onClick={() => open(null)}><i className="bi bi-arrow-left"></i>{t(PANEL_TITLE[panel] || 'settingsNav')}</button>

            {panel === 'profile' && (
              <form onSubmit={saveProfile}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="as-name">{t('fullName')}</label>
                  <input id="as-name" className="form-control" required minLength={2} maxLength={100} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="as-phone">{t('phone2')}</label>
                  <input id="as-phone" className="form-control" type="tel" inputMode="numeric" pattern="\d{10}" title="10-digit mobile number" required value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="as-email">{t('email2')}</label>
                  <input id="as-email" className="form-control" value={me?.email || ''} readOnly disabled />
                </div>
                {area.filter(([, v]) => v).map(([label, value]) => (
                  <div className="d-flex justify-content-between py-2 border-bottom small" key={label}><span className="text-muted">{label}</span><strong>{value}</strong></div>
                ))}
                {role !== 'admin' && <div className="small text-muted mt-2">{t('areaManagedByAdmin')}</div>}
                <button className="btn btn-sa-primary w-100 mt-3" disabled={busy}>{busy ? '…' : t('save2')}</button>
              </form>
            )}

            {panel === 'security' && (
              <>
                <form onSubmit={changePassword}>
                  {[['current', 'pwCurrent', 'current-password'], ['next', 'pwNew', 'new-password'], ['confirm', 'pwConfirm', 'new-password']].map(([k, label, ac]) => (
                    <div className="mb-3" key={k}>
                      <label className="form-label small fw-semibold" htmlFor={`as-${k}`}>{t(label)}</label>
                      <input id={`as-${k}`} type="password" className="form-control" required autoComplete={ac} value={pass[k]} onChange={(e) => setPass((p) => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="small text-muted mb-3">{t('pwRuleLength')} {t('pwSignsOutOthers')}</div>
                  <button className="btn btn-sa-primary w-100" disabled={busy}>{busy ? '…' : t('setNewPassword')}</button>
                </form>
                <hr />
                <div className="fw-semibold mb-1">{t('signOutAll')}</div>
                <div className="small text-muted mb-2">{t('signOutAllHint')}</div>
                <button type="button" className="btn btn-outline-danger w-100" onClick={signOutEverywhere}>{t('signOutAll')}</button>
              </>
            )}

            {panel === 'notifications' && prefs && (
              <>
                {NOTIF_TYPES.map((n) => (
                  <div key={n.key} className="d-flex align-items-center gap-3 py-3 border-bottom">
                    <i className={`bi ${n.icon}`} style={{ fontSize: 20 }}></i>
                    <span className="flex-grow-1">{t(n.labelKey)}</span>
                    <button type="button" role="switch" aria-checked={prefs[n.key]} aria-label={t(n.labelKey)} className="as-switch" disabled={busy} onClick={() => togglePref(n.key)} />
                  </div>
                ))}
                <div className="d-flex align-items-center gap-3 py-3">
                  <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 20 }}></i>
                  <span className="flex-grow-1">{t('prefEmergency')}<div className="small text-muted">{t('prefEmergencyHint')}</div></span>
                  <button type="button" role="switch" aria-checked="true" aria-label={t('prefEmergency')} className="as-switch" disabled />
                </div>
                <Link to={`/${role}/notifications`} className="btn btn-outline-secondary w-100 mt-2">{t('openNotifications')}</Link>
              </>
            )}

            {panel === 'language' && LANGUAGES.map((l) => (
              <button key={l.code} type="button" className={`as-choice ${l.code === language ? 'is-on' : ''}`} onClick={() => { setLanguage(l.code); open(null); }}>
                {l.label}{l.code === language && <i className="bi bi-check-lg"></i>}
              </button>
            ))}

            {panel === 'text' && (
              <>
                {Object.keys(TEXT_SIZES).map((k) => (
                  <button key={k} type="button" className={`as-choice ${k === textSize ? 'is-on' : ''}`} onClick={() => { applyTextSize(k); setTextSize(k); }} style={{ fontSize: `calc(15px * ${parseFloat(TEXT_SIZES[k]) / 100})` }}>
                    {t(`textSize_${k}`)}{k === textSize && <i className="bi bi-check-lg"></i>}
                  </button>
                ))}
                <div className="small text-muted">{t('textSizeHint')}</div>
              </>
            )}

            {panel === 'about' && (
              <>
                <p>{t('aboutText')}</p>
                {[[t('appVersion'), '1.0'], ...(role === 'admin' ? [['Stack', 'MERN (MongoDB · Express · React · Node.js)'], ['University', 'Dev Bhoomi Uttarakhand University']] : [])].map(([k, v]) => (
                  <div key={k} className="d-flex justify-content-between py-2 border-bottom small"><span className="text-muted">{k}</span><strong>{v}</strong></div>
                ))}
                <Link to="/about" className="btn btn-outline-secondary w-100 mt-3">{t('aboutUs')} →</Link>
              </>
            )}

            {panel === 'help' && (
              <>
                <div className="fw-semibold mb-2">{t('faqTitle')}</div>
                {(FAQ[role] || []).map(([q, a]) => (
                  <details key={q} className="border rounded-3 px-3 py-2 mb-2">
                    <summary className="fw-semibold" style={{ cursor: 'pointer' }}>{t(q)}</summary>
                    <div className="small text-muted mt-2">{t(a)}</div>
                  </details>
                ))}
                <div className="fw-semibold mt-3 mb-2">{t('freeHelplines')}</div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {HELPLINES.map(([n, k]) => <a key={n} href={`tel:${n}`} className="btn btn-sm btn-outline-danger">📞 {n} · {t(k)}</a>)}
                </div>
                {role !== 'admin' && (
                  <form onSubmit={sendReport}>
                    <div className="fw-semibold mb-1">{t('reportProblem')}</div>
                    <div className="small text-muted mb-2">{t('reportProblemHint')}</div>
                    <input className="form-control mb-2" required maxLength={120} placeholder={t('subject')} value={report.subject} onChange={(e) => setReport((r) => ({ ...r, subject: e.target.value }))} />
                    <textarea className="form-control mb-2" rows={3} required maxLength={2000} placeholder={t('reportProblemBody')} value={report.body} onChange={(e) => setReport((r) => ({ ...r, body: e.target.value }))} />
                    <button className="btn btn-sa-primary w-100" disabled={busy}>{busy ? '…' : t('send')}</button>
                    <Link to={`/${role}/messages`} className="d-block text-center small mt-2">{t('myRequests')}</Link>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </RoleShell>
  );
}
