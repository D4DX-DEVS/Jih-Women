const mongoose = require('mongoose');
const { localized } = require('./common');

const socialSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    youtube: { type: String, trim: true, default: '' },
    whatsappChannel: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

/** The President's message block on the home page */
const presidentMessageSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    heading: localized({ maxlength: 200 }),
    name: localized({ maxlength: 200 }),
    designation: localized({ maxlength: 200 }),
    photo: { type: String, trim: true, default: '' },
    message: localized({ maxlength: 20000 }),
    linkUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: localized({ maxlength: 200 }),
    tagline: localized({ maxlength: 300 }),
    logoUrl: { type: String, trim: true, default: '' },
    faviconUrl: { type: String, trim: true, default: '' },

    // Slim announcement bar above the header
    topBarText: localized({ maxlength: 200 }),

    // Primary call-to-action in the header
    joinLabel: localized({ maxlength: 60 }),
    joinUrl: { type: String, trim: true, default: '' },

    presidentMessage: { type: presidentMessageSchema, default: () => ({}) },

    address: localized({ maxlength: 1000 }),
    phone: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    mapEmbedUrl: { type: String, trim: true, default: '' },
    workingHours: localized({ maxlength: 500 }),

    social: { type: socialSchema, default: () => ({}) },

    footerNote: localized({ maxlength: 1000 }),

    // Home page section visibility — the FRD marks several sections "hide"
    sections: {
      slider: { type: Boolean, default: true },
      campaigns: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
      featuredArticles: { type: Boolean, default: false },
      upcomingEvents: { type: Boolean, default: true },
      featuredVideos: { type: Boolean, default: false },
      publications: { type: Boolean, default: true },
      contact: { type: Boolean, default: false },
      programBanners: { type: Boolean, default: true },
      presidentMessage: { type: Boolean, default: true },
      focusAreas: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);

/** Singleton accessor — creates the document with defaults on first call. */
async function getSiteSetting() {
  let doc = await SiteSetting.findOne();
  if (!doc) doc = await SiteSetting.create({});
  return doc;
}

module.exports = SiteSetting;
module.exports.getSiteSetting = getSiteSetting;
