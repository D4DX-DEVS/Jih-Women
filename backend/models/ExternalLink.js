const mongoose = require('mongoose');
const { localized } = require('./common');

const LINK_CATEGORIES = ['official-portal', 'affiliated-initiative', 'institution'];

/** True for an absolute http(s) URL with a host — the only kind the site links out to. */
function isExternalUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** "www.example.org" → "https://www.example.org"; anything with a scheme is left for validation. */
function normalizeUrl(value) {
  const url = String(value ?? '').trim();
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('/')) return url;
  return /^[^\s/]+\.[^\s/]+/.test(url) ? `https://${url}` : url;
}

const externalLinkSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 200 }),
    description: localized({ maxlength: 1000 }),
    url: {
      type: String,
      trim: true,
      required: [true, 'URL is required'],
      set: normalizeUrl,
      validate: {
        validator: isExternalUrl,
        message: 'Enter a full web address starting with https:// (for example https://www.example.org).',
      },
    },
    logoUrl: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: LINK_CATEGORIES,
      default: 'official-portal',
      index: true,
    },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

externalLinkSchema.index({ published: 1, category: 1, order: 1 });

module.exports = mongoose.model('ExternalLink', externalLinkSchema);
module.exports.LINK_CATEGORIES = LINK_CATEGORIES;
module.exports.isExternalUrl = isExternalUrl;
