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
  },
  { timestamps: true }
);

const ashaWorkerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ashaId: { type: String, unique: true, required: true, sparse: true }, // Govt. ASHA ID (ASHA-XXXX)
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

// Generate unique ashaId before save
ashaWorkerSchema.pre('save', async function (next) {
  if (this.ashaId) return next();

  let ashaId;
  let isUnique = false;
  const AshaWorker = mongoose.model('AshaWorker');

  while (!isUnique) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    ashaId = `ASHA-${random}`;
    const existing = await AshaWorker.findOne({ ashaId });
    if (!existing) isUnique = true;
  }

  this.ashaId = ashaId;
  next();
});

module.exports = mongoose.model('AshaWorker', ashaWorkerSchema);
