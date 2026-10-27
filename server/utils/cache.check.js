// node utils/cache.check.js
const assert = require('assert');
const { cached, invalidate } = require('./cache');

(async () => {
  let calls = 0;
  const load = async () => ++calls;
  assert.deepStrictEqual(await Promise.all([cached('a', 1000, load), cached('a', 1000, load)]), [1, 1]); // one load shared
  assert.strictEqual(await cached('a', 1000, load), 1);   // served from cache
  invalidate('a');
  assert.strictEqual(await cached('a', 1000, load), 2);   // reloaded after invalidate
  assert.strictEqual(await cached('b', -1, load), 3);
  assert.strictEqual(await cached('b', -1, load), 4);     // expired → reloaded
  await assert.rejects(cached('c', 1000, async () => { throw new Error('db down'); }));
  assert.strictEqual(await cached('c', 1000, load), 5);   // failure not cached
  console.log('cache ok');
})();
