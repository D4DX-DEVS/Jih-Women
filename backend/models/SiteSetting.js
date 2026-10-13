const mongoose = require('mongoose');
const { localized } = require('./common');
const { PAGE_CONTENT_KEYS, SECTION_CONTENT_KEYS } = require('../utils/siteContent');

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

/** Admin-managed title of a static public page (e.g. Leaders, Contact) */
const pageContentSchema = new mongoose.Schema(
  { title: localized({ maxlength: 200 }) },
  { _id: false }
);

/** Admin-managed heading block of a page section, with one shared logo */
const sectionContentSchema = new mongoose.Schema(
  {
    label: localized({ maxlength: 120 }),
    heading: localized({ maxlength: 300 }),
    description: localized({ maxlength: 2000 }),
    logo: { type: String, trim: true, default: '' },
    // Where the section's "Read More" button goes: a site path (/who-we-are/history) or a full URL
    linkUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const keyedSchema = (keys, schema) =>
  new mongoose.Schema(
    Object.fromEntries(keys.map((key) => [key, { type: schema, default: () => ({}) }])),
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

    // Page titles and section headings shown on the public site; keys live in
    // utils/siteContent.js. Empty values fall back to the site's built-in text.
    content: {
      pages: { type: keyedSchema(PAGE_CONTENT_KEYS, pageContentSchema), default: () => ({}) },
      sections: { type: keyedSchema(SECTION_CONTENT_KEYS, sectionContentSchema), default: () => ({}) },
    },

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
