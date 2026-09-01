const mongoose = require('mongoose');
const { localized } = require('./common');

const DOWNLOAD_CATEGORIES = [
  'official-document',
  'constitution',
  'form',
  'poster',
  'report',
  'other',
];

const downloadItemSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    description: localized({ maxlength: 2000 }),
    category: {
      type: String,
      enum: DOWNLOAD_CATEGORIES,
      default: 'other',
      index: true,
    },
    fileUrl: { type: String, trim: true, required: [true, 'File is required'] },
    mimeType: { type: String, trim: true, default: '' },
    sizeBytes: { type: Number, default: 0 },
    thumbnailUrl: { type: String, trim: true, default: '' },
    downloadCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

downloadItemSchema.index({ published: 1, category: 1, order: 1 });

module.exports = mongoose.model('DownloadItem', downloadItemSchema);
module.exports.DOWNLOAD_CATEGORIES = DOWNLOAD_CATEGORIES;
