import { formatDate } from '../shared/api';
import { emptyLocalized } from '../shared/types';
import type { Localized } from '../shared/types';
import type { CollectionConfig, ColumnDef } from './CollectionManager';
import type { Doc } from './fields';

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
  label: 'Pages',
  singular: 'Page',
  description: 'Who We Are sub-pages (Ideology, Our Values, Constitution, Our Legacy) and other standalone pages.',
  reorderable: true,
  filters: [{ param: 'section', label: 'Section', options: [
    { value: 'who-we-are', label: 'Who We Are' },
    { value: 'general', label: 'General' },
  ] }],
  columns: [loc('title', 'Page'), str('slug', 'Slug'), str('section', 'Section')],
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
        { value: 'who-we-are', label: 'Who We Are' },
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
  label: 'Programmes',
  singular: 'Programme',
  description: 'WES, Proficia, Thamheed, Safa Nagar and other programmes.',
  reorderable: true,
  filters: [{ param: 'isMajor', label: 'Type', options: [
    { value: 'true', label: 'Major programme' },
    { value: 'false', label: 'Other' },
  ] }],
  columns: [img('coverImage'), loc('title', 'Programme'), str('slug', 'Slug'), flag('isMajor', 'Major'), flag('bannerImage', 'Banner')],
  blank: () => ({
    title: emptyLocalized(),
    tagline: emptyLocalized(),
    overview: emptyLocalized(),
    externalLabel: emptyLocalized(),
    slug: '',
    objectives: [],
    schedule: [],
    coverImage: '',
    logoUrl: '',
    bannerImage: '',
    gallery: [],
    videos: [],
    downloads: [],
    isMajor: true,
    externalUrl: '',
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Programme name', required: true },
    slugField,
    { kind: 'localized', path: 'tagline', label: 'Tagline', multiline: true, rows: 2 },
    { kind: 'rich', path: 'overview', label: 'Overview' },
    { kind: 'heading', label: 'Objectives' },
    { kind: 'bullets', path: 'objectives', label: 'Objectives' },
    { kind: 'heading', label: 'Schedule' },
    {
      kind: 'object-list',
      path: 'schedule',
      label: 'Schedule',
      addLabel: 'Add session',
      blank: () => ({ time: '', title: emptyLocalized(), description: emptyLocalized() }),
      fields: [
        { kind: 'text', path: 'time', label: 'Time', placeholder: '10:00 AM' },
        { kind: 'localized', path: 'title', label: 'Session' },
        { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 2 },
      ],
    },
    { kind: 'heading', label: 'Media & files' },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'programs', recommend: '1920×1080px (16:9). Also used as the full-width page banner, where the left third is darkened — keep the subject centred.' },
      { kind: 'asset', path: 'logoUrl', label: 'Logo', folder: 'programs', recommend: 'At least 240px tall, width proportional. Transparent PNG or SVG — shown uncropped on white.' },
    ] },
    {
      kind: 'asset',
      path: 'bannerImage',
      label: 'Home page banner',
      folder: 'programs',
      hint: 'Wide artwork (about 3:1). Programmes with a banner appear in the strip under the home page slider.',
      recommend:
        '1800×600px (3:1). Cropped to fill, so keep any text inside the middle 80%.',
    },
    { kind: 'gallery', path: 'gallery', label: 'Gallery', folder: 'programs', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    {
      kind: 'object-list',
      path: 'videos',
      label: 'Videos',
      addLabel: 'Add video',
      blank: () => ({ title: emptyLocalized(), youtubeUrl: '' }),
      fields: [
        { kind: 'localized', path: 'title', label: 'Title' },
        { kind: 'text', path: 'youtubeUrl', label: 'YouTube URL', placeholder: 'https://youtube.com/watch?v=…' },
      ],
    },
    { kind: 'attachments', path: 'downloads', label: 'Downloads', folder: 'programs', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'heading', label: 'Settings', hint: 'A programme with its own website links out instead of showing a local page.' },
    { kind: 'text', path: 'externalUrl', label: 'External website URL' },
    { kind: 'localized', path: 'externalLabel', label: 'External link label' },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'isMajor', label: 'Major programme' },
      orderField,
    ] },
    publishedField,
  ],
};

export const LEADERS: CollectionConfig = {
  key: 'leaders',
  endpoint: '/api/admin/cms/leaders',
  label: 'Leaders',
  singular: 'Leader',
  description: 'Current leadership and past leadership (Meeqathi) posters.',
  reorderable: true,
  filters: [{ param: 'isCurrent', label: 'Term', options: [
    { value: 'true', label: 'Current' },
    { value: 'false', label: 'Past' },
  ] }],
  columns: [img('photo', 'Photo'), loc('name', 'Name'), loc('designation', 'Designation'), str('termLabel', 'Term'), flag('isCurrent', 'Current')],
  blank: () => ({
    name: emptyLocalized(),
    designation: emptyLocalized(),
    bio: emptyLocalized(),
    photo: '',
    posterImage: '',
    termLabel: '',
    isCurrent: true,
    order: 0,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'name', label: 'Name', required: true },
    { kind: 'localized', path: 'designation', label: 'Designation' },
    { kind: 'rich', path: 'bio', label: 'Biography' },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'photo', label: 'Photograph', folder: 'leaders', recommend: '800×1000px (4:5 portrait). Head and shoulders with the face in the upper third.' },
      { kind: 'asset', path: 'posterImage', label: 'Meeqathi poster', folder: 'leaders', recommend: "1200px wide at the poster's natural shape (portrait 3:4 or 2:3 is typical). Shown uncropped." },
    ] },
    { kind: 'row', fields: [
      { kind: 'text', path: 'termLabel', label: 'Term label', placeholder: '2019 – 2023' },
      { kind: 'toggle', path: 'isCurrent', label: 'Current leadership' },
    ] },
    { kind: 'row', fields: [
      { kind: 'number', path: 'termFrom', label: 'Term from (year)' },
      { kind: 'number', path: 'termTo', label: 'Term to (year)' },
    ] },
    { kind: 'row', fields: [orderField, publishedField] },
  ],
};

export const EVENTS: CollectionConfig = {
  key: 'events',
  endpoint: '/api/admin/cms/events',
  label: 'Events',
  singular: 'Event',
  description: 'Upcoming and past events. Anything dated in the future shows under Upcoming automatically.',
  columns: [img('coverImage'), loc('title', 'Event'), date('startDate', 'Date'), loc('venue', 'Venue'), flag('registrationEnabled', 'RSVP')],
  blank: () => ({
    title: emptyLocalized(),
    summary: emptyLocalized(),
    description: emptyLocalized(),
    venue: emptyLocalized(),
    slug: '',
    startDate: '',
    endDate: '',
    timeLabel: '',
    mapUrl: '',
    district: '',
    coverImage: '',
    posterImage: '',
    speakers: [],
    gallery: [],
    downloads: [],
    registrationEnabled: false,
    registrationUrl: '',
    featured: false,
    published: true,
  }),
  fields: [
    { kind: 'localized', path: 'title', label: 'Event title', required: true },
    slugField,
    { kind: 'localized', path: 'summary', label: 'Summary', multiline: true, rows: 3 },
    { kind: 'rich', path: 'description', label: 'Description' },
    { kind: 'heading', label: 'When & where' },
    { kind: 'row', fields: [
      { kind: 'date', path: 'startDate', label: 'Start date', required: true },
      { kind: 'date', path: 'endDate', label: 'End date' },
    ] },
    { kind: 'row', fields: [
      { kind: 'text', path: 'timeLabel', label: 'Time', placeholder: '10:00 AM – 4:00 PM' },
      { kind: 'text', path: 'district', label: 'District' },
    ] },
    { kind: 'localized', path: 'venue', label: 'Venue' },
    { kind: 'text', path: 'mapUrl', label: 'Google Maps link' },
    { kind: 'heading', label: 'Media' },
    { kind: 'row', fields: [
      { kind: 'asset', path: 'coverImage', label: 'Cover image', folder: 'events', recommend: '1920×1080px (16:9). Used as the full-width page banner, where the left third is darkened — keep the subject centred.' },
      { kind: 'asset', path: 'posterImage', label: 'Poster', folder: 'events', recommend: '1600px wide at the poster\u2019s natural shape (portrait 3:4 or 4:5 works best). Shown uncropped.' },
    ] },
    { kind: 'people', path: 'speakers', label: 'Speakers', folder: 'events', recommend: '800×800px (1:1) square. Cropped to a circle, so centre the face and crop tight.' },
    { kind: 'gallery', path: 'gallery', label: 'Gallery', folder: 'events', recommend: '1600px on the long edge, any shape. Grid tiles crop to a square so keep the subject centred; the lightbox shows the full frame. Video: MP4 (H.264), 1080p.' },
    { kind: 'attachments', path: 'downloads', label: 'Downloads', folder: 'events', recommend: 'PDF preferred; DOC, DOCX, XLS and XLSX are also accepted. The file size is shown to visitors, so compress scans before uploading.' },
    { kind: 'heading', label: 'Registration' },
    { kind: 'toggle', path: 'registrationEnabled', label: 'Accept RSVPs on the website', description: 'Shows a registration form on the event page' },
    { kind: 'text', path: 'registrationUrl', label: 'External registration URL', hint: 'Use this instead when registration happens on another site.' },
    { kind: 'row', fields: [
      { kind: 'toggle', path: 'featured', label: 'Featured' },
      publishedField,
    ] },
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
  label: 'Videos & Podcasts',
  singular: 'Item',
  description: 'Embedded YouTube videos and podcast episodes.',
  reorderable: true,
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
    { kind: 'localized', path: 'title', label: 'Title', required: true },
    { kind: 'localized', path: 'description', label: 'Description', multiline: true, rows: 3 },
    { kind: 'text', path: 'youtubeUrl', label: 'YouTube URL', hint: 'Used for videos. Paste the full watch or youtu.be link.' },
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
    { kind: 'text', path: 'url', label: 'URL', placeholder: 'https://…', required: true },
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
  label: 'Focus Areas',
  singular: 'Focus area',
  description: 'The icon strip on the home page — Education, Empowerment, Social Service and so on.',
  reorderable: true,
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
