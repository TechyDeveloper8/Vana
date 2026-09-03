const Booking = require('../models/Booking');
const SeatAvailability = require('../models/SeatAvailability');
const QRCode = require('qrcode');
const { sendTicketEmail } = require('../utils/emailService');
const { createCashfreeOrder, verifyCashfreeOrder } = require('../utils/cashfreeService');

// 1. Create Booking (Online or Admin Manual Entry)
exports.createBooking = async (req, res) => {
  try {
    let {
      userName,
      userEmail,
      userPhone,
      eventTitle,
      eventId,
      ticketCategory = 'Standard Pass',
      quantity = 1,
      unitPrice = 999,
      paymentStatus = 'Paid',
      paymentGateway = 'Admin Manual Entry',
      paymentMethod = 'Cash at Counter',
      selectedSeats = [],
      seatNumbers = '',
      section = 'Ground Floor',
      showtimeDate = 'Default',
      sendEmail = true
    } = req.body;

    // 1. Strict Validation
    if (!userName || !userName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer full name is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail || !userEmail.trim() || !emailRegex.test(userEmail.trim())) {
      return res.status(400).json({ success: false, message: 'A valid customer email address is required to dispatch the ticket pass.' });
    }
    if (!userPhone || !userPhone.trim() || userPhone.trim().replace(/\D/g, '').length < 7) {
      return res.status(400).json({ success: false, message: 'A valid customer phone number (at least 7 digits) is required.' });
    }
    if (!eventTitle && !eventId) {
      return res.status(400).json({ success: false, message: 'Please select an event for this reservation.' });
    }

    // 2. Parse Seat Numbers if provided as comma-separated string
    let parsedSeats = [];
    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      parsedSeats = selectedSeats;
    } else if (typeof seatNumbers === 'string' && seatNumbers.trim()) {
      const rawSeatList = seatNumbers.split(',').map(s => s.trim()).filter(Boolean);
      parsedSeats = rawSeatList.map(s => {
        const parts = s.split('-');
        const row = parts[0] || 'A';
        const num = parseInt(parts[1]) || 1;
        return {
          seatId: s,
          displayLabel: s,
          category: ticketCategory,
          price: Number(unitPrice) || 999,
          section: section || 'General Seating',
          row,
          seatNumber: num
        };
      });
    }

    let finalQuantity = Number(quantity) || 1;
    let computedSubtotal = 0;

    if (parsedSeats.length > 0) {
      finalQuantity = parsedSeats.length;
      computedSubtotal = parsedSeats.reduce((sum, seat) => sum + (Number(seat.price) || Number(unitPrice) || 0), 0);
    } else {
      computedSubtotal = (Number(unitPrice) || 0) * finalQuantity;
    }

    const subtotal = computedSubtotal;
    const gst = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gst;
    const bookingId = 'VANA-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

    // Format seat labels for QR code & Ticket Pass
    const seatDisplayString = parsedSeats.length > 0
      ? parsedSeats.map(s => s.displayLabel || s.seatId).join(', ')
      : 'General Seating';

    const categoryString = parsedSeats.length > 0
      ? [...new Set(parsedSeats.map(s => s.category))].join(', ')
      : ticketCategory;

    // Generate QR code data URL (JSON formatted payload for scanner compatibility)
    const qrData = JSON.stringify({
      bookingId,
      userName: userName.trim(),
      eventTitle,
      quantity: finalQuantity,
      seats: seatDisplayString,
      showtime: showtimeDate,
      issuedBy: req.user ? `${req.user.name} (Admin)` : 'Admin Desk'
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    const bookingPayload = {
      bookingId,
      userId: req.user ? req.user.id : null,
      userName: userName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userPhone: userPhone.trim(),
      eventId: eventId || null,
      eventTitle: eventTitle || 'Vana Special Event',
      ticketCategory: categoryString,
      quantity: finalQuantity,
      unitPrice: parsedSeats.length > 0 ? Math.round(subtotal / finalQuantity) : Number(unitPrice),
      subtotal,
      gst,
      totalAmount,
      paymentStatus: paymentStatus || 'Paid',
      paymentGateway: paymentGateway || 'Admin Manual Entry',
      paymentMethod: paymentMethod || 'Cash at Counter',
      cashfreeOrderId: `MANUAL_${Date.now()}`,
      cashfreePaymentId: `MAN_PAY_${Math.random().toString(36).substring(7).toUpperCase()}`,
      qrCodeUrl,
      isCheckedIn: false,
      showtimeDate,
      selectedSeats: parsedSeats
    };

    const booking = await Booking.create(bookingPayload);

    // Update SeatAvailability permanently to 'Booked' for each selected seat
    if (eventId && parsedSeats.length > 0) {
      const seatIds = parsedSeats.map(s => s.seatId);
      for (const seat of parsedSeats) {
        await SeatAvailability.findOneAndUpdate(
          { eventId, showtimeDate, seatId: seat.seatId },
          {
            $set: {
              status: 'Booked',
              bookedBy: req.user ? req.user.id : null,
              bookingId: booking.bookingId,
              lockedBy: null,
              lockExpiresAt: null,
              category: seat.category || ticketCategory,
              price: seat.price || unitPrice,
              row: seat.row,
              seatNumber: seat.seatNumber,
              displayLabel: seat.displayLabel
            }
          },
          { upsert: true, new: true }
        );
      }

      const updatedSeats = await SeatAvailability.find({ eventId, showtimeDate, seatId: { $in: seatIds } });

      // Real-time broadcast update to all connected socket clients
      const io = req.app?.get ? req.app.get('io') : null;
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

    // Dispatch ticket email pass to user's email address
    let emailResult = { success: false, message: 'Email dispatch disabled by admin' };
    if (sendEmail !== false) {
      emailResult = await sendTicketEmail(booking);
    }

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? `Manual booking confirmed! Official entrance pass emailed to ${booking.userEmail}.`
        : `Manual booking confirmed! (Note: Email dispatch result: ${emailResult.error || 'Check email configuration'})`,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
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

// 7. Create Cashfree Payment Order & Lock Seats
exports.createCashfreePaymentOrder = async (req, res) => {
  try {
    const {
      eventId,
      eventTitle = 'Vana Live Performance',
      showtimeDate = 'Default',
      selectedSeats = [],
      userName,
      userEmail,
      userPhone,
      returnUrl
    } = req.body;

    if (!selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one seat to proceed.' });
    }

    const lockUser = req.user ? req.user.id : (userName ? `guest_${userName.replace(/\s+/g, '_')}` : `guest_${Date.now()}`);
    const seatIds = selectedSeats.map(s => s.seatId);

    // Compute prices
    const subtotal = selectedSeats.reduce((sum, seat) => sum + (Number(seat.price) || 0), 0);
    const gst = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gst;

    // Lock seats atomically for 10 minutes
    if (eventId) {
      const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const lockedSeats = [];
      const failedSeatIds = [];

      for (const seatId of seatIds) {
        const updated = await SeatAvailability.findOneAndUpdate(
          {
            eventId,
            showtimeDate,
            seatId,
            $or: [
              { status: 'Available' },
              { status: 'Temporarily Locked', lockedBy: lockUser }
            ]
          },
          {
            $set: {
              status: 'Temporarily Locked',
              lockedBy: lockUser,
              lockExpiresAt
            }
          },
          { new: true }
        );

        if (updated) {
          lockedSeats.push(updated);
        } else {
          failedSeatIds.push(seatId);
        }
      }

      if (failedSeatIds.length > 0) {
        // Rollback any seats locked in this pass
        if (lockedSeats.length > 0) {
          const rollbackIds = lockedSeats.map(s => s.seatId);
          await SeatAvailability.updateMany(
            { eventId, showtimeDate, seatId: { $in: rollbackIds }, lockedBy: lockUser },
            { $set: { status: 'Available', lockedBy: null, lockExpiresAt: null } }
          );
        }
        return res.status(409).json({
          success: false,
          message: `Seats ${failedSeatIds.join(', ')} are no longer available or already locked.`,
          failedSeatIds
        });
      }

      // Broadcast real-time seat lock to connected clients
      const io = req.app.get('io');
      if (io) {
        const roomName = `${eventId}_${showtimeDate}`;
        io.to(roomName).emit('seatStatusChanged', {
          action: 'lock',
          lockedBy: lockUser,
          seatIds,
          seats: lockedSeats
        });
      }
    }

    // Generate Cashfree Order ID
    const orderId = `VANA_CF_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const cfOrder = await createCashfreeOrder({
      orderId,
      orderAmount: totalAmount,
      customerId: req.user ? req.user.id : `cust_${Date.now()}`,
      customerName: userName || (req.user ? req.user.name : 'Guest User'),
      customerEmail: userEmail || (req.user ? req.user.email : 'guest@example.com'),
      customerPhone: userPhone || '9876543210',
      returnUrl
    });

    res.status(200).json({
      success: true,
      orderId,
      cfOrderId: cfOrder.cf_order_id,
      paymentSessionId: cfOrder.payment_session_id,
      orderAmount: totalAmount,
      subtotal,
      gst,
      isTestMode: cfOrder.isTestMode,
      env: cfOrder.env,
      selectedSeats,
      warning: cfOrder.warning
    });
  } catch (error) {
    console.error('Create Cashfree Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Verify Cashfree Payment & Finalize Reservation
exports.verifyCashfreePayment = async (req, res) => {
  try {
    const {
      orderId,
      eventId,
      eventTitle = 'Vana Live Performance',
      showtimeDate = 'Default',
      selectedSeats = [],
      userName,
      userEmail,
      userPhone,
      ticketCategory,
      paymentMethod = 'Cashfree PG'
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required for payment verification.' });
    }

    // Verify payment with Cashfree PG
    const verification = await verifyCashfreeOrder(orderId);

    if (!verification.success || !verification.isPaid) {
      return res.status(400).json({
        success: false,
        message: verification.message || 'Payment not verified with Cashfree. Order is not paid.',
        verification
      });
    }

    // Compute final pricing
    const finalQuantity = selectedSeats.length > 0 ? selectedSeats.length : 1;
    const computedSubtotal = selectedSeats.length > 0
      ? selectedSeats.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
      : 999;
    const gst = Math.round(computedSubtotal * 0.18);
    const totalAmount = computedSubtotal + gst;

    const bookingId = 'VANA-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const seatDisplayString = selectedSeats.map(s => s.displayLabel || s.seatId).join(', ');
    const categoryString = selectedSeats.length > 0
      ? [...new Set(selectedSeats.map(s => s.category))].join(', ')
      : (ticketCategory || 'Standard Pass');

    // Generate QR Code data URL
    const qrData = JSON.stringify({
      bookingId,
      userName,
      eventTitle,
      quantity: finalQuantity,
      seats: seatDisplayString,
      cashfreeOrderId: orderId
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Create permanent Booking record
    const bookingPayload = {
      bookingId,
      userId: req.user ? req.user.id : null,
      userName: userName || (req.user ? req.user.name : 'Guest User'),
      userEmail: userEmail || (req.user ? req.user.email : 'guest@example.com'),
      userPhone: userPhone || '+91-9876543210',
      eventId: eventId || null,
      eventTitle,
      ticketCategory: categoryString,
      quantity: finalQuantity,
      unitPrice: Math.round(computedSubtotal / finalQuantity),
      subtotal: computedSubtotal,
      gst,
      totalAmount,
      paymentStatus: 'Paid',
      paymentGateway: 'Cashfree',
      paymentMethod: verification.payment_method || paymentMethod || 'Cashfree PG',
      cashfreeOrderId: orderId,
      cashfreePaymentId: verification.cf_payment_id || `cf_pay_${Date.now()}`,
      qrCodeUrl,
      isCheckedIn: false,
      showtimeDate,
      selectedSeats
    };

    const booking = await Booking.create(bookingPayload);

    // Permanently mark seats as Booked
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

    // Send Ticket confirmation email
    const emailResult = await sendTicketEmail(booking);

    res.status(201).json({
      success: true,
      message: 'Payment verified successfully and booking confirmed!',
      emailSent: emailResult.success,
      booking
    });
  } catch (error) {
    console.error('Verify Cashfree Payment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Cancel Cashfree Order & Release Locked Seats
exports.cancelCashfreeOrder = async (req, res) => {
  try {
    const { eventId, showtimeDate = 'Default', seatIds = [] } = req.body;

    if (eventId && seatIds.length > 0) {
      await SeatAvailability.updateMany(
        { eventId, showtimeDate, seatId: { $in: seatIds }, status: 'Temporarily Locked' },
        { $set: { status: 'Available', lockedBy: null, lockExpiresAt: null } }
      );

      const updatedSeats = await SeatAvailability.find({ eventId, showtimeDate, seatId: { $in: seatIds } });

      const io = req.app.get('io');
      if (io) {
        const roomName = `${eventId}_${showtimeDate}`;
        io.to(roomName).emit('seatStatusChanged', {
          action: 'release',
          seatIds,
          seats: updatedSeats
        });
      }
    }

    res.json({ success: true, message: 'Seats released successfully.' });
  } catch (error) {
    console.error('Cancel Cashfree Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
