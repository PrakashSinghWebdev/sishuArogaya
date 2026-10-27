import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { maternalAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate, telHref, Badge } from '../asha/fieldUi';

// Pregnant women registered by ASHAs, high-risk first
export default function HighRiskMothers() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyHigh, setOnlyHigh] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // ponytail: one page of up to 500 pregnancies; add paging when there are more
    maternalAPI.list({ status: 'pregnant', limit: 500 })
      .then((r) => setRows(r.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load'))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const shown = rows
    .filter((p) => !onlyHigh || p.summary.risk.high.length)
    .filter((p) => !q || [p.womanName, p.village, p.ashaId?.userId?.name, p.ashaId?.ashaId].some((v) => String(v || '').toLowerCase().includes(q)))
    .sort((a, b) => b.summary.risk.high.length - a.summary.risk.high.length || new Date(a.summary.edd) - new Date(b.summary.edd));
  const highCount = rows.filter((p) => p.summary.risk.high.length).length;

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-3" style={{ color: palette.text }}><i className="bi bi-heart-pulse me-2 text-danger"></i>{t('highRiskMothers')}</h4>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <button className={`btn btn-sm ${onlyHigh ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setOnlyHigh(true)}>{t('highRisk')} ({highCount})</button>
        <button className={`btn btn-sm ${!onlyHigh ? 'btn-sa-primary' : 'btn-outline-secondary'}`} onClick={() => setOnlyHigh(false)}>{t('pregnantWomen')} ({rows.length})</button>
        <input className="form-control form-control-sm ms-auto" style={{ maxWidth: 260 }} placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
      ) : shown.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {shown.map((p) => {
            const s = p.summary;
            const asha = p.ashaId?.userId;
            return (
              <div key={p._id} className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${s.risk.high.length ? '#dc2626' : palette.primary}` }}>
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="fw-bold" style={{ color: palette.text }}>{p.womanName}{p.age ? <span className="small text-muted fw-normal"> · {p.age} {t('years')}</span> : null}</div>
                    <div className="small" style={{ color: palette.muted }}>
                      {p.village || '—'} · ASHA: {asha?.name || p.ashaId?.ashaId || '—'}{asha?.phone && <> · <a href={telHref(asha.phone)}>{asha.phone}</a></>}
                    </div>
                  </div>
                  <div className="text-end small" style={{ color: palette.text }}>
                    <div><strong>{s.weeks} {t('weeks')}</strong> · {t('edd')} {fmtDate(s.edd)}</div>
                    {s.nextAnc?.number && <div>ANC-{s.nextAnc.number}: {s.nextAnc.dueNow ? <span className="text-danger fw-semibold">{t('visitsDueNow')}</span> : fmtDate(s.nextAnc.dueDate)}</div>}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-2">
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
