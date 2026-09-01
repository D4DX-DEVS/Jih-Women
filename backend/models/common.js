const mongoose = require('mongoose');

/**
 * Bilingual text field. Malayalam is the mandatory language, English optional.
 * Stored as a nested path (no _id) so it stays a plain object in JSON.
 */
function localized({ required = false, maxlength } = {}) {
  const base = { type: String, trim: true, default: '' };
  if (maxlength) base.maxlength = maxlength;
  return {
    ml: required
      ? { ...base, required: [true, 'This field is required in Malayalam.'] }
      : { ...base },
    en: { ...base },
  };
}

/** Short bilingual label (headings, names, designations) */
const localizedShort = () => localized({ maxlength: 300 });
/** Long bilingual body (rich HTML from the admin editor) */
const localizedBody = () => localized({ maxlength: 60000 });

/** Repeating bilingual bullet list item */
const bulletSchema = new mongoose.Schema(
  { text: localized({ maxlength: 1000 }) },
  { _id: false }
);

/** A file/image attachment stored on DigitalOcean Spaces */
const attachmentSchema = new mongoose.Schema(
  {
    title: localized({ maxlength: 300 }),
    url: { type: String, trim: true, required: true },
    mimeType: { type: String, trim: true, default: '' },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

/** A gallery entry (image or video) attached to a content document */
const mediaItemSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, required: true },
    thumbnailUrl: { type: String, trim: true, default: '' },
    caption: localized({ maxlength: 500 }),
    kind: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { _id: false }
);

/** Embedded person card (department leadership, event speakers) */
const personSchema = new mongoose.Schema(
  {
    name: localized({ maxlength: 200 }),
    designation: localized({ maxlength: 200 }),
    photo: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Attaches a pre-validate hook that fills `slug` from the English title
 * (Malayalam does not transliterate to a URL-safe slug) and guarantees
 * a non-empty value.
 */
function autoSlug(schema, sourcePath = 'title') {
  schema.pre('validate', function (next) {
    if (!this.slug || !String(this.slug).trim()) {
      const source = this.get(`${sourcePath}.en`) || this.get(`${sourcePath}.ml`) || '';
      const generated = slugify(source);
      this.slug = generated || `item-${this._id.toString().slice(-8)}`;
    } else {
      this.slug = slugify(this.slug) || `item-${this._id.toString().slice(-8)}`;
    }
    next();
  });
  return schema;
}

module.exports = {
  localized,
  localizedShort,
  localizedBody,
  bulletSchema,
  attachmentSchema,
  mediaItemSchema,
  personSchema,
  slugify,
  autoSlug,
};
