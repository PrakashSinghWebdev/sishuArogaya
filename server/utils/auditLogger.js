const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
  req,
  actor,
  action,
  entityType,
  entityId,
  targetUserId,
  details,
  metadata,
}) => {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      actorName: actor?.name || req?.user?.name || 'System',
      actorRole: actor?.role || req?.user?.role || 'system',
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      targetUserId,
      details,
      metadata,
      ipAddress: req?.ip,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
