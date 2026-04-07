const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AshaWorker = require('../models/AshaWorker');

const { createAuditLog } = require('../utils/auditLogger');
const { generateOTP } = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail').sendEmail;
const getOTPExpiry = (minutes = 10) => new Date(Date.now() + minutes * 60 * 1000);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

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
      aadhar,
      dob,
      password,
      role,
      ashaId,
      district,
      block,
    } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = String(phone || mobile || '').trim();
    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();

    if (!fullName || !normalizedEmail || !normalizedPhone || !password || !role) {
      return res.status(400).json({ message: 'Name, email, phone, password, and role are required' });
    }

    if (!['parent', 'asha', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    if (role === 'asha' && (!ashaId?.trim() || !district?.trim() || !block?.trim())) {
      return res.status(400).json({ message: 'ASHA ID, district, and block are required for ASHA registration' });
    }

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existing) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await User.create({
      name: fullName,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      aadhar: aadhar?.trim(),
      dob: dob || undefined,
      district: district?.trim(),
      block: block?.trim(),
      password,
      role,
    });

    if (role === 'asha') {
      await AshaWorker.create({
        userId: user._id,
        ashaId: ashaId.trim(),
        district: district.trim(),
        block: block.trim(),
      });
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

// POST /api/auth/login
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

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    await createAuditLog({
      req,
      actor: user,
      action: 'LOGIN_SUCCESS',
      entityType: 'Auth',
      entityId: user._id,
      targetUserId: user._id,
      details: `${user.name} logged in successfully`,
    });

    res.json({
      message: 'Login successful',
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
      await sendEmail(user.email, otp);
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

module.exports = { register, login, getMe, changePassword, forgotPassword, resetPassword };
