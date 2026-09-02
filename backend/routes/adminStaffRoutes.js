const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  getCheckInLogs
} = require('../controllers/adminStaffController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All endpoints restricted strictly to Admin role
router.get('/', protect, adminOnly, getAllStaff);
router.post('/', protect, adminOnly, createStaff);
router.put('/:id', protect, adminOnly, updateStaff);
router.patch('/:id/status', protect, adminOnly, toggleStaffStatus);
router.delete('/:id', protect, adminOnly, deleteStaff);
router.get('/checkin-logs', protect, adminOnly, getCheckInLogs);

module.exports = router;
