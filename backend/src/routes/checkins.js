const express = require('express');
const router = express.Router();
// Check-ins are handled in goals routes (PATCH /goals/:id/checkin and /actuals)
// This router can hold additional check-in analytics in future
module.exports = router;
