/**
 * YouTube helpers for the video library.
 *
 * Works without an API key: video details come from the public watch page
 * (ytInitialPlayerResponse) and a channel's uploads from its /videos page
 * (ytInitialData). Nothing is downloaded or re-hosted; the website plays the
 * video through YouTube's embedded player.
 */
const axios = require('axios');

const TIMEOUT_MS = 10000;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en',
};

const ID_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/live\/)([\w-]{11})/,
  /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/,
];

/** The 11-character video id from any common YouTube video URL, or null. */
function extractVideoId(url) {
  const value = String(url || '').trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  for (const rx of ID_PATTERNS) {
    const m = value.match(rx);
    if (m) return m[1];
  }
  return null;
}

/** True for channel addresses (@handle, /channel/UC…, /c/…, /user/…) rather than a single video. */
function isChannelUrl(url) {
  return /youtube\.com\/(?:@[\w.-]+|channel\/UC[\w-]{22}|c\/[\w.-]+|user\/[\w.-]+)/i.test(String(url || ''));
}

const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
const embedUrl = (id) => `https://www.youtube.com/embed/${id}`;

function formatDuration(totalSeconds) {
  const s = Number(totalSeconds);
  if (!Number.isFinite(s) || s <= 0) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

async function getPage(url) {
  const res = await axios.get(url, { headers: HEADERS, timeout: TIMEOUT_MS, responseType: 'text' });
  return String(res.data || '');
}

/** Parses the JSON object assigned to `varName` inside a YouTube page. */
function extractJson(html, varName) {
  const start = html.indexOf(`var ${varName} = `);
  if (start < 0) return null;
  const from = start + `var ${varName} = `.length;
  if (html[from] !== '{') return null;
  // Walk to the matching closing brace; what follows varies between pages
  let depth = 0;
  let inString = false;
  for (let i = from; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try {
        return JSON.parse(html.slice(from, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * The best 16:9 thumbnail that exists for a video. maxresdefault and hq720 are
 * only generated for HD uploads; mqdefault is always there and is also 16:9.
 */
async function bestThumbnail(id) {
  for (const name of ['maxresdefault', 'hq720']) {
    const url = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
    try {
      await axios.head(url, { timeout: 5000 });
      return url;
    } catch {
      // try the next size
    }
  }
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

/**
 * Looks a video up on YouTube.
 *
 * Resolves to `{ status: 'ok', ...details }`, `{ status: 'unavailable', reason }`
 * when YouTube says the video is private, deleted or cannot be embedded, or
 * `{ status: 'unknown' }` when YouTube could not be reached — callers should
 * then carry on with what the editor typed rather than block the save.
 */
async function fetchVideoDetails(id) {
  let html;
  try {
    html = await getPage(`${watchUrl(id)}&hl=en`);
  } catch {
    return { status: 'unknown' };
  }

  const player = extractJson(html, 'ytInitialPlayerResponse');
  if (!player) return { status: 'unknown' };

  const playability = player.playabilityStatus || {};
  if (playability.status && playability.status !== 'OK') {
    return {
      status: 'unavailable',
      reason:
        playability.status === 'LOGIN_REQUIRED'
          ? 'This YouTube video is private or age-restricted, so it cannot be shown on the website.'
          : 'This YouTube video has been removed or is unavailable. Please check the link.',
    };
  }
  if (playability.playableInEmbed === false) {
    return {
      status: 'unavailable',
      reason: "The video's owner has turned off embedding, so it cannot play on the website.",
    };
  }

  const details = player.videoDetails || {};
  const micro = player.microformat?.playerMicroformatRenderer || {};
  return {
    status: 'ok',
    youtubeId: id,
    youtubeUrl: watchUrl(id),
    embedUrl: embedUrl(id),
    title: details.title || '',
    description: details.shortDescription || '',
    durationLabel: formatDuration(details.lengthSeconds),
    publishedAt: micro.publishDate || micro.uploadDate || null,
    thumbnailUrl: await bestThumbnail(id),
  };
}

/**
 * Lists the newest uploads on a channel's /videos tab (about 30).
 * Each item: { youtubeId, title, durationLabel, thumbnailUrl }.
 */
async function fetchChannelVideos(channelUrl) {
  const base = String(channelUrl || '')
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/\/(videos|featured|shorts|streams|playlists|about)\/?$/i, '')
    .replace(/\/$/, '');
  const html = await getPage(`${base}/videos?hl=en`);
  const data = extractJson(html, 'ytInitialData');
  if (!data) throw new Error('channel-unreadable');

  const found = [];
  const seen = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    const lockup = node.lockupViewModel;
    if (lockup && lockup.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && lockup.contentId) {
      const id = lockup.contentId;
      if (!seen.has(id)) {
        seen.add(id);
        const badge = lockup.contentImage?.thumbnailViewModel?.overlays
          ?.map((o) => o.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text)
          .find(Boolean);
        found.push({
          youtubeId: id,
          title: lockup.metadata?.lockupMetadataViewModel?.title?.content || '',
          durationLabel: /^\d+(:\d{2}){1,2}$/.test(badge || '') ? badge : '',
        });
      }
      return;
    }
    // Older page layout
    const renderer = node.videoRenderer;
    if (renderer && renderer.videoId) {
      if (!seen.has(renderer.videoId)) {
        seen.add(renderer.videoId);
        found.push({
          youtubeId: renderer.videoId,
          title: renderer.title?.runs?.map((r) => r.text).join('') || '',
          durationLabel: renderer.lengthText?.simpleText || '',
        });
      }
      return;
    }
    for (const key of Object.keys(node)) walk(node[key]);
  })(data);

  return found;
}

module.exports = {
  extractVideoId,
  isChannelUrl,
  watchUrl,
  embedUrl,
  formatDuration,
  fetchVideoDetails,
  fetchChannelVideos,
};
