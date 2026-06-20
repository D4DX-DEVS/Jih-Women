const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 300,
    },
    order: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
