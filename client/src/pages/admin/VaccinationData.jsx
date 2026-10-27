import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { vaccinationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Pager, { totalOf } from '../../components/Pager';

const LIMIT = 100;

const VaccinationData = () => {
  const { t } = useLanguage();
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState({ total: 0, due: 0, missed: 0 });

  // Paged on the server; the totals for all records come back in headers
  useEffect(() => {
    setLoading(true);
    vaccinationAPI.getOverdue({ page, limit: LIMIT })
      .then(r => {
        setOverdue(r.data);
        setCounts({ total: totalOf(r), due: Number(r.headers['x-due-count']) || 0, missed: Number(r.headers['x-missed-count']) || 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-shield-plus me-2 text-primary"></i>{t('vaccinationData')}</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3 text-danger">{counts.due.toLocaleString('en-IN')}</div><div className="text-muted small">Due Now</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3" style={{color:'#856404'}}>{counts.missed.toLocaleString('en-IN')}</div><div className="text-muted small">{t('overdue')}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3 text-danger">{counts.total.toLocaleString('en-IN')}</div><div className="text-muted small">{t('pending')}</div></div></div>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>{t('childName')}</th><th>{t('vaccination')}</th><th>Due Date</th><th>{t('block')}</th><th>{t('district')}</th><th>{t('status')}</th></tr></thead>
              <tbody>
                {overdue.length===0?<tr><td colSpan={6} className="text-muted text-center py-4">{t('noData')}</td></tr>:overdue.map(v=>(
                  <tr key={v._id}><td className="fw-semibold">{v.childId?.name||'—'}</td><td>{v.vaccineName}</td><td>{new Date(v.dueDate).toLocaleDateString('en-IN')}</td><td>{v.childId?.block||'—'}</td><td>{v.childId?.district||'—'}</td><td><span className={`badge ${v.status==='due'?'bg-danger':'bg-warning text-dark'}`}>{t(v.status)||v.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} limit={LIMIT} total={counts.total} onPage={setPage} />
        </div>
      )}
    </Layout>
  );
};

export default VaccinationData;
