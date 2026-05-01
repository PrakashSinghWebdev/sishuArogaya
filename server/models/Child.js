const mongoose = require('mongoose');

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
    ashaId: { type: mongoose.Schema.Types.ObjectId, ref: 'AshaWorker' },
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

// Generate unique childId before save
childSchema.pre('save', async function (next) {
  if (this.childId) return next();

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
  const now = new Date();
  const birthDate = new Date(this.dob);
  const yearDiff = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  return yearDiff * 12 + monthDiff;
});

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
