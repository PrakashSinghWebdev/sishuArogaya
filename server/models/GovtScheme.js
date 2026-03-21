const mongoose = require('mongoose');

const govtSchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    shortName: { type: String }, // e.g. PMMVY, JSY
    description: { type: String, required: true },
    eligibilityCriteria: { type: String },
    benefits: { type: String },
    applyLink: { type: String },
    category: {
      type: String,
      enum: ['nutrition', 'vaccination', 'financial', 'education', 'other'],
      default: 'other',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GovtScheme', govtSchemeSchema);
