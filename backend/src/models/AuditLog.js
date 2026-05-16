const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: { type: String, required: true }, // 'goal', 'cycle', 'user'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true }, // 'created', 'updated', 'approved', 'returned', 'unlocked', etc.
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changes: { type: mongoose.Schema.Types.Mixed }, // { field: { from, to } }
  note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
