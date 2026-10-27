const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    visitDate: { type: Date, default: Date.now },
    visitType: { type: String },
    weight: { type: Number },
    height: { type: Number },
    headCircumference: { type: Number },
    temperature: { type: Number },
    muac: { type: Number },
    vaccineGiven: { type: String },
    vaccinesGiven: [{ type: String }],
    observations: { type: String },
    outcome: { type: String, enum: ['healthy', 'moderate', 'severe', 'referred', 'follow-up'], default: 'healthy' },
    status: { type: String, enum: ['completed', 'missed'], default: 'completed' },
    followUpDate: { type: Date }, // next planned visit; drives the My Visits work list
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral' },
  },
  { timestamps: true }
);

const ashaWorkerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ashaId: { type: String, unique: true, sparse: true, required: true }, // Govt. ASHA ID (ASHA-XXXX)
    state: { type: String },
    district: { type: String, required: true },
    block: { type: String, required: true },
    village: { type: String },
    assignedChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    checkupQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    visits: [visitSchema],
    totalVisits: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Looked up by login user on almost every ASHA request; matched by area on assignment
ashaWorkerSchema.index({ userId: 1 });
ashaWorkerSchema.index({ district: 1, block: 1, isActive: 1 });

module.exports = mongoose.model('AshaWorker', ashaWorkerSchema);
