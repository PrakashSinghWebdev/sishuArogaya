const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'sa_session';

// httpOnly: page JS (and so any XSS) can't read the token.
// SameSite=Strict: other sites can't ride the session (CSRF).
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api',
};

const readCookie = (req, name) => {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const protect = async (req, res, next) => {
  const token = readCookie(req, COOKIE_NAME);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no session' });
  }

  // Plain HTML forms can't set custom headers, so this blocks cross-site form posts
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return res.status(403).json({ message: 'Missing request header' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = await User.findById(decoded.id).select('-password -otp +sessionVersion');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    // Logout or a password change bumps sessionVersion, killing every older token
    if (decoded.v !== req.user.sessionVersion) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect, COOKIE_NAME, cookieOptions };
