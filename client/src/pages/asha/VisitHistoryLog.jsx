import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';

const VisitHistoryLog = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ashaAPI.getVisits().then(r=>setVisits(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  const OUTCOME_BADGE = { normal:'bg-success', referred:'bg-danger', 'follow-up':'bg-warning text-dark' };

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="bi bi-clock-history me-2 text-secondary"></i>Visit History</h4>
        <span className="badge bg-primary">{visits.length} total visits</span>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Date</th><th>Child</th><th>Weight</th><th>Height</th><th>Vaccine</th><th>Outcome</th></tr></thead>
              <tbody>
                {visits.length===0?<tr><td colSpan={6} className="text-muted text-center py-4">No visits logged yet.</td></tr>:visits.slice().reverse().map((v,i)=>(
                  <tr key={i}>
                    <td>{new Date(v.visitDate).toLocaleDateString('en-IN')}</td>
                    <td className="fw-semibold">{v.childId?.name||'—'}</td>
                    <td>{v.weight?`${v.weight}kg`:'—'}</td>
                    <td>{v.height?`${v.height}cm`:'—'}</td>
                    <td>{v.vaccineGiven||'—'}</td>
                    <td><span className={`badge ${OUTCOME_BADGE[v.outcome]||'bg-secondary'}`}>{v.outcome}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VisitHistoryLog;
