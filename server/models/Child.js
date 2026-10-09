const mongoose = require('mongoose');
const { completedMonths } = require('../utils/zScore');

const childSchema = new mongoose.Schema(
  {
    childId: { type: String, unique: true, required: true, sparse: true }, // CHILD-XXXXXX
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    birthWeight: { type: Number }, // kg
    birthHeight: { type: Number }, // cm
    currentWeight: { type: Number },
    currentHeight: { type: Number },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    motherName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker' },
    state: { type: String },
    district: { type: String },
    block: { type: String },
    village: { type: String },
    nutritionStatus: {
      type: String,
      enum: ['healthy', 'moderate', 'severe'],
      default: 'healthy',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate unique childId before validation so required validation passes
childSchema.pre('validate', async function (next) {
  if (typeof this.childId === 'string' && this.childId.trim().length > 0) return next();

  let childId;
  let isUnique = false;
  const Child = mongoose.model('Child');

  while (!isUnique) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    childId = `CHILD-${random}`;
    const existing = await Child.findOne({ childId });
    if (!existing) isUnique = true;
  }

  this.childId = childId;
  next();
});

// figure out the child's age without having to store it
childSchema.virtual('ageInMonths').get(function () {
  return completedMonths(this.dob);
});

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
