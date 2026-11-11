const express = require('express');
const GalleryImage = require('../models/GalleryImage');

const router = express.Router();

const PAGE_SIZE = 15;

// GET /api/gallery?page=N&limit=N
// Returns one page of images sorted by order ASC, createdAt ASC, plus pagination
// metadata. Defaults to page 1 with 15 images (three rows of five); a page never
// holds more than 15.
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const total = await GalleryImage.countDocuments();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    // A page past the end (e.g. after images were deleted) falls back to the last page
    const page = Math.min(totalPages, Math.max(1, parseInt(req.query.page, 10) || 1));

    // _id breaks ties between images sharing order and createdAt, so skip/limit
    // never repeats or drops an image across pages
    const images = await GalleryImage.find()
      .sort({ order: 1, createdAt: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('[gallery] list error:', err);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

module.exports = router;
