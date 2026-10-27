// Load balancer: runs one API worker per CPU core on the same port. The primary process hands
// incoming connections to the workers round-robin and restarts any worker that crashes.
// ponytail: spreads load over one machine's cores; for several machines put nginx/a cloud LB in front.
const cluster = require('node:cluster');
const os = require('node:os');
require('dotenv').config();

const WORKERS = Number(process.env.WEB_CONCURRENCY) || os.availableParallelism();

if (cluster.isPrimary) {
  cluster.schedulingPolicy = cluster.SCHED_RR; // round-robin (Node's default except on Windows)
  const fork = () => cluster.fork({ CLUSTER_WORKERS: WORKERS });
  console.log(`Load balancer: starting ${WORKERS} workers`);
  for (let i = 0; i < WORKERS; i++) fork();

  let shuttingDown = false;
  cluster.on('exit', (worker, code, signal) => {
    if (shuttingDown) return;
    console.warn(`Worker ${worker.process.pid} died (${signal || code}), restarting`);
    setTimeout(fork, 1000); // pause so a worker that dies on boot doesn't spin the CPU
  });

  // A cache write in one worker must clear that key in every worker
  cluster.on('message', (_worker, msg) => {
    if (msg?.type === 'cache:invalidate') Object.values(cluster.workers).forEach((w) => w.send(msg));
  });

  // WhatsApp can only be logged in once, so it lives here and workers send through it
  require('./utils/messaging').serveWhatsAppToWorkers();

  const stop = () => {
    shuttingDown = true;
    Object.values(cluster.workers).forEach((w) => w.disconnect()); // finish in-flight requests
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
} else {
  require('./server');
}
