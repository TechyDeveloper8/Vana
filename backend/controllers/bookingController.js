const Booking = require('../models/Booking');
const SeatAvailability = require('../models/SeatAvailability');
const QRCode = require('qrcode');
const { sendTicketEmail } = require('../utils/emailService');

// 1. Create Booking (Online or Admin Manual Entry)
exports.createBooking = async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      userPhone,
      eventTitle,
      eventId,
      ticketCategory,
      quantity = 1,
      unitPrice = 999,
      paymentStatus = 'Paid',
      selectedSeats = [],
      showtimeDate = 'Default'
    } = req.body;

    let computedSubtotal = 0;
    let finalQuantity = Number(quantity);

    if (selectedSeats && selectedSeats.length > 0) {
      finalQuantity = selectedSeats.length;
      computedSubtotal = selectedSeats.reduce((sum, seat) => sum + (Number(seat.price) || 0), 0);
    } else {
      computedSubtotal = Number(unitPrice) * finalQuantity;
    }

    const subtotal = computedSubtotal;
    const gst = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gst;
    const bookingId = 'VANA-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

    // Format seat labels for QR code & Ticket Pass
    const seatDisplayString = selectedSeats.map(s => s.displayLabel || s.seatId).join(', ');
    const categoryString = selectedSeats.length > 0
      ? [...new Set(selectedSeats.map(s => s.category))].join(', ')
      : (ticketCategory || 'Standard Pass');

    // Generate QR code data URL (JSON formatted payload for scanner compatibility)
    const qrData = JSON.stringify({
      bookingId,
      userName,
      eventTitle,
      quantity: finalQuantity,
      seats: seatDisplayString
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    const bookingPayload = {
      bookingId,
      userId: req.user ? req.user.id : null,
      userName: userName || (req.user ? req.user.name : 'Guest User'),
      userEmail: userEmail || (req.user ? req.user.email : 'guest@example.com'),
      userPhone: userPhone || '+91-9876543210',
      eventId: eventId || null,
      eventTitle: eventTitle || 'Vana Special Event',
      ticketCategory: categoryString,
      quantity: finalQuantity,
      unitPrice: selectedSeats.length > 0 ? Math.round(subtotal / finalQuantity) : Number(unitPrice),
      subtotal,
      gst,
      totalAmount,
      paymentStatus: paymentStatus || 'Paid',
      razorpayOrderId: 'order_' + Date.now(),
      razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(7),
      qrCodeUrl,
      isCheckedIn: false,
      showtimeDate,
      selectedSeats
    };

    const booking = await Booking.create(bookingPayload);

    // Update SeatAvailability permanently to 'Booked' for each selected seat
    if (eventId && selectedSeats.length > 0) {
      const seatIds = selectedSeats.map(s => s.seatId);
      await SeatAvailability.updateMany(
        { eventId, showtimeDate, seatId: { $in: seatIds } },
        {
          $set: {
            status: 'Booked',
            bookedBy: req.user ? req.user.id : null,
            bookingId: booking.bookingId,
            lockedBy: null,
            lockExpiresAt: null
          }
        }
      );

      const updatedSeats = await SeatAvailability.find({ eventId, showtimeDate, seatId: { $in: seatIds } });

      // Real-time broadcast update to all connected socket clients
      const io = req.app.get('io');
      if (io) {
        const roomName = `${eventId}_${showtimeDate}`;
        io.to(roomName).emit('seatStatusChanged', {
          action: 'booked',
          bookingId: booking.bookingId,
          seatIds,
          seats: updatedSeats
        });
      }
    }

    // Dispatch ticket email pass to user's Gmail asynchronously
    const emailResult = await sendTicketEmail(booking);

    res.status(201).json({
      success: true,
      message: 'Booking completed successfully!',
      emailSent: emailResult.success,
      booking
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Logged-in User's Bookings
exports.getMyBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const bookings = await Booking.find({
      $or: [{ userId: req.user.id }, { userEmail: req.user.email }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get All Bookings (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Single Booking by ID (Admin / User)
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Toggle / Update Booking Check-in & Payment Status (Admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isCheckedIn, paymentStatus } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (isCheckedIn !== undefined) {
      booking.isCheckedIn = isCheckedIn;
      if (isCheckedIn) {
        booking.checkInTime = new Date();
        booking.checkedInBy = req.user ? `${req.user.name} (Admin Override)` : 'Admin Override';
        booking.checkInGate = 'Admin Panel';
      } else {
        booking.checkInTime = null;
        booking.checkedInBy = '';
        booking.checkInGate = '';
      }
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete Booking (Admin)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
