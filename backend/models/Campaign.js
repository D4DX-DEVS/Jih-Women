const mongoose = require('mongoose');
const { localized, attachmentSchema, mediaItemSchema, autoSlug } = require('./common');

const campaignSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    summary: localized({ maxlength: 1000 }),
    body: localized({ maxlength: 60000 }),
    coverImage: { type: String, trim: true, default: '' },
    posterImage: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    hashtag: { type: String, trim: true, default: '' },
    externalUrl: { type: String, trim: true, default: '' },
    gallery: { type: [mediaItemSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(campaignSchema);
campaignSchema.index({ published: 1, order: 1, startDate: -1 });

module.exports = mongoose.model('Campaign', campaignSchema);
