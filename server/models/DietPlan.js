const mongoose = require('mongoose');

const dietItemSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: String, required: true },
  note: { type: String }
});

const mealSchema = new mongoose.Schema({
  time: { type: String, required: true },
  icon: { type: String },
  name: { type: String, required: true },
  items: [dietItemSchema]
});

const dietPlanSchema = new mongoose.Schema({
  ageGroup: { 
    type: String, 
    required: true, 
    enum: ['exclusive-bf', '6-8mo', '9-11mo', '12-23mo', '2-5yr'],
    unique: true 
  },
  minMonths: { type: Number, required: true },
  maxMonths: { type: Number, required: true },
  label: { type: String, required: true }, // '0-5 Months', etc.
  intro: { type: String, required: true },
  color: { type: String },
  tips: [String],
  meals: [mealSchema],
  avoidFoods: [String],
  warning: String
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);

