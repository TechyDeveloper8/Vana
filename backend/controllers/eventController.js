const Event = require('../models/Event');
const {
  uploadBannerToDrive,
  deleteFileFromDrive,
  extractGoogleDriveFileId,
  formatGoogleDriveImageUrl,
  downloadGoogleDriveImageLocally
} = require('../utils/googleDrive');

// 1. Upload Event Banner to Google Drive API / Local Fallback
exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const { mimetype, size, originalname, buffer } = req.file;

    // Validate format (JPG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimetype.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Only JPG, PNG, and WEBP files are allowed.'
      });
    }

    // Validate maximum file size (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 5 MB.'
      });
    }

    // Upload to Google Drive / Local Fallback
    const result = await uploadBannerToDrive(buffer, originalname, mimetype);

    // If an old Google Drive file ID was provided, delete it to keep storage organized
    if (req.body && req.body.oldDriveFileId) {
      await deleteFileFromDrive(req.body.oldDriveFileId);
    }

    res.json({
      success: true,
      message: 'Banner image uploaded to Google Drive successfully',
      bannerImage: result.bannerImage,
      driveFileId: result.fileId,
      storageMode: result.storageMode
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
};

// 1b. Process, Validate & Convert Google Drive Share Link
exports.processGoogleDriveLink = async (req, res) => {
  try {
    const { driveUrl, downloadLocally } = req.body;
    if (!driveUrl || typeof driveUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid Google Drive link.' });
    }

    const fileId = extractGoogleDriveFileId(driveUrl);
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'Could not recognize a valid Google Drive File ID. Please paste a link like https://drive.google.com/file/d/FILE_ID/view?usp=sharing'
      });
    }

    const directEmbedUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const fallbackThumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;

    // Optionally download and store locally on server
    if (downloadLocally) {
      const localResult = await downloadGoogleDriveImageLocally(fileId);
      if (localResult && localResult.success) {
        return res.json({
          success: true,
          message: 'Google Drive banner downloaded & stored locally on server',
          bannerImage: localResult.bannerImage,
          driveFileId: fileId,
          directEmbedUrl,
          fallbackThumbUrl,
          storedLocally: true
        });
      }
    }

    // Direct embed mode (Default, super fast, 0 server disk space)
    return res.json({
      success: true,
      message: 'Google Drive link verified & converted to high-speed stream URL',
      bannerImage: directEmbedUrl,
      driveFileId: fileId,
      directEmbedUrl,
      fallbackThumbUrl,
      storedLocally: false
    });
  } catch (error) {
    console.error('Process Google Drive Link error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process Google Drive link' });
  }
};

// 2. Get all events directly from MongoDB
exports.getEvents = async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    const query = isAdmin
      ? {}
      : { $or: [{ isPublished: true }, { status: 'Published' }, { status: 'Upcoming' }] };

    let events = await Event.find(query).sort({ createdAt: -1 });

    // Auto-seed initial sample events if collection is empty
    if (events.length === 0) {
      console.log('Seeding initial sample events...');
      const sampleEvents = [
        {
          title: 'VANA Grand Musical Night 2026',
          category: 'Concerts',
          eventType: 'Ticketed',
          status: 'Published',
          isPublished: true,
          eventDate: '2026-09-15',
          startTime: '06:00 PM',
          endTime: '10:00 PM',
          organizer: 'Vana Entertainments',
          venue: { name: 'Vana Main Auditorium', city: 'Bhagalpur' },
          price: 999,
          description: 'Experience an extraordinary evening of live music, mesmerizing visuals, and interactive auditorium seating featuring First Floor Balcony & Ground Floor tiers.',
          bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
          ticketTiers: [
            { tierName: 'Silver (First Floor)', price: 500, totalSeats: 260, availableSeats: 260 },
            { tierName: 'Gold (Rows F–Q)', price: 700, totalSeats: 450, availableSeats: 450 },
            { tierName: 'Platinum (Rows A–E)', price: 1000, totalSeats: 150, availableSeats: 150 },
            { tierName: 'VIP Lounge', price: 1500, totalSeats: 40, availableSeats: 40 }
          ]
        },
        {
          title: 'Global Tech & Creator Summit',
          category: 'Corporate Events',
          eventType: 'Ticketed',
          status: 'Published',
          isPublished: true,
          eventDate: '2026-10-01',
          startTime: '10:00 AM',
          endTime: '05:00 PM',
          organizer: 'Vana Corporate',
          venue: { name: 'Vana Main Auditorium', city: 'Bhagalpur' },
          price: 1499,
          description: 'Connect with industry leaders, tech visionaries, and creative entrepreneurs in an immersive auditorium layout.',
          bannerImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
          ticketTiers: [
            { tierName: 'Silver (First Floor)', price: 500, totalSeats: 260, availableSeats: 260 },
            { tierName: 'Gold (Rows F–Q)', price: 700, totalSeats: 450, availableSeats: 450 },
            { tierName: 'Platinum (Rows A–E)', price: 1000, totalSeats: 150, availableSeats: 150 },
            { tierName: 'VIP Lounge', price: 1500, totalSeats: 40, availableSeats: 40 }
          ]
        }
      ];

      await Event.insertMany(sampleEvents);
      events = await Event.find(query).sort({ createdAt: -1 });
    }

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get single event by ID directly from MongoDB
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create Event (Admin - MongoDB)
exports.createEvent = async (req, res) => {
  try {
    const {
      title, category, eventType, status, isPublished, eventDate,
      startTime, endTime, organizer, venue, price, description,
      bannerImage, driveFileId, ticketTiers
    } = req.body;

    // Detect and sanitize Google Drive banner link to direct-embed format
    let finalBannerImage = bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
    let finalDriveFileId = driveFileId || '';

    const detectedFileId = extractGoogleDriveFileId(finalBannerImage);
    if (detectedFileId) {
      finalBannerImage = formatGoogleDriveImageUrl(finalBannerImage);
      if (!finalDriveFileId) finalDriveFileId = detectedFileId;
    }

    const eventPayload = {
      title,
      category: category || 'Corporate Events',
      eventType: eventType || 'Ticketed',
      status: status || 'Published',
      isPublished: isPublished !== undefined ? isPublished : (status !== 'Unpublished'),
      eventDate,
      startTime: startTime || '10:00 AM',
      endTime: endTime || '05:00 PM',
      organizer: organizer || 'Vana Entertainments',
      venue: typeof venue === 'object' ? venue : { name: venue || 'Auditorium Hall', city: 'Bhagalpur' },
      price: price ? Number(price) : 0,
      description: description || '',
      bannerImage: finalBannerImage,
      driveFileId: finalDriveFileId,
      ticketTiers: ticketTiers && ticketTiers.length > 0 ? ticketTiers : [
        { tierName: 'Standard Pass', price: Number(price) || 999, totalSeats: 100, availableSeats: 100 }
      ]
    };

    const event = await Event.create(eventPayload);

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Event (Admin - MongoDB)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.status) {
      updateData.isPublished = updateData.status !== 'Unpublished';
    }

    // Auto-detect and sanitize Google Drive links on update
    if (updateData.bannerImage) {
      const detectedFileId = extractGoogleDriveFileId(updateData.bannerImage);
      if (detectedFileId) {
        updateData.bannerImage = formatGoogleDriveImageUrl(updateData.bannerImage);
        if (!updateData.driveFileId) updateData.driveFileId = detectedFileId;
      }
    }

    if (updateData.price && (!updateData.ticketTiers || updateData.ticketTiers.length === 0)) {
      updateData.ticketTiers = [
        { tierName: 'Standard Pass', price: Number(updateData.price), totalSeats: 100, availableSeats: 100 }
      ];
    }

    const existingEvent = await Event.findById(id);

    // Check if Google Drive banner was replaced, cleanup old file
    if (existingEvent && existingEvent.driveFileId && updateData.driveFileId && existingEvent.driveFileId !== updateData.driveFileId) {
      await deleteFileFromDrive(existingEvent.driveFileId);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, message: 'Event updated successfully', data: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Quick Toggle Publish / Unpublish Status (Admin - MongoDB)
exports.togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const newIsPublished = !event.isPublished;
    const newStatus = newIsPublished ? 'Published' : 'Unpublished';

    const updatedEvent = await Event.findByIdAndUpdate(id, { isPublished: newIsPublished, status: newStatus }, { new: true });

    res.json({
      success: true,
      message: `Event status updated to ${newStatus}`,
      data: updatedEvent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Event (Admin - MongoDB)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (event) {
      if (event.driveFileId) {
        await deleteFileFromDrive(event.driveFileId);
      }
      await Event.findByIdAndDelete(id);
    }

    res.json({ success: true, message: 'Event and associated Google Drive image deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
