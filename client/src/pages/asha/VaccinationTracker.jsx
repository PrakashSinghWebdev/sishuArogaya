import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { vaccinationAPI } from '../../services/api';

const VaccinationTracker = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  const load = () => vaccinationAPI.getOverdue().then(r=>setOverdue(r.data)).catch(console.error).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const markDone = async (vaccineId) => {
    setMarking(vaccineId);
    try { await vaccinationAPI.update({ vaccineId }); load(); }
    catch(err){ alert(err.response?.data?.message || 'Failed.'); }
    finally { setMarking(null); }
  };

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-shield-check me-2 text-primary"></i>Vaccination Tracker</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 d-flex justify-content-between">
            <span className="fw-semibold">Overdue / Due Vaccinations</span>
            <span className="badge bg-danger">{overdue.length} pending</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Child Name</th><th>Vaccine</th><th>Due Date</th><th>Block</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {overdue.length===0?<tr><td colSpan={6} className="text-muted text-center py-4">No overdue vaccinations!</td></tr>:overdue.map(v=>(
                  <tr key={v._id}>
                    <td className="fw-semibold">{v.childId?.name || '—'}</td>
                    <td>{v.vaccineName}</td>
                    <td>{new Date(v.dueDate).toLocaleDateString('en-IN')}</td>
                    <td>{v.childId?.block || '—'}</td>
                    <td><span className={`badge ${v.status==='due'?'bg-danger':'bg-warning text-dark'}`}>{v.status}</span></td>
                    <td><button className="btn btn-sm btn-outline-success" onClick={()=>markDone(v._id)} disabled={marking===v._id}>{marking===v._id?'..':'Mark Done'}</button></td>
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

export default VaccinationTracker;
