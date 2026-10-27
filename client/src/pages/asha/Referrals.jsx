import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ashaAPI, hospitalAPI, maternalAPI, referralAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation as useGPSLocation } from '../../context/LocationContext';
import { palette, URGENCY, EMERGENCY_NUMBERS, fmtDate, isoDay, telHref, Badge } from './fieldUi';

// Quick reasons: IMNCI danger signs and common referral triggers (the ASHA can also type her own)
const QUICK_REASONS = [
  'Fast or difficult breathing',
  'Not able to feed / vomits everything',
  'Convulsions (fits)',
  'Very sleepy or unconscious',
  'Severe dehydration (sunken eyes)',
  'High fever',
  'Severe acute malnutrition (SAM)',
  'Growth faltering',
  'Missed vaccinations',
];

const STATUS_STYLE = {
  pending: { bg: '#fef3c7', color: '#92400e', labelKey: 'refPending' },
  reached: { bg: '#cffafe', color: '#0e7490', labelKey: 'refReached' },
  completed: { bg: '#d1fae5', color: '#059669', labelKey: 'refCompleted' },
  cancelled: { bg: '#f1f5f9', color: '#475569', labelKey: 'refCancelled' },
};

// target is 'child:<id>' or 'mother:<pregnancy id>'
const blank = { target: '', reason: '', urgency: 'urgent', facility: '', followUpDate: isoDay(3) };

export default function Referrals() {
  const { t } = useLanguage();
  const { coords } = useGPSLocation();
  const params = new URLSearchParams(useLocation().search);
  const prefill = params.get('pregnancyId') ? `mother:${params.get('pregnancyId')}` : params.get('childId') ? `child:${params.get('childId')}` : '';
  const [referrals, setReferrals] = useState([]);
  const [children, setChildren] = useState([]);
  const [mothers, setMothers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [showForm, setShowForm] = useState(Boolean(prefill) || params.get('new') === '1');
  const [form, setForm] = useState({ ...blank, target: prefill });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    referralAPI.list()
      .then((r) => setReferrals(r.data))
      .catch((err) => setMessage({ text: err.response?.data?.message || 'Could not load referrals', error: true }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
    ashaAPI.getMyChildren().then((r) => setChildren(r.data || [])).catch(() => {});
    maternalAPI.list().then((r) => setMothers((r.data || []).filter((m) => m.status !== 'closed'))).catch(() => {});
  }, [load]);

  // Nearest government facilities as suggestions for the "facility" box
  useEffect(() => {
    if (!coords) return;
    hospitalAPI.nearby(coords.lat, coords.lng, 30000)
      .then((r) => setFacilities((r.data.hospitals || []).slice(0, 15)))
      .catch(() => {});
  }, [coords]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage({ text: '', error: false });
    try {
      const [kind, id] = form.target.split(':');
      const { target, ...rest } = form;
      await referralAPI.create({ ...rest, [kind === 'mother' ? 'pregnancyId' : 'childId']: id });
      setMessage({ text: t('referralSaved'), error: false });
      setForm(blank);
      setShowForm(false);
      load();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Could not save referral', error: true });
    } finally {
      setBusy(false);
    }
  }

  async function update(id, data) {
    setBusy(true);
    try {
      await referralAPI.update(id, data);
      setNoteFor(null);
      setNote('');
      load();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Could not update', error: true });
    } finally {
      setBusy(false);
    }
  }

  const open = (r) => r.status === 'pending' || r.status === 'reached';
  const shown = referrals.filter((r) => (filter === 'open' ? open(r) : filter === 'closed' ? !open(r) : true));

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-hospital me-2 text-danger"></i>{t('referrals')}</h4>
        <button className="btn btn-danger" onClick={() => setShowForm((s) => !s)}><i className="bi bi-plus-circle me-1"></i>{t('newReferral')}</button>
      </div>

      {/* Emergency helplines: one tap to call */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {EMERGENCY_NUMBERS.map((n) => (
          <a key={n.number} href={telHref(n.number)} className="btn btn-outline-danger btn-sm fw-semibold">📞 {n.number} · {t(n.labelKey)}</a>
        ))}
      </div>

      {message.text && <div className={`alert py-2 small ${message.error ? 'alert-danger' : 'alert-success'}`}>{message.text}</div>}

      {showForm && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-3 mb-3">
          <div className="small mb-2 p-2 rounded" style={{ background: '#fef2f2', color: '#991b1b' }}>
            ⚠️ {t('referralSafetyNote')}
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label small fw-semibold" htmlFor="ref-child">{t('whoIsReferred')} *</label>
              <select id="ref-child" className="form-select" required value={form.target} onChange={set('target')}>
                <option value="">— {t('selectChild')} —</option>
                <optgroup label={t('myChildren')}>
                  {children.map((c) => <option key={c._id} value={`child:${c._id}`}>{c.name}{c.motherName ? ` (${c.motherName})` : ''}</option>)}
                </optgroup>
                {mothers.length > 0 && (
                  <optgroup label={t('maternalCare')}>
                    {mothers.map((m) => <option key={m._id} value={`mother:${m._id}`}>🤰 {m.womanName}{m.village ? ` (${m.village})` : ''}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="col-md-6">
              <span className="form-label small fw-semibold d-block">{t('urgency')} *</span>
              <div className="btn-group w-100" role="group">
                {['routine', 'urgent', 'emergency'].map((u) => (
                  <button type="button" key={u} onClick={() => setForm((f) => ({ ...f, urgency: u }))}
                    className={`btn btn-sm ${form.urgency === u ? (u === 'emergency' ? 'btn-danger' : 'btn-sa-primary') : 'btn-outline-secondary'}`}>
                    {t(URGENCY[u].label)}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold" htmlFor="ref-reason">{t('referralReason')} *</label>
              <div className="d-flex flex-wrap gap-1 mb-2">
                {QUICK_REASONS.map((r) => (
                  <button type="button" key={r} className={`btn btn-sm ${form.reason === r ? 'btn-secondary' : 'btn-outline-secondary'}`} style={{ fontSize: 12 }} onClick={() => setForm((f) => ({ ...f, reason: r }))}>{r}</button>
                ))}
              </div>
              <textarea id="ref-reason" className="form-control" rows={2} required maxLength={500} value={form.reason} onChange={set('reason')} />
            </div>
            <div className="col-md-8">
              <label className="form-label small fw-semibold" htmlFor="ref-facility">{t('referTo')}</label>
              <input id="ref-facility" className="form-control" list="ref-facilities" maxLength={200} placeholder="PHC / CHC / District Hospital" value={form.facility} onChange={set('facility')} />
              <datalist id="ref-facilities">
                {facilities.map((h) => <option key={h._id} value={h.name}>{h.distanceMeters != null ? `${(h.distanceMeters / 1000).toFixed(1)} km` : ''}</option>)}
              </datalist>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="ref-follow">{t('followUpDate')}</label>
              <input id="ref-follow" type="date" className="form-control" min={isoDay(0)} value={form.followUpDate} onChange={set('followUpDate')} />
            </div>
          </div>
          {form.urgency === 'emergency' && (
            <div className="alert alert-danger mt-3 mb-0 py-2">
              🚨 {t('emergencyCallFirst')} <a href={telHref('108')} className="fw-bold">108</a>
            </div>
          )}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? '…' : t('saveReferral')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="d-flex gap-2 mb-3">
        {[['open', 'refOpen'], ['closed', 'refClosed'], ['all', 'visitsAll']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>
            {t(label)} ({referrals.filter((r) => (k === 'open' ? open(r) : k === 'closed' ? !open(r) : true)).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
      ) : shown.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {shown.map((r) => {
            const st = STATUS_STYLE[r.status];
            const urg = URGENCY[r.urgency];
            const overdue = open(r) && r.followUpDate && new Date(r.followUpDate) < new Date(isoDay(0));
            return (
              <div key={r._id} className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${r.urgency === 'emergency' ? '#dc2626' : st.color}` }}>
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    {r.pregnancyId
                      ? <Link to={`/asha/pregnancy/${r.pregnancyId._id}`} className="fw-bold text-decoration-none" style={{ color: palette.text }}>🤰 {r.pregnancyId.womanName}</Link>
                      : <Link to={`/asha/child/${r.childId?._id}`} className="fw-bold text-decoration-none" style={{ color: palette.text }}>{r.childId?.name || '—'}</Link>}
                    <div className="small" style={{ color: palette.text }}>{r.reason}</div>
                    <div className="small" style={{ color: palette.muted }}>
                      {r.facility ? `🏥 ${r.facility} · ` : ''}{t('referredOn')} {fmtDate(r.createdAt)}
                      {r.followUpDate && <span className={overdue ? 'text-danger fw-semibold' : ''}> · {t('followUpDate')}: {fmtDate(r.followUpDate)}</span>}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <Badge bg={urg.bg} color={urg.color}>{t(urg.label)}</Badge>
                    <Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge>
                    {r.escalatedAt && <Badge bg="#ede9fe" color="#5b21b6">{t('escalated')}</Badge>}
                  </div>
                </div>
                {r.history?.length > 1 && (
                  <div className="small mt-2" style={{ color: palette.muted }}>
                    {r.history.slice(1).map((h) => <div key={h._id}>• {fmtDate(h.at)}: {t(STATUS_STYLE[h.status]?.labelKey)}{h.note ? ` — ${h.note}` : ''}</div>)}
                  </div>
                )}
                {open(r) && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {r.status === 'pending' && <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => update(r._id, { status: 'reached' })}>{t('markReached')}</button>}
                    <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={() => update(r._id, { status: 'completed' })}>{t('markCompleted')}</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setNoteFor(noteFor === r._id ? null : r._id); setNote(''); }}>{t('addNote')}</button>
                    {!r.escalatedAt && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => update(r._id, { escalate: true, note: note || undefined })}>{t('escalate')}</button>}
                  </div>
                )}
                {noteFor === r._id && (
                  <div className="d-flex gap-2 mt-2">
                    <input className="form-control form-control-sm" maxLength={500} placeholder={t('notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
                    <button className="btn btn-sm btn-sa-primary" disabled={busy || !note.trim()} onClick={() => update(r._id, { note })}>{t('save2')}</button>
                    <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => update(r._id, { status: 'cancelled', note: note || undefined })}>{t('refCancel')}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
