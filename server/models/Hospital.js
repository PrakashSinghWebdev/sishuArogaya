const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    type:     { type: String, enum: ['hospital', 'clinic', 'pharmacy', 'health_post', 'doctors'], default: 'hospital' },
    address:  { type: String, default: '' },
    phone:    { type: String, default: '' },
    district: { type: String, default: '' },
    state:    { type: String, default: '' },
    pincode:  { type: String, default: '' },
    isGovernment: { type: Boolean, default: true },
    hasEmergency: { type: Boolean, default: false },
    hasICU:       { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
HospitalSchema.index({ location: '2dsphere' });
HospitalSchema.index({ name: 'text', district: 'text', state: 'text' });

module.exports = mongoose.model('Hospital', HospitalSchema);
