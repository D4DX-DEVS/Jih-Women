const mongoose = require('mongoose');
const { localized } = require('./common');

const VIDEO_KINDS = ['video', 'podcast'];

const videoItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: VIDEO_KINDS, default: 'video', index: true },
    title: localized({ required: true, maxlength: 400 }),
    description: localized({ maxlength: 5000 }),

    // Videos embed YouTube; podcasts may instead point at an audio file
    youtubeUrl: { type: String, trim: true, default: '' },
    audioUrl: { type: String, trim: true, default: '' },
    thumbnailUrl: { type: String, trim: true, default: '' },
    durationLabel: { type: String, trim: true, default: '' },

    publishedAt: { type: Date, default: Date.now },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

videoItemSchema.index({ kind: 1, published: 1, order: 1, publishedAt: -1 });

module.exports = mongoose.model('VideoItem', videoItemSchema);
module.exports.VIDEO_KINDS = VIDEO_KINDS;
