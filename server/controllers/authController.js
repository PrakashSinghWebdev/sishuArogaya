const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');
const { generateOTP, getOTPExpiry, sendOTPEmail, sendOTPSMS } = require('../utils/otp');
const { createAuditLog } = require('../utils/auditLogger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, ashaId, district, block } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existing) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await User.create({ name, email: normalizedEmail, phone: normalizedPhone, password, role });

    // If registering as ASHA worker, create AshaWorker record
    if (role === 'asha') {
      await AshaWorker.create({ userId: user._id, ashaId, district, block });
    }

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
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login  — step 1: validate credentials, send OTP
const login = async (req, res) => {
  try {
    const identifier = req.body.email?.trim() || req.body.identifier?.trim() || '';
    const password = req.body.password || '';
    const normalizedEmail = identifier.toLowerCase();

    const query = identifier.includes('@')
      ? { email: normalizedEmail }
      : { $or: [{ phone: identifier }, { email: normalizedEmail }] };

    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      req,
      actor: user,
      action: 'LOGIN_OTP_SENT',
      entityType: 'Auth',
      entityId: user._id,
      targetUserId: user._id,
      details: `OTP generated for ${user.email}`,
    });

    // Send OTP via email and SMS in parallel
    const deliveryResults = await Promise.allSettled([
      sendOTPEmail(user.email, otp, user.name),
      user.phone ? sendOTPSMS(user.phone, otp) : Promise.resolve(),
    ]);

    const emailFailed = deliveryResults[0].status === 'rejected';
    const smsFailed   = deliveryResults[1].status === 'rejected';

    if (emailFailed) console.warn('Email OTP failed:', deliveryResults[0].reason?.message);
    if (smsFailed)   console.warn('SMS OTP failed:',   deliveryResults[1].reason?.message);

    // In development, return OTP in response if both channels fail
    if (emailFailed && smsFailed && process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'OTP generated (dev mode — delivery failed)', otp, userId: user._id });
    }

    const sentVia = [!emailFailed && 'email', !smsFailed && user.phone && 'SMS'].filter(Boolean).join(' & ');
    res.json({ message: `OTP sent via ${sentVia || 'registered contact'}`, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp — step 2: verify OTP, return JWT
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    await createAuditLog({
      req,
      actor: user,
      action: 'LOGIN_VERIFIED',
      entityType: 'Auth',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} completed OTP verification`,
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    await createAuditLog({
      req,
      actor: user,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} changed password`,
    });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    await user.save({ validateBeforeSave: false });

    // Send OTP
    try {
      await sendOTPEmail(user.email, otp, user.name);
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ message: 'Dev OTP', otp, userId: user._id });
      }
    }

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry +password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
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
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, verifyOTP, getMe, changePassword, forgotPassword, resetPassword };
