const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const cluster = require('node:cluster');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

// HTTPS: either Node terminates TLS itself (SSL_KEY_FILE + SSL_CERT_FILE, see the bottom of this file), or a
// proxy / cloud load balancer does and forwards X-Forwarded-Proto. Then set TRUST_PROXY to the number of
// proxy hops (usually 1) so req.secure and req.ip (used by the rate limiter) reflect the real client.
// Never set it without a proxy in front: clients could then fake their IP.
const TRUST_PROXY = process.env.TRUST_PROXY;
if (TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);
const PUBLIC_HOST = process.env.PUBLIC_HOST; // e.g. sishuarogaya.in, used in redirects instead of the Host header

// Behind a TLS proxy: send plain-HTTP visitors to HTTPS (health checks stay on HTTP for the load balancer)
if (TRUST_PROXY && process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.path === '/api/health') return next();
    res.redirect(308, `https://${PUBLIC_HOST || req.hostname}${req.originalUrl}`);
  });
}

// Load shedding: past this many in-flight API requests a worker answers 503 at once, instead of queueing
// everyone into 10–30 s waits (seen at 10,000 users). First in the chain and a bare response, so turning
// a request away costs as little as possible. Tune MAX_INFLIGHT_PER_WORKER to the hardware.
const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT_PER_WORKER) || 256;
let inflight = 0;
app.use('/api/', (req, res, next) => {
  if (req.path === '/health') return next();
  if (req.socket.destroyed) return undefined; // client already left while this sat in the queue
  if (inflight >= MAX_INFLIGHT) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '2' });
    return res.end('{"message":"Server is busy, please try again in a moment"}');
  }
  inflight += 1;
  let counted = true;
  const release = () => { if (counted) { counted = false; inflight -= 1; } };
  res.on('finish', release);
  res.on('close', release);
  next();
});

// Security middleware
// CSP lists exactly what the web app loads (it is served from here in production, see below)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'], // map tiles from several hosts, Unsplash photos
      connectSrc: ["'self'", 'https://nominatim.openstreetmap.org', 'https://overpass-api.de', 'https://maps.mail.ru', 'https://router.project-osrm.org'],
      frameSrc: ['https://www.youtube.com'],
    },
  },
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5175', credentials: true, exposedHeaders: ['X-Total-Count', 'X-Due-Count', 'X-Missed-Count'] }));

// Rate limiting — the SPA fires several calls per page, so keep the global cap generous
// and put a strict cap on credential/OTP endpoints (brute-force protection).
// Under cluster.js each worker counts on its own and requests are dealt round-robin, so split the caps.
// ponytail: approximate per-IP totals; use a shared store (rate-limit-redis) when running on several machines.
const WORKERS = cluster.isWorker ? Number(process.env.CLUSTER_WORKERS) || 1 : 1;
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: Math.ceil(1000 / WORKERS) }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Math.ceil(20 / WORKERS), message: { message: 'Too many attempts. Please try again in 15 minutes.' } });
app.use(['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password'], authLimiter);

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/child', require('./routes/child'));
app.use('/api/growth', require('./routes/growth'));
app.use('/api/vaccination', require('./routes/vaccination'));
app.use('/api/asha', require('./routes/asha'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/schemes', require('./routes/schemes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/diet',      require('./routes/diet'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/maternal',  require('./routes/maternal'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/camps',     require('./routes/camps'));
app.use('/api/incentives', require('./routes/incentives'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', project: 'Sishu Arogaya' }));

// Production: serve the built web app (client/dist) from these same workers, so pages scale across
// every core with cluster.js and share the API's origin. Hashed /assets files never change → cache 1 year.
// ponytail: in-process static serving; a CDN in front would add edge caching close to rural users.
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  // Gzip each JS/CSS/SVG asset once at startup, so serving compressed files costs no CPU per request
  const ASSETS = path.join(CLIENT_DIST, 'assets');
  const gzipped = new Map();
  for (const name of fs.readdirSync(ASSETS)) {
    if (/\.(js|css|svg)$/.test(name)) gzipped.set(`/assets/${name}`, zlib.gzipSync(fs.readFileSync(path.join(ASSETS, name)), { level: 9 }));
  }
  app.get('/assets/*', (req, res, next) => {
    const body = gzipped.get(req.path);
    if (!body || !req.acceptsEncodings('gzip')) return next();
    res.set({ 'Content-Encoding': 'gzip', 'Cache-Control': 'public, max-age=31536000, immutable', Vary: 'Accept-Encoding' });
    res.type(path.extname(req.path)).send(body);
  });
  app.use(express.static(CLIENT_DIST, {
    index: false,
    setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  const indexHtml = fs.readFileSync(path.join(CLIENT_DIST, 'index.html'));
  // Any non-API GET is a client-side route (/login, /parent/...): send the SPA shell
  app.get(/^(?!\/api(\/|$)).*/, (req, res) => res.type('html').set('Cache-Control', 'no-cache').send(indexHtml));
}

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const label = cluster.isWorker ? ` (worker ${process.pid})` : '';
const { SSL_KEY_FILE, SSL_CERT_FILE, HTTP_PORT } = process.env;
if (SSL_KEY_FILE && SSL_CERT_FILE) {
  // ponytail: certificates are read once at start; restart after renewing them (e.g. Let's Encrypt every ~60 days)
  https.createServer({ key: fs.readFileSync(SSL_KEY_FILE), cert: fs.readFileSync(SSL_CERT_FILE) }, app)
    .listen(PORT, () => console.log(`Sishu Arogaya server running on https port ${PORT}${label}`));
  // Optional plain-HTTP port that only redirects to HTTPS
  if (HTTP_PORT) {
    const httpsPort = Number(PORT) === 443 ? '' : `:${PORT}`;
    http.createServer((req, res) => {
      const host = PUBLIC_HOST || String(req.headers.host || 'localhost').replace(/:\d+$/, '');
      res.writeHead(308, { Location: `https://${host}${httpsPort}${req.url}` });
      res.end();
    }).listen(HTTP_PORT, () => console.log(`HTTP → HTTPS redirect on port ${HTTP_PORT}${label}`));
  }
} else {
  // Production login cookies are HTTPS-only, so plain HTTP here only works behind a TLS proxy
  if (process.env.NODE_ENV === 'production' && !TRUST_PROXY && (cluster.worker?.id ?? 1) === 1) { // warn once, not per worker
    console.warn('WARNING: production without HTTPS. Set SSL_KEY_FILE/SSL_CERT_FILE, or TRUST_PROXY behind a TLS proxy; browsers will not keep the Secure login cookie over plain HTTP.');
  }
  app.listen(PORT, () => console.log(`Sishu Arogaya server running on port ${PORT}${label}`));
}

// The primary disconnects a worker once its in-flight requests are done (or the primary died): exit,
// since the open MongoDB connection would otherwise keep an orphaned worker alive
if (cluster.isWorker) process.on('disconnect', () => process.exit(0));

// Under cluster.js the primary owns WhatsApp
if (!cluster.isWorker) require('./utils/messaging').startWhatsApp();

