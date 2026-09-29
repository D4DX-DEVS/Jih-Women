/**
 * Copies the site's built-in page titles and section headings into the
 * admin-managed `content` block of the site settings, so editors start from
 * the wording already live on the site. Only empty fields are filled — values
 * an editor has saved are never overwritten. Safe to re-run.
 *
 *   npm run seed:content
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { getSiteSetting } = require('../models/SiteSetting');
const { PAGE_CONTENT, SECTION_CONTENT } = require('./siteContent');

function fillEmpty(doc, path, value) {
  let filled = 0;
  for (const lang of ['ml', 'en']) {
    const current = doc.get(`${path}.${lang}`);
    if (value[lang] && !(current && current.trim())) {
      doc.set(`${path}.${lang}`, value[lang]);
      filled += 1;
    }
  }
  return filled;
}

async function run() {
  await connectDB();
  const doc = await getSiteSetting();
  let filled = 0;

  for (const [key, title] of Object.entries(PAGE_CONTENT)) {
    filled += fillEmpty(doc, `content.pages.${key}.title`, title);
  }
  for (const [key, fields] of Object.entries(SECTION_CONTENT)) {
    for (const [field, value] of Object.entries(fields)) {
      filled += fillEmpty(doc, `content.sections.${key}.${field}`, value);
    }
  }

  await doc.save();
  console.log(`[seed] site content: ${filled} empty field(s) filled`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
