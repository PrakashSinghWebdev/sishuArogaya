import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { childAPI, growthAPI } from '../../services/api';

const COLOR = { healthy: '#28a745', moderate: '#ffc107', severe: '#dc3545' };
const BG    = { healthy: '#d4edda', moderate: '#fff3cd', severe: '#f8d7da' };

const AIHealthPrediction = () => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    childAPI.list().then(r => { setChildren(r.data); if (r.data[0]) setSelected(r.data[0]); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    growthAPI.getPrediction(selected._id).then(r => setPrediction(r.data)).catch(() => setPrediction(null)).finally(() => setLoading(false));
  }, [selected]);

  return (
    <Layout role="parent">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-cpu me-2 text-info"></i>AI Health Prediction</h4>
        {children.length > 1 && (
          <select className="form-select w-auto" value={selected?._id} onChange={e => setSelected(children.find(c=>c._id===e.target.value))}>
            {children.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="alert alert-secondary border-0 mb-4">
        <i className="bi bi-robot me-2"></i>
        Uses <strong>WHO Z-Score Standards</strong> (WAZ, HAZ, WHZ) to predict nutritional status. Results are based on the latest growth record.
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-info"></div></div> : prediction ? (
        <>
          <div className="card border-0 shadow-sm mb-4" style={{borderLeft:`6px solid ${COLOR[prediction.prediction]}`}}>
            <div className="card-body text-center py-4">
              <div className="display-4 mb-2">{prediction.prediction==='healthy'?'✅':prediction.prediction==='moderate'?'⚠️':'🚨'}</div>
              <h3 className="fw-bold" style={{color:COLOR[prediction.prediction]}}>{prediction.prediction?.toUpperCase()}</h3>
              <p className="text-muted mb-0">{prediction.advice}</p>
            </div>
          </div>

          <div className="row g-3 mb-4">
            {[
              { key:'WAZ', label:'Weight-for-Age', val:prediction.waz, status:prediction.wazStatus, desc:'Underweight indicator' },
              { key:'HAZ', label:'Height-for-Age', val:prediction.haz, status:prediction.hazStatus, desc:'Stunting indicator' },
              { key:'WHZ', label:'Weight-for-Height', val:prediction.whz, status:prediction.whzStatus, desc:'Wasting indicator' },
            ].map(z => (
              <div className="col-md-4" key={z.key}>
                <div className="card border-0 shadow-sm h-100 text-center p-3" style={{background:BG[z.status]}}>
                  <div className="fw-bold fs-5 mb-1" style={{color:COLOR[z.status]}}>{z.key}</div>
                  <div className="display-6 fw-bold mb-1">{z.val}</div>
                  <div className="small text-muted">{z.label}</div>
                  <div className="small text-muted">{z.desc}</div>
                  <span className="badge mt-2 rounded-pill" style={{background:COLOR[z.status]}}>{z.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Z-Score Reference Guide</div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Z-Score</th><th>Classification</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td>&gt; −1.0</td><td><span className="badge bg-success">Healthy</span></td><td>Routine check-up</td></tr>
                  <tr><td>−2.0 to −1.0</td><td><span className="badge bg-warning text-dark">Moderate Risk</span></td><td>ASHA follow-up + diet counselling</td></tr>
                  <tr><td>&lt; −2.0</td><td><span className="badge bg-danger">Severe Malnutrition</span></td><td>Immediate PHC referral</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-graph-up fs-1"></i>
          <p className="mt-2">No growth data available yet. Growth records must be entered by your ASHA worker first.</p>
        </div>
      )}
    </Layout>
  );
};

export default AIHealthPrediction;
