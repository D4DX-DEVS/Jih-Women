const express = require('express');
const GalleryImage = require('../models/GalleryImage');

const router = express.Router();

// GET /api/gallery?limit=N
// Returns images sorted by order ASC, createdAt ASC.
// When ?limit is provided, returns that many images.
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
    let q = GalleryImage.find().sort({ order: 1, createdAt: 1 });
    if (limit > 0) q = q.limit(limit);
    const images = await q.lean();
    res.json({ images });
  } catch (err) {
    console.error('[gallery] list error:', err);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

module.exports = router;
