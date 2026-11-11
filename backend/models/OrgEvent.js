const mongoose = require('mongoose');
const { RICH_BODY_MAX } = require('./common');
const {
  localized,
  attachmentSchema,
  mediaItemSchema,
  personSchema,
  autoSlug,
  isHttpUrl,
} = require('./common');

const orgEventSchema = new mongoose.Schema(
  {
    // Optional: an Event Poster may be just the image. Untitled events get an item-<id> slug.
    title: localized({ maxlength: 300 }),
    slug: { type: String, trim: true, unique: true, index: true },
    summary: localized({ maxlength: 1000 }),
    description: localized({ maxlength: RICH_BODY_MAX }),

    // The Event Poster form no longer asks for a date: a new poster is dated when it is
    // created, which places it on the home page. Stored dates are kept as they are.
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
      default: Date.now,
      index: true,
    },
    endDate: { type: Date },
    timeLabel: { type: String, trim: true, default: '' },
    venue: localized({ maxlength: 500 }),
    mapUrl: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },

    coverImage: { type: String, trim: true, default: '' },
    posterImage: { type: String, trim: true, default: '' },
    // Optional: when set, clicking the poster on the website opens this address in a new
    // tab instead of the event page. Only http(s) links are accepted, so a stored value
    // can never be a javascript: or data: URL.
    externalUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'The poster link is too long.'],
      validate: {
        validator: isHttpUrl,
        message: 'The poster link must be a full web address starting with http:// or https://.',
      },
    },
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
