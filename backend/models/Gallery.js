const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'Corporate' }, // Corporate, Concerts, Expos, Award Shows, Stage Tech
    coverImage: { type: String, default: '' },
    url: { type: String, default: '' }, // Backwards compatibility for single URL
    images: [{ type: String }], // Array of multiple picture URLs for one event
    eventDate: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', gallerySchema);
