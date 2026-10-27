const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLogger');

const INBOX_LINK = { asha: '/asha/messages', admin: '/admin/messages', parent: '/parent/messages' };
const idStr = (v) => String(v?._id || v);

async function notify(userIds, message) {
  const users = await User.find({ _id: { $in: userIds } }).select('_id role').lean();
  if (users.length) await Notification.insertMany(users.map((u) => ({ userId: u._id, message, type: 'system', link: INBOX_LINK[u.role] })));
}

// Users the sender may message: an ASHA or parent → the admins; an admin → anyone active
async function allowedRecipients(user) {
  if (['asha', 'parent'].includes(user.role)) return (await User.find({ role: 'admin', isActive: true }).select('_id').lean()).map((u) => idStr(u._id));
  return null; // admin: no restriction
}

// POST /api/messages  { to: [userId] | 'all', kind, subject, body, meetingAt, related: { kind, id, label } }
const sendMessage = async (req, res) => {
  try {
    const { subject, body, meetingAt, related } = req.body;
    if (!subject || !String(subject).trim()) return res.status(400).json({ message: 'Subject is required' });
    let kind = Message.KINDS.includes(req.body.kind) ? req.body.kind : 'instruction';
    const allowed = await allowedRecipients(req.user);
    let to;
    if (req.body.support && req.user.role !== 'admin') {
      kind = 'query'; // "Report a problem" from Settings: technical support = the admins
      to = (await User.find({ role: 'admin', isActive: true }).select('_id').lean()).map((u) => idStr(u._id));
    } else if (['asha', 'parent'].includes(req.user.role)) {
      kind = 'query'; // an ASHA or a parent writes to the admins
      to = allowed;
    } else if (req.body.to === 'all') {
      // admin: "all" = every active ASHA worker
      to = allowed || (await User.find({ role: 'asha', isActive: true }).select('_id').lean()).map((u) => idStr(u._id));
    } else {
      const wanted = [...new Set((Array.isArray(req.body.to) ? req.body.to : [req.body.to]).filter((v) => mongoose.isValidObjectId(v)).map(String))];
      to = allowed ? wanted.filter((id) => allowed.includes(id)) : wanted;
      if (to.length !== wanted.length) return res.status(403).json({ message: 'You can only message the people listed' });
    }
    if (!to?.length) return res.status(400).json({ message: ['asha', 'parent'].includes(req.user.role) ? 'No one is available to receive this right now' : 'Choose at least one recipient' });
    if (related && related.id && !mongoose.isValidObjectId(related.id)) return res.status(400).json({ message: 'Invalid related record' });

    const message = await Message.create({
      from: req.user._id,
      to,
      kind,
      subject,
      body,
      meetingAt: meetingAt ? new Date(meetingAt) : undefined,
      related: related?.id ? related : undefined,
      readBy: [req.user._id],
    });
    await notify(to, `✉️ ${req.user.name}: ${String(subject).slice(0, 80)}`);
    await createAuditLog({ req, action: 'MESSAGE_SENT', entityType: 'Message', entityId: message._id, details: `${req.user.name} sent a ${kind} to ${to.length} user(s)` });
    res.status(201).json(message);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// In a message sent to many ASHAs, each ASHA sees only her own replies and the sender's
const forViewer = (m, me) => {
  const sender = idStr(m.from);
  const isSender = sender === me;
  return {
    ...m,
    to: isSender ? m.to : m.to.filter((u) => idStr(u) === me),
    recipientCount: m.to.length,
    replies: isSender || m.to.length === 1 ? m.replies : m.replies.filter((r) => [me, sender].includes(idStr(r.by))),
    unread: !m.readBy.some((u) => idStr(u) === me),
    readCount: isSender ? m.readBy.filter((u) => idStr(u) !== sender).length : undefined,
  };
};

// GET /api/messages?box=inbox|sent
const listMessages = async (req, res) => {
  try {
    const me = idStr(req.user._id);
    const filter = req.query.box === 'sent' ? { from: req.user._id } : { to: req.user._id };
    const rows = await Message.find(filter).sort({ updatedAt: -1 }).limit(200)
      .populate('from', 'name role').populate('to', 'name role username').populate('replies.by', 'name role').lean();
    res.json(rows.map((m) => forViewer(m, me)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/unread-count
const unreadCount = async (req, res) => {
  try {
    res.json({ count: await Message.countDocuments({ to: req.user._id, readBy: { $ne: req.user._id } }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Only the sender and the recipients may open a thread
async function findThread(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Invalid message' }); return null; }
  const m = await Message.findOne({ _id: req.params.id, $or: [{ from: req.user._id }, { to: req.user._id }] });
  if (!m) res.status(404).json({ message: 'Message not found' });
  return m;
}

// POST /api/messages/:id/reply { text }
const reply = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Reply is empty' });
    const m = await findThread(req, res);
    if (!m) return undefined;
    const me = idStr(req.user._id);
    const isSender = idStr(m.from) === me;
    // ASHA replying → the sender. Sender replying → the ASHAs who have written back (or the only recipient).
    const repliers = new Set(m.replies.map((r) => idStr(r.by)).filter((id) => id !== me));
    const targets = isSender ? m.to.map(idStr).filter((id) => m.to.length === 1 || repliers.has(id)) : [idStr(m.from)];
    m.replies.push({ by: req.user._id, text });
    // Unread again only for the people who will see this reply
    m.readBy = [...m.readBy.filter((u) => !targets.includes(idStr(u)) && idStr(u) !== me), req.user._id];
    await m.save();
    await notify(targets, `💬 ${req.user.name} replied: ${m.subject.slice(0, 60)}`);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// POST /api/messages/:id/read
const markRead = async (req, res) => {
  try {
    const m = await findThread(req, res);
    if (!m) return undefined;
    await Message.updateOne({ _id: m._id }, { $addToSet: { readBy: req.user._id } }, { timestamps: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/:id/resolve — correction done / question answered
const resolve = async (req, res) => {
  try {
    const m = await findThread(req, res);
    if (!m) return undefined;
    m.resolvedAt = new Date();
    m.replies.push({ by: req.user._id, text: String(req.body.note || '').trim() || '✓ Marked as done' });
    await m.save();
    if (idStr(m.from) !== idStr(req.user._id)) await notify([m.from], `✅ ${req.user.name} completed: ${m.subject.slice(0, 60)}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/recipients — who the current user can write to
const recipients = async (req, res) => {
  try {
    const allowed = await allowedRecipients(req.user);
    const users = await User.find(allowed ? { _id: { $in: allowed } } : { isActive: true, role: 'asha' })
      .select('name role username block district').sort({ name: 1 }).limit(1000).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, listMessages, unreadCount, reply, markRead, resolve, recipients };
