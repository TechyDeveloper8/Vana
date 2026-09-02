const express = require('express');
const router = express.Router();
const {
  getLayout,
  getShowtimeAvailability,
  lockSeats,
  releaseSeats,
  adminUpdateSeatStatus,
  adminUpdateTierPrices,
  adminUpdateLayoutCoordinates
} = require('../controllers/seatingController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');

// Public customer routes
router.get('/layout/:venueId?', getLayout);
router.get('/availability', getShowtimeAvailability);
router.post('/lock', optionalAuth, lockSeats);
router.post('/release', optionalAuth, releaseSeats);

// Admin-only management routes
router.post('/admin/status', protect, adminOnly, adminUpdateSeatStatus);
router.post('/admin/prices', protect, adminOnly, adminUpdateTierPrices);
router.put('/admin/layout', protect, adminOnly, adminUpdateLayoutCoordinates);

module.exports = router;
