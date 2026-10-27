// Concurrency gate for slow work (password hashing, LLM calls): run a few at a time, keep a short
// queue, and reject the rest at once with a 503 "busy" error instead of letting a burst pile up.
// Without it, the 10,000-user load test queued thousands of bcrypt hashes and froze the API for minutes.
const busy = () => Object.assign(new Error('Server is busy, please try again in a moment'), { status: 503 });

function createGate({ maxRunning, maxWaiting }) {
  let running = 0;
  const waiting = [];

  function pump() {
    while (running < maxRunning && waiting.length) {
      const job = waiting.shift();
      if (job.isCancelled()) { job.reject(busy()); continue; } // client already gave up: skip the work
      running += 1;
      Promise.resolve()
        .then(job.task)
        .then(job.resolve, job.reject)
        .finally(() => { running -= 1; pump(); });
    }
  }

  // `isCancelled` is checked when the job's turn comes, e.g. () => req.socket.destroyed
  return function gated(task, isCancelled = () => false) {
    if (waiting.length >= maxWaiting) return Promise.reject(busy());
    return new Promise((resolve, reject) => {
      waiting.push({ task, isCancelled, resolve, reject });
      pump();
    });
  };
}

module.exports = { createGate };
