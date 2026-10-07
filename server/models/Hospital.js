const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    type:     { type: String, enum: ['hospital', 'clinic', 'pharmacy', 'health_post', 'doctors', 'ambulance_station'], default: 'hospital' },
    address:  { type: String, default: '' },
    phone:    { type: String, default: '' },
    emergencyPhone: { type: String, default: '' },
    ambulancePhone: { type: String, default: '' },
    source:   { type: String, enum: ['curated', 'nhp', 'osm'], default: 'curated' }, // nhp = National Health Portal
    district: { type: String, default: '' },
    state:    { type: String, default: '' },
    pincode:  { type: String, default: '' },
    isGovernment: { type: Boolean, default: true },
    hasEmergency: { type: Boolean, default: false },
    hasICU:       { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    // true when the source coordinates are a placeholder (e.g. a city centroid shared by many rows):
    // still searchable by district/state/pincode, but kept out of distance-based results and map pins
    approxLocation: { type: Boolean, default: false },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
HospitalSchema.index({ location: '2dsphere' });
HospitalSchema.index({ name: 'text', district: 'text', state: 'text', address: 'text' });
HospitalSchema.index({ state: 1, district: 1 });
HospitalSchema.index({ pincode: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
