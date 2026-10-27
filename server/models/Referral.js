const mongoose = require('mongoose');

// A child or a pregnant / postnatal mother sent by an ASHA for assessment at a health facility, tracked until it is closed.
// The app records and follows up; diagnosis and treatment stay with the facility.
const STATUSES = ['pending', 'reached', 'completed', 'cancelled'];

const referralSchema = new mongoose.Schema(
  {
    // exactly one of these: who is being referred
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    pregnancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy' },
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    urgency: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'urgent' },
    facility: { type: String, trim: true, maxlength: 200 }, // e.g. "PHC Rampur" — free text, picked or typed
    status: { type: String, enum: STATUSES, default: 'pending' },
    followUpDate: { type: Date },
    escalatedAt: { type: Date }, // flagged to the admins for action
    history: [
      {
        status: { type: String, enum: STATUSES },
        note: { type: String, trim: true, maxlength: 500 },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

referralSchema.index({ ashaId: 1, status: 1, createdAt: -1 });
referralSchema.index({ childId: 1, createdAt: -1 });
referralSchema.index({ pregnancyId: 1, createdAt: -1 });

referralSchema.pre('validate', function requireOnePatient(next) {
  if (Boolean(this.childId) === Boolean(this.pregnancyId)) this.invalidate('childId', 'A referral is for either a child or a mother');
  next();
});
referralSchema.index({ status: 1, escalatedAt: -1 });

referralSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Referral', referralSchema);
