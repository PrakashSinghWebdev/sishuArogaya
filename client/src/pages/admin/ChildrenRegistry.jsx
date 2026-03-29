import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { childAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const ChildrenRegistry = () => {
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { childAPI.list().then(r=>setChildren(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  const filtered = children.filter(c => {
    const s = c.name.toLowerCase().includes(search.toLowerCase()) || (c.district||'').toLowerCase().includes(search.toLowerCase());
    const f = filter==='all'||c.nutritionStatus===filter;
    return s&&f;
  });

  const STATUS = { healthy:'bg-success', moderate:'bg-warning text-dark', severe:'bg-danger' };

  return (
    <Layout role="admin">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-people-fill me-2 text-success"></i>{t('childrenRegistry')} ({children.length})</h4>
      </div>
      <div className="row g-2 mb-3">
        <div className="col-md-6"><input className="form-control" placeholder={`${t('search')}...`} value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <div className="col-md-6 d-flex gap-2">
          {['all','healthy','moderate','severe'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`btn btn-sm ${filter===s?'btn-sa-primary':'btn-outline-secondary'}`}>{s==='all'?'All':t(s)}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div><div className="mt-2 text-muted">{t('loading')}</div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>{t('name')}</th><th>{t('age')}</th><th>{t('gender')}</th><th>{t('district')}</th><th>{t('block')}</th><th>{t('weight')}</th><th>{t('height')}</th><th>{t('status')}</th><th>Parent</th></tr></thead>
              <tbody>
                {filtered.length===0?<tr><td colSpan={9} className="text-muted text-center py-4">{t('noRecords')}</td></tr>:filtered.map(c=>(
                  <tr key={c._id}><td className="fw-semibold">{c.name}</td><td>{c.ageInMonths}mo</td><td className="text-capitalize">{c.gender}</td><td>{c.district||'—'}</td><td>{c.block||'—'}</td><td>{c.currentWeight?`${c.currentWeight}kg`:'—'}</td><td>{c.currentHeight?`${c.currentHeight}cm`:'—'}</td><td><span className={`badge ${STATUS[c.nutritionStatus]}`}>{t(c.nutritionStatus)||c.nutritionStatus}</span></td><td>{c.parentId?.name||'—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ChildrenRegistry;
