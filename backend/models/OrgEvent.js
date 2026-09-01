const mongoose = require('mongoose');
const {
  localized,
  attachmentSchema,
  mediaItemSchema,
  personSchema,
  autoSlug,
} = require('./common');

const orgEventSchema = new mongoose.Schema(
  {
    title: localized({ required: true, maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    summary: localized({ maxlength: 1000 }),
    description: localized({ maxlength: 60000 }),

    startDate: { type: Date, required: [true, 'Event start date is required'], index: true },
    endDate: { type: Date },
    timeLabel: { type: String, trim: true, default: '' },
    venue: localized({ maxlength: 500 }),
    mapUrl: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },

    coverImage: { type: String, trim: true, default: '' },
    posterImage: { type: String, trim: true, default: '' },
    speakers: { type: [personSchema], default: [] },
    gallery: { type: [mediaItemSchema], default: [] },
    downloads: { type: [attachmentSchema], default: [] },

    // Registration: either an external form/site, or a simple built-in RSVP
    registrationEnabled: { type: Boolean, default: false },
    registrationUrl: { type: String, trim: true, default: '' },

    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoSlug(orgEventSchema);
orgEventSchema.index({ published: 1, startDate: -1 });

module.exports = mongoose.model('OrgEvent', orgEventSchema);
