import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import { ashaAPI, childAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

// nutrition status → visual config
const nutritionStyles = {
  healthy:  { bg: '#ecfdf5', color: '#059669', label: 'Healthy'  },
  moderate: { bg: '#fffbeb', color: '#d97706', label: 'Moderate' },
  severe:   { bg: '#fef2f2', color: '#dc2626', label: 'Severe'   },
};

const cardBox = {
  background: 'rgba(255,255,255,0.95)',
  border: '1.5px solid #c5e8ef',
  borderRadius: 16,
  padding: '24px',
  boxShadow: '0 8px 30px rgba(8,145,178,0.08)',
};

// reused button base — merge with a variant object
const btnBase = {
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const btnVariants = {
  outline: { background: 'transparent', color: '#0e7490', border: '1.5px solid #0e7490' },
  green:   { background: '#059669', color: '#fff' },
  red:     { background: '#dc2626', color: '#fff' },
  muted:   { background: '#e2e8f0', color: '#475569' },
};

const thCell = {
  padding: '14px 16px',
  textAlign: 'left',
  color: '#4a7a8a',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  borderBottom: '2px solid #e2e8f0',
};

const tdCell = {
  padding: '16px',
  color: '#0f172a',
  fontSize: 14,
  borderBottom: '1px solid #f1f5f9',
};

const AshaWorkerManagement = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [childSearch, setChildSearch] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [workersRes, childrenRes] = await Promise.all([
        ashaAPI.listWorkers(),
        childAPI.list(),
      ]);
      setWorkers(workersRes.data);
      setChildren(childrenRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function flashToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openWorkerModal(worker) {
    setSelectedWorker(worker);
    setChildSearch('');
    setShowModal(true);
  }

  async function assignChild(childId) {
    setAssigningId(childId);
    try {
      await ashaAPI.assignChild({ childId, ashaWorkerId: selectedWorker._id });
      flashToast('Child assigned successfully');
      const [wRes, cRes] = await Promise.all([ashaAPI.listWorkers(), childAPI.list()]);
      setWorkers(wRes.data);
      setChildren(cRes.data);
      setSelectedWorker(wRes.data.find(w => w._id === selectedWorker._id) || selectedWorker);
    } catch (err) {
      flashToast(err.response?.data?.message || 'Failed to assign', 'danger');
    } finally {
      setAssigningId(null);
    }
  }

  async function unassignChild(childId) {
    setAssigningId(childId);
    try {
      await ashaAPI.unassignChild({ childId });
      flashToast('Child unassigned successfully');
      const [wRes, cRes] = await Promise.all([ashaAPI.listWorkers(), childAPI.list()]);
      setWorkers(wRes.data);
      setChildren(cRes.data);
      setSelectedWorker(wRes.data.find(w => w._id === selectedWorker._id) || selectedWorker);
    } catch (err) {
      flashToast(err.response?.data?.message || 'Failed to unassign', 'danger');
    } finally {
      setAssigningId(null);
    }
  }

  // children currently linked to the open worker
  const assignedChildren = selectedWorker
    ? children.filter(c => {
        const workerRef = c.ashaId?._id || c.ashaId;
        return workerRef && String(workerRef) === String(selectedWorker._id);
      })
    : [];

  // unassigned children matching the search box
  const availableChildren = children.filter(c => {
    if (c.ashaId) return false;
    if (!childSearch) return true;
    const q = childSearch.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.village || '').toLowerCase().includes(q) ||
      (c.block || '').toLowerCase().includes(q)
    );
  });

  return (
    <Layout role="admin">
      <div style={{ fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999, minWidth: 300,
            background: toast.type === 'success' ? '#059669' : '#dc2626',
            color: '#fff', padding: '14px 20px', borderRadius: 12,
            fontWeight: 600, fontSize: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            {toast.msg}
          </div>
        )}

        <h3 style={{
          fontFamily: "'Libre Baskerville', serif",
          fontSize: 22, fontWeight: 700, color: '#0c2340',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 28 }}>👩‍⚕️</span> ASHA Worker Management
        </h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <div style={{
              width: 44, height: 44,
              border: '4px solid #cffafe', borderTopColor: '#0891b2',
              borderRadius: '50%', animation: 'spin .8s linear infinite',
            }} />
          </div>
        ) : (
          <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    {['#', t('name'), 'ASHA ID', `${t('district')} / ${t('block')}`, t('myChildren'), t('logVisit'), t('status'), t('actions')].map(h => (
                      <th key={h} style={thCell}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                        {t('noRecords')}
                      </td>
                    </tr>
                  ) : workers.map((worker, i) => (
                    <tr
                      key={worker._id}
                      style={{ transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdCell}>
                        <span style={{ background: '#e0f7fa', color: '#0891b2', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          #{i + 1}
                        </span>
                      </td>
                      <td style={{ ...tdCell, fontWeight: 700 }}>{worker.userId?.name || '—'}</td>
                      <td style={tdCell}>
                        <code style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 6 }}>
                          {worker.ashaId}
                        </code>
                      </td>
                      <td style={tdCell}>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{worker.district}</span>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{worker.block}</div>
                      </td>
                      <td style={tdCell}>
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                          {worker.assignedChildren?.length || 0}
                        </span>
                      </td>
                      <td style={tdCell}>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                          {worker.totalVisits}
                        </span>
                      </td>
                      <td style={tdCell}>
                        <span style={{
                          background: worker.isActive ? '#ecfdf5' : '#f1f5f9',
                          color: worker.isActive ? '#059669' : '#64748b',
                          padding: '4px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        }}>
                          {worker.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={tdCell}>
                        <button
                          style={{ ...btnBase, ...btnVariants.outline }}
                          onClick={() => openWorkerModal(worker)}
                        >
                          ⚙️ Manage
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
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(12,35,64,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1050, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <div style={{
              background: '#fff', borderRadius: 24,
              width: '100%', maxWidth: 1000, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                padding: '24px 32px', borderBottom: '1.5px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#f8fafc',
              }}>
                <h4 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: '#0c2340', margin: 0 }}>
                  <span style={{ marginRight: 8, color: '#0891b2' }}>👤</span>
                  Assign Children —{' '}
                  <span style={{ color: '#0891b2' }}>{selectedWorker.userId?.name}</span>
                  {' '}({selectedWorker.ashaId})
                </h4>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                {/* Already assigned */}
                <div style={{ marginBottom: 40 }}>
                  <h5 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                    👥 Currently Assigned ({assignedChildren.length})
                  </h5>
                  {assignedChildren.length === 0 ? (
                    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                      No children assigned yet.
                    </div>
                  ) : (
                    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f0fdff' }}>
                          <tr>
                            {[t('name'), 'Age / Gender', 'Location', 'Health Status', ''].map(h => (
                              <th key={h} style={{ ...thCell, borderBottom: '1.5px solid #c5e8ef' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {assignedChildren.map((c, idx) => {
                            const s = nutritionStyles[c.nutritionStatus] || { bg: '#f1f5f9', color: '#475569', label: c.nutritionStatus || 'Unknown' };
                            return (
                              <tr key={c._id} style={{ borderBottom: idx < assignedChildren.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <td style={{ ...tdCell, fontWeight: 700 }}>{c.name}</td>
                                <td style={tdCell}>{c.ageInMonths} mo · <span style={{ textTransform: 'capitalize' }}>{c.gender}</span></td>
                                <td style={tdCell}>{c.village || c.block || '—'}</td>
                                <td style={tdCell}>
                                  <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                                    {s.label}
                                  </span>
                                </td>
                                <td style={{ ...tdCell, textAlign: 'right' }}>
                                  <button
                                    style={{ ...btnBase, ...btnVariants.red, padding: '6px 12px' }}
                                    disabled={assigningId === c._id}
                                    onClick={() => unassignChild(c._id)}
                                  >
                                    {assigningId === c._id ? '⏳' : '✕ Remove'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: '#e2e8f0', margin: '32px 0' }} />

                {/* Find unassigned */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h5 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      🔎 Find Unassigned Children
                    </h5>
                    <input
                      placeholder={`${t('search')} name, village...`}
                      value={childSearch}
                      onChange={e => setChildSearch(e.target.value)}
                      style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #cbd5e1', outline: 'none', minWidth: 260, fontSize: 13 }}
                    />
                  </div>

                  {availableChildren.length === 0 ? (
                    <div style={{ background: '#f8fafc', padding: 32, borderRadius: 12, textAlign: 'center', color: '#64748b' }}>
                      {childSearch
                        ? 'No matching unassigned children.'
                        : 'All children are currently assigned to an ASHA worker.'}
                    </div>
                  ) : (
                    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            {[t('name'), 'Age / Gender', 'Location', 'Parent', 'Health Status', ''].map(h => (
                              <th key={h} style={thCell}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {availableChildren.slice(0, 50).map((c, idx) => {
                            const s = nutritionStyles[c.nutritionStatus] || { bg: '#f1f5f9', color: '#475569', label: c.nutritionStatus || 'Unknown' };
                            return (
                              <tr
                                key={c._id}
                                style={{ borderBottom: idx < Math.min(availableChildren.length, 50) - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ ...tdCell, fontWeight: 700 }}>{c.name}</td>
                                <td style={tdCell}>{c.ageInMonths} mo · <span style={{ textTransform: 'capitalize' }}>{c.gender}</span></td>
                                <td style={tdCell}>{c.village || c.block || '—'}</td>
                                <td style={tdCell}>{c.parentId?.name || '—'}</td>
                                <td style={tdCell}>
                                  <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                                    {s.label}
                                  </span>
                                </td>
                                <td style={{ ...tdCell, textAlign: 'right' }}>
                                  <button
                                    style={{ ...btnBase, ...btnVariants.green, padding: '6px 16px' }}
                                    disabled={assigningId === c._id}
                                    onClick={() => assignChild(c._id)}
                                  >
                                    {assigningId === c._id ? '⏳' : '+ Assign'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {availableChildren.length > 50 && (
                        <div style={{ background: '#f8fafc', padding: 12, textAlign: 'center', fontSize: 12, color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
                          Showing 50 of {availableChildren.length}. Use the search bar to narrow down.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '20px 32px', background: '#f8fafc', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ ...btnBase, ...btnVariants.muted }} onClick={() => setShowModal(false)}>
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AshaWorkerManagement;
