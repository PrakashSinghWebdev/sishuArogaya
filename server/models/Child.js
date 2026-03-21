const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], default: 'Unknown' },
    birthWeight: { type: Number }, // in kg
    birthHeight: { type: Number }, // in cm
    currentWeight: { type: Number },
    currentHeight: { type: Number },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker' },
    district: { type: String },
    block: { type: String },
    village: { type: String },
    nutritionStatus: { type: String, enum: ['healthy', 'moderate', 'severe'], default: 'healthy' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: age in months
childSchema.virtual('ageInMonths').get(function () {
  const now = new Date();
  const dob = new Date(this.dob);
  return (
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth())
  );
});

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
