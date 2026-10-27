import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { campAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { palette, Badge } from '../asha/fieldUi';

const KINDS = {
  immunisation: { icon: '💉', labelKey: 'campImmunisation' },
  health: { icon: '🩺', labelKey: 'campHealth' },
  nutrition: { icon: '🥗', labelKey: 'campNutrition' },
  awareness: { icon: '📢', labelKey: 'campAwareness' },
  other: { icon: '📅', labelKey: 'campOther' },
};
const STATUS = { scheduled: ['#dbeafe', '#1d4ed8'], completed: ['#dcfce7', '#15803d'], cancelled: ['#f1f5f9', '#64748b'] };
const blank = { kind: 'immunisation', title: '', date: '', venue: '', village: '', notes: '', notify: true, block: '' };
const fmt = (d) => new Date(d).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Immunisation sessions, health camps and VHSND days in the worker's area (ASHA: her block)
export default function Camps() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [when, setWhen] = useState('upcoming');
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  const load = useCallback(() => {
    setLoading(true);
    campAPI.list(when).then((r) => setCamps(r.data || [])).catch((err) => setMsg({ text: err.response?.data?.message || 'Could not load', error: true })).finally(() => setLoading(false));
  }, [when]);
  useEffect(load, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: '', error: false });
    try {
      const { data } = await campAPI.create({ ...form, date: new Date(form.date).toISOString() });
      setMsg({ text: `${t('campScheduled')}${data.notifiedParents ? ` ${data.notifiedParents} ${t('parentsNotified')}` : ''}`, error: false });
      setForm(blank);
      setShowForm(false);
      setWhen('upcoming');
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Could not save', error: true });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    setBusy(true);
    try { await campAPI.update(id, { status }); load(); }
    catch (err) { setMsg({ text: err.response?.data?.message || 'Could not update', error: true }); }
    finally { setBusy(false); }
  }

  const canChange = (c) => user?.role === 'admin' || String(c.createdBy?._id) === String(user?.id || user?._id);
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Layout role={user?.role}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-megaphone me-2 text-success"></i>{t('healthCampaigns')}</h4>
        <button className="btn btn-sa-primary" onClick={() => setShowForm((s) => !s)}><i className="bi bi-plus-circle me-1"></i>{t('scheduleCamp')}</button>
      </div>

      {msg.text && <div className={`alert py-2 small ${msg.error ? 'alert-danger' : 'alert-success'}`}>{msg.text}</div>}

      {showForm && (
        <form onSubmit={submit} className="card border-0 shadow-sm p-3 mb-3">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="camp-kind">{t('messageType')}</label>
              <select id="camp-kind" className="form-select" value={form.kind} onChange={set('kind')}>
                {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.icon} {t(v.labelKey)}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label small fw-semibold" htmlFor="camp-title">{t('subject')} *</label>
              <input id="camp-title" className="form-control" required maxLength={150} placeholder={t('campTitlePlaceholder')} value={form.title} onChange={set('title')} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="camp-date">{t('meetingWhen')} *</label>
              <input id="camp-date" type="datetime-local" className="form-control" required min={minDate} value={form.date} onChange={set('date')} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="camp-venue">{t('venue')}</label>
              <input id="camp-venue" className="form-control" maxLength={200} placeholder="Anganwadi centre / Sub-centre" value={form.venue} onChange={set('venue')} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="camp-village">{t('village')}</label>
              <input id="camp-village" className="form-control" maxLength={100} value={form.village} onChange={set('village')} />
            </div>
            <div className="col-12">
              <textarea className="form-control" rows={2} maxLength={1000} placeholder={t('campNotesPlaceholder')} value={form.notes} onChange={set('notes')} />
            </div>
            <div className="col-12 form-check ms-2">
              <input id="camp-notify" type="checkbox" className="form-check-input" checked={form.notify} onChange={set('notify')} />
              <label htmlFor="camp-notify" className="form-check-label small">{t('notifyParents')}</label>
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('scheduleCamp')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="d-flex gap-2 mb-3">
        {[['upcoming', t('upcoming')], ['past', t('pastCamps')]].map(([k, label]) => (
          <button key={k} onClick={() => setWhen(k)} className={`btn btn-sm ${when === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : camps.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noCampScheduled')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {camps.map((c) => {
            const k = KINDS[c.kind] || KINDS.other;
            const [bg, color] = STATUS[c.status];
            return (
              <div key={c._id} className="card border-0 shadow-sm p-3" style={{ opacity: c.status === 'cancelled' ? 0.6 : 1 }}>
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="fw-bold" style={{ color: palette.text }}>{k.icon} {c.title}</div>
                    <div className="small" style={{ color: palette.muted }}>📅 {fmt(c.date)}{c.venue ? ` · 📍 ${c.venue}` : ''}{c.village ? ` · ${c.village}` : ''} · {c.block}</div>
                    {c.notes && <div className="small mt-1">{c.notes}</div>}
                    <div className="small text-muted mt-1">{t('scheduledBy')} {c.createdBy?.name || '—'}{c.notifiedParents ? ` · ${c.notifiedParents} ${t('parentsNotified')}` : ''}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <Badge bg={bg} color={color}>{t(`camp_${c.status}`)}</Badge>
                    {c.status === 'scheduled' && canChange(c) && (
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={() => setStatus(c._id, 'completed')}>{t('markHeld')}</button>
                        <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => setStatus(c._id, 'cancelled')}>{t('cancel')}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
