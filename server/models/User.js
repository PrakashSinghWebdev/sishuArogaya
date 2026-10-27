const mongoose = require('mongoose');
// Native bcrypt runs on libuv's thread pool; bcryptjs ran on the event loop and froze the API under a login burst.
// Hashes are the same bcrypt format, so existing passwords keep working.
const bcrypt = require('@node-rs/bcrypt');
const { createGate } = require('../utils/gate');

// bcrypt work factor. 10 is OWASP's minimum and ~4x faster than 12 (~45ms vs ~170ms per hash),
// which lifts login capacity from ~60/s to ~240/s on 10 cores. Older cost-12 hashes are rehashed on login.
const BCRYPT_COST = 10;
// One hash per worker (= one per core under cluster.js); ~10 queued ≈ 0.5s wait, beyond that 503 "busy"
const gated = createGate({ maxRunning: 1, maxWaiting: 10 });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true, uppercase: true, trim: true }, // admin-created ASHA login (ASHA ID)
    aadhar: { type: String, trim: true },
    dob: { type: Date },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    block: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['parent', 'asha', 'admin'], required: true },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0, select: false },
    // set on admin-created / admin-reset accounts: the API only allows changing the password until done
    mustChangePassword: { type: Boolean, default: false },
    // Which notification types the user wants to see (health_alert / emergencies can't be turned off)
    notificationPrefs: {
      vaccine_reminder: { type: Boolean, default: true },
      visit_reminder: { type: Boolean, default: true },
      scheme_update: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
    },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await gated(() => bcrypt.hash(this.password, BCRYPT_COST));
  next();
});

// Compare password; pass the request so a check queued for a client that already left is skipped
userSchema.methods.matchPassword = async function (enteredPassword, req) {
  return gated(() => bcrypt.compare(enteredPassword, this.password), () => Boolean(req?.socket?.destroyed));
};

// True when the stored hash uses a different work factor ("$2b$12$..." → 12) and should be rehashed
userSchema.methods.needsRehash = function () {
  return Number(String(this.password).split('$')[2]) !== BCRYPT_COST;
};

userSchema.index({ role: 1, district: 1, block: 1 });
userSchema.index({ role: 1, createdAt: -1 }); // admin user list by role, newest first, paged
userSchema.index({ createdAt: -1 }); // parents in an ASHA's block

module.exports = mongoose.model('User', userSchema);
