import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI, childAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const AshaWorkerManagement = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [childSearch, setChildSearch] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, cRes] = await Promise.all([ashaAPI.listWorkers(), childAPI.list()]);
      setWorkers(wRes.data);
      setChildren(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAssignModal = (worker) => {
    setSelectedWorker(worker);
    setChildSearch('');
    setShowModal(true);
  };

  const handleAssign = async (childId) => {
    setAssigning(childId);
    try {
      await ashaAPI.assignChild({ childId, ashaWorkerId: selectedWorker._id });
      showToast('Child assigned successfully');
      const [wRes, cRes] = await Promise.all([ashaAPI.listWorkers(), childAPI.list()]);
      setWorkers(wRes.data);
      setChildren(cRes.data);
      setSelectedWorker(wRes.data.find(w => w._id === selectedWorker._id) || selectedWorker);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'danger');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (childId) => {
    setAssigning(childId);
    try {
      await ashaAPI.unassignChild({ childId });
      showToast('Child unassigned successfully');
      const [wRes, cRes] = await Promise.all([ashaAPI.listWorkers(), childAPI.list()]);
      setWorkers(wRes.data);
      setChildren(cRes.data);
      setSelectedWorker(wRes.data.find(w => w._id === selectedWorker._id) || selectedWorker);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unassign', 'danger');
    } finally {
      setAssigning(null);
    }
  };

  const assignedToSelected = selectedWorker
    ? children.filter(c => {
        const ashaId = c.ashaId?._id || c.ashaId;
        return ashaId && String(ashaId) === String(selectedWorker._id);
      })
    : [];

  const unassignedFiltered = children.filter(c => {
    const noAsha = !c.ashaId;
    const matchSearch = !childSearch ||
      c.name.toLowerCase().includes(childSearch.toLowerCase()) ||
      (c.village || '').toLowerCase().includes(childSearch.toLowerCase()) ||
      (c.block || '').toLowerCase().includes(childSearch.toLowerCase());
    return noAsha && matchSearch;
  });

  const STATUS_COLOR = { healthy: 'bg-success', moderate: 'bg-warning text-dark', severe: 'bg-danger' };

  return (
    <Layout role="admin">
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow`} style={{ zIndex: 9999, minWidth: 260 }}>
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {toast.msg}
        </div>
      )}

      <h4 className="fw-bold mb-4"><i className="bi bi-person-badge-fill me-2 text-primary"></i>{t('ashaWorkers')}</h4>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>{t('name')}</th><th>ASHA ID</th><th>{t('district')}</th><th>{t('block')}</th><th>{t('myChildren')}</th><th>{t('logVisit')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr><td colSpan={9} className="text-muted text-center py-4">{t('noRecords')}</td></tr>
                ) : workers.map((w, i) => (
                  <tr key={w._id}>
                    <td><span className="badge bg-primary">#{i + 1}</span></td>
                    <td className="fw-semibold">{w.userId?.name || '—'}</td>
                    <td><code>{w.ashaId}</code></td>
                    <td>{w.district}</td>
                    <td>{w.block}</td>
                    <td><span className="badge bg-info text-dark">{w.assignedChildren?.length || 0}</span></td>
                    <td><span className="badge bg-success">{w.totalVisits}</span></td>
                    <td><span className={`badge ${w.isActive ? 'bg-success' : 'bg-secondary'}`}>{w.isActive ? t('activate') : t('suspend')}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openAssignModal(w)}>
                        <i className="bi bi-person-plus me-1"></i>Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && selectedWorker && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-badge me-2 text-primary"></i>
                  Assign Children — {selectedWorker.userId?.name} ({selectedWorker.ashaId})
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2 text-success">
                    <i className="bi bi-people-fill me-1"></i>Currently Assigned ({assignedToSelected.length})
                  </h6>
                  {assignedToSelected.length === 0 ? (
                    <p className="text-muted small">No children assigned yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-success">
                          <tr><th>{t('name')}</th><th>{t('age')}</th><th>{t('village')}/{t('block')}</th><th>{t('status')}</th><th>{t('action')}</th></tr>
                        </thead>
                        <tbody>
                          {assignedToSelected.map(c => (
                            <tr key={c._id}>
                              <td className="fw-semibold">{c.name}</td>
                              <td>{c.ageInMonths} mo</td>
                              <td>{c.village || c.block || '—'}</td>
                              <td><span className={`badge ${STATUS_COLOR[c.nutritionStatus]}`}>{c.nutritionStatus}</span></td>
                              <td>
                                <button className="btn btn-sm btn-outline-danger" disabled={assigning === c._id} onClick={() => handleUnassign(c._id)}>
                                  {assigning === c._id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-person-dash me-1"></i>Remove</>}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <hr />

                <div>
                  <h6 className="fw-semibold mb-2">
                    <i className="bi bi-person-plus me-1"></i>Assign Unassigned Children
                  </h6>
                  <input className="form-control mb-3" placeholder={`${t('search')}...`} value={childSearch} onChange={e => setChildSearch(e.target.value)} />
                  {unassignedFiltered.length === 0 ? (
                    <p className="text-muted small">{childSearch ? 'No matching unassigned children.' : 'All children are already assigned.'}</p>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: 340, overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light sticky-top">
                          <tr><th>{t('name')}</th><th>{t('age')}</th><th>{t('gender')}</th><th>{t('village')}/{t('block')}</th><th>Parent</th><th>{t('status')}</th><th>{t('action')}</th></tr>
                        </thead>
                        <tbody>
                          {unassignedFiltered.map(c => (
                            <tr key={c._id}>
                              <td className="fw-semibold">{c.name}</td>
                              <td>{c.ageInMonths} mo</td>
                              <td className="text-capitalize">{c.gender}</td>
                              <td>{c.village || c.block || '—'}</td>
                              <td>{c.parentId?.name || '—'}</td>
                              <td><span className={`badge ${STATUS_COLOR[c.nutritionStatus]}`}>{c.nutritionStatus}</span></td>
                              <td>
                                <button className="btn btn-sm btn-outline-success" disabled={assigning === c._id} onClick={() => handleAssign(c._id)}>
                                  {assigning === c._id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-plus-circle me-1"></i>Assign</>}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AshaWorkerManagement;
