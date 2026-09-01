const mongoose = require('mongoose');
const {
  localized,
  bulletSchema,
  attachmentSchema,
  mediaItemSchema,
  personSchema,
  autoSlug,
} = require('./common');

const activitySchema = new mongoose.Schema(
  {
    title: localized({ maxlength: 300 }),
    description: localized({ maxlength: 2000 }),
    image: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const departmentSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    tagline: localized({ maxlength: 500 }),
    about: localized({ maxlength: 60000 }),
    objectives: { type: [bulletSchema], default: [] },
    activities: { type: [activitySchema], default: [] },
    leadership: { type: [personSchema], default: [] },
    coverImage: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    posters: { type: [mediaItemSchema], default: [] },
    gallery: { type: [mediaItemSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },
    externalUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(departmentSchema);
departmentSchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('Department', departmentSchema);
