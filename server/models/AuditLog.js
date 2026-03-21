const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, trim: true },
    actorRole: { type: String, enum: ['parent', 'asha', 'admin', 'system'], default: 'system' },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, trim: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, entityType: 1 });
auditLogSchema.index({ actorId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
