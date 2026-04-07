const mongoose = require('mongoose');

const dietChecklistSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    childId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    date:     { type: String, required: true }, // "YYYY-MM-DD" — one doc per child per day
    ageGroup: { type: String, required: true },
    // checked items stored as "mealIndex-itemIndex" strings e.g. "0-0", "1-2"
    checks:   { type: [String], default: [] },
    notes:    { type: String, default: '' },
    // set when all items are checked for the day
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One checklist per child per day
dietChecklistSchema.index({ userId: 1, childId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DietChecklist', dietChecklistSchema);
