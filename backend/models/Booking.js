const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.Mixed, default: null },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.Mixed, default: null },
    eventTitle: { type: String, required: true },
    ticketCategory: { type: String, default: 'General' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
    cashfreeOrderId: { type: String, default: '' },
    cashfreePaymentId: { type: String, default: '' },
    paymentSessionId: { type: String, default: '' },
    paymentGateway: { type: String, default: 'Cashfree' },
    paymentMethod: { type: String, default: 'Cashfree PG' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    qrCodeUrl: { type: String, default: '' },
    isCheckedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
    checkedInBy: { type: String, default: '' },
    checkInGate: { type: String, default: '' },
    checkInDevice: { type: String, default: '' },
    showtimeDate: { type: String, default: 'Default' },
    selectedSeats: [
      {
        seatId: { type: String },
        displayLabel: { type: String },
        category: { type: String },
        price: { type: Number },
        section: { type: String },
        row: { type: String },
        seatNumber: { type: Number }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
