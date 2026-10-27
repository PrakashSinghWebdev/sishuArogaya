// node utils/gate.check.js
const assert = require('assert');
const { createGate } = require('./gate');

(async () => {
  const MAX_RUNNING = 1, MAX_WAITING = 10;
  const gated = createGate({ maxRunning: MAX_RUNNING, maxWaiting: MAX_WAITING });
  let live = 0, peak = 0;
  const task = () => new Promise((r) => { live++; peak = Math.max(peak, live); setTimeout(() => { live--; r('ok'); }, 20); });
  const results = await Promise.allSettled(Array.from({ length: MAX_RUNNING + MAX_WAITING + 10 }, () => gated(task)));
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const shed = results.filter((r) => r.status === 'rejected' && r.reason.status === 503).length;
  assert.strictEqual(peak, MAX_RUNNING);                 // never more than MAX_RUNNING at once
  assert.strictEqual(ok, MAX_RUNNING + MAX_WAITING);     // queue filled exactly
  assert.strictEqual(shed, 10);                          // overflow shed with 503
  assert.strictEqual(await gated(task), 'ok');           // recovers once drained
  await assert.rejects(gated(() => { throw new Error('boom'); }), /boom/); // task errors pass through
  assert.strictEqual(await gated(task), 'ok');           // and don't leak a slot
  let ran = false;
  const first = gated(task);
  await assert.rejects(gated(() => { ran = true; }, () => true), (e) => e.status === 503); // cancelled while queued
  await first;
  assert.strictEqual(ran, false);                        // ...and never ran
  console.log('gate ok');
})();
