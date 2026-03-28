import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Notifications from '../parent/Notifications.jsx';

export default function NotificationsAlerts() {
  const { user } = useAuth();
  
  if (user?.role === 'asha') {
    return (
      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <h4>🔔 ASHA Notifications & Alerts</h4>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Overdue vaccinations, checkup queue updates, and malnutrition alerts for your assigned children.</p>
        <Notifications />
      </div>
    );
  }
  
  return <Notifications />;
}
