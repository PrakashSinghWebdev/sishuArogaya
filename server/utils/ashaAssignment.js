// Links children to the ASHA worker responsible for their area (state + district, block preferred).
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const User = require('../models/User');
const escapeRegex = require('./escapeRegex');

const same = (value) => new RegExp(`^\\s*${escapeRegex(String(value).trim())}\\s*$`, 'i');
// Districts repeat across states (e.g. Aurangabad), so match state too when both sides know it
const stateClause = (state) => (state ? { $or: [{ state: same(state) }, { state: { $in: [null, ''] } }] } : {});

// Pick the ASHA for a new child: same district (+state), same block first, then the lightest workload.
async function findAshaForArea({ state, district, block }) {
  if (!district) return null;
  const candidates = await AshaWorker.find({ isActive: true, district: same(district), ...stateClause(state) })
    .select('_id block assignedChildren')
    .lean();
  if (!candidates.length) return null;
  const blockMatch = block ? candidates.filter((a) => a.block && same(block).test(a.block)) : [];
  const pool = blockMatch.length ? blockMatch : candidates;
  return pool.sort((a, b) => (a.assignedChildren?.length || 0) - (b.assignedChildren?.length || 0))[0];
}

async function assignChild(child, asha) {
  await Child.updateOne({ _id: child._id }, { ashaId: asha._id });
  await AshaWorker.updateOne({ _id: asha._id }, { $addToSet: { assignedChildren: child._id } });
}

// Give this ASHA every still-unassigned child in their district, including older children that
// have no location of their own but whose parent registered in the district.
// ponytail: first ASHA in a district to open the dashboard takes the backlog; admins can rebalance via /asha/assign.
async function claimUnassignedInArea(asha) {
  if (!asha?.district) return 0;
  const area = { district: same(asha.district), ...stateClause(asha.state) };
  const parentIds = await User.find({ role: 'parent', ...area }).distinct('_id');
  const children = await Child.find({
    ashaId: { $in: [null, undefined] },
    $or: [area, { district: { $in: [null, ''] }, parentId: { $in: parentIds } }],
  }).select('_id district state');
  if (!children.length) return 0;

  const ids = children.map((c) => c._id);
  await Child.updateMany({ _id: { $in: ids } }, { ashaId: asha._id });
  await Child.updateMany({ _id: { $in: ids }, district: { $in: [null, ''] } }, { district: asha.district, state: asha.state });
  await AshaWorker.updateOne({ _id: asha._id }, { $addToSet: { assignedChildren: { $each: ids } } });
  return ids.length;
}

module.exports = { findAshaForArea, assignChild, claimUnassignedInArea };
