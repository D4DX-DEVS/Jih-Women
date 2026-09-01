const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');

const { requireAdmin } = require('../middleware/auth');
const { buildCrud, sendMongooseError } = require('../utils/cmsCrud');
const { cmsUpload, uploadBuffer, deleteFile, keyFromUrl } = require('../config/spaces');

const { getSiteSetting } = require('../models/SiteSetting');
const Slider = require('../models/Slider');
const Campaign = require('../models/Campaign');
const Page = require('../models/Page');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Leader = require('../models/Leader');
const OrgEvent = require('../models/OrgEvent');
const EventRegistration = require('../models/EventRegistration');
const MediaPost = require('../models/MediaPost');
const VideoItem = require('../models/VideoItem');
const Publication = require('../models/Publication');
const Album = require('../models/Album');
const DownloadItem = require('../models/DownloadItem');
const ExternalLink = require('../models/ExternalLink');
const ContactMessage = require('../models/ContactMessage');
const FocusArea = require('../models/FocusArea');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

const router = express.Router();
router.use(requireAdmin);

const SPACES_FOLDER = process.env.DO_SPACES_FOLDER || '';
const CMS_PREFIX = `${SPACES_FOLDER ? `${SPACES_FOLDER}/` : ''}org`;

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function objectKey(folder, originalName, ext) {
  const extension = ext || path.extname(originalName).toLowerCase() || '.bin';
  return `${CMS_PREFIX}/${folder}/${crypto.randomUUID()}${extension}`;
}

// ── Asset upload ─────────────────────────────────────────────────────────────
// Content documents are saved as plain JSON; files are uploaded here first and
// the returned CDN URL is stored on the document.
router.post('/upload', (req, res) => {
  cmsUpload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const msg =
        uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 500MB.'
          : uploadErr.message || 'File upload failed';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const folder = (req.body?.folder || 'misc').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'misc';

    try {
      // Raster images are re-encoded to WebP and paired with a thumbnail.
      if (IMAGE_MIMES.has(req.file.mimetype)) {
        const full = await sharp(req.file.buffer)
          .rotate()
          .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        const thumb = await sharp(req.file.buffer)
          .rotate()
          .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 72 })
          .toBuffer();

        const baseKey = objectKey(folder, req.file.originalname, '.webp');
        const thumbKey = baseKey.replace(/\.webp$/, '-thumb.webp');

        const [url, thumbnailUrl] = await Promise.all([
          uploadBuffer(full, baseKey, 'image/webp'),
          uploadBuffer(thumb, thumbKey, 'image/webp'),
        ]);

        return res.status(201).json({
          url,
          thumbnailUrl,
          mimeType: 'image/webp',
          sizeBytes: full.length,
          kind: 'image',
        });
      }

      // Everything else (PDF, docs, audio, video, svg, gif) is stored as-is.
      const key = objectKey(folder, req.file.originalname);
      const url = await uploadBuffer(req.file.buffer, key, req.file.mimetype);

      return res.status(201).json({
        url,
        thumbnailUrl: '',
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        kind: req.file.mimetype.startsWith('video/')
          ? 'video'
          : req.file.mimetype.startsWith('audio/')
            ? 'audio'
            : 'file',
        originalName: req.file.originalname,
      });
    } catch (err) {
      console.error('[cms] upload error:', err);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });
});

// Delete an uploaded asset by its CDN URL
router.post('/upload/delete', async (req, res) => {
  const url = req.body?.url;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const key = keyFromUrl(url);
  if (!key) return res.status(400).json({ error: 'URL does not belong to this storage bucket' });
  await deleteFile(key);
  // Image uploads always have a paired thumbnail
  if (key.endsWith('.webp') && !key.endsWith('-thumb.webp')) {
    await deleteFile(key.replace(/\.webp$/, '-thumb.webp'));
  }
  return res.json({ ok: true });
});

// ── Site settings (singleton) ────────────────────────────────────────────────
router.get('/site-settings', async (_req, res) => {
  try {
    const doc = await getSiteSetting();
    return res.json(doc.toObject());
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to load site settings');
  }
});

router.patch('/site-settings', async (req, res) => {
  try {
    const doc = await getSiteSetting();
    const payload = { ...(req.body || {}) };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;
    doc.set(payload);
    await doc.save();
    return res.json(doc.toObject());
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to update site settings');
  }
});

// ── Content collections ──────────────────────────────────────────────────────
router.use(
  '/sliders',
  buildCrud({
    Model: Slider,
    name: 'Slide',
    searchPaths: ['title.ml', 'title.en', 'subtitle.ml', 'subtitle.en'],
    filters: ['published'],
  })
);

router.use(
  '/campaigns',
  buildCrud({
    Model: Campaign,
    name: 'Campaign',
    searchPaths: ['title.ml', 'title.en', 'summary.ml', 'summary.en', 'slug'],
    filters: ['published', 'featured'],
  })
);

router.use(
  '/pages',
  buildCrud({
    Model: Page,
    name: 'Page',
    searchPaths: ['title.ml', 'title.en', 'slug'],
    filters: ['published', 'section'],
  })
);

router.use(
  '/departments',
  buildCrud({
    Model: Department,
    name: 'Department',
    searchPaths: ['title.ml', 'title.en', 'slug'],
    filters: ['published'],
  })
);

router.use(
  '/programs',
  buildCrud({
    Model: Program,
    name: 'Programme',
    searchPaths: ['title.ml', 'title.en', 'slug'],
    filters: ['published', 'isMajor'],
  })
);

router.use(
  '/leaders',
  buildCrud({
    Model: Leader,
    name: 'Leader',
    searchPaths: ['name.ml', 'name.en', 'designation.ml', 'designation.en'],
    filters: ['published', 'isCurrent'],
  })
);

router.use(
  '/events',
  buildCrud({
    Model: OrgEvent,
    name: 'Event',
    searchPaths: ['title.ml', 'title.en', 'slug', 'district'],
    filters: ['published', 'featured'],
    sort: { startDate: -1 },
  })
);

router.use(
  '/media-posts',
  buildCrud({
    Model: MediaPost,
    name: 'Media post',
    searchPaths: ['title.ml', 'title.en', 'slug', 'source'],
    filters: ['published', 'featured', 'type'],
    sort: { publishedAt: -1 },
  })
);

router.use(
  '/videos',
  buildCrud({
    Model: VideoItem,
    name: 'Video',
    searchPaths: ['title.ml', 'title.en'],
    filters: ['published', 'featured', 'kind'],
  })
);

router.use(
  '/publications',
  buildCrud({
    Model: Publication,
    name: 'Publication',
    searchPaths: ['title.ml', 'title.en', 'author.ml', 'author.en', 'slug'],
    filters: ['published', 'featured', 'type'],
  })
);

router.use(
  '/albums',
  buildCrud({
    Model: Album,
    name: 'Album',
    searchPaths: ['title.ml', 'title.en', 'slug'],
    filters: ['published'],
  })
);

router.use(
  '/downloads',
  buildCrud({
    Model: DownloadItem,
    name: 'Download',
    searchPaths: ['title.ml', 'title.en'],
    filters: ['published', 'category'],
  })
);

router.use(
  '/external-links',
  buildCrud({
    Model: ExternalLink,
    name: 'External link',
    searchPaths: ['title.ml', 'title.en', 'url'],
    filters: ['published', 'category'],
  })
);

router.use(
  '/focus-areas',
  buildCrud({
    Model: FocusArea,
    name: 'Focus area',
    searchPaths: ['title.ml', 'title.en'],
    filters: ['published'],
  })
);

// ── Newsletter subscribers ───────────────────────────────────────────────────
router.get('/newsletter', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const [items, total] = await Promise.all([
      NewsletterSubscriber.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NewsletterSubscriber.countDocuments(),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to load subscribers');
  }
});

router.delete('/newsletter/:id', async (req, res) => {
  try {
    const doc = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Subscriber not found' });
    return res.json({ ok: true });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to delete subscriber');
  }
});

// ── Contact messages (read-only inbox + read flag) ───────────────────────────
router.get('/contact-messages', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const query = {};
    if (req.query.isRead === 'true' || req.query.isRead === 'false') {
      query.isRead = req.query.isRead === 'true';
    }

    const [items, total, unread] = await Promise.all([
      ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ isRead: false }),
    ]);

    return res.json({ items, total, unread, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to load contact messages');
  }
});

router.patch('/contact-messages/:id', async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: req.body?.isRead !== false } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Message not found' });
    return res.json(doc);
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to update message');
  }
});

router.delete('/contact-messages/:id', async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Message not found' });
    return res.json({ ok: true });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to delete message');
  }
});

// ── Event RSVPs ──────────────────────────────────────────────────────────────
router.get('/event-registrations', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const query = {};
    if (req.query.event) query.event = req.query.event;

    const [items, total] = await Promise.all([
      EventRegistration.find(query)
        .populate('event', 'title slug startDate')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EventRegistration.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to load event registrations');
  }
});

router.delete('/event-registrations/:id', async (req, res) => {
  try {
    const doc = await EventRegistration.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Registration not found' });
    return res.json({ ok: true });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to delete registration');
  }
});

// ── Dashboard counts ─────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [
      sliders, campaigns, pages, departments, programs, leaders,
      events, upcomingEvents, mediaPosts, videos, publications,
      albums, downloads, links, unreadMessages, eventRsvps,
      focusAreas, subscribers,
    ] = await Promise.all([
      Slider.countDocuments(),
      Campaign.countDocuments(),
      Page.countDocuments(),
      Department.countDocuments(),
      Program.countDocuments(),
      Leader.countDocuments(),
      OrgEvent.countDocuments(),
      OrgEvent.countDocuments({ startDate: { $gte: new Date() }, published: true }),
      MediaPost.countDocuments(),
      VideoItem.countDocuments(),
      Publication.countDocuments(),
      Album.countDocuments(),
      DownloadItem.countDocuments(),
      ExternalLink.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      EventRegistration.countDocuments(),
      FocusArea.countDocuments(),
      NewsletterSubscriber.countDocuments({ isActive: true }),
    ]);

    return res.json({
      sliders, campaigns, pages, departments, programs, leaders,
      events, upcomingEvents, mediaPosts, videos, publications,
      albums, downloads, links, unreadMessages, eventRsvps,
      focusAreas, subscribers,
    });
  } catch (err) {
    return sendMongooseError(res, err, 'Failed to load stats');
  }
});

module.exports = router;
