const express = require('express');
const router = express.Router();
const Cycle = require('../models/Cycle');
const { protect, authorize } = require('../middleware/auth');

// GET /api/cycles — all cycles
router.get('/', protect, async (req, res) => {
  try {
    const cycles = await Cycle.find().sort('-year');
    res.json({ success: true, cycles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cycles/active
router.get('/active', protect, async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ isActive: true });
    if (!cycle) return res.status(404).json({ success: false, message: 'No active cycle' });
    res.json({ success: true, cycle, phase: cycle.currentPhase() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cycles — Admin creates
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, cycle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/cycles/:id — Admin updates
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cycle) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, cycle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/cycles/:id/activate
router.patch('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    await Cycle.updateMany({}, { isActive: false });
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ success: true, cycle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
