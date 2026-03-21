import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { vaccinationAPI } from '../../services/api';

const VaccinationData = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { vaccinationAPI.getOverdue().then(r=>setOverdue(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-shield-plus me-2 text-primary"></i>Vaccination Data</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3 text-danger">{overdue.filter(v=>v.status==='due').length}</div><div className="text-muted small">Due Now</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3" style={{color:'#856404'}}>{overdue.filter(v=>v.status==='missed').length}</div><div className="text-muted small">Missed</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm p-3 text-center"><div className="fw-bold fs-3 text-danger">{overdue.length}</div><div className="text-muted small">Total Pending</div></div></div>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Child</th><th>Vaccine</th><th>Due Date</th><th>Block</th><th>District</th><th>Status</th></tr></thead>
              <tbody>
                {overdue.length===0?<tr><td colSpan={6} className="text-muted text-center py-4">No pending vaccinations!</td></tr>:overdue.map(v=>(
                  <tr key={v._id}><td className="fw-semibold">{v.childId?.name||'—'}</td><td>{v.vaccineName}</td><td>{new Date(v.dueDate).toLocaleDateString('en-IN')}</td><td>{v.childId?.block||'—'}</td><td>{v.childId?.district||'—'}</td><td><span className={`badge ${v.status==='due'?'bg-danger':'bg-warning text-dark'}`}>{v.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VaccinationData;
