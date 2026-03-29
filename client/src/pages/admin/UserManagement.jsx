import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const UserManagement = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [toggling, setToggling] = useState(null);

  const load = (r) => { setLoading(true); adminAPI.listUsers(r==='all'?undefined:r).then(res=>setUsers(res.data)).catch(console.error).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(roleFilter); },[roleFilter]);

  const toggle = async (id) => {
    setToggling(id);
    try { await adminAPI.toggleUser(id); load(roleFilter); }
    catch(err){ alert(err.response?.data?.message||'Failed.'); }
    finally { setToggling(null); }
  };

  const ROLE_BADGE = { parent:'bg-success', asha:'bg-primary', admin:'bg-purple' };

  return (
    <Layout role="admin">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0"><i className="bi bi-person-gear me-2 text-warning"></i>{t('userManagement')} ({users.length})</h4>
        <div className="d-flex gap-2">
          {['all','parent','asha','admin'].map(r=>(
            <button key={r} onClick={()=>setRoleFilter(r)} className={`btn btn-sm ${roleFilter===r?'btn-sa-primary':'btn-outline-secondary'}`}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
          ))}
        </div>
      </div>
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
                    <td><button className={`btn btn-sm ${u.isActive?'btn-outline-danger':'btn-outline-success'}`} onClick={()=>toggle(u._id)} disabled={toggling===u._id}>{toggling===u._id?t('loading'):u.isActive?t('suspend'):t('activate')}</button></td>
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

export default UserManagement;
