const express = require('express');
const rateLimit = require('express-rate-limit');
const XLSX = require('xlsx');
const Feedback = require('../models/Feedback');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions from this IP. Please try again later.' },
});

// Public: submit feedback
router.post('/', submitLimiter, async (req, res) => {
  try {
    const {
      name,
      whatsappNumber,
      email,
      overallRating,
      sessionQuality,
      venueRating,
      liked,
      improvements,
      recommend,
      comments,
    } = req.body;

    const doc = await Feedback.create({
      name: String(name ?? '').trim(),
      whatsappNumber: String(whatsappNumber ?? '').trim(),
      email: String(email ?? '').trim(),
      overallRating: Number(overallRating),
      sessionQuality: Number(sessionQuality),
      venueRating: Number(venueRating),
      liked: String(liked ?? '').trim(),
      improvements: String(improvements ?? '').trim(),
      recommend: String(recommend ?? '').trim(),
      comments: String(comments ?? '').trim(),
    });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first?.message || 'Validation failed' });
    }
    console.error('[feedback] submit error:', err);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Admin: list all feedback (paginated)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments(),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('[feedback] list error:', err);
    return res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Admin: export all feedback as Excel
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).lean();

    const rows = items.map((f) => ({
      'Submitted At': f.createdAt ? new Date(f.createdAt).toLocaleString() : '',
      'Name': f.name || '',
      'WhatsApp': f.whatsappNumber || '',
      'Email': f.email || '',
      'Overall Rating': f.overallRating ?? '',
      'Session Quality': f.sessionQuality ?? '',
      'Venue Rating': f.venueRating ?? '',
      'What They Liked': f.liked || '',
      'Improvements Suggested': f.improvements || '',
      'Would Recommend': f.recommend || '',
      'Other Comments': f.comments || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `wes-feedback-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buf);
  } catch (err) {
    console.error('[feedback] export error:', err);
    return res.status(500).json({ error: 'Failed to export feedback' });
  }
});

// Admin: delete a single feedback
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const doc = await Feedback.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Feedback not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[feedback] delete error:', err);
    return res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

module.exports = router;
