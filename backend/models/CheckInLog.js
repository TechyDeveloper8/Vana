const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    eventId: { type: String, required: true },
    eventTitle: { type: String, default: '' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    ticketCategory: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    staffRole: { type: String, default: 'Gate Entry' },
    status: {
      type: String,
      enum: ['SUCCESS', 'DUPLICATE', 'INVALID', 'WRONG_EVENT', 'UNAUTHORIZED'],
      required: true
    },
    message: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
    scanTimestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CheckInLog', checkInLogSchema);
