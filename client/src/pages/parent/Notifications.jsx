import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { notificationAPI } from '../../services/api';

const TYPE_CONFIG = {
  vaccine_reminder: { icon: 'bi-shield-check', color: '#0d6efd', label: 'Vaccine Reminder' },
  health_alert:     { icon: 'bi-heart-pulse',  color: '#dc3545', label: 'Health Alert' },
  visit_reminder:   { icon: 'bi-calendar-check', color: '#1a6b3c', label: 'Visit Reminder' },
  scheme_update:    { icon: 'bi-bank',          color: '#6f42c1', label: 'Scheme Update' },
  system:           { icon: 'bi-bell',          color: '#6c757d', label: 'System' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { notificationAPI.list().then(r => setNotifications(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  const markRead = async (id) => {
    await notificationAPI.markRead(id).catch(console.error);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };
  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(console.error);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <Layout role="parent">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="bi bi-bell me-2 text-warning"></i>Notifications</h4>
        {notifications.some(n => !n.isRead) && <button className="btn btn-sm btn-outline-secondary" onClick={markAllRead}>Mark All Read</button>}
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div> : (
        <div className="card border-0 shadow-sm">
          {notifications.length === 0 ? (
            <div className="card-body text-center text-muted py-5"><i className="bi bi-bell-slash fs-1"></i><p className="mt-2">No notifications.</p></div>
          ) : (
            <ul className="list-group list-group-flush">
              {notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                return (
                  <li key={n._id} className={`list-group-item d-flex align-items-start gap-3 py-3 ${!n.isRead ? 'bg-light' : ''}`}>
                    <div className="rounded-3 p-2 flex-shrink-0" style={{background:cfg.color+'15'}}><i className={`bi ${cfg.icon}`} style={{color:cfg.color}}></i></div>
                    <div className="flex-grow-1">
                      <div className={`${!n.isRead ? 'fw-semibold' : ''}`} style={{fontSize:'0.875rem'}}>{n.message}</div>
                      <div className="text-muted" style={{fontSize:'0.75rem'}}>{cfg.label} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                    {!n.isRead && <button className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={() => markRead(n._id)}>Mark Read</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Notifications;
