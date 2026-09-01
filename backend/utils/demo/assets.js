/**
 * Generates the placeholder artwork used by the demo content seeder and
 * uploads it straight to Spaces. Object keys are stable, so re-running the
 * seeder overwrites the same files instead of piling up new ones.
 */
const sharp = require('sharp');
const { uploadBuffer } = require('../../config/spaces');

const SPACES_FOLDER = process.env.DO_SPACES_FOLDER || '';
const DEMO_PREFIX = `${SPACES_FOLDER ? `${SPACES_FOLDER}/` : ''}org/demo`;

const PALETTES = [
  ['#2C0A4D', '#5C2AA0', '#E6187E'],
  ['#3F156C', '#8757C6', '#C71169'],
  ['#1E0637', '#6733A8', '#EE5FA3'],
  ['#A20D55', '#E6187E', '#F49BC6'],
  ['#140324', '#3F156C', '#8757C6'],
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wraps a label onto at most three lines that fit the given width. */
function wrap(text, perLine) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string} opts.label      Headline drawn on the image
 * @param {string} [opts.sub]      Small caption under the headline
 * @param {number} [opts.variant]  Palette index
 */
async function makeImage({ width, height, label, sub = '', variant = 0 }) {
  const [c1, c2, c3] = PALETTES[variant % PALETTES.length];
  const base = Math.min(width, height);
  const titleSize = Math.max(20, Math.round(base * 0.085));
  const subSize = Math.max(12, Math.round(base * 0.038));
  const lines = wrap(label, Math.max(12, Math.round(width / (titleSize * 0.56))));
  const blockHeight = lines.length * titleSize * 1.22 + (sub ? subSize * 2.2 : 0);
  let y = height / 2 - blockHeight / 2 + titleSize * 0.9;

  const tspans = lines
    .map((line) => {
      const el = `<text x="50%" y="${Math.round(y)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`;
      y += titleSize * 1.22;
      return el;
    })
    .join('');

  const subEl = sub
    ? `<text x="50%" y="${Math.round(y + subSize * 0.6)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${subSize}" font-weight="500" letter-spacing="2" fill="#ffffff" fill-opacity="0.72">${escapeXml(sub.toUpperCase())}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="55%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>
      <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#dots)"/>
    <circle cx="${Math.round(width * 0.86)}" cy="${Math.round(height * 0.16)}" r="${Math.round(base * 0.28)}" fill="#ffffff" fill-opacity="0.07"/>
    <circle cx="${Math.round(width * 0.1)}" cy="${Math.round(height * 0.88)}" r="${Math.round(base * 0.2)}" fill="#ffffff" fill-opacity="0.05"/>
    ${tspans}
    ${subEl}
  </svg>`;

  return sharp(Buffer.from(svg)).webp({ quality: 84 }).toBuffer();
}

/** Builds a small but structurally valid one-page PDF. */
function makePdf(title, body) {
  const escape = (v) => String(v).replace(/([()\\])/g, '\\$1');
  const content =
    `BT /F1 22 Tf 60 760 Td (${escape(title)}) Tj ET\n` +
    body
      .slice(0, 12)
      .map((line, i) => `BT /F1 12 Tf 60 ${720 - i * 20} Td (${escape(line)}) Tj ET`)
      .join('\n');

  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${Buffer.byteLength(content)}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

/** Uploads a buffer under a stable demo key and returns its CDN URL. */
function putDemo(name, buffer, contentType) {
  return uploadBuffer(buffer, `${DEMO_PREFIX}/${name}`, contentType);
}

async function uploadImage(name, opts) {
  const buffer = await makeImage(opts);
  return putDemo(`${name}.webp`, buffer, 'image/webp');
}

async function uploadPdf(name, title, body) {
  return putDemo(`${name}.pdf`, makePdf(title, body), 'application/pdf');
}

module.exports = { makeImage, makePdf, uploadImage, uploadPdf, DEMO_PREFIX };
