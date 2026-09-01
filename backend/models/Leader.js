const mongoose = require('mongoose');
const { localized } = require('./common');

const leaderSchema = new mongoose.Schema(
  {
    name: localized({ required: true, maxlength: 200 }),
    designation: localized({ maxlength: 200 }),
    bio: localized({ maxlength: 20000 }),
    photo: { type: String, trim: true, default: '' },

    // Past leadership is presented as "Meeqathi" posters
    posterImage: { type: String, trim: true, default: '' },
    termLabel: { type: String, trim: true, default: '' },
    termFrom: { type: Number },
    termTo: { type: Number },

    isCurrent: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaderSchema.index({ isCurrent: -1, order: 1, termFrom: -1 });

module.exports = mongoose.model('Leader', leaderSchema);
