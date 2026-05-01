import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { schemeAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const INITIAL = { name:'', shortName:'', description:'', eligibilityCriteria:'', benefits:'', applyLink:'', category:'nutrition' };

const GovernmentSchemes = () => {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const load = () => schemeAPI.list().then(r=>setSchemes(r.data)).catch(console.error).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await schemeAPI.create(form); load(); setShowForm(false); setForm(INITIAL); }
    catch(err){ alert(err.response?.data?.message||'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <Layout role="admin">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="bi bi-bank me-2 text-purple"></i>{t('governmentSchemes')}</h4>
        <button className="btn btn-sa-primary" onClick={()=>setShowForm(!showForm)}><i className="bi bi-plus-circle me-2"></i>{t('schemes')}</button>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0 fw-semibold">Add New Scheme</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label small">Scheme Name *</label><input className="form-control" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
                <div className="col-md-3"><label className="form-label small">Short Name</label><input className="form-control" placeholder="PMMVY" value={form.shortName} onChange={e=>setForm({...form,shortName:e.target.value})} /></div>
                <div className="col-md-3"><label className="form-label small">Category</label><select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="nutrition">Nutrition</option><option value="vaccination">Vaccination</option><option value="financial">Financial</option><option value="education">Education</option><option value="other">Other</option></select></div>
                <div className="col-12"><label className="form-label small">Description *</label><textarea className="form-control" rows={2} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}></textarea></div>
                <div className="col-md-6"><label className="form-label small">Eligibility</label><textarea className="form-control" rows={2} value={form.eligibilityCriteria} onChange={e=>setForm({...form,eligibilityCriteria:e.target.value})}></textarea></div>
                <div className="col-md-6"><label className="form-label small">Benefits</label><textarea className="form-control" rows={2} value={form.benefits} onChange={e=>setForm({...form,benefits:e.target.value})}></textarea></div>
                <div className="col-12"><label className="form-label small">Apply Link</label><input className="form-control" placeholder="https://..." value={form.applyLink} onChange={e=>setForm({...form,applyLink:e.target.value})} /></div>
              </div>
              <div className="mt-3 d-flex gap-2"><button type="submit" className="btn btn-sa-primary" disabled={saving}>{saving?'Saving...':'Save Scheme'}</button><button type="button" className="btn btn-outline-secondary" onClick={()=>setShowForm(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div><p className="mt-2 text-muted">{t('loading')}</p></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>{t('name')}</th><th>Short Name</th><th>Category</th><th>{t('status')}</th></tr></thead>
              <tbody>
                {schemes.map(s=><tr key={s._id}><td className="fw-semibold">{s.name}</td><td>{s.shortName||'—'}</td><td className="text-capitalize">{s.category}</td><td><span className={`badge ${s.isActive?'bg-success':'bg-secondary'}`}>{s.isActive?'Active':'Inactive'}</span></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GovernmentSchemes;
