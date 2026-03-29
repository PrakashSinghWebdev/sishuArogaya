import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { notificationAPI, adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const TYPES = ['vaccine_reminder','health_alert','visit_reminder','scheme_update','system'];

const NotificationsPanel = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId:'', message:'', type:'system' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { adminAPI.listUsers().then(r=>setUsers(r.data)).catch(console.error); }, []);

  const handleSend = async (e) => {
    e.preventDefault(); setSending(true); setSuccess(''); setError('');
    try { await notificationAPI.send(form); setSuccess('Notification sent!'); setForm({userId:'',message:'',type:'system'}); }
    catch(err) { setError(err.response?.data?.message||'Failed to send.'); }
    finally { setSending(false); }
  };

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-broadcast me-2 text-primary"></i>{t('notificationsPanel')}</h4>
      <div className="card border-0 shadow-sm" style={{maxWidth:560}}>
        <div className="card-header bg-white border-0 fw-semibold">Send Notification</div>
        <div className="card-body">
          {success && <div className="alert alert-success py-2 small">{success}</div>}
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <form onSubmit={handleSend}>
            <div className="mb-3">
              <label className="form-label small">Target User *</label>
              <select className="form-select" required value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})}>
                <option value="">— Select User —</option>
                {users.map(u=><option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small">{t('notifications')} Type</label>
              <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {TYPES.map(tp=><option key={tp} value={tp}>{tp.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small">Message *</label>
              <textarea className="form-control" rows={3} required value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Enter notification message..."></textarea>
            </div>
            <button type="submit" className="btn btn-sa-primary w-100" disabled={sending}>{sending?`${t('loading')}...`:`Send ${t('notifications')}`}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPanel;
