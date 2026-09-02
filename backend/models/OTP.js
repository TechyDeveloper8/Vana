const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['register', 'forgot_password'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600 // Automatically delete after 10 minutes (600 seconds)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OTP', otpSchema);
