/**
 * Editor layout for the admin-managed page titles and section headings stored
 * on the site settings under `content` (keys: backend/utils/siteContent.js).
 * Empty fields fall back to the public site's built-in text.
 */
import type { FieldDef } from './fields';

const PAGES: [key: string, label: string][] = [
  ['whoWeAre', 'Who We Are / About Us'],
  ['leaders', 'Leaders'],
  ['departments', 'Departments'],
  ['programs', 'Programmes'],
  ['events', 'Events'],
  ['news', 'News'],
  ['pressReleases', 'Press releases'],
  ['statements', 'Statements'],
  ['interviews', 'Interviews'],
  ['speeches', 'Speeches'],
  ['videos', 'Videos'],
  ['podcasts', 'Podcasts'],
  ['photoGallery', 'Photo gallery'],
  ['downloads', 'Downloads'],
  ['publications', 'Publications'],
  ['externalLinks', 'External links'],
  ['contact', 'Contact Us'],
  ['searchResults', 'Search results'],
];

export const PAGE_TITLE_FIELDS: FieldDef[] = PAGES.map(([key, label]) => ({
  kind: 'localized',
  path: `content.pages.${key}.title`,
  label,
}));

type SectionField = 'label' | 'heading' | 'description';

type SectionDef = {
  key: string;
  title: string;
  description: string;
  fields: SectionField[];
  hints?: Partial<Record<SectionField, string>>;
};

const FIELD_LABELS: Record<SectionField, string> = {
  label: 'Small label (above the heading)',
  heading: 'Heading',
  description: 'Description',
};

const LOGO_RECOMMEND =
  'One logo per section, used in both languages. At least 56px tall, transparent PNG or SVG. Shown small beside the heading.';

const SECTIONS: SectionDef[] = [
  {
    key: 'homePrograms',
    title: 'Home · Programme strip',
    description: 'The row of programme banners under the slider.',
    fields: ['heading'],
  },
  {
    key: 'homeAbout',
    title: 'Home · About us',
    description: 'The organisation introduction beside the president’s message.',
    fields: ['label', 'heading', 'description'],
    hints: {
      label: 'Shown above the heading. Leave English blank to show the Malayalam label.',
      heading: 'Leave blank to use the organisation name. Leave English blank to show the Malayalam heading.',
      description: 'Leave blank to use the footer note.',
    },
  },
  {
    key: 'homePresident',
    title: 'Home · President’s message',
    description: 'The message text, photo and heading are edited under Site Settings.',
    fields: ['label'],
  },
  { key: 'homeNews', title: 'Home · Latest news', description: 'News column heading.', fields: ['heading'] },
  { key: 'homeEvents', title: 'Home · Upcoming events', description: 'Events column heading.', fields: ['heading'] },
  {
    key: 'homeVideos',
    title: 'Home · Featured videos',
    description: 'Video row heading.',
    fields: ['heading'],
    hints: { heading: 'Leave blank to show “Featured Video” or “Featured Videos” automatically.' },
  },
  { key: 'homeCampaigns', title: 'Home · Campaigns', description: 'Campaign cards section.', fields: ['label', 'heading'] },
  {
    key: 'homeFeaturedArticles',
    title: 'Home · Featured articles',
    description: 'Featured articles section.',
    fields: ['label', 'heading'],
  },
  { key: 'homePublications', title: 'Home · Publications', description: 'Publications section.', fields: ['label', 'heading'] },
  { key: 'leadersCurrent', title: 'Leaders · Current leadership', description: 'State leaders grid.', fields: ['label', 'heading'] },
  { key: 'leadersPast', title: 'Leaders · Past leadership', description: 'Meeqathi posters and past terms.', fields: ['label', 'heading'] },
  { key: 'programsMajor', title: 'Programmes · Major', description: 'Major programmes list.', fields: ['label', 'heading'] },
  { key: 'programsOther', title: 'Programmes · Other', description: 'Other programmes list.', fields: ['label', 'heading'] },
];

export const SECTION_GROUPS: { key: string; title: string; description: string; fields: FieldDef[] }[] =
  SECTIONS.map((section) => ({
    key: section.key,
    title: section.title,
    description: section.description,
    fields: [
      ...section.fields.map<FieldDef>((field) => ({
        kind: 'localized',
        path: `content.sections.${section.key}.${field}`,
        label: FIELD_LABELS[field],
        multiline: field === 'description',
        rows: field === 'description' ? 3 : undefined,
        hint: section.hints?.[field],
      })),
      {
        kind: 'asset',
        path: `content.sections.${section.key}.logo`,
        label: 'Section logo',
        folder: 'sections',
        recommend: LOGO_RECOMMEND,
      },
    ],
  }));
