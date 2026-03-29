import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const MalnutritionCases = () => {
  const { t } = useLanguage();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = (f) => { setLoading(true); adminAPI.getMalnutrition(f==='all'?undefined:f).then(r=>setCases(r.data)).catch(console.error).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(filter); },[filter]);

  return (
    <Layout role="admin">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-exclamation-octagon me-2 text-danger"></i>{t('malnutritionCases')}</h4>
        <div className="d-flex gap-2">
          {['all','moderate','severe'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`btn btn-sm ${filter===s?'btn-danger':'btn-outline-danger'}`}>{s==='all'?'All':t(s)}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-danger"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>{t('childName')}</th><th>{t('age')}</th><th>{t('block')}</th><th>{t('district')}</th><th>{t('weight')}</th><th>{t('height')}</th><th>{t('status')}</th><th>Parent</th><th>ASHA</th></tr></thead>
              <tbody>
                {cases.length===0?<tr><td colSpan={9} className="text-muted text-center py-4">{t('noRecords')}</td></tr>:cases.map(c=>(
                  <tr key={c._id} className={c.nutritionStatus==='severe'?'table-danger':''}>
                    <td className="fw-semibold">{c.name}</td><td>{c.ageInMonths}mo</td><td>{c.block||'—'}</td><td>{c.district||'—'}</td>
                    <td>{c.currentWeight?`${c.currentWeight}kg`:'—'}</td><td>{c.currentHeight?`${c.currentHeight}cm`:'—'}</td>
                    <td><span className={`badge ${c.nutritionStatus==='severe'?'bg-danger':'bg-warning text-dark'}`}>{t(c.nutritionStatus)||c.nutritionStatus}</span></td>
                    <td>{c.parentId?.name||'—'}</td><td>{c.ashaId?.ashaId||'—'}</td>
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

export default MalnutritionCases;
