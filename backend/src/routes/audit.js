const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// GET /api/audit?entityId=&action=
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { entityId, action, limit = 100 } = req.query;
    const query = {};
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort('-createdAt')
      .limit(parseInt(limit));
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
