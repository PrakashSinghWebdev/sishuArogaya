const mongoose = require('mongoose');

const whoReferenceSchema = new mongoose.Schema({
  metric: {
    type: String,
    enum: ['wfa', 'hfa', 'wfh', 'hcfa', 'bmi', 'acfa'],
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  ageMonths: { type: Number },   // for age-based metrics
  length:    { type: Number },   // for wfh (weight-for-height/length)
  l: { type: Number },           // LMS Lambda
  m: { type: Number },           // LMS Mu (median)
  s: { type: Number },           // LMS Sigma
  sd3neg: { type: Number },
  sd2neg: { type: Number },
  sd1neg: { type: Number },
  sd0:    { type: Number },
  sd1:    { type: Number },
  sd2:    { type: Number },
  sd3:    { type: Number },
}, { timestamps: false, collection: 'who_references' });

whoReferenceSchema.index({ metric: 1, gender: 1, ageMonths: 1 });
whoReferenceSchema.index({ metric: 1, gender: 1, length: 1 });

module.exports = mongoose.model('WHOReference', whoReferenceSchema);
