import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import Pager, { totalOf } from '../../components/Pager';
import { referralAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, URGENCY, fmtDate, telHref, Badge } from '../asha/fieldUi';

const LIMIT = 50;
const STATUS_STYLE = {
  pending: { bg: '#fef3c7', color: '#92400e', labelKey: 'refPending' },
  reached: { bg: '#cffafe', color: '#0e7490', labelKey: 'refReached' },
  completed: { bg: '#d1fae5', color: '#059669', labelKey: 'refCompleted' },
  cancelled: { bg: '#f1f5f9', color: '#475569', labelKey: 'refCancelled' },
};
const TABS = {
  escalated: { labelKey: 'escalated', params: { escalated: 'true', status: 'pending,reached' } },
  open: { labelKey: 'refOpen', params: { status: 'pending,reached' } },
  all: { labelKey: 'visitsAll', params: {} },
};

// Referrals raised by ASHAs: follow up escalations and close the loop
export default function AdminReferrals() {
  const { t } = useLanguage();
  const [tab, setTab] = useState(new URLSearchParams(useLocation().search).get('escalated') ? 'escalated' : 'open');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    referralAPI.list({ ...TABS[tab].params, page, limit: LIMIT })
      .then((r) => { setRows(r.data); setTotal(totalOf(r)); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load'))
      .finally(() => setLoading(false));
  }, [tab, page]);
  useEffect(load, [load]);

  async function update(id, data) {
    setBusy(true);
    setError('');
    try {
      await referralAPI.update(id, data);
      setNoteFor(null);
      setNote('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-3" style={{ color: palette.text }}><i className="bi bi-hospital me-2 text-danger"></i>{t('referrals')}</h4>
      <div className="d-flex gap-2 mb-3">
        {Object.entries(TABS).map(([k, v]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} className={`btn btn-sm ${tab === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{t(v.labelKey)}</button>
        ))}
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
      ) : rows.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="d-flex flex-column">
            {rows.map((r) => {
              const st = STATUS_STYLE[r.status];
              const urg = URGENCY[r.urgency];
              const open = r.status === 'pending' || r.status === 'reached';
              const asha = r.ashaId?.userId;
              return (
                <div key={r._id} className="p-3 border-bottom" style={{ borderLeft: `4px solid ${r.urgency === 'emergency' ? '#dc2626' : st.color}` }}>
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div>
                      <div className="fw-bold" style={{ color: palette.text }}>{r.pregnancyId ? `🤰 ${r.pregnancyId.womanName}` : r.childId?.name || '—'}</div>
                      <div className="small">{r.reason}</div>
                      <div className="small" style={{ color: palette.muted }}>
                        ASHA: {asha?.name || r.ashaId?.ashaId || '—'}{asha?.phone && <> · <a href={telHref(asha.phone)}>{asha.phone}</a></>}
                        {' · '}{(r.childId?.village || r.pregnancyId?.village) || r.ashaId?.block || ''}
                        {r.facility ? ` · 🏥 ${r.facility}` : ''} · {fmtDate(r.createdAt)}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <Badge bg={urg.bg} color={urg.color}>{t(urg.label)}</Badge>
                      <Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge>
                      {r.escalatedAt && <Badge bg="#ede9fe" color="#5b21b6">{t('escalated')} {fmtDate(r.escalatedAt)}</Badge>}
                    </div>
                  </div>
                  {r.history?.length > 1 && (
                    <div className="small mt-2" style={{ color: palette.muted }}>
                      {r.history.slice(1).map((h) => <div key={h._id}>• {fmtDate(h.at)}: {t(STATUS_STYLE[h.status]?.labelKey)}{h.note ? ` — ${h.note}` : ''}</div>)}
                    </div>
                  )}
                  {open && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => { setNoteFor(noteFor === r._id ? null : r._id); setNote(''); }}>{t('addNote')}</button>
                      <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={() => update(r._id, { status: 'completed', note: t('closedBySupervisor') })}>{t('markCompleted')}</button>
                    </div>
                  )}
                  {noteFor === r._id && (
                    <div className="d-flex gap-2 mt-2">
                      <input className="form-control form-control-sm" maxLength={500} placeholder={t('supervisorNotePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
                      <button className="btn btn-sm btn-sa-primary" disabled={busy || !note.trim()} onClick={() => update(r._id, { note })}>{t('save2')}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pager page={page} limit={LIMIT} total={total} onPage={setPage} />
        </div>
      )}
    </Layout>
  );
}
