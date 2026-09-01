const mongoose = require('mongoose');
const { localized } = require('./common');

const LINK_CATEGORIES = ['official-portal', 'affiliated-initiative', 'institution'];

const externalLinkSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 200 }),
    description: localized({ maxlength: 1000 }),
    url: { type: String, trim: true, required: [true, 'URL is required'] },
    logoUrl: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: LINK_CATEGORIES,
      default: 'official-portal',
      index: true,
    },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

externalLinkSchema.index({ published: 1, category: 1, order: 1 });

module.exports = mongoose.model('ExternalLink', externalLinkSchema);
module.exports.LINK_CATEGORIES = LINK_CATEGORIES;
