const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    vaccineName: { type: String, required: true },
    dueDate: { type: Date, required: true },
    givenDate: { type: Date },
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['upcoming', 'due', 'done', 'missed'], default: 'upcoming' },
    notes: { type: String },
    ageMonths: { type: Number }, // scheduled age in months (0, 1.5, 2.5, ...)
  },
  { timestamps: true }
);

vaccinationSchema.index({ childId: 1, dueDate: 1 });
vaccinationSchema.index({ status: 1, dueDate: 1 }); // overdue list + dashboard count

module.exports = mongoose.model('Vaccination', vaccinationSchema);
