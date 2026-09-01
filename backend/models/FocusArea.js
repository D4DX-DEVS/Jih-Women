const mongoose = require('mongoose');
const { localized } = require('./common');

// Lucide icon names offered in the admin picker
const FOCUS_ICONS = [
  'graduation-cap',
  'users',
  'heart-handshake',
  'calendar-days',
  'megaphone',
  'handshake',
  'book-open',
  'sprout',
  'shield-check',
  'stethoscope',
  'scale',
  'lightbulb',
];

const focusAreaSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 120 }),
    description: localized({ maxlength: 400 }),
    icon: { type: String, enum: FOCUS_ICONS, default: 'graduation-cap' },
    linkUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

focusAreaSchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('FocusArea', focusAreaSchema);
module.exports.FOCUS_ICONS = FOCUS_ICONS;
