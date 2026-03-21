import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useLocation } from 'react-router-dom';
import { ashaAPI, childAPI, growthAPI, vaccinationAPI } from '../../services/api';

const VACCINES = ['BCG','Hepatitis B','OPV-0','OPV-1','DPT-1','OPV-2','DPT-2','OPV-3','DPT-3','Measles-1','Vitamin A','DPT Booster','Measles-2'];

const LogHomeVisit = () => {
  const location = useLocation();
  const preSelectedId = new URLSearchParams(location.search).get('childId');
  const [children, setChildren] = useState([]);
  const [form, setForm] = useState({ childId: preSelectedId||'', weight:'', height:'', vaccineGiven:'', observations:'', outcome:'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { ashaAPI.getMyChildren().then(r => setChildren(r.data)).catch(console.error); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setSuccess(''); setError('');
    try {
      await ashaAPI.logVisit(form);
      // If weight/height entered, also log growth record
      if (form.weight && form.height && form.childId) {
        const child = children.find(c => c._id === form.childId);
        if (child) await growthAPI.add({ childId: form.childId, weight: parseFloat(form.weight), height: parseFloat(form.height), ageMonths: child.ageInMonths, notes: form.observations }).catch(console.error);
      }
      setSuccess('Visit logged successfully!');
      setForm({ childId: preSelectedId||'', weight:'', height:'', vaccineGiven:'', observations:'', outcome:'normal' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to log visit.'); }
    finally { setSubmitting(false); }
  };

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-clipboard-plus me-2 text-success"></i>Log Home Visit</h4>
      <div className="card border-0 shadow-sm" style={{maxWidth:640}}>
        <div className="card-body">
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Select Child *</label>
              <select className="form-select" required value={form.childId} onChange={e=>setForm({...form,childId:e.target.value})}>
                <option value="">— Select Child —</option>
                {children.map(c=><option key={c._id} value={c._id}>{c.name} ({c.ageInMonths}mo)</option>)}
              </select>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6"><label className="form-label small fw-semibold">Weight (kg)</label><input type="number" step="0.1" min="0" className="form-control" placeholder="e.g. 7.5" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} /></div>
              <div className="col-6"><label className="form-label small fw-semibold">Height (cm)</label><input type="number" step="0.1" min="0" className="form-control" placeholder="e.g. 68" value={form.height} onChange={e=>setForm({...form,height:e.target.value})} /></div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Vaccine Given (if any)</label>
              <select className="form-select" value={form.vaccineGiven} onChange={e=>setForm({...form,vaccineGiven:e.target.value})}>
                <option value="">— None —</option>
                {VACCINES.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Observations / Notes</label>
              <textarea className="form-control" rows={3} placeholder="Child's condition, issues noted..." value={form.observations} onChange={e=>setForm({...form,observations:e.target.value})}></textarea>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold">Outcome</label>
              <select className="form-select" value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})}>
                <option value="normal">Normal — Routine follow-up</option>
                <option value="referred">Referred to PHC</option>
                <option value="follow-up">Follow-up required</option>
              </select>
            </div>
            <button type="submit" className="btn btn-sa-primary w-100" disabled={submitting}>
              {submitting?<span className="spinner-border spinner-border-sm me-2"></span>:null}Log Visit
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default LogHomeVisit;
