const AuditLog = require('../models/AuditLog');

/**
 * Writes an audit record to the DB.
 * Pass either `actor` directly or let it fall back to req.user — whichever is available.
 * Silently swallows errors so a logging failure never breaks the main request.
 */
async function createAuditLog({ req, actor, action, entityType, entityId, targetUserId, details, metadata }) {
  try {
    const performedBy = actor || req?.user;

    await AuditLog.create({
      actorId: performedBy?._id,
      actorName: performedBy?.name || 'System',
      actorRole: performedBy?.role || 'system',
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      targetUserId,
      details,
      metadata,
      ipAddress: req?.ip,
    });
  } catch (err) {
    // don't let audit failures bubble up to the caller
    console.error('Audit log error:', err.message);
  }
}

module.exports = { createAuditLog };
