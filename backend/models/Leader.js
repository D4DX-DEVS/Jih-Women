const mongoose = require('mongoose');
const { localized } = require('./common');

// Which group of leaders a person belongs to. Leaders saved before categories existed
// have no value stored and are treated as state leaders (see the public leaders route).
// `party` is the stored value of the group the site and admin label "Past Leaders".
const LEADER_CATEGORIES = ['state', 'district', 'party'];

/**
 * A period of leadership as the editor typed it ("2024–2026", "2024 - 2026", "2019"),
 * with the years read out of it for sorting and grouping. A plain year or year range is
 * rewritten in one style ("2024–2026") so equal periods group together on the site;
 * any other wording is kept as typed.
 */
function parsePeriod(raw) {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  const years = (text.match(/\b\d{4}\b/g) || []).map(Number);
  const from = years.length ? Math.min(...years) : undefined;
  const to = years.length ? Math.max(...years) : undefined;
  const plain = /^(\d{4})(?:\s*(?:-|–|—|to|\/)\s*(\d{4}))?$/i.test(text);
  const period = plain ? (from === to ? String(from) : `${from}–${to}`) : text;
  return { period, from, to };
}

/**
 * Cleans a list of leadership periods: drops rows left completely blank, merges repeats
 * of the same period and district, and orders them oldest first. Rows whose years cannot
 * be read keep their place after the dated ones.
 */
function normalizeTerms(list) {
  const seen = new Set();
  const terms = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const district = String(raw?.district ?? '').trim();
    const { period, from, to } = parsePeriod(raw?.period);
    if (!period && !district) continue;
    const key = `${period.toLowerCase()}|${district.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push({ period, district, from, to });
  }
  const rank = (t) => (t.from === undefined ? Infinity : t.from);
  return terms
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t) - rank(b.t) || (a.t.to ?? 0) - (b.t.to ?? 0) || a.i - b.i)
    .map(({ t }) => t);
}

/** The single period a leader saved before periods existed carries in its old term fields. */
function legacyTerms(leader) {
  const label = String(leader?.termLabel ?? '').trim();
  if (label) return [{ period: label, district: '' }];
  const { termFrom, termTo } = leader || {};
  if (termFrom || termTo) {
    const years = [termFrom, termTo].filter(Boolean);
    return [{ period: years.join('–'), district: '' }];
  }
  return [];
}

/** Every period of a leader, falling back to the old term fields for records saved before. */
function leaderTerms(leader) {
  const own = Array.isArray(leader?.terms) && leader.terms.length ? leader.terms : legacyTerms(leader);
  return normalizeTerms(own);
}

/** The most recent period (latest end year); the last one listed when none has a year. */
function latestTerm(terms) {
  let latest = null;
  for (const t of terms) {
    if (t.from === undefined) continue;
    if (!latest || t.to > latest.to || (t.to === latest.to && t.from > latest.from)) latest = t;
  }
  return latest || terms[terms.length - 1] || null;
}

const termSchema = new mongoose.Schema(
  {
    // The year or year range as shown on the site, e.g. "2024–2026"; optional
    period: { type: String, trim: true, default: '', maxlength: 60 },
    // District served in during this period (district leaders); optional
    district: { type: String, trim: true, default: '', maxlength: 80 },
    // Read from `period` when saved; used for ordering and grouping
    from: { type: Number },
    to: { type: Number },
  },
  { _id: false }
);

const leaderSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: { values: LEADER_CATEGORIES, message: 'Choose State, District or Past leaders as the category.' },
      default: 'state',
      // Optional in the admin: a blank category is saved as State, as for older records
      set: (value) => value || 'state',
    },
    // Every field is optional, in both languages; the site leaves out whatever is empty
    name: localized({ maxlength: 200 }),
    designation: localized({ maxlength: 200 }),
    bio: localized({ maxlength: 20000 }),
    photo: { type: String, trim: true, default: '' },

    // Past leadership is presented as "Meeqathi" posters
    posterImage: { type: String, trim: true, default: '' },

    // Every period this person led in, so one record covers repeated or broken terms
    terms: { type: [termSchema], default: [] },

    // Kept in step with the most recent entry of `terms` when saved. Records saved before
    // `terms` existed hold their only period here; it becomes their first period on save.
    termLabel: { type: String, trim: true, default: '' },
    termFrom: { type: Number },
    termTo: { type: Number },

    // Decides Current/Past on the site; set from the category when saved (Past Leaders
    // are not current), never worked out from the calendar
    isCurrent: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

leaderSchema.pre('validate', function (next) {
  const source = this.terms && this.terms.length
    ? this.terms.map((t) => (typeof t.toObject === 'function' ? t.toObject() : t))
    : legacyTerms(this);
  const terms = normalizeTerms(source);
  this.terms = terms;

  const latest = latestTerm(terms);
  this.termLabel = latest ? latest.period : '';
  this.termFrom = latest ? latest.from : undefined;
  this.termTo = latest ? latest.to : undefined;

  this.isCurrent = this.category !== 'party';
  next();
});

leaderSchema.index({ isCurrent: -1, order: 1, termFrom: -1 });

module.exports = mongoose.model('Leader', leaderSchema);
module.exports.LEADER_CATEGORIES = LEADER_CATEGORIES;
module.exports.leaderTerms = leaderTerms;
module.exports.normalizeTerms = normalizeTerms;
module.exports.parsePeriod = parsePeriod;
