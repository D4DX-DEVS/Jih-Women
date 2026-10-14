const mongoose = require('mongoose');
const { RICH_BODY_MAX } = require('./common');
const {
  localized,
  bulletSchema,
  attachmentSchema,
  mediaItemSchema,
  isHttpUrl,
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
    overview: localized({ maxlength: RICH_BODY_MAX }),
    objectives: { type: [bulletSchema], default: [] },
    schedule: { type: [scheduleItemSchema], default: [] },
    coverImage: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    // Wide artwork used in the home page programme strip
    bannerImage: { type: String, trim: true, default: '' },
    // Programme poster shown, uncropped, beside the description on the programme's own page
    posterImage: { type: String, trim: true, default: '' },
    gallery: { type: [mediaItemSchema], default: [] },
    videos: { type: [videoRefSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },

    // Major programmes get a dedicated card on the Programs landing page
    isMajor: { type: Boolean, default: true },
    // WES has its own standalone site — link out instead of rendering locally
    // Optional, set per programme in the admin. Only http(s) links are accepted so a
    // stored value can never be a javascript: or data: URL.
    externalUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'The website link is too long.'],
      validate: {
        validator: isHttpUrl,
        message: 'The website link must be a full address starting with http:// or https://.',
      },
    },
    externalLabel: localized({ maxlength: 120 }),

    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(programSchema);

// One gallery entry per file: a repeated submit or a photo picked twice cannot list the
// same image twice. The first occurrence (and its caption) is kept, order unchanged.
programSchema.pre('validate', function dedupeGallery() {
  if (!this.isModified('gallery') || !Array.isArray(this.gallery)) return;
  const seen = new Set();
  const unique = this.gallery.filter((item) => {
    const url = (item?.url ?? '').trim();
    if (!url || seen.has(url)) return !url;
    seen.add(url);
    return true;
  });
  if (unique.length !== this.gallery.length) this.gallery = unique;
});

programSchema.index({ published: 1, isMajor: -1, order: 1 });

module.exports = mongoose.model('Program', programSchema);
