const mongoose = require('mongoose');

const govtSchemeSchema = new mongoose.Schema(
  {
    name:                { type: String, required: true },
    shortName:           { type: String },
    description:         { type: String, required: true },
    eligibilityCriteria: { type: String },
    benefits:            { type: String },
    applyLink:           { type: String },
    icon:                { type: String, default: '🏛️' },
    tags:                { type: [String], default: [] },
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
