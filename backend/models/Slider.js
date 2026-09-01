const mongoose = require('mongoose');
const { localized } = require('./common');

const sliderSchema = new mongoose.Schema(
  {
    title: localized({ maxlength: 300 }),
    subtitle: localized({ maxlength: 500 }),
    imageUrl: { type: String, trim: true, required: [true, 'Slide image is required'] },
    mobileImageUrl: { type: String, trim: true, default: '' },
    linkUrl: { type: String, trim: true, default: '' },
    linkLabel: localized({ maxlength: 120 }),
    secondaryLinkUrl: { type: String, trim: true, default: '' },
    secondaryLinkLabel: localized({ maxlength: 120 }),
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sliderSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Slider', sliderSchema);
