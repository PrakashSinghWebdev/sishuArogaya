const crypto = require('crypto');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');

// Username = ASHA ID, e.g. ASHA-482913
const generateAshaId = () => `ASHA-${crypto.randomInt(100000, 1000000)}`;
const STANDARD_ASHA_ID = /^ASHA-\d{6}$/i;

const isTaken = async (id) => (await User.exists({ username: id })) || (await AshaWorker.exists({ ashaId: id }));

const uniqueAshaId = async () => {
  let id = generateAshaId();
  while (await isTaken(id)) id = generateAshaId();
  return id;
};

// Login username for an existing/self-registered ASHA: reuse a standard ASHA ID, otherwise mint a fresh one
const ashaUsernameFor = async (ashaId) => {
  const id = String(ashaId || '').trim().toUpperCase();
  if (STANDARD_ASHA_ID.test(id) && !(await User.exists({ username: id }))) return id;
  return uniqueAshaId();
};

// One-time password for an admin-created account: 12 random URL-safe characters. The user must replace
// it at first login (User.mustChangePassword). The old name+DOB scheme was guessable by anyone who knew both.
const randomPassword = () => crypto.randomBytes(9).toString('base64url');

module.exports = { generateAshaId, uniqueAshaId, ashaUsernameFor, randomPassword };

if (require.main === module) {
  const assert = require('assert');
  assert.match(randomPassword(), /^[A-Za-z0-9_-]{12}$/);
  assert.notStrictEqual(randomPassword(), randomPassword());
  assert.match(generateAshaId(), /^ASHA-\d{6}$/);
  assert.strictEqual(require('./messaging').toE164('98765 43210'), '+919876543210');
  console.log('ashaCredentials ok');
}
