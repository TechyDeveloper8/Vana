const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginAdmin,
  getMe,
  sendSignupOTP,
  sendForgotOTP,
  resetPassword,
  getEmailStatus
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/email-status', getEmailStatus);
router.post('/send-signup-otp', sendSignupOTP);
router.post('/register', registerUser);
router.post('/send-forgot-otp', sendForgotOTP);
router.post('/reset-password', resetPassword);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.get('/me', protect, getMe);

module.exports = router;

