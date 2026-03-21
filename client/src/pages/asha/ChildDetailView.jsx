import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useParams, Link } from 'react-router-dom';
import { childAPI, growthAPI, vaccinationAPI } from '../../services/api';

const ChildDetailView = () => {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([childAPI.get(id), growthAPI.getHistory(id), vaccinationAPI.getSchedule(id)])
      .then(([cRes, gRes, vRes]) => { setChild(cRes.data); setGrowth(gRes.data); setVaccines(vRes.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout role="asha"><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></Layout>;
  if (!child) return <Layout role="asha"><div className="text-muted text-center py-5">Child not found.</div></Layout>;

  const STATUS_COLOR = { healthy:'#28a745', moderate:'#ffc107', severe:'#dc3545' };
  const latestGrowth = growth[growth.length - 1];
  const dueVaccines = vaccines.filter(v => ['due','missed'].includes(v.status));

  return (
    <Layout role="asha">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/asha/children" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
        <h4 className="fw-bold mb-0">{child.name}</h4>
        <span className={`badge`} style={{background:STATUS_COLOR[child.nutritionStatus]}}>{child.nutritionStatus?.toUpperCase()}</span>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-3">
            <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3 mx-auto" style={{width:72,height:72}}><i className="bi bi-person-fill text-primary" style={{fontSize:32}}></i></div>
            <h5 className="fw-bold">{child.name}</h5>
            <p className="text-muted small mb-2">{child.gender} · {child.ageInMonths} months</p>
            <div className="row g-2 mt-2">
              {[{l:'DOB',v:new Date(child.dob).toLocaleDateString('en-IN')},{l:'Blood Grp',v:child.bloodGroup},{l:'Weight',v:latestGrowth?`${latestGrowth.weight} kg`:'—'},{l:'Height',v:latestGrowth?`${latestGrowth.height} cm`:'—'}].map(f=>(
                <div className="col-6" key={f.l}><div className="rounded-2 p-2" style={{background:'#f8f9fa'}}><div className="fw-semibold small">{f.v}</div><div className="text-muted" style={{fontSize:'0.7rem'}}>{f.l}</div></div></div>
              ))}
            </div>
            <div className="mt-3 d-grid gap-2">
              <Link to={`/asha/log-visit?childId=${child._id}`} className="btn btn-sa-primary btn-sm"><i className="bi bi-clipboard-plus me-2"></i>Log Visit</Link>
              <Link to={`/asha/growth-records?childId=${child._id}`} className="btn btn-outline-primary btn-sm"><i className="bi bi-graph-up me-2"></i>Add Growth Data</Link>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {dueVaccines.length > 0 && (
            <div className="alert alert-danger mb-3"><i className="bi bi-exclamation-triangle me-2"></i><strong>{dueVaccines.length} vaccine(s) overdue!</strong> Immediate action required.</div>
          )}

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white border-0 fw-semibold">Recent Growth Records</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead><tr><th>Date</th><th>Age</th><th>Weight</th><th>Height</th><th>Status</th></tr></thead>
                <tbody>
                  {growth.slice(-5).reverse().map(r=>(
                    <tr key={r._id}><td>{new Date(r.recordedDate).toLocaleDateString('en-IN')}</td><td>{r.ageMonths}mo</td><td>{r.weight}kg</td><td>{r.height}cm</td><td><span className={`badge ${r.prediction==='healthy'?'bg-success':r.prediction==='moderate'?'bg-warning text-dark':'bg-danger'}`}>{r.prediction}</span></td></tr>
                  ))}
                  {growth.length===0 && <tr><td colSpan={5} className="text-muted text-center py-3">No growth records.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Vaccination Status</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead><tr><th>Vaccine</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  {vaccines.map(v=>(
                    <tr key={v._id}><td>{v.vaccineName}</td><td>{new Date(v.dueDate).toLocaleDateString('en-IN')}</td><td><span className={`badge ${v.status==='done'?'bg-success':v.status==='due'?'bg-danger':v.status==='missed'?'bg-warning text-dark':'bg-secondary'}`}>{v.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChildDetailView;
