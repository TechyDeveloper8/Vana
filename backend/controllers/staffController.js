const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const CheckInLog = require('../models/CheckInLog');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vana_secret_key_2026_jwt_token_auth';

// 1. Staff Login Endpoint
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid staff credentials' });
    }

    // Check role is staff (or admin)
    if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User is not authorized as Event Staff. Please use Admin or Customer portal.'
      });
    }

    // Check account active status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account has been deactivated by the administrator. Contact management for access.'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid staff credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole || 'Gate Entry',
        assignedEvents: user.assignedEvents || []
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
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
    console.error('Staff Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Events Assigned to Logged-in Staff Member
exports.getAssignedEvents = async (req, res) => {
  try {
    const staffId = req.user.id;
    const user = await User.findById(staffId);

    const assignedIds = user ? (user.assignedEvents || []) : (req.user.assignedEvents || []);
    let events = [];

    if (req.user.role === 'admin' || assignedIds.includes('ALL') || assignedIds.length === 0) {
      events = await Event.find({ status: { $ne: 'Cancelled' } }).sort({ eventDate: 1 });
    } else {
      events = await Event.find({ _id: { $in: assignedIds }, status: { $ne: 'Cancelled' } }).sort({ eventDate: 1 });
    }

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Real-Time Staff Verification Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const staffId = String(req.user.id);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [verifiedCount, duplicateCount, invalidCount, totalBookingsCount, checkedInBookingsCount] = await Promise.all([
      CheckInLog.countDocuments({ staffId, status: 'SUCCESS', scanTimestamp: { $gte: startOfDay } }),
      CheckInLog.countDocuments({ staffId, status: 'DUPLICATE', scanTimestamp: { $gte: startOfDay } }),
      CheckInLog.countDocuments({ staffId, status: { $in: ['INVALID', 'WRONG_EVENT', 'UNAUTHORIZED'] }, scanTimestamp: { $gte: startOfDay } }),
      Booking.countDocuments({ status: { $ne: 'Cancelled' } }),
      Booking.countDocuments({ isCheckedIn: true })
    ]);

    const pendingEntries = Math.max(0, totalBookingsCount - checkedInBookingsCount);

    res.json({
      success: true,
      stats: {
        verifiedToday: verifiedCount,
        pendingEntries: pendingEntries,
        duplicateScans: duplicateCount,
        invalidScans: invalidCount,
        totalBookings: totalBookingsCount,
        checkedInBookings: checkedInBookingsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Instant Ticket Verification Engine (QR Code Check-In)
exports.verifyTicket = async (req, res) => {
  try {
    const { ticketCode, eventId, deviceInfo } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.name || 'Event Staff';
    const staffRole = req.user.staffRole || 'Gate Entry';

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required ticketCode parameter'
      });
    }

    // Sanitize ticket code payload & extract booking ID from various QR formats
    const rawInput = String(ticketCode).trim();
    let extractedCode = rawInput;

    // 1. Check if JSON payload (e.g. {"bookingId": "VANA-2026-..."})
    if (rawInput.includes('{') && rawInput.includes('}')) {
      try {
        const jsonMatch = rawInput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedCode = parsed.bookingId || parsed.id || extractedCode;
        }
      } catch (e) {
        // Keep raw text if parse fails
      }
    }

    // 2. Check if text contains VANA ID pattern (e.g. "Ticket: VANA-2026-123456 | Name: ...")
    const vanaMatch = rawInput.match(/VANA-[A-Za-z0-9-]+/i);
    if (vanaMatch) {
      extractedCode = vanaMatch[0];
    } else {
      const ticketPrefixMatch = rawInput.match(/Ticket:\s*([^\s|]+)/i);
      if (ticketPrefixMatch) {
        extractedCode = ticketPrefixMatch[1];
      }
    }

    const cleanCode = extractedCode.trim().replace(/^["']|["']$/g, '');

    // Verify staff assignment to this event (if specific eventId passed and not 'all')
    const targetEventId = (eventId && eventId !== 'all') ? eventId : null;
    const staffUser = await User.findById(staffId);
    const assignedIds = staffUser ? (staffUser.assignedEvents || []) : (req.user.assignedEvents || []);

    if (targetEventId && req.user.role !== 'admin' && !assignedIds.includes('ALL') && assignedIds.length > 0) {
      const isAssigned = assignedIds.some(id => String(id) === String(targetEventId));
      if (!isAssigned) {
        await CheckInLog.create({
          bookingId: cleanCode,
          eventId: targetEventId,
          staffId: String(staffId),
          staffName,
          staffRole,
          status: 'UNAUTHORIZED',
          message: 'Staff not assigned to this event gate',
          deviceInfo: deviceInfo || ''
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          status: 'UNAUTHORIZED',
          title: 'ACCESS DENIED',
          message: 'You are not assigned to verify tickets for this specific event.'
        });
      }
    }

    // Lookup Booking in Database with case-insensitive regex & flexible matching
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPatterns = [
      { bookingId: cleanCode },
      { bookingId: { $regex: new RegExp('^' + escapeRegex(cleanCode) + '$', 'i') } },
      { bookingId: { $regex: new RegExp('^' + escapeRegex(rawInput) + '$', 'i') } }
    ];

    if (cleanCode.match(/^[0-9a-fA-F]{24}$/)) {
      searchPatterns.push({ _id: cleanCode });
    }

    const booking = await Booking.findOne({ $or: searchPatterns });

    // CASE A: Invalid Ticket Code
    if (!booking) {
      await CheckInLog.create({
        bookingId: cleanCode,
        eventId: targetEventId || 'GENERAL',
        staffId: String(staffId),
        staffName,
        staffRole,
        status: 'INVALID',
        message: 'Ticket ID not found in system database',
        deviceInfo: deviceInfo || ''
      }).catch(() => {});

      return res.status(404).json({
        success: false,
        status: 'INVALID',
        title: 'INVALID TICKET',
        message: `No ticket record found matching code "${cleanCode}". Pass cannot be verified.`
      });
    }

    // CASE B: Wrong Event Code (Only if targetEventId specified)
    if (targetEventId && booking.eventId && String(booking.eventId) !== String(targetEventId)) {
      await CheckInLog.create({
        bookingId: booking.bookingId,
        eventId: targetEventId,
        eventTitle: booking.eventTitle,
        userName: booking.userName,
        userEmail: booking.userEmail,
        ticketCategory: booking.ticketCategory,
        quantity: booking.quantity,
        staffId: String(staffId),
        staffName,
        staffRole,
        status: 'WRONG_EVENT',
        message: `Ticket belongs to "${booking.eventTitle}"`,
        deviceInfo: deviceInfo || ''
      }).catch(() => {});

      return res.status(400).json({
        success: false,
        status: 'WRONG_EVENT',
        title: 'WRONG EVENT PASS',
        message: `This ticket is registered for "${booking.eventTitle}", not for this current event gate.`,
        bookingId: booking.bookingId,
        attendeeName: booking.userName
      });
    }

    // CASE C: Already Checked In (Duplicate Ticket Warning)
    if (booking.isCheckedIn) {
      await CheckInLog.create({
        bookingId: booking.bookingId,
        eventId: booking.eventId || targetEventId,
        eventTitle: booking.eventTitle,
        userName: booking.userName,
        userEmail: booking.userEmail,
        ticketCategory: booking.ticketCategory,
        quantity: booking.quantity,
        staffId: String(staffId),
        staffName,
        staffRole,
        status: 'DUPLICATE',
        message: `Already scanned by ${booking.checkedInBy || 'Gate Staff'}`,
        deviceInfo: deviceInfo || ''
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        status: 'DUPLICATE',
        title: 'TICKET ALREADY USED',
        message: 'WARNING: This ticket was previously scanned and marked checked-in!',
        attendeeName: booking.userName,
        userEmail: booking.userEmail,
        bookingId: booking.bookingId,
        ticketCategory: booking.ticketCategory,
        quantity: booking.quantity,
        checkInTime: booking.checkInTime,
        checkedInBy: booking.checkedInBy || 'Gate Entry',
        checkInGate: booking.checkInGate || 'Gate Entry'
      });
    }

    // CASE D: VALID PASS - INSTANT CHECK-IN CONFIRMATION (GREEN OVERLAY)
    const scanTimestamp = new Date();
    booking.isCheckedIn = true;
    booking.checkInTime = scanTimestamp;
    booking.checkedInBy = staffName;
    booking.checkInGate = staffRole;
    booking.checkInDevice = deviceInfo || 'Mobile Device';

    await booking.save();

    // Log successful check-in
    await CheckInLog.create({
      bookingId: booking.bookingId,
      eventId: booking.eventId || targetEventId,
      eventTitle: booking.eventTitle,
      userName: booking.userName,
      userEmail: booking.userEmail,
      ticketCategory: booking.ticketCategory,
      quantity: booking.quantity,
      staffId: String(staffId),
      staffName,
      staffRole,
      status: 'SUCCESS',
      message: 'Verified & Checked In successfully',
      deviceInfo: deviceInfo || '',
      scanTimestamp
    }).catch(() => {});

    res.json({
      success: true,
      status: 'SUCCESS',
      title: 'ACCESS GRANTED',
      message: 'Ticket verified & checked-in successfully!',
      attendeeName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      bookingId: booking.bookingId,
      ticketCategory: booking.ticketCategory || 'Standard Pass',
      quantity: booking.quantity || 1,
      eventTitle: booking.eventTitle,
      checkInTime: scanTimestamp,
      checkedInBy: staffName,
      checkInGate: staffRole
    });
  } catch (error) {
    console.error('Ticket verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Staff Member's Recent Shift Scans directly from MongoDB
exports.getMyScans = async (req, res) => {
  try {
    const staffId = String(req.user.id);
    const logs = await CheckInLog.find({ staffId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
