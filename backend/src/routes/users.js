const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users — Admin: all users; Manager: their team
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query = { managerId: req.user._id };
    } else if (req.user.role === 'employee') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const users = await User.find(query).populate('managerId', 'name email').sort('name');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/managers — list all managers (for admin)
router.get('/managers', protect, authorize('admin'), async (req, res) => {
  try {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } }).select('name email department');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users — Admin creates user
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, managerId, employeeId } = req.body;
    const user = await User.create({ name, email, password, role, department, managerId: managerId || null, employeeId });
    res.status(201).json({ success: true, user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email or Employee ID already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id — Admin updates user
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, department, managerId, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, managerId: managerId || null, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/my-team — Manager sees their team
router.get('/my-team', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const team = await User.find({ managerId: req.user._id, isActive: true }).select('name email department employeeId');
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
