const SeatLayout = require('../models/SeatLayout');
const SeatAvailability = require('../models/SeatAvailability');
const Event = require('../models/Event');
const { generateVenueLayout } = require('../utils/seatingLayoutData');

// Helper to cleanup expired locks lazily
const cleanupExpiredLocks = async (eventId, showtimeDate) => {
  try {
    const now = new Date();
    const expiredSeats = await SeatAvailability.find({
      eventId,
      showtimeDate,
      status: 'Temporarily Locked',
      lockExpiresAt: { $lt: now }
    });

    if (expiredSeats.length > 0) {
      const expiredIds = expiredSeats.map(s => s._id);
      await SeatAvailability.updateMany(
        { _id: { $in: expiredIds } },
        {
          $set: {
            status: 'Available',
            lockedBy: null,
            lockExpiresAt: null
          }
        }
      );
      return expiredSeats.map(s => s.seatId);
    }
  } catch (err) {
    console.error('Error cleaning up expired locks:', err);
  }
  return [];
};

// 1. Get Venue Seating Layout Configuration
exports.getLayout = async (req, res) => {
  try {
    const venueId = req.params.venueId || 'ground-floor-main';
    const forceReseed = req.query.forceReseed === 'true';
    let layout = await SeatLayout.findOne({ venueId }).lean();

    // Auto-update if layout is missing, forceReseed requested, or has old colliding FFR seats or old category mapping
    const hasOldLayout = layout && layout.seats && (
      layout.seats.some(s => s.seatId && s.seatId.startsWith('FFR-') && s.rotation !== 0) ||
      layout.seats.some(s => ['A', 'B', 'C', 'D', 'E'].includes(s.row) && s.category === 'Platinum')
    );

    if (!layout || forceReseed || hasOldLayout) {
      console.log('Seeding / updating corrected seating layout...');
      await SeatLayout.deleteMany({ venueId });
      const seedData = generateVenueLayout();
      layout = await SeatLayout.create(seedData);
    }

    res.json({ success: true, data: layout });
  } catch (error) {
    console.error('Get Layout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Real-Time Seat Availability for Event & Showtime
exports.getShowtimeAvailability = async (req, res) => {
  try {
    const { eventId, showtimeDate } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId query parameter is required' });
    }

    const showtime = showtimeDate || 'Default';

    // 1. Cleanup expired locks first
    const expiredSeatIds = await cleanupExpiredLocks(eventId, showtime);

    // 2. Fetch existing seat inventory for this showtime (.lean() minimizes RAM for 1,006 seats)
    let availability = await SeatAvailability.find({ eventId, showtimeDate: showtime })
      .select('seatId displayLabel category price status lockedBy')
      .lean();

    // 3. If inventory does not exist yet, auto-initialize from venue layout
    if (availability.length === 0) {
      let layout = await SeatLayout.findOne({ venueId: 'ground-floor-main' });
      if (!layout) {
        const seedData = generateVenueLayout();
        layout = await SeatLayout.create(seedData);
      }

      // Check if event has price tiers configured
      const event = await Event.findById(eventId);
      let defaultSilverPrice = 500;
      let defaultGoldPrice = 700;
      let defaultPlatinumPrice = 1000;
      let defaultVipPrice = 1500;

      if (event && event.ticketTiers && event.ticketTiers.length > 0) {
        event.ticketTiers.forEach(tier => {
          const name = tier.tierName.toLowerCase();
          if (name.includes('silv') || name.includes('first')) defaultSilverPrice = tier.price;
          if (name.includes('gold')) defaultGoldPrice = tier.price;
          if (name.includes('plat')) defaultPlatinumPrice = tier.price;
          if (name.includes('vip')) defaultVipPrice = tier.price;
        });
      }

      const newDocs = layout.seats.map(seat => {
        let price = defaultPlatinumPrice;
        if (seat.category === 'Silver') price = defaultSilverPrice;
        if (seat.category === 'Gold') price = defaultGoldPrice;
        if (seat.category === 'VIP Lounge') price = defaultVipPrice;

        return {
          eventId,
          showtimeDate: showtime,
          seatId: seat.seatId,
          displayLabel: seat.displayLabel,
          category: seat.category,
          price,
          status: 'Available'
        };
      });

      await SeatAvailability.insertMany(newDocs);
      availability = await SeatAvailability.find({ eventId, showtimeDate: showtime })
        .select('seatId displayLabel category price status lockedBy')
        .lean();
    }

    res.json({
      success: true,
      eventId,
      showtimeDate: showtime,
      count: availability.length,
      expiredReleased: expiredSeatIds,
      data: availability
    });
  } catch (error) {
    console.error('Get Availability Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Atomic Lock Seats Prior to Checkout
exports.lockSeats = async (req, res) => {
  try {
    const { eventId, showtimeDate = 'Default', seatIds = [], lockedBy } = req.body;

    if (!eventId || !seatIds || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'eventId and seatIds are required' });
    }

    const lockUser = lockedBy || (req.user ? req.user.id : 'guest_' + Date.now());
    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lock

    // Cleanup expired locks first
    await cleanupExpiredLocks(eventId, showtimeDate);

    const lockedSeats = [];
    const failedSeatIds = [];

    // Attempt atomic lock per requested seat
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

    // If any seat failed to lock (already locked by someone else), rollback created locks
    if (failedSeatIds.length > 0) {
      if (lockedSeats.length > 0) {
        const rollbackSeatIds = lockedSeats.map(s => s.seatId);
        await SeatAvailability.updateMany(
          { eventId, showtimeDate, seatId: { $in: rollbackSeatIds }, lockedBy: lockUser },
          { $set: { status: 'Available', lockedBy: null, lockExpiresAt: null } }
        );
      }

      return res.status(409).json({
        success: false,
        message: `Seats ${failedSeatIds.join(', ')} are no longer available or already locked by another user.`,
        failedSeatIds
      });
    }

    // Broadcast real-time lock update via Socket.IO if attached to req.app
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

    res.json({
      success: true,
      message: 'Seats locked successfully for 10 minutes.',
      lockedBy: lockUser,
      lockExpiresAt,
      seats: lockedSeats
    });
  } catch (error) {
    console.error('Lock Seats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Safely Release Locked Seats
exports.releaseSeats = async (req, res) => {
  try {
    const { eventId, showtimeDate = 'Default', seatIds = [], lockedBy } = req.body;

    if (!eventId || !seatIds || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'eventId and seatIds are required' });
    }

    const lockUser = lockedBy || (req.user ? req.user.id : null);

    const query = { eventId, showtimeDate, seatId: { $in: seatIds }, status: 'Temporarily Locked' };
    if (lockUser && !lockUser.startsWith('admin')) {
      query.lockedBy = lockUser;
    }

    await SeatAvailability.updateMany(query, {
      $set: { status: 'Available', lockedBy: null, lockExpiresAt: null }
    });

    const updatedSeats = await SeatAvailability.find({ eventId, showtimeDate, seatId: { $in: seatIds } });

    // Broadcast real-time release update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const roomName = `${eventId}_${showtimeDate}`;
      io.to(roomName).emit('seatStatusChanged', {
        action: 'release',
        seatIds,
        seats: updatedSeats
      });
    }

    res.json({ success: true, message: 'Seats released successfully.', seatIds });
  } catch (error) {
    console.error('Release Seats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin Bulk Update Seat Status (Block / Reserve / Available)
exports.adminUpdateSeatStatus = async (req, res) => {
  try {
    const { eventId, showtimeDate = 'Default', seatIds = [], status } = req.body;

    if (!eventId || !seatIds || seatIds.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'eventId, seatIds, and status are required' });
    }

    const validStatuses = ['Available', 'Blocked', 'Reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    await SeatAvailability.updateMany(
      { eventId, showtimeDate, seatId: { $in: seatIds } },
      {
        $set: {
          status,
          lockedBy: null,
          lockExpiresAt: null
        }
      }
    );

    const updatedSeats = await SeatAvailability.find({ eventId, showtimeDate, seatId: { $in: seatIds } });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      const roomName = `${eventId}_${showtimeDate}`;
      io.to(roomName).emit('seatStatusChanged', {
        action: 'admin_update',
        status,
        seatIds,
        seats: updatedSeats
      });
    }

    res.json({
      success: true,
      message: `Updated ${seatIds.length} seat(s) to ${status}.`,
      data: updatedSeats
    });
  } catch (error) {
    console.error('Admin Update Seat Status Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin Update Tier Prices for Showtime & Sync to Event Model
exports.adminUpdateTierPrices = async (req, res) => {
  try {
    const { eventId, showtimeDate = 'Default', prices = {} } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }

    const categories = Object.keys(prices);
    for (const cat of categories) {
      // Update SeatAvailability for ALL showtimes of this event
      await SeatAvailability.updateMany(
        { eventId, category: cat },
        { $set: { price: Number(prices[cat]) } }
      );
    }

    // Sync Event document (starting price & ticketTiers array)
    const numericPrices = Object.values(prices).map(Number).filter((p) => !isNaN(p) && p > 0);
    const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : 500;

    const formattedTiers = [
      { tierName: 'Silver (First Floor Rows 1A–1H)', price: Number(prices.Silver || 500), totalSeats: 260, availableSeats: 260 },
      { tierName: 'Gold (Rows A–E)', price: Number(prices.Gold || 700), totalSeats: 150, availableSeats: 150 },
      { tierName: 'Platinum (Rows F–Q)', price: Number(prices.Platinum || 1000), totalSeats: 450, availableSeats: 450 },
      { tierName: 'VIP Lounge (Row V)', price: Number(prices['VIP Lounge'] || 1500), totalSeats: 40, availableSeats: 40 }
    ];

    await Event.findByIdAndUpdate(eventId, {
      price: minPrice,
      ticketTiers: formattedTiers
    });

    const updatedInventory = await SeatAvailability.find({ eventId, showtimeDate });

    // Real-time broadcast price changes
    const io = req.app.get('io');
    if (io) {
      const roomName = `${eventId}_${showtimeDate}`;
      io.to(roomName).emit('seatPricesUpdated', { eventId, showtimeDate, prices });
    }

    res.json({
      success: true,
      message: 'Category pricing updated successfully across Event Management & Seating Inventory.',
      data: updatedInventory
    });
  } catch (error) {
    console.error('Admin Update Prices Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Admin Update Venue Layout Coordinates
exports.adminUpdateLayoutCoordinates = async (req, res) => {
  try {
    const { venueId = 'ground-floor-main', seats } = req.body;

    let layout = await SeatLayout.findOne({ venueId });
    if (!layout) {
      return res.status(404).json({ success: false, message: 'Venue layout not found' });
    }

    if (seats && Array.isArray(seats)) {
      layout.seats = seats;
      await layout.save();
    }

    res.json({ success: true, message: 'Venue layout configuration saved successfully.', data: layout });
  } catch (error) {
    console.error('Admin Update Layout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
