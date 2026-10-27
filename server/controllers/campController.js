const mongoose = require('mongoose');
const HealthCamp = require('../models/HealthCamp');
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLogger');
const { same } = require('../utils/ashaAssignment');

const KINDS = ['immunisation', 'health', 'nutrition', 'awareness', 'other'];

// Area the caller works in: an ASHA her block; an admin everywhere
async function scopeOf(user) {
  if (user.role === 'asha') {
    const asha = await AshaWorker.findOne({ userId: user._id }).select('_id district block').lean();
    return asha ? { asha, district: asha.district, blocks: [asha.block] } : null;
  }
  return { all: true };
}
const areaFilter = (scope) => (scope.all ? {} : { district: same(scope.district), block: { $in: scope.blocks.map(same) } });

// GET /api/camps?when=upcoming|past — camps in the caller's area
const listCamps = async (req, res) => {
  try {
    const scope = await scopeOf(req.user);
    if (!scope) return res.status(404).json({ message: 'ASHA profile not found' });
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const past = req.query.when === 'past';
    const camps = await HealthCamp.find({ ...areaFilter(scope), date: past ? { $lt: startOfToday } : { $gte: startOfToday } })
      .sort({ date: past ? -1 : 1 }).limit(200).populate('createdBy', 'name role').lean();
    res.json(camps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tell the parents of children in the ASHA's caseload (in that village, if one is set)
async function notifyParents(camp, ashaIds) {
  const filter = { ashaId: { $in: ashaIds }, parentId: { $ne: null } };
  if (camp.village) filter.village = same(camp.village);
  const parentIds = await Child.distinct('parentId', filter);
  if (!parentIds.length) return 0;
  const when = camp.date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  await Notification.insertMany(parentIds.map((userId) => ({
    userId,
    message: `📅 ${camp.title} on ${when}${camp.venue ? ` at ${camp.venue}` : ''}. Please bring your child and the MCP card.`,
    type: 'vaccine_reminder',
    link: '/parent/vaccination',
  })));
  return parentIds.length;
}

// POST /api/camps
const createCamp = async (req, res) => {
  try {
    const scope = await scopeOf(req.user);
    if (!scope || scope.all) return res.status(403).json({ message: 'Only ASHA workers schedule camps' });
    const { title, date, venue, village, notes, notify } = req.body;
    const block = scope.asha ? scope.asha.block : String(req.body.block || scope.blocks[0] || '');
    if (!scope.blocks.some((b) => same(b).test(block))) return res.status(403).json({ message: 'Choose one of your blocks' });
    const when = new Date(date);
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Title is required' });
    if (!date || Number.isNaN(when.getTime())) return res.status(400).json({ message: 'Date and time are required' });
    if (when < new Date(Date.now() - 864e5)) return res.status(400).json({ message: 'Camp date is in the past' });
    const camp = await HealthCamp.create({
      createdBy: req.user._id,
      ashaId: scope.asha?._id,
      district: scope.district,
      block,
      kind: KINDS.includes(req.body.kind) ? req.body.kind : 'immunisation',
      title, date: when, venue, village, notes,
    });
    if (notify) {
      const ashaIds = scope.asha ? [scope.asha._id] : (await AshaWorker.find({ district: same(scope.district), block: same(block) }).select('_id').lean()).map((a) => a._id);
      camp.notifiedParents = await notifyParents(camp, ashaIds);
      await camp.save();
    }
    await createAuditLog({ req, action: 'CAMP_SCHEDULED', entityType: 'HealthCamp', entityId: camp._id, details: `${req.user.name} scheduled ${camp.title} on ${when.toISOString().slice(0, 10)}`, metadata: { notified: camp.notifiedParents } });
    res.status(201).json(camp);
  } catch (err) {
    res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
  }
};

// PATCH /api/camps/:id { status: 'completed' | 'cancelled' } — the creator, or an admin
const updateCamp = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid camp' });
    const scope = await scopeOf(req.user);
    if (!scope) return res.status(404).json({ message: 'ASHA profile not found' });
    const camp = await HealthCamp.findOne({ _id: req.params.id, ...areaFilter(scope) });
    if (!camp) return res.status(404).json({ message: 'Camp not found' });
    if (req.user.role === 'asha' && String(camp.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'Only the person who scheduled this camp can change it' });
    if (!['completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
    camp.status = req.body.status;
    await camp.save();
    res.json(camp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { listCamps, createCamp, updateCamp, scopeOf, areaFilter };
