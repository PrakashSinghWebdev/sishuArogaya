import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';

const AshaWorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ashaAPI.listWorkers().then(r=>setWorkers(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-person-badge-fill me-2 text-primary"></i>ASHA Worker Management</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Rank</th><th>Name</th><th>ASHA ID</th><th>District</th><th>Block</th><th>Assigned</th><th>Total Visits</th><th>Status</th></tr></thead>
              <tbody>
                {workers.length===0?<tr><td colSpan={8} className="text-muted text-center py-4">No workers found.</td></tr>:workers.map((w,i)=>(
                  <tr key={w._id}><td><span className="badge bg-primary">#{i+1}</span></td><td className="fw-semibold">{w.userId?.name||'—'}</td><td>{w.ashaId}</td><td>{w.district}</td><td>{w.block}</td><td>{w.assignedChildren?.length||0}</td><td><span className="badge bg-success">{w.totalVisits}</span></td><td><span className={`badge ${w.isActive?'bg-success':'bg-secondary'}`}>{w.isActive?'Active':'Inactive'}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AshaWorkerManagement;
