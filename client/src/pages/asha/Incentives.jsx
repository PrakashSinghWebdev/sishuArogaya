import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { incentiveAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate, Badge } from './fieldUi';

export const CLAIM_STATUS = {
  pending: { bg: '#f1f5f9', color: '#475569', labelKey: 'claimPending' },
  submitted: { bg: '#dbeafe', color: '#1d4ed8', labelKey: 'claimSubmitted' },
  approved: { bg: '#dcfce7', color: '#15803d', labelKey: 'claimApproved' },
  rejected: { bg: '#fee2e2', color: '#b91c1c', labelKey: 'claimRejected' },
  paid: { bg: '#d1fae5', color: '#065f46', labelKey: 'claimPaid' },
};
const thisMonth = () => new Date().toISOString().slice(0, 7);
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const blank = (month) => ({ activity: '', month, beneficiary: '', childId: '', pregnancyId: '', amount: '', notes: '' });

// ASHA incentive claims: activities found in her records, claims she makes, and their approval status.
// Rates follow the state's guidelines, so the amount is entered by the ASHA, not calculated.
export default function Incentives() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(thisMonth());
  const [claims, setClaims] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  const load = useCallback(() => {
    incentiveAPI.list().then((r) => setClaims(r.data || [])).catch((err) => setMsg({ text: err.response?.data?.message || 'Could not load', error: true }));
    incentiveAPI.suggestions(month).then((r) => setSuggestions(r.data.suggestions || [])).catch(() => setSuggestions([]));
  }, [month]);
  useEffect(load, [load]);
  useEffect(() => { incentiveAPI.activities().then((r) => setActivities(r.data || [])).catch(() => {}); }, []);

  async function save(submit) {
    setBusy(true);
    setMsg({ text: '', error: false });
    try {
      await incentiveAPI.create({ ...form, submit });
      setMsg({ text: submit ? t('claimSubmittedMsg') : t('claimSavedMsg'), error: false });
      setForm(null);
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Could not save', error: true });
    } finally {
      setBusy(false);
    }
  }

  async function act(id, action) {
    if (action === 'delete' && !window.confirm(t('confirmDeleteClaim'))) return;
    setBusy(true);
    try { await incentiveAPI.act(id, action); load(); }
    catch (err) { setMsg({ text: err.response?.data?.message || 'Could not update', error: true }); }
    finally { setBusy(false); }
  }

  const shown = claims.filter((c) => filter === 'all' || c.status === filter);
  const total = (st) => claims.filter((c) => st.includes(c.status)).reduce((n, c) => n + (c.amount || 0), 0);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-currency-rupee me-2 text-primary"></i>{t('incentiveClaims')}</h4>
        <button className="btn btn-sa-primary" onClick={() => setForm(form ? null : blank(month))}><i className="bi bi-plus-circle me-1"></i>{t('newClaim')}</button>
      </div>

      <div className="row g-2 mb-3">
        {[[t('claimSubmitted'), total(['submitted']), '#1d4ed8', '#dbeafe'], [t('claimApproved'), total(['approved']), '#15803d', '#dcfce7'], [t('claimPaid'), total(['paid']), '#065f46', '#d1fae5']].map(([label, n, color, bg]) => (
          <div className="col-4" key={label}>
            <div className="card border-0 shadow-sm p-2 text-center" style={{ background: bg }}>
              <div className="fw-bold fs-5" style={{ color }}>{rupees(n)}</div>
              <div className="small fw-semibold" style={{ color }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {msg.text && <div className={`alert py-2 small ${msg.error ? 'alert-danger' : 'alert-success'}`}>{msg.text}</div>}

      {/* Activities found in her records this month */}
      <div className="card border-0 shadow-sm p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <span className="fw-semibold">💡 {t('eligibleActivities')}</span>
          <label className="small d-flex align-items-center gap-2" htmlFor="claim-month">
            {t('month')}
            <input id="claim-month" type="month" className="form-control form-control-sm" max={thisMonth()} value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
        </div>
        {suggestions.length === 0 ? <div className="small text-muted">{t('noSuggestions')}</div> : suggestions.map((sg) => (
          <div key={`${sg.activity}-${sg.childId || sg.pregnancyId}`} className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 border-top">
            <div className="small"><div className="fw-semibold">{sg.activity}</div><div className="text-muted">{sg.beneficiary} · {sg.evidence}</div></div>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setForm({ ...blank(month), activity: sg.activity, beneficiary: sg.beneficiary || '', childId: sg.childId || '', pregnancyId: sg.pregnancyId || '' })}>{t('claimThis')}</button>
          </div>
        ))}
      </div>

      {form && (
        <form className="card border-0 shadow-sm p-3 mb-3" onSubmit={(e) => { e.preventDefault(); save(true); }}>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label small fw-semibold" htmlFor="cl-activity">{t('activity')} *</label>
              <select id="cl-activity" className="form-select" required value={form.activity} onChange={set('activity')}>
                <option value="">—</option>
                {activities.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="cl-month">{t('month')} *</label>
              <input id="cl-month" type="month" className="form-control" required max={thisMonth()} value={form.month} onChange={set('month')} />
            </div>
            <div className="col-md-3 col-6">
              <label className="form-label small fw-semibold" htmlFor="cl-amount">{t('amount')} (₹)</label>
              <input id="cl-amount" type="number" min={0} max={100000} inputMode="numeric" className="form-control" value={form.amount} onChange={set('amount')} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold" htmlFor="cl-ben">{t('beneficiary')}</label>
              <input id="cl-ben" className="form-control" maxLength={150} value={form.beneficiary} onChange={set('beneficiary')} readOnly={Boolean(form.childId || form.pregnancyId)} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold" htmlFor="cl-notes">{t('claimNotes')}</label>
              <input id="cl-notes" className="form-control" maxLength={500} value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="small text-muted mt-2">{t('incentiveRateNote')}</div>
          <div className="d-flex gap-2 mt-2 flex-wrap">
            <button className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('submitClaim')}</button>
            <button type="button" className="btn btn-outline-primary" disabled={busy} onClick={() => save(false)}>{t('saveDraft')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="d-flex gap-2 mb-2 flex-wrap">
        {['all', 'pending', 'submitted', 'approved', 'rejected', 'paid'].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>
            {k === 'all' ? t('visitsAll') : t(CLAIM_STATUS[k].labelKey)} ({k === 'all' ? claims.length : claims.filter((c) => c.status === k).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {shown.map((c) => {
            const st = CLAIM_STATUS[c.status];
            const last = c.history?.[c.history.length - 1];
            return (
              <div key={c._id} className="card border-0 shadow-sm p-3">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div className="small">
                    <div className="fw-bold" style={{ color: palette.text }}>{c.activity}</div>
                    <div className="text-muted">{c.beneficiary || '—'} · {c.month}{c.notes ? ` · ${c.notes}` : ''}</div>
                    {last?.note && c.status !== 'pending' && <div className={c.status === 'rejected' ? 'text-danger' : 'text-muted'}>{last.by?.name ? `${last.by.name}: ` : ''}{last.note} · {fmtDate(last.at)}</div>}
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <span className="fw-bold">{c.amount != null ? rupees(c.amount) : '—'}</span>
                    <Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge>
                    {c.status === 'pending' && (
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-sa-primary" disabled={busy} onClick={() => act(c._id, 'submit')}>{t('submitClaim')}</button>
                        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => act(c._id, 'delete')} aria-label={t('delete')}><i className="bi bi-trash"></i></button>
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
