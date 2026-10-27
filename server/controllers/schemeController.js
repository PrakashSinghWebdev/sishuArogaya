const GovtScheme = require('../models/GovtScheme');
const { createAuditLog } = require('../utils/auditLogger');
const { cached, invalidate } = require('../utils/cache');

// GET /api/schemes
const getSchemes = async (req, res) => {
  try {
    const schemes = await cached('schemes', 10 * 60_000, () => GovtScheme.find({ isActive: true }).lean());
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/schemes — Admin only
const createScheme = async (req, res) => {
  try {
    const scheme = await GovtScheme.create(req.body);
    invalidate('schemes');
    await createAuditLog({
      req,
      action: 'SCHEME_CREATED',
      entityType: 'GovtScheme',
      entityId: scheme._id,
      details: `${req.user.name} created scheme ${scheme.name}`,
    });
    res.status(201).json(scheme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/schemes/:id — Admin only
const updateScheme = async (req, res) => {
  try {
    const scheme = await GovtScheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
    invalidate('schemes');
    await createAuditLog({
      req,
      action: 'SCHEME_UPDATED',
      entityType: 'GovtScheme',
      entityId: scheme._id,
      details: `${req.user.name} updated scheme ${scheme.name}`,
      metadata: { fields: Object.keys(req.body || {}) },
    });
    res.json(scheme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSchemes, createScheme, updateScheme };
