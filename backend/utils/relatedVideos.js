/**
 * Finds videos that belong to a programme by their titles. Videos have no programme
 * field, so a video counts as related when its title (either language) contains
 * the programme's full name, or one of the programme's distinctive name words
 * allowing one typo for longer words (so "Profisia" matches "Proficia"). Common
 * words ("women", "summit", "conference"…) never count on their own.
 */

const GENERIC = new Set([
  'women', 'womens', 'woman', 'summit', 'conference', 'programme', 'program', 'programs',
  'kerala', 'muslim', 'professional', 'monthly', 'wing', 'jamaat', 'islami', 'islamic',
  'hind', 'state', 'annual', 'second', 'first', 'year', 'exam', 'result', 'video',
  // Malayalam equivalents (conference, gathering, women's, Kerala, Islami, Jamaat, monthly, programme)
  'സമ്മേളനം', 'സംഗമം', 'വനിതാ', 'വനിത', 'കേരള', 'ഇസ്ലാമി', 'ഇസ്‌ലാമി', 'ജമാഅത്തെ', 'മാസിക', 'പരിപാടി', 'സമ്മിറ്റ്',
]);

const normalise = (s = '') => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
const words = (s) => normalise(s).split(' ').filter(Boolean);

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Match terms for a programme: full names (both languages) and distinctive words. */
function programTerms(program) {
  const names = [program.title?.en, program.title?.ml].map(normalise).filter((n) => n.length >= 4);
  const keywords = new Set();
  for (const source of [program.title?.en, program.title?.ml, (program.slug || '').replace(/-/g, ' ')]) {
    for (const w of words(source)) if (w.length >= 5 && !GENERIC.has(w) && !/^\d+$/.test(w)) keywords.add(w);
  }
  return { names, keywords: [...keywords] };
}

function isRelated(video, { names, keywords }) {
  const text = normalise(`${video.title?.en || ''} ${video.title?.ml || ''}`);
  if (!text) return false;
  if (names.some((n) => ` ${text} `.includes(` ${n} `))) return true;
  const vw = new Set(text.split(' '));
  return keywords.some((k) => vw.has(k) || (k.length >= 6 && [...vw].some((w) => w.length >= 5 && editDistance(k, w) <= 1)));
}

/** Published videos related to `program`, newest first (at most `limit`). */
async function relatedVideosFor(VideoItem, program, { limit = 12, published = { published: true } } = {}) {
  const terms = programTerms(program);
  if (!terms.names.length && !terms.keywords.length) return [];
  const videos = await VideoItem.find({ ...published, kind: 'video' })
    .select('title description youtubeUrl youtubeId thumbnailUrl durationLabel publishedAt kind')
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
  return videos.filter((v) => isRelated(v, terms)).slice(0, limit);
}

module.exports = { relatedVideosFor, isRelated, programTerms };
