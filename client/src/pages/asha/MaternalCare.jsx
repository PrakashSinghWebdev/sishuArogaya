import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { maternalAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate, isoDay, telHref, Badge, HISTORY_RISKS } from './fieldUi';

const blank = { womanName: '', husbandName: '', age: '', phone: '', village: '', rchId: '', lmp: '', gravida: '', para: '', historyRisks: [] };

// What the ASHA needs to do next for this mother, in one line
function nextStep(p, t) {
  const s = p.summary;
  if (p.status === 'pregnant' && s.nextAnc?.number) {
    return { text: `ANC-${s.nextAnc.number} ${s.nextAnc.dueNow ? t('visitsDueNow').toLowerCase() : `${t('from')} ${fmtDate(s.nextAnc.dueDate)}`}`, urgent: s.nextAnc.dueNow };
  }
  if (p.status === 'delivered' && s.nextPnc && !s.nextPnc.complete) {
    return { text: `${t('pncVisit')} ${t('day')} ${s.nextPnc.day} · ${fmtDate(s.nextPnc.dueDate)}`, urgent: s.nextPnc.overdue || new Date(s.nextPnc.dueDate) <= new Date() };
  }
  return null;
}

// Pregnancy register: registration, due check-ups and high-risk mothers
export default function MaternalCare() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pregnant');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(new URLSearchParams(useLocation().search).get('new') === '1');
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });

  const load = useCallback(() => {
    maternalAPI.list()
      .then((r) => setRows(r.data))
      .catch((err) => setMessage({ text: err.response?.data?.message || 'Could not load', error: true }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleRisk = (r) => setForm((f) => ({ ...f, historyRisks: f.historyRisks.includes(r) ? f.historyRisks.filter((x) => x !== r) : [...f.historyRisks, r] }));

  async function submit(e) {
    e.preventDefault();
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) return setMessage({ text: t('phoneInvalid'), error: true });
    setBusy(true);
    setMessage({ text: '', error: false });
    try {
      await maternalAPI.register(form);
      setForm(blank);
      setShowForm(false);
      setMessage({ text: t('pregnancyRegistered'), error: false });
      load();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Could not register', error: true });
    } finally {
      setBusy(false);
    }
  }

  const q = search.trim().toLowerCase();
  const shown = rows
    .filter((p) => p.status === tab)
    .filter((p) => !q || [p.womanName, p.husbandName, p.village, p.phone, p.rchId].some((v) => String(v || '').toLowerCase().includes(q)))
    // high-risk and due-now mothers first
    .sort((a, b) => b.summary.risk.high.length - a.summary.risk.high.length || Number(Boolean(nextStep(b, t)?.urgent)) - Number(Boolean(nextStep(a, t)?.urgent)));
  const count = (s) => rows.filter((p) => p.status === s).length;
  const highRisk = rows.filter((p) => p.status === 'pregnant' && p.summary.risk.high.length).length;
  const dueNow = rows.filter((p) => nextStep(p, t)?.urgent).length;

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-heart-pulse me-2 text-danger"></i>{t('maternalCare')}</h4>
        <button className="btn btn-sa-primary" onClick={() => setShowForm((s) => !s)}><i className="bi bi-plus-circle me-1"></i>{t('registerPregnancy')}</button>
      </div>

      <div className="row g-2 mb-3">
        {[[t('pregnantWomen'), count('pregnant'), palette.dark, '#cffafe'], [t('highRisk'), highRisk, '#991b1b', '#fee2e2'], [t('checkupsDue'), dueNow, '#92400e', '#fef3c7']].map(([label, n, color, bg]) => (
          <div className="col-4" key={label}>
            <div className="card border-0 shadow-sm text-center p-2" style={{ background: bg }}>
              <div className="fw-bold fs-3" style={{ color }}>{n}</div>
              <div className="small fw-semibold" style={{ color }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {message.text && <div className={`alert py-2 small ${message.error ? 'alert-danger' : 'alert-success'}`}>{message.text}</div>}

      {showForm && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-3 mb-3">
          <div className="row g-2">
            {[
              ['womanName', t('womanName'), { required: true, maxLength: 100 }],
              ['husbandName', t('husbandName'), { maxLength: 100 }],
              ['lmp', t('lmp'), { required: true, type: 'date', max: isoDay(0), min: isoDay(-300) }],
              ['age', t('age'), { type: 'number', min: 10, max: 60, inputMode: 'numeric' }],
              ['phone', t('phone2'), { type: 'tel', inputMode: 'numeric', maxLength: 14 }],
              ['village', t('village'), { maxLength: 100 }],
              ['gravida', t('gravida'), { type: 'number', min: 1, max: 20, inputMode: 'numeric' }],
              ['para', t('para'), { type: 'number', min: 0, max: 20, inputMode: 'numeric' }],
              ['rchId', t('rchId'), { maxLength: 30 }],
            ].map(([key, label, props]) => (
              <div className="col-md-4 col-6" key={key}>
                <label className="form-label small fw-semibold" htmlFor={`preg-${key}`}>{label}{props.required ? ' *' : ''}</label>
                <input id={`preg-${key}`} className="form-control" value={form[key]} onChange={set(key)} {...props} />
              </div>
            ))}
          </div>
          {form.lmp && <div className="small mt-2" style={{ color: palette.dark }}>📅 {t('edd')}: <strong>{fmtDate(new Date(new Date(form.lmp).getTime() + 280 * 864e5))}</strong></div>}
          <div className="mt-3">
            <div className="small fw-semibold mb-1">{t('riskHistory')}</div>
            <div className="d-flex flex-wrap gap-1">
              {HISTORY_RISKS.map((r) => (
                <button type="button" key={r} onClick={() => toggleRisk(r)} className={`btn btn-sm ${form.historyRisks.includes(r) ? 'btn-danger' : 'btn-outline-secondary'}`} style={{ fontSize: 12 }}>{r}</button>
              ))}
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('registerPregnancy')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="d-flex gap-2 mb-2 flex-wrap">
        {[['pregnant', 'tabPregnant'], ['delivered', 'tabPostnatal'], ['closed', 'refClosed']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn btn-sm ${tab === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{t(label)} ({count(k)})</button>
        ))}
      </div>
      <input className="form-control mb-3" placeholder={t('familySearch')} value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>
      ) : shown.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {shown.map((p) => {
            const s = p.summary;
            const step = nextStep(p, t);
            const risky = s.risk.high.length > 0;
            return (
              <div key={p._id} className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${risky ? '#dc2626' : palette.primary}` }}>
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <Link to={`/asha/pregnancy/${p._id}`} className="fw-bold text-decoration-none" style={{ color: palette.text }}>{p.womanName} →</Link>
                    {p.age ? <span className="small text-muted"> · {p.age} {t('years')}</span> : null}
                    <div className="small" style={{ color: palette.muted }}>
                      {p.husbandName ? `${p.husbandName} · ` : ''}{p.village || '—'}
                      {p.phone && <> · <a href={telHref(p.phone)}>{p.phone}</a></>}
                    </div>
                  </div>
                  <div className="text-end small" style={{ color: palette.text }}>
                    {p.status === 'pregnant' && <div><strong>{s.weeks} {t('weeks')}</strong> · T{s.trimester} · {t('edd')} {fmtDate(s.edd)}</div>}
                    {p.status === 'delivered' && <div>{t('delivered')} {fmtDate(p.delivery?.date)}</div>}
                    {p.status === 'closed' && <div>{p.closeReason}</div>}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {step && <Badge bg={step.urgent ? '#fef3c7' : '#cffafe'} color={step.urgent ? '#92400e' : palette.dark}>📅 {step.text}</Badge>}
                  {s.nextAnc?.missed?.length > 0 && <Badge bg="#fee2e2" color="#991b1b">{t('missedAnc')}: {s.nextAnc.missed.map((n) => `ANC-${n}`).join(', ')}</Badge>}
                  {s.risk.high.map((r) => <Badge key={r} bg="#dc2626" color="#fff">⚠ {r}</Badge>)}
                  {s.risk.warnings.map((r) => <Badge key={r} bg="#fef3c7" color="#92400e">{r}</Badge>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
