import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import RoleShell from '../../components/RoleShell';
import { messageAPI, notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { palette, Badge } from '../asha/fieldUi';

const KIND_STYLE = {
  instruction: { bg: '#cffafe', color: '#0e7490', icon: '📋' },
  announcement: { bg: '#e0e7ff', color: '#3730a3', icon: '📢' },
  training: { bg: '#d1fae5', color: '#065f46', icon: '🎓' },
  meeting: { bg: '#fef3c7', color: '#92400e', icon: '📅' },
  correction: { bg: '#fee2e2', color: '#991b1b', icon: '✏️' },
  query: { bg: '#f1f5f9', color: '#334155', icon: '❓' },
};
const SENDER_KINDS = ['instruction', 'announcement', 'training', 'meeting', 'correction'];
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const blank = { to: 'all', picked: [], kind: 'instruction', subject: '', body: '', meetingAt: '' };

// Admin ↔ ASHA messages (ASHAs and parents write to the admins; admins to one or more ASHAs)
// plus system alerts (escalations, emergencies) in one place
export default function Messages() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const isAsha = role === 'asha' || role === 'parent'; // both write to one fixed recipient (the admins)
  const [tab, setTab] = useState(useLocation().pathname.endsWith('/notifications') ? 'alerts' : 'inbox');
  const [rows, setRows] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  const load = useCallback(() => {
    setLoading(true);
    const req = tab === 'alerts' ? notificationAPI.list().then((r) => setAlerts(r.data || [])) : messageAPI.list(tab).then((r) => setRows(r.data || []));
    req.catch((err) => setMsg({ text: err.response?.data?.message || 'Could not load', error: true })).finally(() => setLoading(false));
  }, [tab]);
  useEffect(load, [load]);
  useEffect(() => { if (!isAsha) messageAPI.recipients().then((r) => setRecipients(r.data || [])).catch(() => {}); }, [isAsha]);

  async function run(fn, okText) {
    setBusy(true);
    setMsg({ text: '', error: false });
    try {
      await fn();
      if (okText) setMsg({ text: okText, error: false });
      load();
      return true;
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Something went wrong', error: true });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function send(e) {
    e.preventDefault();
    const payload = { kind: form.kind, subject: form.subject, body: form.body, meetingAt: form.meetingAt || undefined, to: form.to === 'all' ? 'all' : form.picked };
    if (!isAsha && form.to !== 'all' && !form.picked.length) return setMsg({ text: t('chooseRecipients'), error: true });
    if (await run(() => messageAPI.send(payload), t('messageSent'))) { setForm(blank); setCompose(false); setTab('sent'); }
  }

  function toggleOpen(m) {
    setOpenId(openId === m._id ? null : m._id);
    setReplyText('');
    if (m.unread) messageAPI.markRead(m._id).then(() => setRows((rs) => rs.map((r) => (r._id === m._id ? { ...r, unread: false } : r)))).catch(() => {});
  }

  const unread = rows.filter((r) => r.unread).length;
  const pick = (id) => setForm((f) => ({ ...f, picked: f.picked.includes(id) ? f.picked.filter((x) => x !== id) : [...f.picked, id] }));

  return (
    <RoleShell role={role}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="fw-bold mb-0" style={{ color: palette.text }}><i className="bi bi-chat-left-text me-2" style={{ color: palette.primary }}></i>{t('supervisorMessages')}</h4>
        <button className="btn btn-sa-primary" onClick={() => setCompose((c) => !c)}>
          <i className="bi bi-pencil-square me-1"></i>{role === 'parent' ? t('contactSupport') : isAsha ? t('messageSupervisor') : t('newMessage')}
        </button>
      </div>

      {msg.text && <div className={`alert py-2 small ${msg.error ? 'alert-danger' : 'alert-success'}`}>{msg.text}</div>}

      {compose && (
        <form onSubmit={send} className="card border-0 shadow-sm p-3 mb-3">
          {!isAsha && (
            <>
              <div className="row g-2">
                <div className="col-md-6">
                  <span className="form-label small fw-semibold d-block">{t('sendTo')}</span>
                  <div className="btn-group w-100" role="group">
                    <button type="button" className={`btn btn-sm ${form.to === 'all' ? 'btn-sa-primary' : 'btn-outline-secondary'}`} onClick={() => setForm((f) => ({ ...f, to: 'all' }))}>{t('allMyAshas')} ({recipients.length})</button>
                    <button type="button" className={`btn btn-sm ${form.to === 'some' ? 'btn-sa-primary' : 'btn-outline-secondary'}`} onClick={() => setForm((f) => ({ ...f, to: 'some' }))}>{t('chooseAshas')}</button>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="msg-kind">{t('messageType')}</label>
                  <select id="msg-kind" className="form-select form-select-sm" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                    {SENDER_KINDS.map((k) => <option key={k} value={k}>{KIND_STYLE[k].icon} {t(`kind_${k}`)}</option>)}
                  </select>
                </div>
              </div>
              {form.to === 'some' && (
                <div className="border rounded p-2 mt-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {recipients.length === 0 && <div className="small text-muted">{t('noRecords')}</div>}
                  {recipients.map((r) => (
                    <div className="form-check" key={r._id}>
                      <input className="form-check-input" type="checkbox" id={`to-${r._id}`} checked={form.picked.includes(r._id)} onChange={() => pick(r._id)} />
                      <label className="form-check-label small" htmlFor={`to-${r._id}`}>{r.name} {r.username ? `(${r.username})` : ''} {r.block ? `· ${r.block}` : ''}</label>
                    </div>
                  ))}
                </div>
              )}
              {['meeting', 'training'].includes(form.kind) && (
                <div className="mt-2">
                  <label className="form-label small fw-semibold" htmlFor="msg-when">{t('meetingWhen')}</label>
                  <input id="msg-when" type="datetime-local" className="form-control form-control-sm" style={{ maxWidth: 260 }} value={form.meetingAt} onChange={(e) => setForm((f) => ({ ...f, meetingAt: e.target.value }))} />
                </div>
              )}
            </>
          )}
          <input className="form-control mt-2" required maxLength={150} placeholder={t('subject')} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <textarea className="form-control mt-2" rows={4} maxLength={3000} placeholder={t('messageBody')} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-sa-primary" disabled={busy}>{busy ? '…' : t('send')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setCompose(false)}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="d-flex gap-2 mb-3">
        {[['inbox', `${t('inbox')}${unread && tab === 'inbox' ? ` (${unread})` : ''}`], ['sent', t('sentBox')], ['alerts', t('alertsTab')]].map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setOpenId(null); }} className={`btn btn-sm ${tab === k ? 'btn-sa-primary' : 'btn-outline-secondary'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: palette.primary }}></div></div>
      ) : tab === 'alerts' ? (
        alerts.length === 0 ? <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div> : (
          <div className="d-flex flex-column gap-2">
            {alerts.map((n) => (
              <div key={n._id} className="card border-0 shadow-sm p-3 small" style={{ borderLeft: `4px solid ${n.type === 'health_alert' ? '#dc2626' : palette.primary}`, opacity: n.isRead ? 0.75 : 1 }}>
                <div>{n.message}</div>
                <div className="text-muted mt-1">{fmtDateTime(n.createdAt)}</div>
              </div>
            ))}
          </div>
        )
      ) : rows.length === 0 ? (
        <div className="card border-0 shadow-sm p-4 text-center text-muted">{t('noRecords')}</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {rows.map((m) => {
            const k = KIND_STYLE[m.kind] || KIND_STYLE.instruction;
            const open = openId === m._id;
            const canResolve = !m.resolvedAt && ['correction', 'query'].includes(m.kind);
            return (
              <div key={m._id} className="card border-0 shadow-sm" style={{ borderLeft: `4px solid ${k.color}` }}>
                <button type="button" className="btn text-start p-3 border-0" onClick={() => toggleOpen(m)} aria-expanded={open}>
                  <div className="d-flex justify-content-between gap-2 flex-wrap">
                    <div>
                      <span className={m.unread ? 'fw-bold' : 'fw-semibold'} style={{ color: palette.text }}>{k.icon} {m.subject}</span>
                      {m.unread && <span className="badge bg-danger ms-2">{t('newBadge')}</span>}
                      <div className="small" style={{ color: palette.muted }}>
                        {tab === 'sent'
                          ? `${t('toLabel')}: ${m.recipientCount > 1 ? `${m.recipientCount} ${t('people')}` : m.to[0]?.name || '—'} · ${t('readBy')} ${m.readCount}/${m.recipientCount}`
                          : `${t('fromLabel')}: ${m.from?.name || '—'}`}
                        {' · '}{fmtDateTime(m.createdAt)}{m.replies.length ? ` · 💬 ${m.replies.length}` : ''}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <Badge bg={k.bg} color={k.color}>{t(`kind_${m.kind}`)}</Badge>
                      {m.resolvedAt && <Badge bg="#d1fae5" color="#065f46">✓ {t('done')}</Badge>}
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="px-3 pb-3 small">
                    {m.meetingAt && <div className="mb-2 fw-semibold" style={{ color: '#92400e' }}>📅 {fmtDateTime(m.meetingAt)}</div>}
                    {m.related?.label && <div className="mb-2">🔗 {m.related.label}</div>}
                    {m.body && <div style={{ whiteSpace: 'pre-wrap', color: palette.text }}>{m.body}</div>}
                    {m.replies.length > 0 && (
                      <div className="mt-2 d-flex flex-column gap-1">
                        {m.replies.map((r) => (
                          <div key={r._id} className="p-2 rounded" style={{ background: String(r.by?._id) === String(user?.id || user?._id) ? '#ecfeff' : '#f8fafc' }}>
                            <span className="fw-semibold">{r.by?.name || '—'}</span> <span className="text-muted">{fmtDateTime(r.at)}</span>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{r.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      <input className="form-control form-control-sm" style={{ flex: '1 1 220px' }} maxLength={2000} placeholder={t('writeReply')} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      <button className="btn btn-sm btn-sa-primary" disabled={busy || !replyText.trim()} onClick={() => run(() => messageAPI.reply(m._id, replyText.trim())).then((ok) => ok && setReplyText(''))}>{t('send')}</button>
                      {canResolve && <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={() => run(() => messageAPI.resolve(m._id, replyText.trim()))}>✓ {t('markDone')}</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </RoleShell>
  );
}
