const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SeatAvailability = require('../models/SeatAvailability');
const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Booking');
const CheckInLog = require('../models/CheckInLog');
const Contact = require('../models/Contact');
const OTP = require('../models/OTP');
const SeatLayout = require('../models/SeatLayout');
const { generateVenueLayout } = require('../utils/seatingLayoutData');

async function inspectAndReset() {
  await connectDB();
  console.log('Connected to MongoDB.');

  // 1. Inspect current counts
  console.log('--- Current Data ---');
  const bookingCount = await Booking.countDocuments();
  const checkInCount = await CheckInLog.countDocuments();
  const contactCount = await Contact.countDocuments();
  const otpCount = await OTP.countDocuments();
  const eventCount = await Event.countDocuments();
  const userCount = await User.countDocuments();
  const seatAvailCount = await SeatAvailability.countDocuments();
  const seatLayoutCount = await SeatLayout.countDocuments();

  console.log({
    bookingCount,
    checkInCount,
    contactCount,
    otpCount,
    eventCount,
    userCount,
    seatAvailCount,
    seatLayoutCount
  });

  const bookedSeatsCount = await SeatAvailability.countDocuments({ status: 'Booked' });
  const lockedSeatsCount = await SeatAvailability.countDocuments({ status: 'Temporarily Locked' });
  const availableSeatsCount = await SeatAvailability.countDocuments({ status: 'Available' });

  console.log({
    bookedSeatsCount,
    lockedSeatsCount,
    availableSeatsCount
  });

  // 2. Perform Reset
  console.log('\n--- Resetting Database to Fresh State ---');
  
  // Clear all previous bookings and logs
  const delBookings = await Booking.deleteMany({});
  console.log(`Deleted ${delBookings.deletedCount} bookings.`);

  const delLogs = await CheckInLog.deleteMany({});
  console.log(`Deleted ${delLogs.deletedCount} check-in logs.`);

  const delContacts = await Contact.deleteMany({});
  console.log(`Deleted ${delContacts.deletedCount} contacts.`);

  const delOtps = await OTP.deleteMany({});
  console.log(`Deleted ${delOtps.deletedCount} OTPs.`);

  // Reset all Event bookedSeats counts to 0
  const resetEvents = await Event.updateMany({}, { $set: { bookedSeats: 0 } });
  console.log(`Reset bookedSeats count on ${resetEvents.modifiedCount} event(s).`);

  // Ensure SeatLayout is fresh
  await SeatLayout.deleteMany({ venueId: 'ground-floor-main' });
  const freshLayout = generateVenueLayout();
  await SeatLayout.create(freshLayout);
  console.log(`Seeded fresh venue SeatLayout (${freshLayout.seats.length} seats).`);

  // Reset all SeatAvailability records to 'Available' (no seat booked)
  const delAvail = await SeatAvailability.deleteMany({});
  console.log(`Cleared ${delAvail.deletedCount} old SeatAvailability records.`);

  // Re-seed fresh availability for all events
  const allEvents = await Event.find({});
  console.log(`Found ${allEvents.length} event(s) to re-seed fresh seat inventory for.`);

  let totalSeeded = 0;
  for (const ev of allEvents) {
    const showtimes = (ev.showtimes && ev.showtimes.length > 0) ? ev.showtimes : ['Default'];
    
    // Check tier prices
    let defaultSilverPrice = 500;
    let defaultGoldPrice = 700;
    let defaultPlatinumPrice = 1000;
    let defaultVipPrice = 1500;

    if (ev.ticketTiers && ev.ticketTiers.length > 0) {
      ev.ticketTiers.forEach(tier => {
        const name = (tier.tierName || '').toLowerCase();
        if (name.includes('silv') || name.includes('first')) defaultSilverPrice = tier.price;
        if (name.includes('gold')) defaultGoldPrice = tier.price;
        if (name.includes('plat')) defaultPlatinumPrice = tier.price;
        if (name.includes('vip')) defaultVipPrice = tier.price;
      });
    }

    for (const st of showtimes) {
      const showtimeKey = typeof st === 'string' ? st : (st.date || 'Default');
      const docs = freshLayout.seats.map(seat => {
        let price = defaultGoldPrice;
        if (seat.category === 'Silver') price = defaultSilverPrice;
        if (seat.category === 'Platinum') price = defaultPlatinumPrice;
        if (seat.category === 'VIP Lounge') price = defaultVipPrice;

        return {
          eventId: ev._id,
          showtimeDate: showtimeKey,
          seatId: seat.seatId,
          displayLabel: seat.displayLabel,
          category: seat.category,
          price,
          status: 'Available',
          lockedBy: null,
          lockExpiresAt: null,
          bookedBy: null,
          bookingId: null
        };
      });

      await SeatAvailability.insertMany(docs);
      totalSeeded += docs.length;
      console.log(`Seeded ${docs.length} fresh Available seats for event "${ev.title}" (Showtime: ${showtimeKey}).`);
    }
  }

  // Verify final state
  console.log('\n--- Final Verification ---');
  const finalBookings = await Booking.countDocuments();
  const finalBookedSeats = await SeatAvailability.countDocuments({ status: 'Booked' });
  const finalAvailableSeats = await SeatAvailability.countDocuments({ status: 'Available' });
  const finalTotalSeats = await SeatAvailability.countDocuments();

  console.log({
    finalBookings,
    finalBookedSeats,
    finalAvailableSeats,
    finalTotalSeats
  });

  console.log('\nDatabase is 100% fresh with 0 seats booked and all seats open for booking!');
  process.exit(0);
}

inspectAndReset().catch(err => {
  console.error('Reset Error:', err);
  process.exit(1);
});
