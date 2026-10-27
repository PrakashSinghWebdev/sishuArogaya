const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { createAuditLog } = require('../utils/auditLogger');
const { generateOTP, getOTPExpiry, sendOTPEmail } = require('../utils/otp');

const MIN_PASSWORD_LENGTH = 8;
const isValidPassword = (pw) => typeof pw === 'string' && pw.length >= MIN_PASSWORD_LENGTH;
const PASSWORD_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

const { COOKIE_NAME, cookieOptions } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign({ id: user._id, v: user.sessionVersion || 0 }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      mobile,
      dob,
      password,
      role,
      state,
      district,
      block,
    } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = String(phone || mobile || '').trim();
    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();

    if (!fullName || !normalizedEmail || !normalizedPhone || !password || !role) {
      return res.status(400).json({ message: 'Name, email, phone, password, and role are required' });
    }

    if (!isValidPassword(password)) return res.status(400).json({ message: PASSWORD_ERROR });

    // ASHA and admin accounts are created by an admin, never self-registered
    if (role !== 'parent') {
      return res.status(400).json({ message: 'Only parents can register. ASHA workers get login details from their admin.' });
    }

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existing) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await User.create({
      name: fullName,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      dob: dob || undefined,
      state: state?.trim(),
      district: district?.trim(),
      block: block?.trim(),
      password,
      role,
    });

    await createAuditLog({
      req,
      actor: user,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} registered as ${user.role}`,
    });

    res.status(201).json({ message: 'Registered successfully. Please login.' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const identifier = req.body.email?.trim() || req.body.identifier?.trim() || '';
    const password = req.body.password || '';
    const expectedRole = req.body.role?.trim().toLowerCase() || ''; // role selected on login UI
    const normalizedEmail = identifier.toLowerCase();

    const query = identifier.includes('@')
      ? { email: normalizedEmail }
      : { $or: [{ phone: identifier }, { email: normalizedEmail }, { username: identifier.toUpperCase() }] };

    const user = await User.findOne(query).select('+password +sessionVersion');
    if (!user || !(await user.matchPassword(password, req))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    // Role-based login enforcement: if the client specified a role, it must match
    if (expectedRole && expectedRole !== user.role) {
      const roleLabels = { parent: 'Parent', asha: 'ASHA Worker', admin: 'Admin' };
      return res.status(403).json({
        message: `This account is registered as ${roleLabels[user.role] || user.role}. Please select the correct login portal.`,
      });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    if (user.needsRehash()) user.password = password; // pre-save hook rehashes at the current cost
    await user.save({ validateBeforeSave: false });

    // Session cookie (no maxAge): gone when the browser closes; the JWT expiry caps it otherwise
    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);

    await createAuditLog({
      req,
      actor: user,
      action: 'LOGIN_SUCCESS',
      entityType: 'Auth',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} logged in successfully as ${user.role}`,
    });

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, district: user.district, mustChangePassword: Boolean(user.mustChangePassword) },
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/logout — revoke server-side so a copied token stops working too
const logout = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!isValidPassword(newPassword)) return res.status(400).json({ message: PASSWORD_ERROR });
    const user = await User.findById(req.user._id).select('+password +sessionVersion');
    if (!currentPassword || !(await user.matchPassword(currentPassword, req))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (newPassword === currentPassword) return res.status(400).json({ message: 'Choose a password different from the current one' });
    user.password = newPassword;
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion || 0) + 1; // sign out every other device
    await user.save();
    res.cookie(COOKIE_NAME, signToken(user), cookieOptions);
    await createAuditLog({
      req,
      actor: user,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} changed password`,
    });
    res.json({ message: 'Password updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, mustChangePassword: false } });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    await user.save({ validateBeforeSave: false });

    try {
      await sendOTPEmail(user.email, otp, user.name, 'password reset');
    } catch (emailErr) {
      console.warn('Password reset OTP email failed:', emailErr.message);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'Email service unavailable. Using development OTP fallback.',
          otp,
          userId: user._id,
        });
      }

      return res.status(503).json({
        message: 'Password reset email service is temporarily unavailable. Please try again later.',
      });
    }

    res.json({ message: 'Password reset OTP sent to your email', userId: user._id });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'OTP is required' });
    if (!isValidPassword(newPassword)) return res.status(400).json({ message: PASSWORD_ERROR });

    const user = await User.findById(userId).select('+otp +otpExpiry +password +sessionVersion');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // A missing stored OTP must never match (undefined === undefined)
    if (!user.otp || user.otp !== String(otp).trim()) return res.status(400).json({ message: 'Invalid OTP' });
    if (!user.otpExpiry || user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.password = newPassword;
    user.mustChangePassword = false; // they chose this one themselves
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.sessionVersion = (user.sessionVersion || 0) + 1; // revoke any hijacked sessions
    await user.save();

    await createAuditLog({
      req,
      actor: user,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id,
      details: `${user.name} reset password via forgot flow`,
    });

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// PUT /api/auth/profile — the signed-in user edits their own name and phone (email / role / area are managed by admin)
const updateProfile = async (req, res) => {
  try {
    const name = req.body.name === undefined ? undefined : String(req.body.name).trim();
    const phone = req.body.phone === undefined ? undefined : String(req.body.phone).replace(/\D/g, '');
    if (name !== undefined && (name.length < 2 || name.length > 100)) return res.status(400).json({ message: 'Enter your full name' });
    if (phone !== undefined && phone.length !== 10) return res.status(400).json({ message: 'Phone must be 10 digits' });
    if (phone && await User.exists({ phone, _id: { $ne: req.user._id } })) return res.status(400).json({ message: 'This phone number is already registered' });
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    await createAuditLog({ req, action: 'PROFILE_UPDATED', entityType: 'User', entityId: user._id, targetUserId: user._id, details: `${user.name} updated their profile`, metadata: { fields: Object.keys(update) } });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/preferences — { notificationPrefs: { vaccine_reminder, visit_reminder, scheme_update, system } }
const updatePreferences = async (req, res) => {
  try {
    const prefs = req.body.notificationPrefs || {};
    const update = {};
    for (const key of ['vaccine_reminder', 'visit_reminder', 'scheme_update', 'system']) {
      if (typeof prefs[key] === 'boolean') update[`notificationPrefs.${key}`] = prefs[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    res.json({ notificationPrefs: user.notificationPrefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { updateProfile, updatePreferences, register, login, getMe, logout, changePassword, forgotPassword, resetPassword };
