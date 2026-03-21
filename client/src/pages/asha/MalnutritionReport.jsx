import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';

const MalnutritionReport = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ashaAPI.getMyChildren().then(r => setChildren(r.data.filter(c => ['moderate','severe'].includes(c.nutritionStatus)))).catch(console.error).finally(()=>setLoading(false));
  }, []);

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-exclamation-triangle me-2 text-danger"></i>Malnutrition Report</h4>

      {children.filter(c=>c.nutritionStatus==='severe').length > 0 && (
        <div className="alert alert-danger mb-3"><i className="bi bi-exclamation-octagon me-2"></i><strong>{children.filter(c=>c.nutritionStatus==='severe').length} severe case(s)</strong> require immediate PHC referral.</div>
      )}

      {loading ? <div className="text-center py-5"><div className="spinner-border text-danger"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Child</th><th>Age</th><th>Weight</th><th>Height</th><th>Status</th><th>Parent</th><th>Action</th></tr></thead>
              <tbody>
                {children.length===0?<tr><td colSpan={7} className="text-muted text-center py-4">No malnutrition cases in your area.</td></tr>:children.map(c=>(
                  <tr key={c._id} className={c.nutritionStatus==='severe'?'table-danger':''}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.ageInMonths}mo</td>
                    <td>{c.currentWeight ? `${c.currentWeight}kg` : '—'}</td>
                    <td>{c.currentHeight ? `${c.currentHeight}cm` : '—'}</td>
                    <td><span className={`badge ${c.nutritionStatus==='severe'?'bg-danger':'bg-warning text-dark'}`}>{c.nutritionStatus}</span></td>
                    <td>{c.parentId?.name || '—'}</td>
                    <td>{c.nutritionStatus==='severe'&&<span className="badge bg-danger">Refer to PHC</span>}</td>
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

export default MalnutritionReport;
