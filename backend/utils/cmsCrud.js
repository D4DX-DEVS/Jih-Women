const express = require('express');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FIELD_ALIASES = {
  fileUrl: 'File',
  imageUrl: 'Image',
  mobileImageUrl: 'Mobile image',
  coverImage: 'Cover image',
  posterImage: 'Poster',
  logoUrl: 'Logo',
  bannerImage: 'Banner image',
  thumbnailUrl: 'Thumbnail',
  audioUrl: 'Audio file',
  youtubeUrl: 'YouTube link',
  externalUrl: 'External link',
  linkUrl: 'Link',
  sourceUrl: 'Source link',
  purchaseUrl: 'Purchase link',
  mapUrl: 'Map link',
  mapEmbedUrl: 'Map embed link',
  url: 'Link',
  whatsappNumber: 'WhatsApp number',
  whatsapp: 'WhatsApp number',
  startDate: 'Start date',
  endDate: 'End date',
  publishedAt: 'Publish date',
  eventDate: 'Event date',
  isCurrent: 'Current leadership',
  isMajor: 'Major programme',
};

/** Turns a schema path such as "title.ml" into "Title (Malayalam)". */
function humanFieldName(path) {
  const [head, ...rest] = String(path).split('.');
  const words = head.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').trim();
  const label =
    FIELD_ALIASES[head] || words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  if (rest[0] === 'ml') return `${label} (Malayalam)`;
  if (rest[0] === 'en') return `${label} (English)`;
  return label;
}

function listNames(names) {
  if (names.length === 1) return names[0];
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(', ')} and ${last}`;
}

/**
 * Answers with a message an editor can act on, plus the raw field map so the
 * admin panel can highlight the inputs that need attention.
 */
function sendMongooseError(res, err, fallback) {
  if (err && err.name === 'ValidationError') {
    const fields = {};
    const missing = [];
    const malformed = [];

    for (const key of Object.keys(err.errors)) {
      const detail = err.errors[key];
      fields[key] = detail.message;
      // Mongoose wraps type failures as CastError inside a ValidationError,
      // and those are a different problem from a blank field.
      if (detail.name === 'CastError' || detail.kind === 'date' || detail.kind === 'Number') {
        malformed.push(humanFieldName(key));
      } else {
        missing.push(humanFieldName(key));
      }
    }

    const parts = [];
    if (missing.length) {
      parts.push(
        missing.length === 1
          ? `${missing[0]} is required.`
          : `Please fill in ${listNames(missing)}.`
      );
    }
    if (malformed.length) {
      parts.push(
        malformed.length === 1
          ? `${malformed[0]} does not look right — please check what you entered.`
          : `Please check ${listNames(malformed)} — those values do not look right.`
      );
    }

    return res.status(400).json({ error: parts.join(' ') || 'Please check the details you entered.', fields });
  }

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || { slug: 1 })[0];
    const label = field === 'slug' ? 'web address' : humanFieldName(field).toLowerCase();
    return res.status(409).json({
      error: `Another entry already uses that ${label}. Please choose a different one.`,
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      error: `${humanFieldName(err.path)} does not look right. Please check what you entered.`,
    });
  }

  console.error(`[cms] ${fallback}:`, err);
  return res.status(500).json({ error: fallback });
}

/**
 * Builds a standard admin CRUD router for a CMS collection.
 *
 * @param {object}   cfg
 * @param {import('mongoose').Model} cfg.Model
 * @param {string}   cfg.name          Human label used in error messages
 * @param {string[]} cfg.searchPaths   Document paths matched by ?search
 * @param {string[]} cfg.filters       Query params passed straight through as equality filters
 * @param {object}   cfg.sort          Default sort
 * @param {string[]} cfg.sortable      Paths allowed in ?sortBy
 */
function buildCrud({
  Model,
  name,
  searchPaths = [],
  filters = [],
  sort = { order: 1, createdAt: -1 },
  sortable = ['order', 'createdAt', 'updatedAt', 'publishedAt', 'startDate'],
}) {
  const router = express.Router();

  function buildQuery(req) {
    const query = {};

    for (const key of filters) {
      const raw = req.query[key];
      if (raw === undefined || raw === '') continue;
      if (raw === 'true' || raw === 'false') query[key] = raw === 'true';
      else query[key] = raw;
    }

    const search = (req.query.search || '').trim();
    if (search && searchPaths.length) {
      const rx = new RegExp(escapeRegex(search), 'i');
      query.$or = searchPaths.map((p) => ({ [p]: rx }));
    }

    return query;
  }

  function buildSort(req) {
    const sortBy = req.query.sortBy;
    if (sortBy && sortable.includes(sortBy)) {
      const dir = req.query.sortDir === 'asc' ? 1 : -1;
      return { [sortBy]: dir };
    }
    return sort;
  }

  // List (paginated). Pass ?limit=0 to fetch everything.
  router.get('/', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const rawLimit = req.query.limit === undefined ? 50 : parseInt(req.query.limit, 10);
      const limit = Number.isNaN(rawLimit) ? 50 : Math.min(500, Math.max(0, rawLimit));
      const query = buildQuery(req);

      let cursor = Model.find(query).sort(buildSort(req));
      if (limit > 0) cursor = cursor.skip((page - 1) * limit).limit(limit);

      const [items, total] = await Promise.all([
        cursor.lean(),
        Model.countDocuments(query),
      ]);

      return res.json({
        items,
        total,
        page,
        limit,
        pages: limit > 0 ? Math.ceil(total / limit) || 1 : 1,
      });
    } catch (err) {
      return sendMongooseError(res, err, `We could not load the ${name.toLowerCase()} list. Please try again.`);
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: `That ${name.toLowerCase()} no longer exists. It may have been deleted.` });
      return res.json(doc);
    } catch (err) {
      return sendMongooseError(res, err, `We could not open this ${name.toLowerCase()}. Please try again.`);
    }
  });

  router.post('/', async (req, res) => {
    try {
      const doc = await Model.create(req.body || {});
      return res.status(201).json(doc.toObject());
    } catch (err) {
      return sendMongooseError(res, err, `We could not create the ${name.toLowerCase()}. Please try again.`);
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: `That ${name.toLowerCase()} no longer exists. It may have been deleted.` });

      const payload = { ...(req.body || {}) };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      doc.set(payload);
      await doc.save();
      return res.json(doc.toObject());
    } catch (err) {
      return sendMongooseError(res, err, `We could not save your changes. Please try again.`);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: `That ${name.toLowerCase()} no longer exists. It may have been deleted.` });
      return res.json({ ok: true });
    } catch (err) {
      return sendMongooseError(res, err, `We could not delete this ${name.toLowerCase()}. Please try again.`);
    }
  });

  // Bulk reorder — body: { ids: [...] } in the desired display order
  router.post('/reorder', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      if (!ids.length) return res.status(400).json({ error: 'Nothing to reorder.' });

      await Model.bulkWrite(
        ids.map((id, index) => ({
          updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
        }))
      );
      return res.json({ ok: true, count: ids.length });
    } catch (err) {
      return sendMongooseError(res, err, `We could not save the new order. Please try again.`);
    }
  });

  return router;
}

module.exports = { buildCrud, sendMongooseError, escapeRegex, humanFieldName };
