import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Pager, { totalOf } from '../../components/Pager';
import { incentiveAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, telHref, Badge } from '../asha/fieldUi';
import { CLAIM_STATUS } from '../asha/Incentives';

const LIMIT = 50;
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Admin verifies the incentive claims ASHAs submit (approve, or reject with a reason)
export default function Claims() {
  const { t } = useLanguage();
  const [status, setStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    incentiveAPI.list({ status: status === 'all' ? undefined : status, page, limit: LIMIT })
      .then((r) => { setRows(r.data || []); setTotal(totalOf(r)); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load'))
      .finally(() => setLoading(false));
  }, [status, page]);
  useEffect(load, [load]);

  async function act(id, action, n) {
    setBusy(true);
    setError('');
    try { await incentiveAPI.act(id, action, n); setRejecting(null); setNote(''); load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update'); }
    finally { setBusy(false); }
  }

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-3" style={{ color: palette.text }}><i className="bi bi-currency-rupee me-2 text-primary"></i>{t('incentiveClaims')}</h4>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[['submitted', t('toReview')], ['approved', t('claimApproved')], ['rejected', t('claimRejected')], ['all', t('visitsAll')]].map(([k, label]) => (
          <button key={k} onClick={() => { setStatus(k); setPage(1); }} className={`btn btn-sm ${status === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{label}</button>
        ))}
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : rows.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="card border-0 shadow-sm">
          {rows.map((c) => {
            const st = CLAIM_STATUS[c.status];
            const asha = c.ashaId?.userId;
            return (
              <div key={c._id} className="p-3 border-bottom">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div className="small">
                    <div className="fw-bold" style={{ color: palette.text }}>{c.activity}</div>
                    <div>{c.beneficiary || '—'} · {c.month}{c.notes ? ` · ${c.notes}` : ''}</div>
                    <div className="text-muted">ASHA: {asha?.name || c.ashaId?.ashaId}{asha?.phone && <> · <a href={telHref(asha.phone)}>{asha.phone}</a></>} · {c.ashaId?.block}</div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <span className="fw-bold">{c.amount != null ? rupees(c.amount) : '—'}</span>
                    <Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge>
                  </div>
                </div>
                {c.status === 'submitted' && (
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    <button className="btn btn-sm btn-success" disabled={busy} onClick={() => act(c._id, 'approve')}>✓ {t('approve')}</button>
                    <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => { setRejecting(rejecting === c._id ? null : c._id); setNote(''); }}>{t('reject')}</button>
                  </div>
                )}
                {rejecting === c._id && (
                  <div className="d-flex gap-2 mt-2">
                    <input className="form-control form-control-sm" maxLength={500} placeholder={t('rejectReason')} value={note} onChange={(e) => setNote(e.target.value)} />
                    <button className="btn btn-sm btn-danger" disabled={busy || !note.trim()} onClick={() => act(c._id, 'reject', note)}>{t('reject')}</button>
                  </div>
                )}
              </div>
            );
          })}
          <Pager page={page} limit={LIMIT} total={total} onPage={setPage} />
        </div>
      )}
    </Layout>
  );
}
