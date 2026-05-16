const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "FY 2025-26"
  year: { type: Number, required: true },
  goalSettingOpen: { type: Date, required: true },
  goalSettingClose: { type: Date },
  q1Open: { type: Date },
  q1Close: { type: Date },
  q2Open: { type: Date },
  q2Close: { type: Date },
  q3Open: { type: Date },
  q3Close: { type: Date },
  q4Open: { type: Date },
  q4Close: { type: Date },
  isActive: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

cycleSchema.methods.currentPhase = function () {
  const now = new Date();
  if (now >= this.goalSettingOpen && (!this.goalSettingClose || now <= this.goalSettingClose)) return 'goal_setting';
  if (this.q1Open && now >= this.q1Open && (!this.q1Close || now <= this.q1Close)) return 'q1';
  if (this.q2Open && now >= this.q2Open && (!this.q2Close || now <= this.q2Close)) return 'q2';
  if (this.q3Open && now >= this.q3Open && (!this.q3Close || now <= this.q3Close)) return 'q3';
  if (this.q4Open && now >= this.q4Open && (!this.q4Close || now <= this.q4Close)) return 'q4';
  return 'closed';
};

module.exports = mongoose.model('Cycle', cycleSchema);
