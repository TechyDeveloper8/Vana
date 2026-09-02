const mongoose = require('mongoose');

const seatAvailabilitySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.Mixed, required: true },
    showtimeDate: { type: String, required: true, default: 'Default' },
    seatId: { type: String, required: true },
    displayLabel: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Available', 'Selected', 'Temporarily Locked', 'Booked', 'Blocked', 'Reserved'],
      default: 'Available'
    },
    lockedBy: { type: String, default: null },
    lockExpiresAt: { type: Date, default: null },
    bookedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    bookingId: { type: String, default: null }
  },
  { timestamps: true }
);

// Compound unique index to guarantee single availability record per seat per showtime
seatAvailabilitySchema.index({ eventId: 1, showtimeDate: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model('SeatAvailability', seatAvailabilitySchema);
