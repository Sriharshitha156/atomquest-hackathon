const mongoose = require('mongoose');

const goalItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  thrustArea: { type: String, required: true },
  uomType: { type: String, enum: ['numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero'], required: true },
  target: { type: mongoose.Schema.Types.Mixed, required: true }, // number or date string
  weightage: { type: Number, required: true, min: 10, max: 100 },
  isShared: { type: Boolean, default: false },
  sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
  // Actuals per quarter
  q1Actual: { type: mongoose.Schema.Types.Mixed },
  q2Actual: { type: mongoose.Schema.Types.Mixed },
  q3Actual: { type: mongoose.Schema.Types.Mixed },
  q4Actual: { type: mongoose.Schema.Types.Mixed },
  // Status per quarter
  q1Status: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  q2Status: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  q3Status: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  q4Status: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  // Computed scores (cached)
  q1Score: { type: Number },
  q2Score: { type: Number },
  q3Score: { type: Number },
  q4Score: { type: Number },
});

const goalSheetSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
  goals: { type: [goalItemSchema], validate: [arr => arr.length <= 8, 'Maximum 8 goals allowed'] },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'returned', 'approved', 'locked'],
    default: 'draft'
  },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerComments: { type: String },
  // Track check-in completion
  q1CheckinDone: { type: Boolean, default: false },
  q2CheckinDone: { type: Boolean, default: false },
  q3CheckinDone: { type: Boolean, default: false },
  q4CheckinDone: { type: Boolean, default: false },
}, { timestamps: true });

// Validate total weightage = 100
goalSheetSchema.methods.validateWeightage = function () {
  const total = this.goals.reduce((sum, g) => sum + g.weightage, 0);
  return total === 100;
};

// Compute score for a single goal item
goalSheetSchema.statics.computeScore = function (goal, quarter) {
  const actual = goal[`${quarter}Actual`];
  const target = goal.target;
  if (actual === undefined || actual === null || actual === '') return null;

  switch (goal.uomType) {
    case 'numeric_min':
    case 'percent_min':
      return Math.min((actual / target) * 100, 150); // cap at 150%
    case 'numeric_max':
    case 'percent_max':
      return Math.min((target / actual) * 100, 150);
    case 'timeline':
      const completionDate = new Date(actual);
      const deadline = new Date(target);
      return completionDate <= deadline ? 100 : Math.max(0, 100 - ((completionDate - deadline) / (1000 * 60 * 60 * 24)) * 2);
    case 'zero':
      return actual === 0 || actual === '0' ? 100 : 0;
    default:
      return null;
  }
};

module.exports = mongoose.model('Goal', goalSheetSchema);
