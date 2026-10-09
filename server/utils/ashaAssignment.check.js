// Run against a THROWAWAY database (it deletes everything in it):
//   TEST_MONGO_URI=mongodb://127.0.0.1:27999/asha_check node utils/ashaAssignment.check.js
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const AshaWorker = require('../models/AshaWorker');
const Child = require('../models/Child');
const User = require('../models/User');
const { findAshaForArea, claimUnassignedInArea } = require('./ashaAssignment');

const uri = process.env.TEST_MONGO_URI;
if (!uri || !/check|test/i.test(uri)) {
  console.error('Refusing to run: set TEST_MONGO_URI to a throwaway database whose name contains "test" or "check".');
  process.exit(1);
}

(async () => {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();

  const user = (name) => User.create({ name, email: `${name}@x.in`, password: 'secret123', role: 'asha', phone: '9' + String(Math.random()).slice(2, 11) });
  const asha = async (name, area) => AshaWorker.create({ userId: (await user(name))._id, ashaId: name, ...area });

  const north = await asha('north', { state: 'Uttarakhand', district: 'Dehradun', block: 'Raipur' });
  const south = await asha('south', { state: 'Uttarakhand', district: 'Dehradun', block: 'Sahaspur' });
  await asha('elsewhere', { state: 'Bihar', district: 'Aurangabad', block: 'Raipur' }); // same block name, other district

  // same block → that block's ASHA; block text is matched case/space-insensitively
  assert.equal(String((await findAshaForArea({ state: 'Uttarakhand', district: 'Dehradun', block: '  raipur ' }))._id), String(north._id));
  assert.equal(String((await findAshaForArea({ state: 'Uttarakhand', district: 'Dehradun', block: 'Sahaspur' }))._id), String(south._id));
  // no ASHA in that block → nobody, even though the district has ASHAs (old code fell back to the district)
  assert.equal(await findAshaForArea({ state: 'Uttarakhand', district: 'Dehradun', block: 'Doiwala' }), null);
  // missing block → nobody
  assert.equal(await findAshaForArea({ state: 'Uttarakhand', district: 'Dehradun' }), null);

  // several ASHAs in one block → lightest workload
  const north2 = await asha('north2', { state: 'Uttarakhand', district: 'Dehradun', block: 'Raipur' });
  await AshaWorker.updateOne({ _id: north._id }, { assignedChildren: [new mongoose.Types.ObjectId()] });
  assert.equal(String((await findAshaForArea({ state: 'Uttarakhand', district: 'Dehradun', block: 'Raipur' }))._id), String(north2._id));

  // claiming the backlog only takes unassigned children from the ASHA's own block
  const dob = new Date('2026-01-01');
  const mine = await Child.create({ name: 'mine', dob, gender: 'male', state: 'Uttarakhand', district: 'Dehradun', block: 'Sahaspur' });
  const other = await Child.create({ name: 'other', dob, gender: 'male', state: 'Uttarakhand', district: 'Dehradun', block: 'Doiwala' });
  assert.equal(await claimUnassignedInArea(south), 1);
  assert.equal(String((await Child.findById(mine._id)).ashaId), String(south._id));
  assert.equal((await Child.findById(other._id)).ashaId, undefined);

  console.log('ashaAssignment ok');
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
})().catch(async (err) => { console.error(err); await mongoose.disconnect(); process.exit(1); });
