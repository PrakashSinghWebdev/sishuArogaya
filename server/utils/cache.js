// Small in-process TTL cache for read-heavy, rarely-changing data.
// Under cluster.js each worker has its own copy; invalidations are broadcast to all of them.
// ponytail: per-process memory; switch to Redis if the API runs on more than one machine.
const cluster = require('node:cluster');

const store = new Map(); // key -> { expires, value: Promise }

// Returns the cached value for `key`, or runs `load()` once and keeps its result for `ttlMs`.
// Concurrent callers share one in-flight load; failed loads are not cached.
function cached(key, ttlMs, load) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = Promise.resolve().then(load);
  store.set(key, { expires: Date.now() + ttlMs, value });
  value.catch(() => store.get(key)?.value === value && store.delete(key));
  return value;
}

function dropLocal(prefix) {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}

// Drop every key starting with `prefix` (call after a write that changes cached data)
function invalidate(prefix) {
  dropLocal(prefix);
  if (cluster.isWorker) process.send({ type: 'cache:invalidate', prefix }); // primary relays to all workers
}

if (cluster.isWorker) process.on('message', (msg) => msg?.type === 'cache:invalidate' && dropLocal(msg.prefix));

module.exports = { cached, invalidate };
