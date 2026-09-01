const mongoose = require('mongoose');
const { localized, attachmentSchema, mediaItemSchema, autoSlug } = require('./common');

const MEDIA_POST_TYPES = [
  'news',
  'press-release',
  'statement',
  'interview',
  'speech',
];

const mediaPostSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: MEDIA_POST_TYPES,
      required: [true, 'Media type is required'],
      index: true,
    },
    title: localized({ required: true, maxlength: 400 }),
    slug: { type: String, trim: true, unique: true, index: true },
    excerpt: localized({ maxlength: 1000 }),
    body: localized({ maxlength: 60000 }),
    coverImage: { type: String, trim: true, default: '' },
    gallery: { type: [mediaItemSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },

    source: { type: String, trim: true, default: '' },
    sourceUrl: { type: String, trim: true, default: '' },
    author: localized({ maxlength: 200 }),
    tags: { type: [String], default: [] },

    publishedAt: { type: Date, default: Date.now, index: true },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(mediaPostSchema);
mediaPostSchema.index({ type: 1, published: 1, publishedAt: -1 });

module.exports = mongoose.model('MediaPost', mediaPostSchema);
module.exports.MEDIA_POST_TYPES = MEDIA_POST_TYPES;
