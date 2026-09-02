const Gallery = require('../models/Gallery');

// 1. Get all gallery event albums directly from MongoDB
exports.getGalleryItems = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });

    // Normalize images array and cover image for backwards compatibility
    const formatted = items.map((item) => {
      const doc = item.toObject();
      let imgs = doc.images || [];
      if (imgs.length === 0 && doc.url) {
        imgs = [doc.url];
      }
      const cover = doc.coverImage || doc.url || (imgs.length > 0 ? imgs[0] : '');
      return {
        ...doc,
        coverImage: cover,
        images: imgs
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single album by ID
exports.getGalleryById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Gallery.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Event album not found' });
    }

    const doc = item.toObject();
    let imgs = doc.images || [];
    if (imgs.length === 0 && doc.url) {
      imgs = [doc.url];
    }
    const cover = doc.coverImage || doc.url || (imgs.length > 0 ? imgs[0] : '');

    res.json({
      success: true,
      data: {
        ...doc,
        coverImage: cover,
        images: imgs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Event Album with Multiple Pictures (Admin)
exports.createGalleryItem = async (req, res) => {
  try {
    const { title, category, coverImage, url, images, eventDate, location, description } = req.body;

    let imageList = [];
    if (Array.isArray(images)) {
      imageList = images.filter((img) => typeof img === 'string' && img.trim() !== '');
    } else if (typeof images === 'string' && images.trim() !== '') {
      // Split by newline or comma if passed as text block
      imageList = images
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (url && !imageList.includes(url)) {
      imageList.unshift(url);
    }

    const mainCover = coverImage || (imageList.length > 0 ? imageList[0] : url || '');

    const newItem = await Gallery.create({
      title,
      category: category || 'Corporate',
      coverImage: mainCover,
      url: mainCover,
      images: imageList,
      eventDate: eventDate || '',
      location: location || '',
      description: description || ''
    });

    res.status(201).json({ success: true, message: 'Event album created successfully', data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Event Album (Title, Category, Pictures Array) (Admin)
exports.updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, coverImage, images, eventDate, location, description } = req.body;

    let imageList = [];
    if (Array.isArray(images)) {
      imageList = images.filter((img) => typeof img === 'string' && img.trim() !== '');
    } else if (typeof images === 'string' && images.trim() !== '') {
      imageList = images
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (category !== undefined) updatePayload.category = category;
    if (eventDate !== undefined) updatePayload.eventDate = eventDate;
    if (location !== undefined) updatePayload.location = location;
    if (description !== undefined) updatePayload.description = description;

    if (images !== undefined) {
      updatePayload.images = imageList;
      if (!coverImage && imageList.length > 0) {
        updatePayload.coverImage = imageList[0];
        updatePayload.url = imageList[0];
      }
    }

    if (coverImage) {
      updatePayload.coverImage = coverImage;
      updatePayload.url = coverImage;
    }

    const updated = await Gallery.findByIdAndUpdate(id, updatePayload, { new: true });

    res.json({ success: true, message: 'Event album updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Add Photo URL to existing Event Album (Admin)
exports.addImageToAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    const album = await Gallery.findById(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Event album not found' });
    }

    album.images.push(imageUrl.trim());
    if (!album.coverImage) {
      album.coverImage = imageUrl.trim();
      album.url = imageUrl.trim();
    }

    await album.save();

    res.json({ success: true, message: 'Photo added to album successfully', data: album });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Remove Photo from Event Album (Admin)
exports.removeImageFromAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const album = await Gallery.findById(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Event album not found' });
    }

    album.images = album.images.filter((img) => img !== imageUrl);
    if (album.coverImage === imageUrl) {
      album.coverImage = album.images.length > 0 ? album.images[0] : '';
      album.url = album.coverImage;
    }

    await album.save();

    res.json({ success: true, message: 'Photo removed from album successfully', data: album });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete entire Event Album (Admin)
exports.deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Gallery.findByIdAndDelete(id);

    res.json({ success: true, message: 'Event album deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
