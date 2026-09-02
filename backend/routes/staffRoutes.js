const express = require('express');
const router = express.Router();
const {
  staffLogin,
  getAssignedEvents,
  getDashboardStats,
  verifyTicket,
  getMyScans
} = require('../controllers/staffController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

// Staff Authentication (Public login endpoint for staff credentials)
router.post('/login', staffLogin);

// Protected Staff Portal Routes
router.get('/assigned-events', protect, staffOnly, getAssignedEvents);
router.get('/dashboard-stats', protect, staffOnly, getDashboardStats);
router.post('/verify-ticket', protect, staffOnly, verifyTicket);
router.get('/my-scans', protect, staffOnly, getMyScans);

module.exports = router;
