import { formatDate } from '../shared/api';
import { emptyLocalized } from '../shared/types';
import type { Localized } from '../shared/types';
import type { CollectionConfig, ColumnDef } from './CollectionManager';
import type { Doc } from './fields';
import DownloadsVisibilityToggle from './DownloadsVisibilityToggle';
import FocusVisibilityToggle from './FocusVisibilityToggle';
import YouTubeChannelImport from './YouTubeChannelImport';

/* ---------------- column helpers ---------------- */

const loc = (path: string, label: string): ColumnDef => ({
  label,
  className: 'min-w-[200px] max-w-[340px]',
  render: (row) => {
    const value = row[path] as Localized | undefined;
    return (
      <div className="min-w-0">
        <div className="cell-clamp font-medium text-[13px] leading-snug">
          {value?.ml || value?.en || '—'}
        </div>
        {value?.en && value?.ml && (
          <div className="cell-truncate mt-0.5 text-[11.5px] text-foreground/45">{value.en}</div>
        )}
      </div>
    );
  },
});

const str = (path: string, label: string): ColumnDef => ({
  label,
  className: 'max-w-[190px]',
  render: (row) => (
    <span className="cell-truncate text-foreground/70">{(row[path] as string) || '—'}</span>
  ),
});

const date = (path: string, label: string): ColumnDef => ({
  label,
  className: 'w-[132px]',
  render: (row) => (
    <span className="whitespace-nowrap text-foreground/60">{formatDate(row[path] as string)}</span>
  ),
});

const img = (path: string, label = ''): ColumnDef => ({
  label: label || 'Image',
  className: 'w-[72px]',
  render: (row) =>
    row[path] ? (
      <img
        src={row[path] as string}
        alt=""
        className="h-11 w-11 rounded-lg border border-[#e6e8f0] object-cover"
      />
    ) : (
      <div className="grid h-11 w-11 place-items-center rounded-lg border border-dashed border-[#d3d7e4] text-[9px] text-foreground/30">
        —
      </div>
    ),
});

/** A logo, shown whole (not cropped) in a wider box so wide marks stay legible. */
const logo = (path: string, label = 'Logo'): ColumnDef => ({
  label,
  className: 'w-[112px]',
  render: (row) =>
    row[path] ? (
      <span className="flex h-12 w-24 items-center justify-center rounded-lg border border-[#e6e8f0] bg-white p-1.5">
        <img src={row[path] as string} alt="" className="h-auto max-h-full w-auto max-w-full object-contain" />
      </span>
    ) : (
      <div className="grid h-12 w-24 place-items-center rounded-lg border border-dashed border-[#d3d7e4] text-[9px] text-foreground/30">
        —
      </div>
    ),
});

const flag = (path: string, label: string): ColumnDef => ({
  label,
  className: 'w-[92px]',
  render: (row) =>
    row[path] ? <span className="badge badge-success">Yes</span> : <span className="text-foreground/25">—</span>,
});

const count = (path: string, label: string): ColumnDef => ({
  label,
  className: 'w-[86px]',
  render: (row) => (
    <span className="text-foreground/60">{((row[path] as unknown[]) ?? []).length}</span>
  ),
});

/* ---------------- shared field fragments ---------------- */

const slugField = {
  kind: 'text' as const,
  path: 'slug',
  label: 'URL slug',
  placeholder: 'auto-generated from English title',
  hint: 'Lowercase letters, numbers and hyphens. Leave blank to generate from the English title.',
};

const orderField = { kind: 'number' as const, path: 'order', label: 'Sort order' };
const publishedField = {
  kind: 'toggle' as const,
  path: 'published',
  label: 'Published',
  description: 'Visible on the public website',
};

/* ---------------- collections ---------------- */

export const SLIDERS: CollectionConfig = {
  key: 'sliders',
  endpoint: '/api/admin/cms/sliders',
  label: 'Home Slider',
  singular: 'Slide',
  description: 'The sliding banner at the top of the home page.',
  reorderable: true,
  columns: [img('imageUrl'), loc('title', 'Title'), str('linkUrl', 'Link')],
  blank: () => ({
    title: emptyLocalized(),
    subtitle: emptyLocalized(),
    linkLabel: emptyLocalized(),
    secondaryLinkLabel: emptyLocalized(),
    imageUrl: '',
    mobileImageUrl: '',
    linkUrl: '',
    secondaryLinkUrl: '',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'asset', path: 'imageUrl', label: 'Slide image', folder: 'slider', required: true, recommend: '1920×900px or wider (about 2:1). The headline sits over the left third on a dark gradient — keep faces and detail on the right half.' },
    { kind: 'asset', path: 'mobileImageUrl', label: 'Mobile image (optional)', folder: 'slider', hint: 'Portrait crop used on phones.', recommend: '1080×1440px (3:4 portrait). The same artwork re-cropped upright, subject centred.' },
    {
      kind: 'localized',
      path: 'title',
      label: 'Headline',
      hint: 'Wrap words in *asterisks* to highlight them in pink — e.g. Building a *Better Society*.',
    },
    { kind: 'localized', path: 'subtitle', label: 'Subtitle', multiline: true, rows: 3 },
    { kind: 'heading', label: 'Primary button' },
    { kind: 'row', fields: [
      { kind: 'localized', path: 'linkLabel', label: 'Label' },
      { kind: 'text', path: 'linkUrl', label: 'Link', placeholder: '/events or https://…' },
    ] },
    { kind: 'heading', label: 'Secondary button' },
    { kind: 'row', fields: [
      { kind: 'localized', path: 'secondaryLinkLabel', label: 'Label' },
      { kind: 'text', path: 'secondaryLinkUrl', label: 'Link', placeholder: '/programs' },
    ] },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const CAMPAIGNS: CollectionConfig = {
  key: 'campaigns',
  endpoint: '/api/admin/cms/campaigns',
  label: 'Campaigns',
  singular: 'Campaign',
  description: 'Ongoing campaigns featured on the home page.',
  reorderable: true,
  filters: [{ param: 'featured', label: 'Featured', options: [{ value: 'true', label: 'Featured' }, { value: 'false', label: 'Not featured' }] }],
  columns: [img('coverImage'), loc('title', 'Campaign'), str('slug', 'Slug'), date('startDate', 'Starts'), flag('featured', 'Featured')],
  blank: () => ({
    title: emptyLocalized(),
    summary: emptyLocalized(),
    body: emptyLocalized(),
    slug: '',
    coverImage: '',
    posterImage: '',
    hashtag: '',
    externalUrl: '',
    gallery: [],
    downloads: [],
    featured: false,
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    slugField,
    { kind: 'localized', path: 'summary', label: 'Summary', multiline: true, rows: 3 },
    { kind: 'rich', path: 'body', label: 'Full description' },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'campaigns', recommend: '1600×900px (16:9). Used as the card image and as the full-width page banner, where the left third is darkened — keep the subject centred.' },
      { kind: 'asset', path: 'posterImage', label: 'Poster', folder: 'campaigns', recommend: "1400×1960px (5:7 portrait), or the poster's own shape with the long edge up to 2000px. Shown uncropped." },
    ] },
    { kind: 'row', fields: [
      { kind: 'date', path: 'startDate', label: 'Start date' },
      { kind: 'date', path: 'endDate', label: 'End date' },
    ] },
    { kind: 'row', fields: [
      { kind: 'text', path: 'hashtag', label: 'Hashtag', placeholder: '#campaign' },
      { kind: 'text', path: 'externalUrl', label: 'External link' },
    ] },
    { kind: 'gallery', path: 'gallery', label: 'Gallery', folder: 'campaigns', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'attachments', path: 'downloads', label: 'Downloads', folder: 'campaigns', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'featured', label: 'Featured on home page' },
      orderField,
    ] },
    publishedField,
  ],
};

export const PAGES: CollectionConfig = {
  key: 'pages',
  endpoint: '/api/admin/cms/pages',
  label: 'About Us',
  noun: 'pages',
  singular: 'Page',
  description: 'About Us sub-pages (Ideology, Our Values, Constitution, Our Legacy) and other standalone pages.',
  reorderable: true,
  filters: [{ param: 'section', label: 'Section', options: [
    // The stored value stays 'who-we-are': it is the public URL and API section key
    { value: 'who-we-are', label: 'About Us' },
    { value: 'general', label: 'General' },
  ] }],
  columns: [
    loc('title', 'Page'),
    str('slug', 'Slug'),
    {
      label: 'Section',
      className: 'max-w-[190px]',
      render: (row) => (
        <span className="cell-truncate text-foreground/70">
          {row.section === 'who-we-are' ? 'About Us' : row.section === 'general' ? 'General' : (row.section as string) || '—'}
        </span>
      ),
    },
  ],
  blank: () => ({
    title: emptyLocalized(),
    summary: emptyLocalized(),
    body: emptyLocalized(),
    slug: '',
    section: 'who-we-are',
    heroImage: '',
    downloads: [],
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Page title', required: true },
    { kind: 'row', fields: [
      slugField,
      { kind: 'select', path: 'section', label: 'Section', options: [
        { value: 'who-we-are', label: 'About Us' },
        { value: 'general', label: 'General' },
      ] },
    ] },
    { kind: 'localized', path: 'summary', label: 'Summary', multiline: true, rows: 3 },
    { kind: 'rich', path: 'body', label: 'Page content' },
    { kind: 'asset', path: 'heroImage', label: 'Hero image', folder: 'pages', recommend: '1920×840px (16:7). Also used as the full-width page banner, where the left third is darkened.' },
    { kind: 'attachments', path: 'downloads', label: 'Downloads (PDF)', folder: 'pages', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const DEPARTMENTS: CollectionConfig = {
  key: 'departments',
  endpoint: '/api/admin/cms/departments',
  label: 'Departments',
  singular: 'Department',
  description: "Thamheedul Mar'a, WINGS, FOR HER and other wings — each gets its own page.",
  reorderable: true,
  columns: [img('coverImage'), loc('title', 'Department'), str('slug', 'Slug'), count('activities', 'Activities')],
  blank: () => ({
    title: emptyLocalized(),
    tagline: emptyLocalized(),
    about: emptyLocalized(),
    slug: '',
    objectives: [],
    activities: [],
    leadership: [],
    coverImage: '',
    logoUrl: '',
    posters: [],
    gallery: [],
    downloads: [],
    externalUrl: '',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Department name', required: true },
    slugField,
    { kind: 'localized', path: 'tagline', label: 'Tagline', multiline: true, rows: 2 },
    { kind: 'rich', path: 'about', label: 'About' },
    { kind: 'heading', label: 'Objectives' },
    { kind: 'bullets', path: 'objectives', label: 'Objectives' },
    { kind: 'heading', label: 'Activities' },
    {
      kind: 'object-list',
      path: 'activities',
      label: 'Activities',
      addLabel: 'Add activity',
      blank: () => ({ title: emptyLocalized(), description: emptyLocalized(), image: '' }),
      fields: [
        { kind: 'localized', path: 'title', label: 'Activity' },
        { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 2 },
        { kind: 'asset', path: 'image', label: 'Image', folder: 'departments', recommend: '1200×675px (16:9).' },
      ],
    },
    { kind: 'heading', label: 'Leadership' },
    { kind: 'people', path: 'leadership', label: 'Leadership', folder: 'departments', recommend: '800×800px (1:1) square. Cropped to a circle, so centre the face and crop tight.' },
    { kind: 'heading', label: 'Media & files' },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'departments', recommend: '1920×1080px (16:9). Also used as the full-width page banner, where the left third is darkened — keep the subject centred.' },
      { kind: 'asset', path: 'logoUrl', label: 'Logo', folder: 'departments', recommend: 'At least 240px tall, width proportional. Transparent PNG or SVG — shown uncropped on white.' },
    ] },
    { kind: 'gallery', path: 'posters', label: 'Posters', folder: 'departments', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'gallery', path: 'gallery', label: 'Gallery', folder: 'departments', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'attachments', path: 'downloads', label: 'Downloads', folder: 'departments', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'row', fields: [
      { kind: 'text', path: 'externalUrl', label: 'External website' },
      orderField,
    ] },
    publishedField,
  ],
};

export const PROGRAMS: CollectionConfig = {
  key: 'programs',
  endpoint: '/api/admin/cms/programs',
  label: 'Highlights',
  singular: 'Programme',
  description: 'WES, Proficia, Thamheed, Safa Nagar and other programmes. A poster uploaded for a programme is shown on that programme’s own page.',
  reorderable: true,
  filters: [{ param: 'isMajor', label: 'Type', options: [
    { value: 'true', label: 'Major programme' },
    { value: 'false', label: 'Other' },
  ] }],
  columns: [logo('logoUrl'), img('posterImage', 'Poster'), loc('title', 'Programme'), str('slug', 'Slug'), flag('isMajor', 'Major')],
  /* The form edits and sends only name, short description, description, poster, logo,
     external website URL and gallery. Everything else stored on a programme (slug,
     cover/banner images, objectives, schedule, videos, downloads, link label, type,
     order) is left as it is; a new programme gets the model defaults (published, major,
     order 0, slug from the name). The backend accepts the same fields, plus the list's
     Published toggle. */
  editable: ['title', 'tagline', 'overview', 'posterImage', 'logoUrl', 'externalUrl', 'gallery'],
  modalSize: 'lg',
  blank: () => ({
    title: emptyLocalized(),
    tagline: emptyLocalized(),
    overview: emptyLocalized(),
    posterImage: '',
    logoUrl: '',
    externalUrl: '',
    gallery: [],
  }),
  fields: [
    { kind: 'heading', label: 'Programme information' },
    { kind: 'localized', path: 'title', label: 'Programme name', required: true, onlyLang: 'ml' },
    {
      kind: 'localized',
      path: 'tagline',
      label: 'Short description',
      multiline: true,
      rows: 2,
      hint: 'One or two lines, shown at the top of the programme page.',
    },
    { kind: 'rich', path: 'overview', label: 'Description' },
    {
      kind: 'text',
      path: 'externalUrl',
      label: 'External Website URL',
      placeholder: 'https://example.org',
      hint: 'Optional. When set, clicking this programme on the website opens this address in a new tab instead of the programme page. Must start with http:// or https://. Clear it to go back to the programme page.',
    },
    { kind: 'heading', label: 'Media' },
    {
      kind: 'asset',
      path: 'posterImage',
      label: 'Poster',
      folder: 'programs',
      fit: 'poster',
      hint: 'Shown beside the description on this programme’s own page (not on the home page). Leave empty and the page shows the logo there instead.',
      recommend: '1200px wide at the poster’s natural shape (portrait 4:5 or 3:4 works best). Shown whole, never cropped. JPG, PNG or WebP.',
    },
    {
      kind: 'asset',
      path: 'logoUrl',
      label: 'Logo',
      folder: 'programs',
      fit: 'contain',
      hint: 'Shown on the programme page, its card on the Programs page and the logo strip on the home page.',
      recommend: 'At least 240px tall, width proportional. Transparent PNG or SVG — shown uncropped.',
    },
    { kind: 'heading', label: 'Gallery' },
    {
      kind: 'gallery',
      path: 'gallery',
      label: 'Photos',
      folder: 'programs',
      accept: 'image/*',
      hint: "This programme's own photos, shown in a grid on its page. Select several at once; reorder them with the arrows.",
      recommend: 'Up to 2000px on the long edge, any shape; images are compressed to WebP on upload.',
    },
  ],
};

/** Values match the backend's LEADER_CATEGORIES (backend/models/Leader.js). */
const LEADER_CATEGORY_OPTIONS = [
  { value: 'state', label: 'State Leaders' },
  { value: 'district', label: 'District Leaders' },
  { value: 'party', label: 'Former Leaders' },
];

/** Stored in English; the public site shows each in the visitor's language (web/src/lib/leaders.ts). */
const KERALA_DISTRICT_OPTIONS = [
  { value: '', label: '— Choose district —' },
  ...[
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
  ].map((d) => ({ value: d, label: d })),
];

type LeaderTermRow = { period?: string; district?: string };

/** District leaders need a designation, a year (range) and a district; the server checks the same */
const isDistrictLeader = (_doc: Doc, root: Doc) => root.category === 'district';

/** A leader's periods; records saved before periods existed hold one in `termLabel` (or the years). */
function leaderTermRows(row: Doc): LeaderTermRow[] {
  const terms = row.terms as LeaderTermRow[] | undefined;
  if (Array.isArray(terms) && terms.length) return terms;
  const label = String(row.termLabel ?? '').trim();
  if (label) return [{ period: label, district: '' }];
  const years = [row.termFrom, row.termTo].filter(Boolean);
  return years.length ? [{ period: years.join('–'), district: '' }] : [];
}

export const LEADERS: CollectionConfig = {
  key: 'leaders',
  endpoint: '/api/admin/cms/leaders',
  label: 'Leaders',
  singular: 'Leader',
  description: 'State, district and past leaders. Each leader belongs to one category, shown as its own tab on the website.',
  reorderable: true,
  filters: [
    { param: 'category', label: 'Category', options: LEADER_CATEGORY_OPTIONS },
    { param: 'isCurrent', label: 'Term', options: [
      { value: 'true', label: 'Current' },
      { value: 'false', label: 'Past' },
    ] },
  ],
  columns: [
    img('photo', 'Photo'),
    loc('name', 'Name'),
    loc('designation', 'Designation'),
    {
      label: 'Category',
      className: 'w-[150px]',
      // Leaders saved before categories existed have none and are shown as state leaders
      render: (row) => (
        <span className="text-foreground/70">
          {LEADER_CATEGORY_OPTIONS.find((o) => o.value === (row.category || 'state'))?.label ?? '—'}
        </span>
      ),
    },
    {
      label: 'Leadership periods',
      className: 'min-w-[160px] max-w-[260px]',
      render: (row) => {
        const terms = leaderTermRows(row);
        return terms.length ? (
          <div className="space-y-0.5 text-[12.5px] leading-snug text-foreground/70">
            {terms.map((t, i) => (
              <div key={i} className="cell-truncate">
                {t.period || '—'}
                {t.district && <span className="text-foreground/45"> · {t.district}</span>}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-foreground/25">—</span>
        );
      },
    },
    flag('isCurrent', 'Current'),
  ],
  blank: () => ({
    category: 'state',
    name: emptyLocalized(),
    designation: emptyLocalized(),
    bio: emptyLocalized(),
    photo: '',
    terms: [{ period: '', district: '' }],
    order: 0,
    published: true,
  }),
  // An older record's single term becomes its first period. The old term fields are
  // cleared here; the server fills them again from the periods when the leader is saved.
  // A leader with no period yet gets one empty row, so the year input is in view.
  // The category decides Current/Past on save, so a leader still marked as past from
  // before opens under Past Leaders, the tab the website lists them under.
  toForm: (row) => {
    const terms = leaderTermRows(row).map((t) => ({ period: t.period ?? '', district: t.district ?? '' }));
    return {
      ...row,
      category: row.isCurrent === false ? 'party' : row.category || 'state',
      terms: terms.length ? terms : [{ period: '', district: '' }],
      termLabel: '',
      termFrom: null,
      termTo: null,
    };
  },
  fields: [
    { kind: 'heading', label: 'Leader details' },
    {
      kind: 'select',
      path: 'category',
      label: 'Category',
      options: LEADER_CATEGORY_OPTIONS,
      hint: 'Which tab of the Leaders page this person appears under. State and District Leaders are current leadership; Past Leaders are not. District Leaders also need a designation, a year and a district.',
    },
    {
      kind: 'localized',
      path: 'name',
      label: 'Name',
      required: true,
      primaryLang: 'en',
      hint: 'English is required. Malayalam is optional; when entered it is shown on the Malayalam site.',
    },
    {
      kind: 'localized',
      path: 'designation',
      label: 'Designation',
      primaryLang: 'en',
      requiredWhen: isDistrictLeader,
      hint: 'The position held, e.g. President, Secretary, District President. Malayalam is optional.',
    },

    {
      kind: 'heading',
      label: 'Leadership periods',
      hint: 'One row per period this person led in, e.g. 2024–2026. Add every term to the same leader instead of creating the leader again. The latest period is the heading they are listed under on the website; all periods are shown on their card.',
    },
    {
      kind: 'object-list',
      path: 'terms',
      label: 'Periods',
      addLabel: 'Add another period',
      requiredWhen: isDistrictLeader,
      blank: () => ({ period: '', district: '' }),
      fields: [
        { kind: 'row', fields: [
          {
            kind: 'text',
            path: 'period',
            label: 'Year or year range',
            placeholder: '2024–2026',
            requiredWhen: isDistrictLeader,
          },
          {
            kind: 'select',
            path: 'district',
            label: 'District',
            options: KERALA_DISTRICT_OPTIONS,
            // Shown for District Leaders; also for any period that already has a district saved
            when: (row, root) => isDistrictLeader(row, root) || Boolean(row.district),
            requiredWhen: isDistrictLeader,
            hint: 'The district served in during this period.',
          },
        ] },
      ],
    },

    { kind: 'heading', label: 'Photo' },
    { kind: 'asset', path: 'photo', label: 'Photograph', folder: 'leaders', recommend: '800×1000px (4:5 portrait). Head and shoulders with the face in the upper third.' },

    { kind: 'heading', label: 'Biography' },
    { kind: 'rich', path: 'bio', label: 'Biography' },

    { kind: 'heading', label: 'Display' },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const EVENTS: CollectionConfig = {
  key: 'events',
  endpoint: '/api/admin/cms/events',
  label: 'Event Poster',
  noun: 'event posters',
  singular: 'Poster',
  description:
    'Posters shown in the Events section of the home page, newest first after any upcoming events. Hide a poster with its Published switch, or delete it to remove it for good.',
  /* The form manages the poster, its optional title and its optional link, and sends only
     those. Everything else stored on an event (date, summary, description, venue, speakers,
     gallery, downloads, registration settings, slug) is left as it is, so existing events
     keep their pages and their dates. A new poster is dated when it is created (the event
     model's default). */
  editable: ['title', 'posterImage', 'externalUrl'],
  modalSize: 'md',
  columns: [
    {
      label: 'Poster',
      className: 'w-[96px]',
      // Older events may have only a cover image; the home page falls back to it too
      render: (row) => {
        const src = (row.posterImage || row.coverImage) as string | undefined;
        return src ? (
          <span className="flex h-14 w-11 items-center justify-center rounded-lg border border-[#e6e8f0] bg-white p-0.5">
            <img src={src} alt="" className="h-auto max-h-full w-auto max-w-full object-contain" />
          </span>
        ) : (
          <div className="grid h-14 w-11 place-items-center rounded-lg border border-dashed border-[#d3d7e4] text-[9px] text-foreground/30">
            —
          </div>
        );
      },
    },
    loc('title', 'Title'),
    date('startDate', 'Date'),
  ],
  blank: () => ({
    title: emptyLocalized(),
    posterImage: '',
    externalUrl: '',
  }),
  fields: [
    {
      kind: 'asset',
      path: 'posterImage',
      label: 'Poster',
      folder: 'events',
      fit: 'poster',
      required: true,
      accept: 'image/jpeg,image/png,image/webp',
      hint: 'JPG, PNG or WebP. To replace a poster, upload a new image here and save.',
      recommend: '1600px wide at the poster\u2019s natural shape (portrait 3:4 or 4:5 works best). Shown whole, never cropped.',
    },
    {
      kind: 'localized',
      path: 'title',
      label: 'Poster title',
      hint: 'Optional. A short name for the event, used as the poster\u2019s alternative text. Leave it empty and the poster is shown without a title.',
    },
    {
      kind: 'text',
      path: 'externalUrl',
      label: 'Link',
      placeholder: 'https://example.org',
      hint: 'Optional. When set, clicking the poster on the website opens this address in a new tab. Must start with http:// or https://. Leave it empty and the poster opens its event page.',
    },
  ],
};

export const MEDIA_POSTS: CollectionConfig = {
  key: 'media-posts',
  endpoint: '/api/admin/cms/media-posts',
  label: 'News & Statements',
  singular: 'Post',
  description: 'News, press releases, statements, interviews and speeches.',
  filters: [{ param: 'type', label: 'Type', options: [
    { value: 'news', label: 'News' },
    { value: 'press-release', label: 'Press release' },
    { value: 'statement', label: 'Statement' },
    { value: 'interview', label: 'Interview' },
    { value: 'speech', label: 'Speech' },
  ] }],
  columns: [img('coverImage'), loc('title', 'Title'), str('type', 'Type'), date('publishedAt', 'Published'), flag('featured', 'Featured')],
  blank: () => ({
    type: 'news',
    title: emptyLocalized(),
    excerpt: emptyLocalized(),
    body: emptyLocalized(),
    author: emptyLocalized(),
    slug: '',
    coverImage: '',
    gallery: [],
    downloads: [],
    source: '',
    sourceUrl: '',
    tags: [],
    publishedAt: new Date().toISOString(),
    featured: false,
    published: true,
  }),
  fields: [
    { kind: 'row', fields: [
      { kind: 'select', path: 'type', label: 'Type', required: true, options: [
        { value: 'news', label: 'News' },
        { value: 'press-release', label: 'Press release' },
        { value: 'statement', label: 'Statement' },
        { value: 'interview', label: 'Interview' },
        { value: 'speech', label: 'Speech' },
      ] },
      { kind: 'date', path: 'publishedAt', label: 'Publish date' },
    ] },
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    slugField,
    { kind: 'localized', path: 'excerpt', label: 'Excerpt', multiline: true, rows: 3 },
    { kind: 'rich', path: 'body', label: 'Body' },
    { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'media', recommend: '1920×1200px (16:10). Cropped three ways — article card, wide page banner and a near-square list thumbnail — so keep the subject centred and clear of the edges.' },
    { kind: 'localized', path: 'author', label: 'Author' },
    { kind: 'row', fields: [
      { kind: 'text', path: 'source', label: 'Source' },
      { kind: 'text', path: 'sourceUrl', label: 'Source URL' },
    ] },
    { kind: 'tags', path: 'tags', label: 'Tags' },
    { kind: 'gallery', path: 'gallery', label: 'Gallery', folder: 'media', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'attachments', path: 'downloads', label: 'Attachments', folder: 'media', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'featured', label: 'Featured article' },
      publishedField,
    ] },
  ],
};

export const VIDEOS: CollectionConfig = {
  key: 'videos',
  endpoint: '/api/admin/cms/videos',
  label: 'Videos',
  singular: 'Item',
  description: 'YouTube videos (played inside the website) and podcast episodes. Up to three featured videos show on the home page, in this order.',
  reorderable: true,
  extra: (props) => <YouTubeChannelImport {...props} />,
  filters: [{ param: 'kind', label: 'Kind', options: [
    { value: 'video', label: 'Video' },
    { value: 'podcast', label: 'Podcast' },
  ] }],
  columns: [img('thumbnailUrl'), loc('title', 'Title'), str('kind', 'Kind'), date('publishedAt', 'Published'), flag('featured', 'Featured')],
  blank: () => ({
    kind: 'video',
    title: emptyLocalized(),
    description: emptyLocalized(),
    youtubeUrl: '',
    audioUrl: '',
    thumbnailUrl: '',
    durationLabel: '',
    publishedAt: new Date().toISOString(),
    featured: false,
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'row', fields: [
      { kind: 'select', path: 'kind', label: 'Kind', options: [
        { value: 'video', label: 'Video' },
        { value: 'podcast', label: 'Podcast' },
      ] },
      { kind: 'date', path: 'publishedAt', label: 'Publish date' },
    ] },
    { kind: 'text', path: 'youtubeUrl', label: 'YouTube video link', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'For videos. Paste a watch, youtu.be or shorts link. On save, any blank title, description, thumbnail or duration below is filled in from YouTube.' },
    { kind: 'localized', path: 'title', label: 'Title', hint: 'Leave blank on a YouTube video to use its YouTube title. Required for podcasts.' },
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 3 },
    { kind: 'asset', path: 'audioUrl', label: 'Audio file', folder: 'podcasts', accept: '.mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4', preview: 'file', hint: 'Used for podcast episodes.', recommend: 'MP3, WAV or M4A only — other audio formats are rejected on upload. About 128 kbps for speech, 192 kbps for music.' },
    { kind: 'asset', path: 'thumbnailUrl', label: 'Thumbnail', folder: 'videos', hint: 'Optional — YouTube thumbnails are used automatically when blank.', recommend: '1280×720px (16:9). Leave the centre clear — a round play button sits over it.' },
    { kind: 'row', fields: [
      { kind: 'text', path: 'durationLabel', label: 'Duration', placeholder: '12:40' },
      orderField,
    ] },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'featured', label: 'Featured on home page' },
      publishedField,
    ] },
  ],
};

export const PUBLICATIONS: CollectionConfig = {
  key: 'publications',
  endpoint: '/api/admin/cms/publications',
  label: 'Publications',
  singular: 'Publication',
  description: 'Books, articles, booklets and the PDF library.',
  reorderable: true,
  filters: [{ param: 'type', label: 'Type', options: [
    { value: 'book', label: 'Book' },
    { value: 'article', label: 'Article' },
    { value: 'booklet', label: 'Booklet' },
    { value: 'pdf', label: 'PDF' },
  ] }],
  columns: [img('coverImage'), loc('title', 'Title'), str('type', 'Type'), loc('author', 'Author'), date('publishedAt', 'Published')],
  blank: () => ({
    type: 'book',
    title: emptyLocalized(),
    author: emptyLocalized(),
    publisher: emptyLocalized(),
    description: emptyLocalized(),
    body: emptyLocalized(),
    slug: '',
    coverImage: '',
    fileUrl: '',
    externalUrl: '',
    purchaseUrl: '',
    language: 'ml',
    publishedAt: new Date().toISOString(),
    featured: false,
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'row', fields: [
      { kind: 'select', path: 'type', label: 'Type', required: true, options: [
        { value: 'book', label: 'Book' },
        { value: 'article', label: 'Article' },
        { value: 'booklet', label: 'Booklet' },
        { value: 'pdf', label: 'PDF' },
      ] },
      { kind: 'date', path: 'publishedAt', label: 'Publish date' },
    ] },
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    slugField,
    { kind: 'row', fields: [
      { kind: 'localized', path: 'author', label: 'Author' },
      { kind: 'localized', path: 'publisher', label: 'Publisher' },
    ] },
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 3 },
    { kind: 'rich', path: 'body', label: 'Full text (for articles)' },
    { kind: 'asset', path: 'coverImage', label: 'Cover', folder: 'publications', recommend: '1200×1600px (3:4 portrait) — the book or magazine cover.' },
    { kind: 'asset', path: 'fileUrl', label: 'PDF file', folder: 'publications', accept: '.pdf', preview: 'file', recommend: 'PDF only. Export scans at about 150 DPI and run a “reduce file size” pass before uploading.' },
    { kind: 'row', fields: [
      { kind: 'text', path: 'externalUrl', label: 'Read online URL' },
      { kind: 'text', path: 'purchaseUrl', label: 'Purchase URL' },
    ] },
    { kind: 'row', fields: [
      { kind: 'number', path: 'price', label: 'Price (₹)' },
      { kind: 'number', path: 'pages', label: 'Pages' },
    ] },
    { kind: 'row', fields: [
      { kind: 'select', path: 'language', label: 'Language', options: [
        { value: 'ml', label: 'Malayalam' },
        { value: 'en', label: 'English' },
        { value: 'ar', label: 'Arabic' },
      ] },
      orderField,
    ] },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'featured', label: 'Featured' },
      publishedField,
    ] },
  ],
};

export const ALBUMS: CollectionConfig = {
  key: 'albums',
  endpoint: '/api/admin/cms/albums',
  label: 'Photo Gallery',
  singular: 'Album',
  description: 'Photo and video albums shown in the Media Centre.',
  reorderable: true,
  columns: [img('coverImage'), loc('title', 'Album'), date('eventDate', 'Date'), count('items', 'Items')],
  blank: () => ({
    title: emptyLocalized(),
    description: emptyLocalized(),
    slug: '',
    coverImage: '',
    eventDate: '',
    items: [],
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Album title', required: true },
    slugField,
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 2 },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'albums', recommend: '1600×1200px (4:3). The album title sits over the bottom third on a dark gradient — keep faces in the top two-thirds.' },
      { kind: 'date', path: 'eventDate', label: 'Event date' },
    ] },
    { kind: 'gallery', path: 'items', label: 'Photos & videos', folder: 'albums', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const DOWNLOADS: CollectionConfig = {
  key: 'downloads',
  endpoint: '/api/admin/cms/downloads',
  label: 'Downloads',
  singular: 'Download',
  description: 'Official documents, forms, posters and reports available for download.',
  reorderable: true,
  extra: (props) => <DownloadsVisibilityToggle {...props} />,
  filters: [{ param: 'category', label: 'Category', options: [
    { value: 'official-document', label: 'Official document' },
    { value: 'constitution', label: 'Constitution' },
    { value: 'form', label: 'Form' },
    { value: 'poster', label: 'Poster' },
    { value: 'report', label: 'Report' },
    { value: 'other', label: 'Other' },
  ] }],
  columns: [img('thumbnailUrl'), loc('title', 'Title'), str('category', 'Category'), str('downloadCount', 'Downloads')],
  blank: () => ({
    title: emptyLocalized(),
    description: emptyLocalized(),
    category: 'official-document',
    fileUrl: '',
    thumbnailUrl: '',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 2 },
    { kind: 'select', path: 'category', label: 'Category', options: [
      { value: 'official-document', label: 'Official document' },
      { value: 'constitution', label: 'Constitution' },
      { value: 'form', label: 'Form' },
      { value: 'poster', label: 'Poster' },
      { value: 'report', label: 'Report' },
      { value: 'other', label: 'Other' },
    ] },
    { kind: 'asset', path: 'fileUrl', label: 'File', folder: 'downloads', accept: '.pdf,.doc,.docx,.xls,.xlsx,image/*', preview: 'file', required: true, recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown next to the download button.' },
    { kind: 'asset', path: 'thumbnailUrl', label: 'Thumbnail', folder: 'downloads', recommend: '400×400px (1:1). Optional — the public list shows a file-type icon, so this is only an admin preview.' },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const EXTERNAL_LINKS: CollectionConfig = {
  key: 'external-links',
  endpoint: '/api/admin/cms/external-links',
  label: 'External Links',
  singular: 'Link',
  description: 'Aramam, FOR HER, Prabodhanam and other affiliated portals.',
  reorderable: true,
  filters: [{ param: 'category', label: 'Category', options: [
    { value: 'official-portal', label: 'Official portal' },
    { value: 'affiliated-initiative', label: 'Affiliated initiative' },
    { value: 'institution', label: 'Institution' },
  ] }],
  columns: [img('logoUrl', 'Logo'), loc('title', 'Title'), str('url', 'URL'), str('category', 'Category')],
  blank: () => ({
    title: emptyLocalized(),
    description: emptyLocalized(),
    url: '',
    logoUrl: '',
    category: 'official-portal',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 2 },
    { kind: 'text', path: 'url', label: 'URL', placeholder: 'https://…', required: true, hint: 'Full web address, e.g. https://www.youtube.com/@channel. Opens in a new tab.' },
    { kind: 'asset', path: 'logoUrl', label: 'Logo', folder: 'links', recommend: '256px on the long edge. Transparent PNG or SVG — letterboxed into a 48px square, so a wide wordmark is fine.' },
    { kind: 'select', path: 'category', label: 'Category', options: [
      { value: 'official-portal', label: 'Official portal' },
      { value: 'affiliated-initiative', label: 'Affiliated initiative' },
      { value: 'institution', label: 'Institution' },
    ] },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

const FOCUS_ICON_OPTIONS = [
  { value: 'graduation-cap', label: 'Graduation cap — education' },
  { value: 'users', label: 'Users — empowerment' },
  { value: 'heart-handshake', label: 'Heart & handshake — social service' },
  { value: 'calendar-days', label: 'Calendar — events' },
  { value: 'megaphone', label: 'Megaphone — awareness' },
  { value: 'handshake', label: 'Handshake — leadership' },
  { value: 'book-open', label: 'Open book — study' },
  { value: 'sprout', label: 'Sprout — environment' },
  { value: 'shield-check', label: 'Shield — protection' },
  { value: 'stethoscope', label: 'Stethoscope — health' },
  { value: 'scale', label: 'Scales — legal' },
  { value: 'lightbulb', label: 'Lightbulb — innovation' },
];

export const FOCUS_AREAS: CollectionConfig = {
  key: 'focus-areas',
  endpoint: '/api/admin/cms/focus-areas',
  label: 'Focus',
  noun: 'focus areas',
  singular: 'Focus area',
  description:
    'The icon strip on the home page and the Focus button on the About Us page — Education, Empowerment, Social Service and so on.',
  reorderable: true,
  extra: (props) => <FocusVisibilityToggle {...props} />,
  columns: [str('icon', 'Icon'), loc('title', 'Title'), loc('description', 'Description')],
  blank: () => ({
    title: emptyLocalized(),
    description: emptyLocalized(),
    icon: 'graduation-cap',
    linkUrl: '',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    {
      kind: 'localized',
      path: 'description',
      label: 'Description',
      multiline: true,
      rows: 2,
      hint: 'Keep it to two or three short lines — the cards sit side by side.',
    },
    { kind: 'select', path: 'icon', label: 'Icon', options: FOCUS_ICON_OPTIONS },
    { kind: 'text', path: 'linkUrl', label: 'Link (optional)', placeholder: '/departments/wings' },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const ORG_COLLECTIONS: CollectionConfig[] = [
  SLIDERS,
  FOCUS_AREAS,
  CAMPAIGNS,
  PAGES,
  DEPARTMENTS,
  PROGRAMS,
  LEADERS,
  EVENTS,
  MEDIA_POSTS,
  VIDEOS,
  PUBLICATIONS,
  ALBUMS,
  DOWNLOADS,
  EXTERNAL_LINKS,
];

export type { Doc };
