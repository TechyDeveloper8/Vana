const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  displayLabel: { type: String, required: true },
  row: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  category: { type: String, required: true },
  block: { type: String, required: true },
  section: { type: String, default: 'Ground Floor' },
  floor: { type: String, default: 'FIRST_FLOOR' },
  side: { type: String, default: 'CENTER' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  rotation: { type: Number, default: 0 },
  type: { type: String, default: 'standard', enum: ['standard', 'couch', 'sofa'] },
  couchGroup: { type: Number, default: null }
}, { _id: false });

const seatLayoutSchema = new mongoose.Schema({
  venueId: { type: String, required: true, unique: true, default: 'ground-floor-main' },
  name: { type: String, required: true, default: 'Ground Floor Main Auditorium' },
  dimensions: {
    width: { type: Number, default: 1400 },
    height: { type: Number, default: 900 }
  },
  seats: [seatSchema]
}, { timestamps: true });

module.exports = mongoose.model('SeatLayout', seatLayoutSchema);
