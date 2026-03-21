const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['vaccine_reminder', 'health_alert', 'visit_reminder', 'scheme_update', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // optional deep link
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
