const express = require('express');
const router = express.Router();
const {
  createBooking,
  reserveBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  createCashfreePaymentOrder,
  verifyCashfreePayment,
  cancelCashfreeOrder,
  getCashfreeStatus
} = require('../controllers/bookingController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');

// Cashfree Payment Gateway Endpoints
router.get('/cashfree/status', getCashfreeStatus);
router.post('/cashfree/create-order', optionalAuth, createCashfreePaymentOrder);
router.post('/cashfree/verify', optionalAuth, verifyCashfreePayment);
router.post('/cashfree/cancel', optionalAuth, cancelCashfreeOrder);

router.post('/create', optionalAuth, createBooking);
router.post('/reserve', optionalAuth, reserveBooking);
router.get('/my-bookings', protect, getMyBookings);

router.get('/all', protect, adminOnly, getAllBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);
router.delete('/:id', protect, adminOnly, deleteBooking);

module.exports = router;
