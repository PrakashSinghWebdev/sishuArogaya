const mongoose = require('mongoose');

// Supervisor ↔ ASHA communication: instructions, announcements, training / meeting notices,
// correction requests on a record, and questions from an ASHA. Replies form a simple thread.
const KINDS = ['instruction', 'announcement', 'training', 'meeting', 'correction', 'query'];

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], validate: (v) => v.length > 0 && v.length <= 500 },
    kind: { type: String, enum: KINDS, default: 'instruction' },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, trim: true, maxlength: 3000 },
    meetingAt: { type: Date }, // training / meeting date and time
    // optional record the message is about (correction requests)
    related: {
      kind: { type: String, enum: ['Child', 'Pregnancy', 'Referral'] },
      id: { type: mongoose.Schema.Types.ObjectId },
      label: { type: String, trim: true, maxlength: 150 },
    },
    resolvedAt: { type: Date }, // correction done / query answered
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [
      {
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ to: 1, createdAt: -1 });
messageSchema.index({ from: 1, createdAt: -1 });

messageSchema.statics.KINDS = KINDS;

module.exports = mongoose.model('Message', messageSchema);
