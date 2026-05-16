const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Helper: log audit
const audit = async (entityId, action, performedBy, changes, note) => {
  await AuditLog.create({ entityType: 'goal', entityId, action, performedBy, changes, note });
};

// GET /api/goals/my — Employee: own goal sheet for active cycle
router.get('/my', protect, async (req, res) => {
  try {
    const cycleId = req.query.cycleId;
    const query = { employeeId: req.user._id };
    if (cycleId) query.cycleId = cycleId;
    const goals = await Goal.find(query).populate('cycleId', 'name year').sort('-createdAt');
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/goals/team — Manager: all goal sheets of their team
router.get('/team', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const cycleId = req.query.cycleId;
    let teamIds;
    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id });
      teamIds = team.map(u => u._id);
    }
    const query = {};
    if (teamIds) query.employeeId = { $in: teamIds };
    if (cycleId) query.cycleId = cycleId;
    const goals = await Goal.find(query)
      .populate('employeeId', 'name email department employeeId')
      .populate('cycleId', 'name year')
      .sort('-createdAt');
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/goals/all — Admin: everyone
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { cycleId, status, department } = req.query;
    const query = {};
    if (cycleId) query.cycleId = cycleId;
    if (status) query.status = status;
    if (department) {
      const users = await User.find({ department });
      query.employeeId = { $in: users.map(u => u._id) };
    }
    const goals = await Goal.find(query)
      .populate('employeeId', 'name email department employeeId managerId')
      .populate('cycleId', 'name year')
      .sort('-createdAt');
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/goals/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('employeeId', 'name email department employeeId managerId')
      .populate('cycleId', 'name year')
      .populate('approvedBy', 'name');
    if (!goal) return res.status(404).json({ success: false, message: 'Goal sheet not found' });
    res.json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/goals — Employee creates/saves draft goal sheet
router.post('/', protect, authorize('employee', 'manager'), async (req, res) => {
  try {
    const { cycleId, goals } = req.body;

    // Validate max 8 goals
    if (goals.length > 8) {
      return res.status(400).json({ success: false, message: 'Maximum 8 goals allowed' });
    }
    // Validate min 10% weightage each
    for (const g of goals) {
      if (g.weightage < 10) {
        return res.status(400).json({ success: false, message: `Goal "${g.title}" must have at least 10% weightage` });
      }
    }
    // Validate total = 100
    const total = goals.reduce((s, g) => s + g.weightage, 0);
    if (total !== 100) {
      return res.status(400).json({ success: false, message: `Total weightage must be 100%. Current: ${total}%` });
    }

    // Check if already exists (update draft)
    let sheet = await Goal.findOne({ employeeId: req.user._id, cycleId });
    if (sheet && sheet.status === 'locked') {
      return res.status(400).json({ success: false, message: 'Goals are locked. Contact Admin to unlock.' });
    }
    if (sheet) {
      sheet.goals = goals;
      sheet.status = 'draft';
      await sheet.save();
      await audit(sheet._id, 'updated', req.user._id, {}, 'Draft updated');
    } else {
      sheet = await Goal.create({ employeeId: req.user._id, cycleId, goals, status: 'draft' });
      await audit(sheet._id, 'created', req.user._id, {}, 'New goal sheet created');
    }
    res.status(201).json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/submit — Employee submits for approval
router.patch('/:id/submit', protect, authorize('employee', 'manager'), async (req, res) => {
  try {
    const sheet = await Goal.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    if (sheet.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your goal sheet' });
    }
    if (!['draft', 'returned'].includes(sheet.status)) {
      return res.status(400).json({ success: false, message: `Cannot submit from status: ${sheet.status}` });
    }
    sheet.status = 'submitted';
    sheet.submittedAt = new Date();
    await sheet.save();
    await audit(sheet._id, 'submitted', req.user._id, {}, 'Submitted for manager approval');
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/approve — Manager approves (with optional inline edits)
router.patch('/:id/approve', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const sheet = await Goal.findById(req.params.id).populate('employeeId');
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    if (sheet.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Goal sheet not in submitted state' });
    }
    // Manager can only approve their own team
    if (req.user.role === 'manager') {
      const emp = sheet.employeeId;
      if (!emp.managerId || emp.managerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not your team member' });
      }
    }
    // Apply any inline edits to goals
    if (req.body.goals) {
      // Validate again
      const goals = req.body.goals;
      const total = goals.reduce((s, g) => s + g.weightage, 0);
      if (total !== 100) return res.status(400).json({ success: false, message: 'Total weightage must be 100%' });
      sheet.goals = goals;
    }
    if (req.body.managerComments) sheet.managerComments = req.body.managerComments;
    sheet.status = 'locked';
    sheet.approvedAt = new Date();
    sheet.approvedBy = req.user._id;
    await sheet.save();
    await audit(sheet._id, 'approved', req.user._id, {}, req.body.managerComments || 'Approved');
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/return — Manager returns for rework
router.patch('/:id/return', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const sheet = await Goal.findById(req.params.id).populate('employeeId');
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    if (sheet.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Not in submitted state' });
    }
    sheet.status = 'returned';
    sheet.managerComments = req.body.reason || 'Returned for revision';
    await sheet.save();
    await audit(sheet._id, 'returned', req.user._id, {}, sheet.managerComments);
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/unlock — Admin unlocks a locked goal sheet
router.patch('/:id/unlock', protect, authorize('admin'), async (req, res) => {
  try {
    const sheet = await Goal.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    sheet.status = 'approved';
    await sheet.save();
    await audit(sheet._id, 'unlocked', req.user._id, {}, req.body.reason || 'Unlocked by Admin');
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/goals/shared — Admin/Manager pushes a shared goal to employees
router.post('/shared', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { cycleId, sharedGoal, employeeIds } = req.body;
    const results = [];
    for (const empId of employeeIds) {
      let sheet = await Goal.findOne({ employeeId: empId, cycleId });
      if (!sheet) {
        sheet = await Goal.create({ employeeId: empId, cycleId, goals: [], status: 'draft' });
      }
      if (sheet.goals.length >= 8) {
        results.push({ empId, error: 'Max goals reached' });
        continue;
      }
      const sharedItem = { ...sharedGoal, isShared: true, sharedFrom: null };
      sheet.goals.push(sharedItem);
      await sheet.save();
      results.push({ empId, success: true });
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/actuals — Employee updates quarterly actuals
router.patch('/:id/actuals', protect, async (req, res) => {
  try {
    const sheet = await Goal.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    if (sheet.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your goal sheet' });
    }
    if (!['locked', 'approved'].includes(sheet.status)) {
      return res.status(400).json({ success: false, message: 'Goals must be approved before entering actuals' });
    }

    const { quarter, goalUpdates } = req.body; // quarter: q1|q2|q3|q4
    for (const update of goalUpdates) {
      const goal = sheet.goals.id(update.goalId);
      if (!goal) continue;
      goal[`${quarter}Actual`] = update.actual;
      goal[`${quarter}Status`] = update.status;
      // Compute score
      goal[`${quarter}Score`] = Goal.computeScore(goal, quarter);
    }
    await sheet.save();
    await audit(sheet._id, 'actuals_updated', req.user._id, { quarter }, `${quarter.toUpperCase()} actuals updated`);
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/goals/:id/checkin — Manager adds check-in comment
router.patch('/:id/checkin', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { quarter, comment } = req.body;
    const sheet = await Goal.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Not found' });
    sheet[`${quarter}CheckinDone`] = true;
    sheet.managerComments = comment || sheet.managerComments;
    await sheet.save();
    await audit(sheet._id, 'checkin', req.user._id, { quarter }, comment);
    res.json({ success: true, goal: sheet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
