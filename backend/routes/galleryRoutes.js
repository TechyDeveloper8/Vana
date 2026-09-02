const express = require('express');
const router = express.Router();
const {
  getGalleryItems,
  getGalleryById,
  createGalleryItem,
  updateGalleryItem,
  addImageToAlbum,
  removeImageFromAlbum,
  deleteGalleryItem
} = require('../controllers/galleryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getGalleryItems);
router.get('/:id', getGalleryById);
router.post('/', protect, adminOnly, createGalleryItem);
router.put('/:id', protect, adminOnly, updateGalleryItem);
router.post('/:id/add-image', protect, adminOnly, addImageToAlbum);
router.post('/:id/remove-image', protect, adminOnly, removeImageFromAlbum);
router.delete('/:id', protect, adminOnly, deleteGalleryItem);

module.exports = router;
