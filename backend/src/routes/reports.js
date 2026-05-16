const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reports/achievement?cycleId=&format=json|csv
router.get('/achievement', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { cycleId, format } = req.query;
    let empQuery = {};
    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id });
      empQuery = { employeeId: { $in: team.map(u => u._id) } };
    }
    const query = { ...empQuery };
    if (cycleId) query.cycleId = cycleId;
    const goals = await Goal.find(query)
      .populate('employeeId', 'name email department employeeId')
      .populate('cycleId', 'name year');

    // Flatten for report
    const rows = [];
    for (const sheet of goals) {
      for (const g of sheet.goals) {
        rows.push({
          employee: sheet.employeeId?.name,
          employeeId: sheet.employeeId?.employeeId,
          department: sheet.employeeId?.department,
          cycle: sheet.cycleId?.name,
          goalTitle: g.title,
          thrustArea: g.thrustArea,
          uom: g.uomType,
          weightage: g.weightage,
          target: g.target,
          q1Actual: g.q1Actual ?? '',
          q1Score: g.q1Score ?? '',
          q1Status: g.q1Status,
          q2Actual: g.q2Actual ?? '',
          q2Score: g.q2Score ?? '',
          q2Status: g.q2Status,
          q3Actual: g.q3Actual ?? '',
          q3Score: g.q3Score ?? '',
          q3Status: g.q3Status,
          q4Actual: g.q4Actual ?? '',
          q4Score: g.q4Score ?? '',
          q4Status: g.q4Status,
          sheetStatus: sheet.status,
        });
      }
    }

    if (format === 'csv') {
      const fields = Object.keys(rows[0] || {});
      const csv = [fields.join(','), ...rows.map(r => fields.map(f => JSON.stringify(r[f] ?? '')).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=achievement_report.csv');
      return res.send(csv);
    }

    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/completion?cycleId=  — Check-in completion dashboard
router.get('/completion', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { cycleId } = req.query;
    const query = {};
    if (cycleId) query.cycleId = cycleId;
    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id });
      query.employeeId = { $in: team.map(u => u._id) };
    }
    const sheets = await Goal.find(query).populate('employeeId', 'name department');
    const rows = sheets.map(s => ({
      employee: s.employeeId?.name,
      department: s.employeeId?.department,
      status: s.status,
      q1Done: s.q1CheckinDone,
      q2Done: s.q2CheckinDone,
      q3Done: s.q3CheckinDone,
      q4Done: s.q4CheckinDone,
    }));
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
