const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    visitDate: { type: Date, default: Date.now },
    weight: { type: Number },
    height: { type: Number },
    vaccineGiven: { type: String },
    observations: { type: String },
    outcome: { type: String, enum: ['normal', 'referred', 'follow-up'], default: 'normal' },
    status: { type: String, enum: ['completed', 'missed'], default: 'completed' },
  },
  { timestamps: true }
);

const ashaWorkerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ashaId: { type: String, unique: true, required: true }, // Govt. ASHA ID
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

module.exports = mongoose.model('AshaWorker', ashaWorkerSchema);
