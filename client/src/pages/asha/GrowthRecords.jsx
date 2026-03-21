import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useLocation } from 'react-router-dom';
import { ashaAPI, growthAPI } from '../../services/api';

const GrowthRecords = () => {
  const location = useLocation();
  const preChildId = new URLSearchParams(location.search).get('childId');
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(preChildId || '');
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ weight: '', height: '', ageMonths: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { ashaAPI.getMyChildren().then(r => setChildren(r.data)).catch(console.error); }, []);
  useEffect(() => {
    if (selectedId) growthAPI.getHistory(selectedId).then(r => setRecords(r.data)).catch(console.error);
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setSuccess(''); setError('');
    try {
      await growthAPI.add({ childId: selectedId, weight: parseFloat(form.weight), height: parseFloat(form.height), ageMonths: parseFloat(form.ageMonths), notes: form.notes });
      setSuccess('Growth record added!');
      const r = await growthAPI.getHistory(selectedId);
      setRecords(r.data);
      setForm({ weight:'', height:'', ageMonths:'', notes:'' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to add record.'); }
    finally { setSubmitting(false); }
  };

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-graph-up-arrow me-2 text-primary"></i>Growth Records</h4>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Add New Record</div>
            <div className="card-body">
              {success && <div className="alert alert-success py-2 small">{success}</div>}
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small">Select Child *</label>
                  <select className="form-select" required value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
                    <option value="">— Select Child —</option>
                    {children.map(c=><option key={c._id} value={c._id}>{c.name} ({c.ageInMonths}mo)</option>)}
                  </select>
                </div>
                <div className="mb-3"><label className="form-label small">Age (months) *</label><input type="number" step="0.5" min="0" max="24" className="form-control" required value={form.ageMonths} onChange={e=>setForm({...form,ageMonths:e.target.value})} /></div>
                <div className="mb-3"><label className="form-label small">Weight (kg) *</label><input type="number" step="0.1" min="0" className="form-control" required value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} /></div>
                <div className="mb-3"><label className="form-label small">Height (cm) *</label><input type="number" step="0.1" min="0" className="form-control" required value={form.height} onChange={e=>setForm({...form,height:e.target.value})} /></div>
                <div className="mb-3"><label className="form-label small">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}></textarea></div>
                <button type="submit" className="btn btn-sa-primary w-100" disabled={submitting}>{submitting?'Saving...':'Save Record'}</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Growth History</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>Date</th><th>Age</th><th>Weight</th><th>Height</th><th>WAZ</th><th>Status</th></tr></thead>
                <tbody>
                  {records.length===0?<tr><td colSpan={6} className="text-muted text-center py-4">No records.</td></tr>:records.slice().reverse().map(r=>(
                    <tr key={r._id}><td>{new Date(r.recordedDate).toLocaleDateString('en-IN')}</td><td>{r.ageMonths}mo</td><td>{r.weight}kg</td><td>{r.height}cm</td><td>{r.wazScore}</td><td><span className={`badge ${r.prediction==='healthy'?'bg-success':r.prediction==='moderate'?'bg-warning text-dark':'bg-danger'}`}>{r.prediction}</span></td></tr>
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

export default GrowthRecords;
