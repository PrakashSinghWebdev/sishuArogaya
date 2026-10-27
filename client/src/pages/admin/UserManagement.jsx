import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Pager, { totalOf } from '../../components/Pager';

const LIMIT = 100;

const UserManagement = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [toggling, setToggling] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reload, setReload] = useState(0);
  const [resetResult, setResetResult] = useState(null);

  // Search and paging run on the server (there can be lakhs of parents)
  useEffect(() => { setPage(1); }, [roleFilter, search]);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      adminAPI.listUsers(roleFilter === 'all' ? undefined : roleFilter, { q: search || undefined, page, limit: LIMIT })
        .then(res => { setUsers(res.data); setTotal(totalOf(res)); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [roleFilter, search, page, reload]);

  const toggle = async (id) => {
    setToggling(id);
    try { await adminAPI.toggleUser(id); setReload(n => n + 1); }
    catch(err){ alert(err.response?.data?.message||'Failed.'); }
    finally { setToggling(null); }
  };

  // An ASHA forgot the password: issue a new one-time password (sent by SMS, WhatsApp, email)
  const resetPassword = async (u) => {
    if (!window.confirm(`Reset the password of ${u.name}? They will be signed out and must set a new password.`)) return;
    setToggling(u._id);
    try { const { data } = await adminAPI.resetPassword(u._id); setResetResult({ ...data, name: u.name }); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
    finally { setToggling(null); }
  };

  const ROLE_BADGE = { parent:'bg-success', asha:'bg-primary', admin:'bg-purple' };

  return (
    <Layout role="admin">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-person-gear me-2 text-warning"></i>{t('userManagement')} ({total.toLocaleString('en-IN')})</h4>
        <div className="d-flex gap-2">
          {['all','parent','asha','admin'].map(r=>(
            <button key={r} onClick={()=>setRoleFilter(r)} className={`btn btn-sm ${roleFilter===r?'btn-sa-primary':'btn-outline-secondary'}`}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
          ))}
        </div>
      </div>
      {resetResult && (
        <div className="alert alert-success small">
          <div className="d-flex justify-content-between"><strong>New one-time password for {resetResult.name}</strong><button type="button" className="btn-close" aria-label="Close" onClick={() => setResetResult(null)}></button></div>
          <div>Username: <strong>{resetResult.username}</strong> · Password: <strong>{resetResult.password}</strong></div>
          <div>{Object.entries(resetResult.delivery).map(([ch, st]) => `${st === 'sent' ? '✓' : '✕'} ${ch.toUpperCase()}${st === 'sent' ? '' : `: ${st}`}`).join(' · ')}</div>
          <div className="d-flex gap-2 mt-2">
            <a className="btn btn-sm btn-success" target="_blank" rel="noreferrer" href={`https://wa.me/91${resetResult.phone}?text=${encodeURIComponent(resetResult.text)}`}>WhatsApp</a>
            <a className="btn btn-sm btn-primary" href={`sms:+91${resetResult.phone}?body=${encodeURIComponent(resetResult.text)}`}>SMS</a>
          </div>
        </div>
      )}
      <input className="form-control mb-3" placeholder={`${t('search')}... (name, email, phone, ASHA ID)`} value={search} onChange={e=>setSearch(e.target.value)} />
      {loading ? <div className="text-center py-5"><div className="spinner-border text-warning"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>{t('name')}</th><th>{t('email2')}</th><th>{t('phone2')}</th><th>{t('role')}</th><th>{t('status')}</th><th>{t('createdAt')}</th><th>{t('action')}</th></tr></thead>
              <tbody>
                {users.length===0?<tr><td colSpan={7} className="text-muted text-center py-4">{t('noRecords')}</td></tr>:users.map(u=>(
                  <tr key={u._id}>
                    <td className="fw-semibold">{u.name}</td><td>{u.email}</td><td>{u.phone||'—'}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]||'bg-secondary'}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive?'bg-success':'bg-secondary'}`}>{u.isActive?t('activate'):t('suspend')}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="text-nowrap">
                      <button className={`btn btn-sm ${u.isActive?'btn-outline-danger':'btn-outline-success'}`} onClick={()=>toggle(u._id)} disabled={toggling===u._id}>{toggling===u._id?t('loading'):u.isActive?t('suspend'):t('activate')}</button>
                      {u.role === 'asha' && <button className="btn btn-sm btn-outline-secondary ms-1" title="Reset password" onClick={()=>resetPassword(u)} disabled={toggling===u._id}><i className="bi bi-key"></i></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} limit={LIMIT} total={total} onPage={setPage} />
        </div>
      )}
    </Layout>
  );
};

export default UserManagement;
