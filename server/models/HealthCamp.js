const mongoose = require('mongoose');

// Village immunisation session / health camp / VHSND day, scheduled by an ASHA
const healthCampSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker' }, // set when an ASHA schedules it
    district: { type: String, trim: true, required: true },
    block: { type: String, trim: true, required: true },
    kind: { type: String, enum: ['immunisation', 'health', 'nutrition', 'awareness', 'other'], default: 'immunisation' },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    date: { type: Date, required: true }, // date and start time
    venue: { type: String, trim: true, maxlength: 200 }, // e.g. "Anganwadi centre, Rampur"
    village: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    notifiedParents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

healthCampSchema.index({ district: 1, block: 1, date: 1 });

module.exports = mongoose.model('HealthCamp', healthCampSchema);
