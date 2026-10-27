const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Served over HTTPS in production (TLS in Node or at a proxy, see server.js) or when a certificate is configured
const HTTPS = process.env.NODE_ENV === 'production' || Boolean(process.env.SSL_CERT_FILE);

// __Host- prefix: the browser only accepts this cookie if it is Secure, has no Domain and Path=/,
// so it can't be planted over plain HTTP or from a subdomain. Local HTTP dev keeps a plain name.
const COOKIE_NAME = HTTPS ? '__Host-sa_session' : 'sa_session';

// httpOnly: page JS (and so any XSS) can't read the token.
// secure: only ever sent over HTTPS. SameSite=Strict: other sites can't ride the session (CSRF).
const cookieOptions = {
  httpOnly: true,
  secure: HTTPS,
  sameSite: 'strict',
  path: HTTPS ? '/' : '/api', // __Host- requires Path=/
};

const readCookie = (req, name) => {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const PASSWORD_CHANGE_ROUTES = new Set(['GET /api/auth/me', 'PUT /api/auth/change-password', 'POST /api/auth/logout']);

const protect = async (req, res, next) => {
  const token = readCookie(req, COOKIE_NAME);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no session' });
  }

  // Plain HTML forms can't set custom headers, so this blocks cross-site form posts
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return res.status(403).json({ message: 'Missing request header' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }

  try {
    req.user = await User.findById(decoded.id).select('-password -otp +sessionVersion');
  } catch (err) {
    // A database hiccup is not a bad session: a 401 here would log users out under heavy load
    return res.status(503).json({ message: 'Server is busy, please try again in a moment' });
  }

  // the role check also locks out old supervisor accounts left in the database
  if (!req.user || !req.user.isActive || !User.schema.path('role').enumValues.includes(req.user.role)) {
    return res.status(401).json({ message: 'User not found or deactivated' });
  }

  // Logout or a password change bumps sessionVersion, killing every older token
  if (decoded.v !== req.user.sessionVersion) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }

  // One-time (admin-issued) password: nothing else works until the user sets their own
  if (req.user.mustChangePassword && !PASSWORD_CHANGE_ROUTES.has(`${req.method} ${req.baseUrl}${req.path}`)) {
    return res.status(403).json({ message: 'Please set a new password first', code: 'PASSWORD_CHANGE_REQUIRED' });
  }

  next();
};

module.exports = { protect, COOKIE_NAME, cookieOptions };
