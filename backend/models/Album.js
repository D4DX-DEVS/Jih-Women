const mongoose = require('mongoose');
const { localized, mediaItemSchema, autoSlug } = require('./common');

const albumSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    description: localized({ maxlength: 2000 }),
    coverImage: { type: String, trim: true, default: '' },
    eventDate: { type: Date },
    items: { type: [mediaItemSchema], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(albumSchema);
albumSchema.index({ published: 1, order: 1, eventDate: -1 });

module.exports = mongoose.model('Album', albumSchema);
