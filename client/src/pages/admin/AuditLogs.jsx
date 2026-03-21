import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAuditLogs()
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-journal-text me-2 text-secondary"></i>Audit Logs</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
              <tbody>
                {logs.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-4">No audit logs found.</td></tr> : logs.map(log => (
                  <tr key={log._id}>
                    <td className="text-muted small">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    <td className="fw-semibold">{log.actorName || log.actorId?.name || 'System'}</td>
                    <td><span className={`badge ${log.actorRole === 'admin' ? 'bg-purple' : log.actorRole === 'asha' ? 'bg-primary' : log.actorRole === 'parent' ? 'bg-success' : 'bg-secondary'}`}>{log.actorRole}</span></td>
                    <td><code>{log.action}</code></td>
                    <td>{log.entityType}{log.entityId ? ` #${String(log.entityId).slice(-6)}` : ''}</td>
                    <td>{log.details || '—'}</td>
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

export default AuditLogs;
