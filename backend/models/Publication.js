const mongoose = require('mongoose');
const { RICH_BODY_MAX } = require('./common');
const { localized, autoSlug } = require('./common');

const PUBLICATION_TYPES = ['book', 'article', 'booklet', 'pdf', 'research-paper', 'aramam'];

const publicationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: PUBLICATION_TYPES,
      required: [true, 'Publication type is required'],
      index: true,
    },
    title: localized({ required: true, maxlength: 400 }),
    slug: { type: String, trim: true, unique: true, index: true },
    author: localized({ maxlength: 200 }),
    publisher: localized({ maxlength: 200 }),
    description: localized({ maxlength: 20000 }),
    body: localized({ maxlength: RICH_BODY_MAX }),

    coverImage: { type: String, trim: true, default: '' },
    fileUrl: { type: String, trim: true, default: '' },
    externalUrl: { type: String, trim: true, default: '' },
    purchaseUrl: { type: String, trim: true, default: '' },
    price: { type: Number },
    pages: { type: Number },
    language: { type: String, trim: true, default: 'ml' },

    publishedAt: { type: Date, default: Date.now },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A research paper is only useful with its author, abstract and PDF, so those are
// required for that type. The file check runs here, not just in the admin form,
// because the upload endpoint accepts many file types.
const hasText = (value) => Boolean(value && (String(value.en || '').trim() || String(value.ml || '').trim()));
publicationSchema.pre('validate', function (next) {
  if (this.type !== 'research-paper') return next();
  if (!hasText(this.author)) this.invalidate('author', 'Author name is required for a research paper.');
  if (!hasText(this.description)) this.invalidate('description', 'A short description (abstract) is required for a research paper.');
  if (!this.publishedAt) this.invalidate('publishedAt', 'Publication date is required for a research paper.');
  if (!this.fileUrl || !this.fileUrl.trim()) {
    this.invalidate('fileUrl', 'Please upload the research paper as a PDF file.');
  } else if (!/\.pdf(\?.*)?$/i.test(this.fileUrl.trim())) {
    this.invalidate('fileUrl', 'The research paper file must be a PDF.');
  }
  return next();
});

autoSlug(publicationSchema);
publicationSchema.index({ type: 1, published: 1, order: 1, publishedAt: -1 });

module.exports = mongoose.model('Publication', publicationSchema);
module.exports.PUBLICATION_TYPES = PUBLICATION_TYPES;
