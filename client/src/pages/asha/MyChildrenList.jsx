import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const STATUS_COLOR = { healthy: 'bg-success', moderate: 'bg-warning text-dark', severe: 'bg-danger' };

const MyChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [checkupQueue, setCheckupQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [childRes, queueRes] = await Promise.all([
        ashaAPI.getMyChildren(),
        ashaAPI.getCheckupQueue(),
      ]);
      setChildren(childRes.data);
      setCheckupQueue(queueRes.data.map(c => c._id || c));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggleCheckup = async (childId) => {
    setToggling(childId);
    try {
      const res = await ashaAPI.toggleCheckupQueue({ childId });
      if (res.data.action === 'added') {
        setCheckupQueue(prev => [...prev, childId]);
        showToast('Child added to checkup list');
      } else {
        setCheckupQueue(prev => prev.filter(id => id !== childId));
        showToast('Child removed from checkup list', 'warning');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'danger');
    } finally {
      setToggling(null);
    }
  };

  const isInQueue = (childId) => checkupQueue.includes(childId);

  const filtered = children.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.nutritionStatus === filter;
    return matchSearch && matchFilter;
  });

  const queueChildren = children.filter(c => isInQueue(c._id));
  const displayList = activeTab === 'checkup' ? queueChildren : filtered;

  return (
    <Layout role="asha">
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow`} style={{ zIndex: 9999, minWidth: 260 }}>
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle' : toast.type === 'warning' ? 'dash-circle' : 'exclamation-triangle'} me-2`}></i>
          {toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-people me-2 text-success"></i>My Children ({children.length})</h4>
        {checkupQueue.length > 0 && (
          <span className="badge bg-primary fs-6 px-3 py-2">
            <i className="bi bi-clipboard2-check me-1"></i>{checkupQueue.length} scheduled for checkup
          </span>
        )}
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'all' ? 'active fw-semibold' : ''}`} onClick={() => setActiveTab('all')}>
            <i className="bi bi-people me-1"></i>All Children
            <span className="badge bg-secondary ms-2">{children.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'checkup' ? 'active fw-semibold' : ''}`} onClick={() => setActiveTab('checkup')}>
            <i className="bi bi-clipboard2-check me-1"></i>Checkup Queue
            {checkupQueue.length > 0 && <span className="badge bg-primary ms-2">{checkupQueue.length}</span>}
          </button>
        </li>
      </ul>

      {activeTab === 'all' && (
        <div className="row g-2 mb-3">
          <div className="col-md-6"><input className="form-control" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="col-md-6 d-flex gap-2 flex-wrap">
            {['all', 'healthy', 'moderate', 'severe'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'checkup' && checkupQueue.length === 0 && !loading && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-clipboard2 fs-1 d-block mb-2"></i>
          No children scheduled for checkup. Use the Schedule button on any child.
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Child Name</th><th>Age</th><th>Gender</th><th>Village</th><th>Weight</th><th>Status</th><th>Checkup</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No children found.</td></tr>
                ) : displayList.map(c => (
                  <tr key={c._id} className={isInQueue(c._id) ? 'table-primary' : ''}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.ageInMonths} mo</td>
                    <td className="text-capitalize">{c.gender}</td>
                    <td>{c.village || c.block || '—'}</td>
                    <td>{c.currentWeight ? `${c.currentWeight} kg` : '—'}</td>
                    <td><span className={`badge ${STATUS_COLOR[c.nutritionStatus]}`}>{c.nutritionStatus}</span></td>
                    <td>
                      <button
                        className={`btn btn-sm ${isInQueue(c._id) ? 'btn-primary' : 'btn-outline-primary'}`}
                        disabled={toggling === c._id}
                        onClick={() => handleToggleCheckup(c._id)}
                        title={isInQueue(c._id) ? 'Remove from checkup queue' : 'Schedule for checkup'}
                      >
                        {toggling === c._id
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : isInQueue(c._id)
                            ? <><i className="bi bi-clipboard2-check-fill me-1"></i>Scheduled</>
                            : <><i className="bi bi-clipboard2-plus me-1"></i>Schedule</>
                        }
                      </button>
                    </td>
                    <td className="d-flex gap-1">
                      <Link to={`/asha/child/${c._id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-eye"></i></Link>
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
