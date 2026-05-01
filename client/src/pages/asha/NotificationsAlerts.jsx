import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// maps notification type to visual config
const notifTypeConfig = {
  vaccine_reminder: {
    icon: 'bi-shield-check',
    accent: '#f59e0b',
    bg: '#fff8eb',
    label: 'Vaccine Reminder',
  },
  health_alert: {
    icon: 'bi-exclamation-triangle-fill',
    accent: '#ef4444',
    bg: '#fff4f4',
    label: 'Health Alert',
  },
  visit_reminder: {
    icon: 'bi-calendar2-check',
    accent: '#0891b2',
    bg: '#f0fbff',
    label: 'Visit Reminder',
  },
  scheme_update: {
    icon: 'bi-megaphone',
    accent: '#10b981',
    bg: '#f1fff8',
    label: 'Scheme Update',
  },
  system: {
    icon: 'bi-bell',
    accent: '#6366f1',
    bg: '#f6f7ff',
    label: 'System',
  },
};

function prettyDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsAlerts() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI
      .list()
      .then(res => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const summaryStats = useMemo(() => {
    const unreadCount   = notifications.filter(n => !n.isRead).length;
    const urgentCount   = notifications.filter(n => n.type === 'health_alert').length;
    const reminderCount = notifications.filter(n =>
      n.type === 'vaccine_reminder' || n.type === 'visit_reminder'
    ).length;

    return [
      { label: 'Unread',    value: unreadCount,            color: '#0891b2' },
      { label: 'Urgent',    value: urgentCount,            color: '#ef4444' },
      { label: 'Reminders', value: reminderCount,          color: '#f59e0b' },
      { label: 'Total',     value: notifications.length,   color: '#10b981' },
    ];
  }, [notifications]);

  async function markOneAsRead(notifId) {
    try {
      await notificationAPI.markRead(notifId);
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
      );
    } catch {
      // silently ignore — UI keeps its current state
    }
  }

  async function markEverythingRead() {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // same — don't crash if the request fails
    }
  }

  return (
    <Layout role="asha">
      {/* quick-glance stats row */}
      <div className="row g-3 mb-4">
        {summaryStats.map(stat => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-2">{stat.label}</div>
                <div className="fw-bold" style={{ fontSize: '2rem', color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div>ASHA Notifications &amp; Alerts</div>
            <div className="small text-muted mt-1">
              Overdue vaccines, visit follow-ups, and health advisories for{' '}
              {user?.name || 'your account'}.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={markEverythingRead}
          >
            Mark all as read
          </button>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">No notifications right now.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12, padding: 16 }}>
              {notifications.map(item => {
                const cfg = notifTypeConfig[item.type] || notifTypeConfig.system;
                return (
                  <div
                    key={item._id}
                    style={{
                      border: `1px solid ${item.isRead ? '#e6f0f4' : `${cfg.accent}40`}`,
                      borderLeft: `5px solid ${cfg.accent}`,
                      background: item.isRead ? '#fff' : cfg.bg,
                      borderRadius: 16,
                      padding: 16,
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: '#fff',
                        border: `1px solid ${cfg.accent}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cfg.accent,
                        flexShrink: 0,
                      }}
                    >
                      <i className={`bi ${cfg.icon}`} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                        <span className="fw-semibold">{item.title || cfg.label}</span>
                        <span className="badge" style={{ background: cfg.accent, color: '#fff' }}>
                          {cfg.label}
                        </span>
                        {!item.isRead && <span className="badge bg-danger">New</span>}
                      </div>
                      <div className="text-muted small" style={{ lineHeight: 1.6 }}>
                        {item.message}
                      </div>
                      <div className="small text-muted mt-2">{prettyDate(item.createdAt)}</div>
                    </div>

                    {!item.isRead && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => markOneAsRead(item._id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
