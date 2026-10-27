import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate } from './fieldUi';

const thisMonth = () => new Date().toISOString().slice(0, 7);

function Section({ icon, title, rows }) {
  return (
    <div className="col-md-6 col-xl-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white fw-semibold">{icon} {title}</div>
        <ul className="list-group list-group-flush small">
          {rows.map(([label, value, warn]) => (
            <li key={label} className="list-group-item d-flex justify-content-between">
              <span>{label}</span><strong className={warn ? 'text-danger' : ''}>{value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The ASHA's own monthly report: visits, immunisation, nutrition, referrals, maternal care — with Excel export
export default function GenerateReport() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(thisMonth());
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setR(null);
    ashaAPI.getReport(month).then((res) => setR(res.data)).catch((err) => setError(err.response?.data?.message || 'Could not load the report'));
  }, [month]);

  async function download() {
    setDownloading(true);
    try {
      const res = await ashaAPI.downloadReport(month);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `asha-report-${r?.worker?.ashaId || 'me'}-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Could not download the report');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-file-earmark-bar-graph me-2 text-success"></i>{t('monthlyReport')}</h4>
        <div className="d-flex gap-2 align-items-center">
          <label className="visually-hidden" htmlFor="rep-month">{t('month')}</label>
          <input id="rep-month" type="month" className="form-control" max={thisMonth()} value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn btn-success text-nowrap" onClick={download} disabled={!r || downloading}>
            {downloading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-download me-1"></i>Excel</>}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {!r && !error && <div className="text-center py-5"><div className="spinner-border text-success"></div></div>}

      {r && (
        <>
          <div className="small mb-3" style={{ color: palette.muted }}>{r.worker.ashaId} · {r.worker.block}, {r.worker.district} · {new Date(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          <div className="row g-3 mb-3">
            <Section icon="🏠" title={t('homeVisits')} rows={[[t('refCompleted'), r.visits.completed], [t('visitMissed'), r.visits.missed, r.visits.missed > 0], [t('childrenVisited'), r.visits.childrenVisited], [t('referredDuringVisits'), r.visits.referredDuringVisits]]} />
            <Section icon="💉" title={t('immunisation')} rows={[[t('dosesGivenMonth'), r.vaccination.dosesGiven], [t('upToDate'), `${r.vaccination.upToDatePct}%`], [t('childrenOverdue'), r.vaccination.overdueChildren, r.vaccination.overdueChildren > 0]]} />
            <Section icon="🥗" title={t('nutritionScreening')} rows={[[t('screenedMonth'), r.nutrition.screened], [t('healthy'), r.nutrition.healthy], [t('moderate'), r.nutrition.moderate, r.nutrition.moderate > 0], [t('severe'), r.nutrition.severe, r.nutrition.severe > 0]]} />
            <Section icon="🏥" title={t('referrals')} rows={[[t('referralsMade'), r.referrals.total], [t('urgencyEmergency'), r.referrals.emergency], [t('refCompleted'), r.referrals.completed], [t('refOpen'), r.referrals.open, r.referrals.open > 0]]} />
            <Section icon="🤰" title={t('maternalCare')} rows={[[t('pregnancyRegisteredCount'), r.maternal.registered], [t('ancHistory'), r.maternal.ancVisits], [t('deliveries'), `${r.maternal.deliveries} (${r.maternal.institutional} ${t('institutionalShort')})`], [t('pncHistory'), r.maternal.pncVisits], [t('highRisk'), r.maternal.highRiskNow, r.maternal.highRiskNow > 0]]} />
            <Section icon="📢" title={t('outreachIncentives')} rows={[[t('campsHeld'), r.camps.held], [t('incentiveClaims'), r.incentives.claims], [t('claimApproved'), `₹${Number(r.incentives.approvedAmount || 0).toLocaleString('en-IN')}`]]} />
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">⚠ {t('needsFollowUp')} ({r.followUp.length})</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 small">
                <thead><tr><th>{t('name')}</th><th>{t('village')}</th><th>{t('due')}</th><th>{t('reason')}</th></tr></thead>
                <tbody>
                  {r.followUp.length === 0 ? <tr><td colSpan={4} className="text-center text-muted py-3">✅ {t('visitsNoneDue')}</td></tr> : r.followUp.map((f) => (
                    <tr key={`${f.name}-${f.due}`}><td className="fw-semibold">{f.name}</td><td>{f.village || '—'}</td><td>{fmtDate(f.due)}</td><td>{f.reasons}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
