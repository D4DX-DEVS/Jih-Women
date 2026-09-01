const express = require('express');
const rateLimit = require('express-rate-limit');

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
const { MEDIA_POST_TYPES } = require('../models/MediaPost');
const VideoItem = require('../models/VideoItem');
const Publication = require('../models/Publication');
const Album = require('../models/Album');
const DownloadItem = require('../models/DownloadItem');
const ExternalLink = require('../models/ExternalLink');
const ContactMessage = require('../models/ContactMessage');
const FocusArea = require('../models/FocusArea');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

const router = express.Router();

const PUBLISHED = { published: true };

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have sent several messages already. Please wait a little while before trying again.' },
});

function paging(req, fallback = 12) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || fallback));
  return { page, limit, skip: (page - 1) * limit };
}

function fail(res, err, message) {
  console.error(`[site] ${message}:`, err);
  return res.status(500).json({ error: message });
}

// ── Bootstrap: everything the shell (header/footer) needs in one request ─────
router.get('/bootstrap', async (_req, res) => {
  try {
    const [settings, departments, programs] = await Promise.all([
      getSiteSetting(),
      Department.find(PUBLISHED).select('title slug order').sort({ order: 1 }).lean(),
      Program.find(PUBLISHED).select('title slug order isMajor externalUrl').sort({ order: 1 }).lean(),
    ]);

    return res.json({
      settings: settings.toObject(),
      nav: { departments, programs },
    });
  } catch (err) {
    return fail(res, err, 'We could not load the site right now. Please refresh the page.');
  }
});

// ── Home page payload ────────────────────────────────────────────────────────
router.get('/home', async (_req, res) => {
  try {
    const now = new Date();
    const [
      settings, sliders, campaigns, updates, upcomingEvents,
      featuredArticles, featuredVideos, publications,
      focusAreas, programBanners,
    ] = await Promise.all([
      getSiteSetting(),
      Slider.find(PUBLISHED).sort({ order: 1, createdAt: -1 }).lean(),
      Campaign.find(PUBLISHED).sort({ order: 1, startDate: -1 }).limit(6).lean(),
      MediaPost.find({ ...PUBLISHED, type: 'news' })
        .select('-body')
        .sort({ publishedAt: -1 })
        .limit(6)
        .lean(),
      OrgEvent.find({ ...PUBLISHED, startDate: { $gte: now } })
        .select('-description')
        .sort({ startDate: 1 })
        .limit(6)
        .lean(),
      MediaPost.find({ ...PUBLISHED, featured: true })
        .select('-body')
        .sort({ publishedAt: -1 })
        .limit(4)
        .lean(),
      VideoItem.find({ ...PUBLISHED, kind: 'video', featured: true })
        .sort({ order: 1, publishedAt: -1 })
        .limit(4)
        .lean(),
      Publication.find(PUBLISHED).sort({ order: 1, publishedAt: -1 }).limit(6).lean(),
      FocusArea.find(PUBLISHED).sort({ order: 1 }).limit(8).lean(),
      // $ne alone also matches documents where the field is absent
      Program.find({ ...PUBLISHED, bannerImage: { $exists: true, $nin: ['', null] } })
        .select('title slug bannerImage externalUrl order')
        .sort({ order: 1 })
        .limit(6)
        .lean(),
    ]);

    return res.json({
      settings: settings.toObject(),
      sliders,
      campaigns,
      updates,
      upcomingEvents,
      featuredArticles,
      featuredVideos,
      publications,
      focusAreas,
      programBanners,
    });
  } catch (err) {
    return fail(res, err, 'We could not load the home page. Please refresh and try again.');
  }
});

// ── Campaigns ────────────────────────────────────────────────────────────────
router.get('/campaigns', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const [items, total] = await Promise.all([
      Campaign.find(PUBLISHED)
        .select('-body')
        .sort({ order: 1, startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(PUBLISHED),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return fail(res, err, 'Failed to load campaigns');
  }
});

router.get('/campaigns/:slug', async (req, res) => {
  try {
    const doc = await Campaign.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This campaign is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'Failed to load campaign');
  }
});

// ── Pages (Who We Are & general) ─────────────────────────────────────────────
router.get('/pages', async (req, res) => {
  try {
    const query = { ...PUBLISHED };
    if (req.query.section) query.section = req.query.section;
    const items = await Page.find(query).select('-body').sort({ order: 1 }).lean();
    return res.json({ items });
  } catch (err) {
    return fail(res, err, 'We could not load these pages. Please try again.');
  }
});

router.get('/pages/:slug', async (req, res) => {
  try {
    const doc = await Page.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This page is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this page. Please try again.');
  }
});

// ── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', async (_req, res) => {
  try {
    const items = await Department.find(PUBLISHED)
      .select('title slug tagline coverImage logoUrl order')
      .sort({ order: 1 })
      .lean();
    return res.json({ items });
  } catch (err) {
    return fail(res, err, 'We could not load the departments. Please try again.');
  }
});

router.get('/departments/:slug', async (req, res) => {
  try {
    const doc = await Department.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This department is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this department. Please try again.');
  }
});

// ── Programmes ───────────────────────────────────────────────────────────────
router.get('/programs', async (_req, res) => {
  try {
    const items = await Program.find(PUBLISHED)
      .select('title slug tagline coverImage logoUrl isMajor externalUrl externalLabel order')
      .sort({ isMajor: -1, order: 1 })
      .lean();
    return res.json({ items });
  } catch (err) {
    return fail(res, err, 'We could not load the programmes. Please try again.');
  }
});

router.get('/programs/:slug', async (req, res) => {
  try {
    const doc = await Program.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This programme is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this programme. Please try again.');
  }
});

// ── Leaders ──────────────────────────────────────────────────────────────────
router.get('/leaders', async (_req, res) => {
  try {
    const [current, past] = await Promise.all([
      Leader.find({ ...PUBLISHED, isCurrent: true }).sort({ order: 1 }).lean(),
      Leader.find({ ...PUBLISHED, isCurrent: false }).sort({ termFrom: -1, order: 1 }).lean(),
    ]);
    return res.json({ current, past });
  } catch (err) {
    return fail(res, err, 'We could not load the leadership list. Please try again.');
  }
});

// ── Events ───────────────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const now = new Date();
    const scope = req.query.scope === 'past' ? 'past' : req.query.scope === 'all' ? 'all' : 'upcoming';

    const query = { ...PUBLISHED };
    if (scope === 'upcoming') query.startDate = { $gte: now };
    if (scope === 'past') query.startDate = { $lt: now };

    const sort = scope === 'upcoming' ? { startDate: 1 } : { startDate: -1 };

    const [items, total] = await Promise.all([
      OrgEvent.find(query).select('-description').sort(sort).skip(skip).limit(limit).lean(),
      OrgEvent.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1, scope });
  } catch (err) {
    return fail(res, err, 'We could not load the events. Please try again.');
  }
});

router.get('/events/:slug', async (req, res) => {
  try {
    const doc = await OrgEvent.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This event is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this event. Please try again.');
  }
});

router.post('/events/:slug/register', formLimiter, async (req, res) => {
  try {
    const event = await OrgEvent.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!event) return res.status(404).json({ error: 'This event is not available.' });
    if (!event.registrationEnabled) {
      return res.status(403).json({ error: 'Registration for this event has closed.' });
    }

    const { name, phone, email, district, place, notes } = req.body || {};
    const doc = await EventRegistration.create({
      event: event._id,
      name: String(name ?? '').trim(),
      phone: String(phone ?? '').trim(),
      email: String(email ?? '').trim(),
      district: String(district ?? '').trim(),
      place: String(place ?? '').trim(),
      notes: String(notes ?? '').trim(),
    });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first?.message || 'Please check the details you entered.' });
    }
    return fail(res, err, 'We could not save your registration. Please try again in a moment.');
  }
});

// ── Media centre ─────────────────────────────────────────────────────────────
router.get('/media', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const query = { ...PUBLISHED };
    if (req.query.type && MEDIA_POST_TYPES.includes(req.query.type)) query.type = req.query.type;

    const [items, total] = await Promise.all([
      MediaPost.find(query).select('-body').sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      MediaPost.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return fail(res, err, 'We could not load these posts. Please try again.');
  }
});

router.get('/media/:slug', async (req, res) => {
  try {
    const doc = await MediaPost.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This post is not available.' });

    const related = await MediaPost.find({
      ...PUBLISHED,
      type: doc.type,
      _id: { $ne: doc._id },
    })
      .select('title slug coverImage excerpt publishedAt type')
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();

    return res.json({ ...doc, related });
  } catch (err) {
    return fail(res, err, 'We could not open this post. Please try again.');
  }
});

router.get('/videos', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const query = { ...PUBLISHED, kind: req.query.kind === 'podcast' ? 'podcast' : 'video' };

    const [items, total] = await Promise.all([
      VideoItem.find(query).sort({ order: 1, publishedAt: -1 }).skip(skip).limit(limit).lean(),
      VideoItem.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return fail(res, err, 'We could not load the videos. Please try again.');
  }
});

// ── Photo gallery ────────────────────────────────────────────────────────────
router.get('/albums', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const [items, total] = await Promise.all([
      Album.find(PUBLISHED)
        .select('title slug description coverImage eventDate order items')
        .sort({ order: 1, eventDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Album.countDocuments(PUBLISHED),
    ]);

    // Send only the item count for the listing view
    const summary = items.map(({ items: media, ...rest }) => ({
      ...rest,
      itemCount: media?.length || 0,
    }));

    return res.json({ items: summary, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return fail(res, err, 'We could not load the gallery. Please try again.');
  }
});

router.get('/albums/:slug', async (req, res) => {
  try {
    const doc = await Album.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This album is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this album. Please try again.');
  }
});

// ── Publications ─────────────────────────────────────────────────────────────
router.get('/publications', async (req, res) => {
  try {
    const { page, limit, skip } = paging(req);
    const query = { ...PUBLISHED };
    if (req.query.type) query.type = req.query.type;

    const [items, total] = await Promise.all([
      Publication.find(query)
        .select('-body')
        .sort({ order: 1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Publication.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    return fail(res, err, 'We could not load the publications. Please try again.');
  }
});

router.get('/publications/:slug', async (req, res) => {
  try {
    const doc = await Publication.findOne({ ...PUBLISHED, slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'This publication is not available.' });
    return res.json(doc);
  } catch (err) {
    return fail(res, err, 'We could not open this publication. Please try again.');
  }
});

// ── Downloads ────────────────────────────────────────────────────────────────
router.get('/downloads', async (req, res) => {
  try {
    const query = { ...PUBLISHED };
    if (req.query.category) query.category = req.query.category;
    const items = await DownloadItem.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    return fail(res, err, 'We could not load the downloads. Please try again.');
  }
});

router.post('/downloads/:id/hit', async (req, res) => {
  try {
    await DownloadItem.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: false });
  }
});

// ── External links ───────────────────────────────────────────────────────────
router.get('/external-links', async (_req, res) => {
  try {
    const items = await ExternalLink.find(PUBLISHED).sort({ category: 1, order: 1 }).lean();
    return res.json({ items });
  } catch (err) {
    return fail(res, err, 'We could not load these links. Please try again.');
  }
});

// ── Contact form ─────────────────────────────────────────────────────────────
router.post('/contact', formLimiter, async (req, res) => {
  try {
    const { name, email, phone, district, subject, message } = req.body || {};
    const doc = await ContactMessage.create({
      name: String(name ?? '').trim(),
      email: String(email ?? '').trim(),
      phone: String(phone ?? '').trim(),
      district: String(district ?? '').trim(),
      subject: String(subject ?? '').trim(),
      message: String(message ?? '').trim(),
    });
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first?.message || 'Please check the details you entered.' });
    }
    return fail(res, err, 'We could not send your message. Please try again in a moment.');
  }
});

// ── Newsletter ───────────────────────────────────────────────────────────────
router.post('/newsletter', formLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Please enter your email address.' });

    // Re-subscribing an existing address is a success, not a duplicate error
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return res.status(200).json({ ok: true, alreadySubscribed: true });
    }

    await NewsletterSubscriber.create({ email });
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first?.message || 'That does not look like a valid email address.' });
    }
    return fail(res, err, 'We could not add you to the list. Please try again in a moment.');
  }
});

// ── Global search across the public content ──────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const match = (paths) => ({ ...PUBLISHED, $or: paths.map((p) => ({ [p]: rx })) });

    const [posts, pubs, events, pages, programs, departments] = await Promise.all([
      MediaPost.find(match(['title.ml', 'title.en', 'excerpt.ml', 'excerpt.en']))
        .select('title slug coverImage type publishedAt').limit(8).lean(),
      Publication.find(match(['title.ml', 'title.en', 'author.ml', 'author.en']))
        .select('title slug coverImage type').limit(8).lean(),
      OrgEvent.find(match(['title.ml', 'title.en', 'summary.ml', 'summary.en']))
        .select('title slug coverImage startDate').limit(8).lean(),
      Page.find(match(['title.ml', 'title.en'])).select('title slug section').limit(8).lean(),
      Program.find(match(['title.ml', 'title.en'])).select('title slug coverImage').limit(8).lean(),
      Department.find(match(['title.ml', 'title.en'])).select('title slug coverImage').limit(8).lean(),
    ]);

    const results = [
      ...posts.map((d) => ({ kind: 'media', path: `/media/${d.type}/${d.slug}`, ...d })),
      ...pubs.map((d) => ({ kind: 'publication', path: `/publications/${d.slug}`, ...d })),
      ...events.map((d) => ({ kind: 'event', path: `/events/${d.slug}`, ...d })),
      ...pages.map((d) => ({ kind: 'page', path: `/who-we-are/${d.slug}`, ...d })),
      ...programs.map((d) => ({ kind: 'program', path: `/programs/${d.slug}`, ...d })),
      ...departments.map((d) => ({ kind: 'department', path: `/departments/${d.slug}`, ...d })),
    ];

    return res.json({ results });
  } catch (err) {
    return fail(res, err, 'Search is unavailable right now. Please try again.');
  }
});

module.exports = router;
