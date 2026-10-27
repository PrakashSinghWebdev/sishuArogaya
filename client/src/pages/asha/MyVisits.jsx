import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, STATUS, fmtDate, ageText, isoDay, telHref, Badge } from './fieldUi';

const TABS = [
  { key: 'now', labelKey: 'visitsDueNow', match: (b) => b === 'overdue' || b === 'today' },
  { key: 'week', labelKey: 'visitsThisWeek', match: (b) => b === 'week' },
  { key: 'all', labelKey: 'visitsAll', match: () => true },
];

const BUCKET = {
  overdue: { bg: '#fee2e2', color: '#991b1b', labelKey: 'visitsOverdue' },
  today: { bg: '#fef3c7', color: '#92400e', labelKey: 'visitsToday' },
  week: { bg: '#cffafe', color: '#0e7490', labelKey: 'visitsThisWeek' },
  later: { bg: '#f1f5f9', color: '#475569', labelKey: 'visitsLater' },
};

// Daily work list: who needs a home visit, by when and why (computed on the server from follow-ups,
// open referrals, due vaccines and nutrition status)
export default function MyVisits() {
  const { t } = useLanguage();
  const [plan, setPlan] = useState({ counts: {}, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('now');
  const [missedFor, setMissedFor] = useState(null); // child id whose "missed" form is open
  const [newDate, setNewDate] = useState(isoDay(1));
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    ashaAPI.getVisitPlan()
      .then((r) => { setPlan(r.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load visits'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function markMissed(childId) {
    setSaving(true);
    try {
      await ashaAPI.logVisit({ childId, status: 'missed', followUpDate: newDate, visitType: 'Missed visit' });
      setMissedFor(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const active = TABS.find((x) => x.key === tab);
  const items = plan.items.filter((i) => active.match(i.bucket));
  const counts = plan.counts || {};

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-calendar-check me-2" style={{ color: palette.primary }}></i>{t('myVisits')}</h4>
          <div className="small" style={{ color: palette.muted }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <Link to="/asha/log-visit" className="btn btn-sa-primary"><i className="bi bi-clipboard-plus me-1"></i>{t('logVisit')}</Link>
      </div>

      <div className="row g-2 mb-3">
        {[['overdue', counts.overdue], ['today', counts.today], ['week', counts.week]].map(([b, n]) => (
          <div className="col-4" key={b}>
            <div className="card border-0 shadow-sm text-center p-2" style={{ background: BUCKET[b].bg }}>
              <div className="fw-bold fs-3" style={{ color: BUCKET[b].color }}>{n || 0}</div>
              <div className="small fw-semibold" style={{ color: BUCKET[b].color }}>{t(BUCKET[b].labelKey)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => setTab(x.key)} className={`btn btn-sm ${tab === x.key ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>
            {t(x.labelKey)} ({plan.items.filter((i) => x.match(i.bucket)).length})
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>
      ) : items.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">✅ {t('visitsNoneDue')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {items.map(({ child, dueDate, bucket, reasons, lastVisit }) => {
            const st = STATUS[child.nutritionStatus] || STATUS.healthy;
            const phone = child.parentId?.phone || child.contactPhone;
            return (
              <div key={child._id} className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${BUCKET[bucket].color}` }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <Link to={`/asha/child/${child._id}`} className="fw-bold text-decoration-none" style={{ color: palette.text, fontSize: 16 }}>{child.name}</Link>
                    <span className="ms-2 small text-muted">{ageText(child.dob)} · {child.gender === 'female' ? '♀' : '♂'}</span>
                    <div className="small" style={{ color: palette.muted }}>
                      {child.parentId?.name || child.motherName || '—'}{child.village ? ` · ${child.village}` : ''}
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge bg={BUCKET[bucket].bg} color={BUCKET[bucket].color}>{t(BUCKET[bucket].labelKey)} · {fmtDate(dueDate)}</Badge>
                    <div className="small mt-1" style={{ color: palette.muted }}>{t('lastVisit')}: {lastVisit ? fmtDate(lastVisit) : t('never')}</div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {child.nutritionStatus !== 'healthy' && <Badge bg={st.bg} color={st.color}>{t(st.label)}</Badge>}
                  {reasons.filter((r) => !/malnutrition/i.test(r)).map((r) => <Badge key={r} bg="#f1f5f9" color="#334155">{r}</Badge>)}
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Link to={`/asha/log-visit?childId=${child._id}`} className="btn btn-sm btn-sa-primary"><i className="bi bi-check2-circle me-1"></i>{t('logVisit')}</Link>
                  {phone && <a href={telHref(phone)} className="btn btn-sm btn-outline-success"><i className="bi bi-telephone me-1"></i>{t('call')}</a>}
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setMissedFor(missedFor === child._id ? null : child._id); setNewDate(isoDay(1)); }}>
                    <i className="bi bi-x-circle me-1"></i>{t('visitMissed')}
                  </button>
                </div>
                {missedFor === child._id && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2 p-2 rounded" style={{ background: palette.bg }}>
                    <label className="small fw-semibold" htmlFor={`resched-${child._id}`}>{t('rescheduleTo')}</label>
                    <input id={`resched-${child._id}`} type="date" className="form-control form-control-sm" style={{ maxWidth: 170 }} min={isoDay(0)} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    <button className="btn btn-sm btn-warning" disabled={saving || !newDate} onClick={() => markMissed(child._id)}>{saving ? '…' : t('save2')}</button>
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
