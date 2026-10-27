import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, STATUS, fmtDate, ageText, telHref, Badge } from './fieldUi';

// Households in the ASHA's area: each family with its children, contacts and last visit
export default function Families() {
  const { t } = useLanguage();
  const [data, setData] = useState({ families: [], duplicates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [onlyFollowUp, setOnlyFollowUp] = useState(false);

  useEffect(() => {
    ashaAPI.getFamilies()
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load families'))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const families = data.families.filter((f) => {
    if (onlyFollowUp && !f.needsFollowUp) return false;
    if (!q) return true;
    return [f.familyId, f.headName, f.phone, f.motherName, f.fatherName, f.village, ...f.children.map((c) => c.name)]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}>
          <i className="bi bi-house-heart me-2" style={{ color: palette.primary }}></i>{t('families')} ({data.families.length})
        </h4>
        <Link to="/asha/register-child" className="btn btn-sa-primary"><i className="bi bi-person-plus me-1"></i>{t('registerChild')}</Link>
      </div>

      {data.duplicates.length > 0 && (
        <div className="alert alert-warning small">
          <div className="fw-semibold mb-1"><i className="bi bi-files me-1"></i>{t('possibleDuplicates')}</div>
          {data.duplicates.map(([a, b]) => (
            <div key={`${a._id}-${b._id}`}>
              <Link to={`/asha/child/${a._id}`}>{a.name} ({a.childId})</Link> ↔ <Link to={`/asha/child/${b._id}`}>{b.name} ({b.childId})</Link>
            </div>
          ))}
          <div className="text-muted mt-1">{t('duplicatesHint')}</div>
        </div>
      )}

      <div className="row g-2 mb-3">
        <div className="col-md-8">
          <input className="form-control" placeholder={t('familySearch')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="col-md-4 d-flex align-items-center">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="fam-followup" checked={onlyFollowUp} onChange={(e) => setOnlyFollowUp(e.target.checked)} />
            <label className="form-check-label small" htmlFor="fam-followup">{t('needsFollowUpOnly')}</label>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>
      ) : families.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="row g-3">
          {families.map((f) => (
            <div className="col-md-6" key={f.familyId}>
              <div className="card border-0 shadow-sm h-100 p-3" style={{ borderTop: `3px solid ${f.needsFollowUp ? '#f59e0b' : palette.primary}` }}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-bold" style={{ color: palette.text }}>{f.headName}</div>
                    <div className="small" style={{ color: palette.muted }}>{f.familyId}{f.village ? ` · ${f.village}` : ''}</div>
                  </div>
                  {f.needsFollowUp && <Badge bg="#fef3c7" color="#92400e">{t('needsFollowUp')}</Badge>}
                </div>
                <div className="small mt-2" style={{ color: palette.text }}>
                  {f.motherName && <div>👩 {t('mother')}: {f.motherName}</div>}
                  {f.fatherName && <div>👨 {t('father')}: {f.fatherName}</div>}
                  {f.phone && <div>📞 <a href={telHref(f.phone)}>{f.phone}</a></div>}
                  <div style={{ color: palette.muted }}>{t('lastVisit')}: {f.lastVisit ? fmtDate(f.lastVisit) : t('never')}</div>
                </div>
                <div className="mt-2 d-flex flex-column gap-1">
                  {f.children.map((c) => {
                    const st = STATUS[c.nutritionStatus] || STATUS.healthy;
                    return (
                      <Link key={c._id} to={`/asha/child/${c._id}`} className="d-flex justify-content-between align-items-center p-2 rounded text-decoration-none" style={{ background: palette.bg }}>
                        <span style={{ color: palette.text }}>
                          <span className="fw-semibold">{c.name}</span>
                          <span className="small text-muted ms-2">{ageText(c.dob)}</span>
                          {c.openReferral && <span className="ms-2" title={t('referrals')}>🏥</span>}
                        </span>
                        <Badge bg={st.bg} color={st.color}>{t(st.label)}</Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
