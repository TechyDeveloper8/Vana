const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  togglePublishStatus,
  deleteEvent,
  uploadBanner,
  processGoogleDriveLink
} = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Configure Multer for memory storage with 5 MB file size limit
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB Limit
});

// Public Routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Admin Event Banner Upload & Google Drive Link Processing Endpoints
router.post('/upload-banner', protect, adminOnly, upload.single('banner'), uploadBanner);
router.post('/process-gdrive-link', protect, adminOnly, processGoogleDriveLink);

// Admin Event CRUD & Publish Status Routes
router.post('/', protect, adminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.patch('/:id/publish', protect, adminOnly, togglePublishStatus);
router.delete('/:id', protect, adminOnly, deleteEvent);

module.exports = router;
