const mongoose = require('mongoose');

// An ASHA's claim for an incentive-eligible activity. The app tracks the claim; eligibility, rates,
// approval and payment follow the state's ASHA incentive guidelines (amount is entered, not computed).
const ACTIVITIES = [
  'Full immunisation of a child (by 1 year)',
  'Complete immunisation (by 2 years)',
  'Institutional delivery support (JSY)',
  'Home-based newborn care (all HBNC visits)',
  'Home-based young child care (HBYC) visit',
  'Early ANC registration (first trimester)',
  'Referral of a sick child / SAM case',
  'Family planning counselling',
  'Village Health & Nutrition Day mobilisation',
  'Other',
];
const STATUSES = ['pending', 'submitted', 'approved', 'rejected', 'paid'];

const incentiveClaimSchema = new mongoose.Schema(
  {
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker', required: true },
    activity: { type: String, enum: ACTIVITIES, required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ }, // YYYY-MM the work was done
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    pregnancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pregnancy' },
    beneficiary: { type: String, trim: true, maxlength: 150 }, // name shown on the claim
    amount: { type: Number, min: 0, max: 100000 },
    notes: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: STATUSES, default: 'pending' },
    history: [{
      status: { type: String, enum: STATUSES },
      note: { type: String, trim: true, maxlength: 500 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

incentiveClaimSchema.index({ ashaId: 1, month: -1 });
incentiveClaimSchema.index({ status: 1, updatedAt: -1 });

incentiveClaimSchema.statics.ACTIVITIES = ACTIVITIES;
incentiveClaimSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('IncentiveClaim', incentiveClaimSchema);
