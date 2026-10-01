const mongoose = require('mongoose');
const { localized } = require('./common');
const { extractVideoId, isChannelUrl, watchUrl, embedUrl } = require('../utils/youtube');

const VIDEO_KINDS = ['video', 'podcast'];

const videoItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: VIDEO_KINDS, default: 'video', index: true },
    title: localized({ required: true, maxlength: 400 }),
    description: localized({ maxlength: 5000 }),

    // Videos embed YouTube; podcasts may instead point at an audio file
    youtubeUrl: { type: String, trim: true, default: '' },
    // Derived from youtubeUrl on every save
    youtubeId: { type: String, trim: true, default: '', index: true },
    embedUrl: { type: String, trim: true, default: '' },
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

// Normalise the YouTube link into its id, canonical watch URL and embed URL
videoItemSchema.pre('validate', function deriveYouTube() {
  const raw = (this.youtubeUrl || '').trim();
  if (!raw) {
    this.youtubeId = '';
    this.embedUrl = '';
    return;
  }
  const id = extractVideoId(raw);
  if (!id) {
    this.invalidate(
      'youtubeUrl',
      isChannelUrl(raw)
        ? 'That is a YouTube channel link. Paste the link of a single video, or use "Import from YouTube channel" to add the channel\'s videos.'
        : 'That does not look like a YouTube video link. Paste the full watch, youtu.be or shorts link.'
    );
    return;
  }
  this.youtubeId = id;
  this.youtubeUrl = watchUrl(id);
  this.embedUrl = embedUrl(id);
});

module.exports = mongoose.model('VideoItem', videoItemSchema);
module.exports.VIDEO_KINDS = VIDEO_KINDS;
