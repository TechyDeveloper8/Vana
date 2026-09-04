const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, testEmailConfiguration } = require('../utils/emailService');

const inMemoryOTPs = new Map();

const storeOTP = async (email, otp, purpose) => {
  const cleanEmail = email.toLowerCase().trim();
  inMemoryOTPs.set(`${cleanEmail}_${purpose}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  try {
    await OTP.deleteMany({ email: cleanEmail, purpose });
    await OTP.create({ email: cleanEmail, otp, purpose });
  } catch (err) {
    console.warn('[OTP STORAGE WARN] MongoDB OTP operation failed, using memory fallback:', err.message);
  }
};

const verifyOTPCode = async (email, otp, purpose) => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanOTP = String(otp).trim();

  try {
    const otpRecord = await OTP.findOne({ email: cleanEmail, purpose, otp: cleanOTP });
    if (otpRecord) {
      await OTP.deleteMany({ email: cleanEmail, purpose });
      inMemoryOTPs.delete(`${cleanEmail}_${purpose}`);
      return true;
    }
  } catch (err) {
    // fallback
  }

  const memData = inMemoryOTPs.get(`${cleanEmail}_${purpose}`);
  if (memData) {
    if (memData.otp === cleanOTP && Date.now() < memData.expiresAt) {
      inMemoryOTPs.delete(`${cleanEmail}_${purpose}`);
      return true;
    }
  }

  return false;
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      staffRole: user.staffRole || 'Gate Entry',
      assignedEvents: user.assignedEvents || []
    },
    process.env.JWT_SECRET || 'vana_secret_key_2026_jwt_token_auth',
    { expiresIn: '7d' }
  );
};

// Send OTP for Registration
exports.sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === 'vanaentertainmentswork@gmail.com') {
      return res.status(400).json({ success: false, message: 'This email is reserved for system administration.' });
    }

    let userExists = null;
    try {
      userExists = await User.findOne({ email: cleanEmail });
    } catch (e) {
      userExists = null;
    }

    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await storeOTP(cleanEmail, otp, 'register');

    const emailRes = await sendOTPEmail(cleanEmail, otp, 'register');

    console.log('\n======================================================');
    console.log(`🔑 [VANA REGISTRATION OTP] User: ${cleanEmail}`);
    console.log(`👉 VERIFICATION CODE: [ ${otp} ]`);
    console.log(`📨 Delivery Status: ${emailRes.success ? 'Delivered via Email API' : 'Email API delivery error (' + emailRes.error + ')'}`);
    console.log('======================================================\n');

    if (!emailRes.success) {
      console.warn(`[AUTH NOTICE] Email delivery failed for ${cleanEmail}:`, emailRes.error);
      return res.json({
        success: true,
        message: `Verification code generated. (Email notice: ${emailRes.error || 'Check Brevo API key'}: code is ${otp})`,
        devOtp: otp,
        emailSent: false
      });
    }

    res.json({
      success: true,
      message: `Verification OTP sent to ${cleanEmail}`,
      emailSent: true
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send OTP for Forgot Password
exports.sendForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    try {
      user = await User.findOne({ email: cleanEmail });
    } catch (e) {
      user = null;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email address' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await storeOTP(cleanEmail, otp, 'forgot_password');

    const emailRes = await sendOTPEmail(cleanEmail, otp, 'forgot_password');

    console.log('\n======================================================');
    console.log(`🔑 [VANA PASSWORD RESET OTP] User: ${cleanEmail}`);
    console.log(`👉 VERIFICATION CODE: [ ${otp} ]`);
    console.log(`📨 Delivery Status: ${emailRes.success ? 'Delivered via Email API' : 'Email API delivery error (' + emailRes.error + ')'}`);
    console.log('======================================================\n');

    if (!emailRes.success) {
      console.warn(`[AUTH NOTICE] Email delivery failed for ${cleanEmail}:`, emailRes.error);
      return res.json({
        success: true,
        message: `Password reset code generated. (Email notice: ${emailRes.error || 'Check Brevo API key'}: code is ${otp})`,
        devOtp: otp,
        emailSent: false
      });
    }

    res.json({
      success: true,
      message: `Password reset OTP sent to ${cleanEmail}`,
      emailSent: true
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const isValidOTP = await verifyOTPCode(cleanEmail, otp, 'forgot_password');
    if (!isValidOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register User (with OTP verification)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide all fields including verification OTP' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === 'vanaentertainmentswork@gmail.com') {
      return res.status(403).json({ success: false, message: 'Reserved administrative email address' });
    }

    const isValidOTP = await verifyOTPCode(cleanEmail, otp, 'register');
    if (!isValidOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification OTP code' });
    }

    let userExists = null;
    try {
      userExists = await User.findOne({ email: cleanEmail });
    } catch (e) {
      userExists = null;
    }

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email: cleanEmail, phone, password, role: 'user' });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Universal Login Endpoint (Customer, Staff & Admin Role Auto-Detection)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by administrator. Please contact support.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        staffRole: user.staffRole || 'Gate Entry',
        assignedEvents: user.assignedEvents || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Login (Fixed to official admin email: vanaentertainmentswork@gmail.com)
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide admin password' });
    }

    const cleanUser = (username || 'vanaentertainmentswork@gmail.com').toLowerCase().trim();

    if (cleanUser !== 'vanaentertainmentswork@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only the official administrator email (vanaentertainmentswork@gmail.com) is authorized.'
      });
    }

    const user = await User.findOne({ email: 'vanaentertainmentswork@gmail.com' });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole || 'Gate Entry',
        assignedEvents: user.assignedEvents || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Current User Profile
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// Check Email Service & Brevo Gateway Status
exports.getEmailStatus = async (req, res) => {
  try {
    const status = await testEmailConfiguration();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


