const mongoose = require('mongoose');
const { localized, autoSlug } = require('./common');

const PUBLICATION_TYPES = ['book', 'article', 'booklet', 'pdf'];

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
    body: localized({ maxlength: 60000 }),

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

autoSlug(publicationSchema);
publicationSchema.index({ type: 1, published: 1, order: 1, publishedAt: -1 });

module.exports = mongoose.model('Publication', publicationSchema);
module.exports.PUBLICATION_TYPES = PUBLICATION_TYPES;
