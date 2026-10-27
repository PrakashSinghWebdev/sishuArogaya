import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ashaAPI, campAPI, vaccinationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { palette, fmtDate, ageText, isoDay, telHref, Badge } from './fieldUi';

// Immunisation for the ASHA's children: who is overdue, what is due soon, and recording doses given.
// Everything comes from each child's national schedule in the database.
export default function VaccinationTracker() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('due');
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState(null); // dose id whose date picker is open
  const [givenDate, setGivenDate] = useState(isoDay(0));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    ashaAPI.getVaccinationStatus().then((r) => setData(r.data)).catch((err) => setError(err.response?.data?.message || 'Could not load'));
  }, []);
  useEffect(() => {
    load();
    campAPI.list('upcoming').then((r) => setCamps((r.data || []).filter((c) => c.status === 'scheduled'))).catch(() => {});
  }, [load]);

  async function markGiven(dose, childName) {
    setBusy(true);
    setError('');
    try {
      await vaccinationAPI.update({ vaccineId: dose._id, givenDate });
      setNotice(`✓ ${dose.vaccineName} — ${childName}`);
      setMarking(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const q = search.trim().toLowerCase();
  const rows = (data?.children || []).filter((r) => !q || [r.child.name, r.child.village, r.child.motherName].some((v) => String(v || '').toLowerCase().includes(q)));
  const dueRows = rows.filter((r) => r.pending.length);
  const sum = data?.summary;
  const nextCamp = camps.find((c) => c.kind === 'immunisation') || camps[0];

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-eyedropper me-2 text-warning"></i>{t('vaccinationTracker')}</h4>
        <Link to="/asha/camps" className="btn btn-outline-success"><i className="bi bi-megaphone me-1"></i>{t('healthCampaigns')}</Link>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {notice && <div className="alert alert-success py-2 small">{notice}</div>}
      {!data && !error && <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>}

      {data && (
        <>
          <div className="row g-2 mb-3">
            {[
              [t('upToDate'), `${sum.upToDate}/${sum.children}`, `${sum.coveragePct}% ${t('coverage')}`, '#15803d', '#dcfce7'],
              [t('childrenOverdue'), sum.overdueChildren, t('followUpThisWeek'), '#b91c1c', '#fee2e2'],
              [t('vaccinesDueWeek'), sum.dueThisWeek, t('dosesLabel'), '#a16207', '#fef3c7'],
              [t('nextCamp'), nextCamp ? fmtDate(nextCamp.date) : '—', nextCamp ? (nextCamp.village || nextCamp.venue || nextCamp.title) : t('noCampScheduled'), '#1d4ed8', '#dbeafe'],
            ].map(([label, value, sub, color, bg]) => (
              <div className="col-md-3 col-6" key={label}>
                <div className="card border-0 shadow-sm p-3 h-100" style={{ background: bg }}>
                  <div className="small fw-semibold" style={{ color }}>{label}</div>
                  <div className="fs-4 fw-bold" style={{ color }}>{value}</div>
                  <div className="small text-truncate" style={{ color }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            {[['due', `${t('dueAndOverdue')} (${dueRows.length})`], ['all', `${t('allChildren')} (${rows.length})`], ['camps', `${t('healthCampaigns')} (${camps.length})`]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`btn btn-sm ${tab === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{label}</button>
            ))}
            {tab !== 'camps' && <input className="form-control form-control-sm ms-auto" style={{ maxWidth: 240 }} placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />}
          </div>

          {tab === 'due' && (dueRows.length === 0 ? (
            <div className="card border-0 shadow-sm p-4 text-center text-muted">✅ {t('allUpToDate')}</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {dueRows.map((r) => {
                const phone = r.child.parentId?.phone || r.child.contactPhone;
                return (
                  <div key={r.child._id} className="card border-0 shadow-sm p-3" style={{ borderLeft: `4px solid ${r.overdue ? '#dc2626' : '#f59e0b'}` }}>
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                      <div>
                        <Link to={`/asha/child/${r.child._id}`} className="fw-bold text-decoration-none" style={{ color: palette.text }}>{r.child.name}</Link>
                        <span className="small text-muted ms-2">{ageText(r.child.dob)}{r.child.village ? ` · ${r.child.village}` : ''}</span>
                        <div className="small text-muted">{r.child.parentId?.name || r.child.motherName || ''}{phone && <> · <a href={telHref(phone)}>{phone}</a></>}</div>
                      </div>
                      <div className="small text-end">{r.given} {t('dosesGiven')}{r.overdue ? <div className="text-danger fw-semibold">{r.overdue} {t('visitsOverdue')}</div> : null}</div>
                    </div>
                    <div className="d-flex flex-column gap-1 mt-2">
                      {r.pending.map((d) => (
                        <div key={d._id} className="d-flex flex-wrap align-items-center gap-2 p-2 rounded" style={{ background: d.overdue ? '#fef2f2' : '#fffbeb' }}>
                          <span className="fw-semibold small flex-grow-1">💉 {d.vaccineName}</span>
                          <Badge bg={d.overdue ? '#fee2e2' : '#fef3c7'} color={d.overdue ? '#b91c1c' : '#a16207'}>{d.overdue ? t('visitsOverdue') : t('due')} · {fmtDate(d.dueDate)}</Badge>
                          {marking === d._id ? (
                            <span className="d-flex gap-1 align-items-center">
                              <label className="visually-hidden" htmlFor={`given-${d._id}`}>{t('dateGiven')}</label>
                              <input id={`given-${d._id}`} type="date" className="form-control form-control-sm" style={{ width: 150 }} max={isoDay(0)} value={givenDate} onChange={(e) => setGivenDate(e.target.value)} />
                              <button className="btn btn-sm btn-success" disabled={busy} onClick={() => markGiven(d, r.child.name)}>{busy ? '…' : t('save2')}</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setMarking(null)}>✕</button>
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-outline-success" onClick={() => { setMarking(d._id); setGivenDate(isoDay(0)); }}>✓ {t('markGiven')}</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {tab === 'all' && (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0 small align-middle">
                  <thead><tr><th>{t('name')}</th><th>{t('age')}</th><th>{t('dosesGiven')}</th><th>{t('nextDose')}</th><th>{t('status')}</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.child._id}>
                        <td><Link to={`/asha/child/${r.child._id}`} className="fw-semibold text-decoration-none">{r.child.name}</Link><div className="text-muted">{r.child.village}</div></td>
                        <td>{ageText(r.child.dob)}</td>
                        <td>{r.given}{r.dueByNow ? ` / ${r.dueByNow} ${t('dueByNow')}` : ''}</td>
                        <td>{r.next ? <>{r.next.vaccineName}<div className="text-muted">{fmtDate(r.next.dueDate)}</div></> : '—'}</td>
                        <td>{r.upToDate ? <Badge bg="#dcfce7" color="#15803d">✓ {t('upToDate')}</Badge> : <Badge bg="#fee2e2" color="#b91c1c">{r.overdue} {t('visitsOverdue')}</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'camps' && (camps.length === 0 ? (
            <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noCampScheduled')} · <Link to="/asha/camps">{t('scheduleCamp')}</Link></div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {camps.map((c) => (
                <Link key={c._id} to="/asha/camps" className="card border-0 shadow-sm p-3 text-decoration-none" style={{ color: palette.text }}>
                  <div className="fw-bold">{c.title}</div>
                  <div className="small text-muted">📅 {new Date(c.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{c.venue ? ` · 📍 ${c.venue}` : ''}{c.village ? ` · ${c.village}` : ''}</div>
                </Link>
              ))}
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}
