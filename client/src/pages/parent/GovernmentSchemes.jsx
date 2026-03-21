import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { schemeAPI } from '../../services/api';

const SCHEME_ICONS = { nutrition:'bi-egg-fried', vaccination:'bi-shield-check', financial:'bi-cash-coin', education:'bi-book', other:'bi-star' };
const SCHEME_COLORS = { nutrition:'#1a6b3c', vaccination:'#0d6efd', financial:'#fd7e14', education:'#6f42c1', other:'#6c757d' };

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    schemeAPI.list().then(r => setSchemes(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? schemes : schemes.filter(s => s.category === filter);

  return (
    <Layout role="parent">
      <h4 className="fw-bold mb-4"><i className="bi bi-bank me-2 text-purple"></i>Government Welfare Schemes</h4>

      <div className="mb-3 d-flex gap-2 flex-wrap">
        {['all','nutrition','vaccination','financial','education'].map(c => (
          <button key={c} onClick={()=>setFilter(c)} className={`btn btn-sm ${filter===c?'btn-sa-primary':'btn-outline-secondary'}`}>
            {c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div></div> : (
        <div className="row g-4">
          {filtered.length === 0 ? (
            <div className="col-12 text-center text-muted py-5"><i className="bi bi-bank fs-1"></i><p className="mt-2">No schemes found.</p></div>
          ) : filtered.map(s => {
            const color = SCHEME_COLORS[s.category] || '#6c757d';
            const icon = SCHEME_ICONS[s.category] || 'bi-star';
            return (
              <div className="col-md-6" key={s._id}>
                <div className="card border-0 shadow-sm h-100" style={{borderTop:`4px solid ${color}`}}>
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="rounded-3 p-2 flex-shrink-0" style={{background:color+'15'}}>
                        <i className={`bi ${icon} fs-3`} style={{color}}></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">{s.name}</h6>
                        {s.shortName && <span className="badge rounded-pill" style={{background:color+'20',color}}>{s.shortName}</span>}
                      </div>
                    </div>
                    <p className="text-muted small mb-2">{s.description}</p>
                    {s.eligibilityCriteria && <div className="small mb-2"><strong>Eligibility:</strong> {s.eligibilityCriteria}</div>}
                    {s.benefits && <div className="small mb-3"><strong>Benefits:</strong> {s.benefits}</div>}
                    {s.applyLink && <a href={s.applyLink} target="_blank" rel="noreferrer" className="btn btn-sm" style={{background:color,color:'#fff'}}>Apply / Learn More <i className="bi bi-arrow-right ms-1"></i></a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default GovernmentSchemes;
