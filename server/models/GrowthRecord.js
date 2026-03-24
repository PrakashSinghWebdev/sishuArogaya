const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedDate: { type: Date, default: Date.now },
    ageMonths: { type: Number, required: true },
    weight: { type: Number, required: true }, // kg
    height: { type: Number, required: true }, // cm
    // WHO Z-scores
    headCircumference: { type: Number }, // cm
    wazScore: { type: Number }, // Weight-for-Age
    hazScore: { type: Number }, // Height-for-Age
    whzScore: { type: Number }, // Weight-for-Height
    prediction: { type: String, enum: ['healthy', 'moderate', 'severe'], default: 'healthy' },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);
