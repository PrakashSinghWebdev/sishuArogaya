import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const MyChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { ashaAPI.getMyChildren().then(r => setChildren(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  const filtered = children.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.nutritionStatus === filter;
    return matchSearch && matchFilter;
  });

  const STATUS_COLOR = { healthy:'bg-success', moderate:'bg-warning text-dark', severe:'bg-danger' };

  return (
    <Layout role="asha">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-people me-2 text-success"></i>My Children ({children.length})</h4>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-6"><input className="form-control" placeholder="Search by name..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <div className="col-md-6 d-flex gap-2">
          {['all','healthy','moderate','severe'].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`btn btn-sm ${filter===s?'btn-sa-primary':'btn-outline-secondary'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Child Name</th><th>Age</th><th>Gender</th><th>Village</th><th>Weight</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length===0 ? <tr><td colSpan={7} className="text-center text-muted py-4">No children found.</td></tr> : filtered.map(c=>(
                  <tr key={c._id}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.ageInMonths} mo</td>
                    <td className="text-capitalize">{c.gender}</td>
                    <td>{c.village || c.block || '—'}</td>
                    <td>{c.currentWeight ? `${c.currentWeight} kg` : '—'}</td>
                    <td><span className={`badge ${STATUS_COLOR[c.nutritionStatus]}`}>{c.nutritionStatus}</span></td>
                    <td>
                      <Link to={`/asha/child/${c._id}`} className="btn btn-sm btn-outline-primary me-1"><i className="bi bi-eye"></i></Link>
                      <Link to={`/asha/log-visit?childId=${c._id}`} className="btn btn-sm btn-outline-success"><i className="bi bi-clipboard-plus"></i></Link>
                    </td>
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

export default MyChildrenList;
