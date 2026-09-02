const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  tierName: { type: String, required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, default: 100 },
  availableSeats: { type: Number, default: 100 }
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true }, // Corporate, Concert, Expo, Award Show, Festival
    eventType: { type: String, default: 'Public' },
    status: { type: String, enum: ['Published', 'Unpublished', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Published' },
    isPublished: { type: Boolean, default: true },
    eventDate: { type: String, required: true },
    startTime: { type: String, default: '18:00' },
    endTime: { type: String, default: '22:00' },
    organizer: { type: String, default: 'Vana Entertainments' },
    venue: {
      name: { type: String, required: true },
      address: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, default: 'Bihar' },
      pincode: { type: String, default: '' },
      mapLink: { type: String, default: '' }
    },
    price: { type: Number, default: 0 },
    contactPerson: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    bannerImage: { type: String, default: 'images/event1.jpg' },
    driveFileId: { type: String, default: '' },
    galleryImages: [{ type: String }],
    description: { type: String, default: '' },
    ticketTiers: [ticketTierSchema],
    capacity: { type: Number, default: 500 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);

