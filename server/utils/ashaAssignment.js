// Links children to the ASHA worker responsible for their area: same state + district + block,
// as entered by the parent/ASHA at registration. No cross-block fallback — an unmatched child
// waits until an ASHA for that block registers (claimUnassignedInArea) or an admin assigns one.
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const User = require('../models/User');
const escapeRegex = require('./escapeRegex');

const same = (value) => new RegExp(`^\\s*${escapeRegex(String(value).trim())}\\s*$`, 'i');
// Districts repeat across states (e.g. Aurangabad), so match state too when both sides know it
const stateClause = (state) => (state ? { $or: [{ state: same(state) }, { state: { $in: [null, ''] } }] } : {});

// Pick the ASHA for a new child: same block (+district, +state); among several, the lightest workload.
async function findAshaForArea({ state, district, block }) {
  if (!district || !block) return null;
  const candidates = await AshaWorker.find({ isActive: true, district: same(district), block: same(block), ...stateClause(state) })
    .select('_id assignedChildren')
    .lean();
  return candidates.sort((a, b) => (a.assignedChildren?.length || 0) - (b.assignedChildren?.length || 0))[0] || null;
}

async function assignChild(child, asha) {
  await Child.updateOne({ _id: child._id }, { ashaId: asha._id });
  await AshaWorker.updateOne({ _id: asha._id }, { $addToSet: { assignedChildren: child._id } });
}

// Give this ASHA every still-unassigned child in their block, including older children that
// have no location of their own but whose parent registered in the block.
// ponytail: first ASHA in a block to open the dashboard takes the backlog; admins can rebalance via /asha/assign.
async function claimUnassignedInArea(asha) {
  if (!asha?.district || !asha?.block) return 0;
  const area = { district: same(asha.district), block: same(asha.block), ...stateClause(asha.state) };
  const parentIds = await User.find({ role: 'parent', ...area }).distinct('_id');
  const children = await Child.find({
    ashaId: { $in: [null, undefined] },
    $or: [area, { district: { $in: [null, ''] }, parentId: { $in: parentIds } }],
  }).select('_id district state');
  if (!children.length) return 0;

  const ids = children.map((c) => c._id);
  await Child.updateMany({ _id: { $in: ids } }, { ashaId: asha._id });
  await Child.updateMany({ _id: { $in: ids }, district: { $in: [null, ''] } }, { district: asha.district, block: asha.block, state: asha.state });
  await AshaWorker.updateOne({ _id: asha._id }, { $addToSet: { assignedChildren: { $each: ids } } });
  return ids.length;
}

module.exports = { findAshaForArea, assignChild, claimUnassignedInArea };
