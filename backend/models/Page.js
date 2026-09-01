const mongoose = require('mongoose');
const { localized, attachmentSchema, autoSlug } = require('./common');

const PAGE_SECTIONS = ['who-we-are', 'general'];

const pageSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    section: { type: String, enum: PAGE_SECTIONS, default: 'general', index: true },
    summary: localized({ maxlength: 1000 }),
    body: localized({ maxlength: 60000 }),
    heroImage: { type: String, trim: true, default: '' },
    downloads: { type: [attachmentSchema], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(pageSchema);
pageSchema.index({ section: 1, order: 1 });

module.exports = mongoose.model('Page', pageSchema);
module.exports.PAGE_SECTIONS = PAGE_SECTIONS;
