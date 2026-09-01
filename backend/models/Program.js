const mongoose = require('mongoose');
const {
  localized,
  bulletSchema,
  attachmentSchema,
  mediaItemSchema,
  autoSlug,
} = require('./common');

const scheduleItemSchema = new mongoose.Schema(
  {
    time: { type: String, trim: true, default: '' },
    title: localized({ maxlength: 300 }),
    description: localized({ maxlength: 2000 }),
  },
  { _id: false }
);

const videoRefSchema = new mongoose.Schema(
  {
    title: localized({ maxlength: 300 }),
    youtubeUrl: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const programSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    tagline: localized({ maxlength: 500 }),
    overview: localized({ maxlength: 60000 }),
    objectives: { type: [bulletSchema], default: [] },
    schedule: { type: [scheduleItemSchema], default: [] },
    coverImage: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    // Wide artwork used in the home page programme strip
    bannerImage: { type: String, trim: true, default: '' },
    gallery: { type: [mediaItemSchema], default: [] },
    videos: { type: [videoRefSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },

    // Major programmes get a dedicated card on the Programs landing page
    isMajor: { type: Boolean, default: true },
    // WES has its own standalone site — link out instead of rendering locally
    externalUrl: { type: String, trim: true, default: '' },
    externalLabel: localized({ maxlength: 120 }),

    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(programSchema);
programSchema.index({ published: 1, isMajor: -1, order: 1 });

module.exports = mongoose.model('Program', programSchema);
