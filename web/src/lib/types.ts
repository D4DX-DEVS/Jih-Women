export type Lang = 'ml' | 'en';

export type Localized = { ml: string; en: string };

export type Attachment = {
  title: Localized;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type MediaItem = {
  url: string;
  thumbnailUrl: string;
  caption: Localized;
  kind: 'image' | 'video';
};

export type Person = {
  name: Localized;
  designation: Localized;
  photo: string;
};

export type Bullet = { text: Localized };

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  /** Events only: which list the backend returned ('upcoming', 'past' or 'all') */
  scope?: string;
};

export type PresidentMessage = {
  enabled: boolean;
  heading: Localized;
  name: Localized;
  designation: Localized;
  photo: string;
  message: Localized;
  linkUrl: string;
};

export type SiteSettings = {
  siteName: Localized;
  tagline: Localized;
  logoUrl: string;
  faviconUrl: string;
  topBarText: Localized;
  joinLabel: Localized;
  joinUrl: string;
  presidentMessage: PresidentMessage;
  address: Localized;
  phone: string;
  whatsapp: string;
  email: string;
  mapEmbedUrl: string;
  workingHours: Localized;
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    whatsappChannel: string;
    twitter: string;
  };
  footerNote: Localized;
  sections: {
    slider: boolean;
    campaigns: boolean;
    updates: boolean;
    featuredArticles: boolean;
    upcomingEvents: boolean;
    featuredVideos: boolean;
    publications: boolean;
    contact: boolean;
    programBanners: boolean;
    presidentMessage: boolean;
    focusAreas: boolean;
    newsletter: boolean;
    /** The Downloads link in the menus; missing on an older backend (treated as on) */
    downloads?: boolean;
  };
  /** Admin-managed page titles and section headings (keys: backend/utils/siteContent.js) */
  content?: {
    pages?: Record<string, { title?: Localized } | undefined>;
    sections?: Record<string, SectionContent | undefined>;
  };
};

export type SectionContent = {
  label?: Localized;
  heading?: Localized;
  description?: Localized;
  logo?: string;
  /** Where the section's Read More button goes: a site path or a full URL */
  linkUrl?: string;
};

export type FocusArea = {
  _id: string;
  title: Localized;
  description: Localized;
  icon: string;
  linkUrl: string;
};

export type ProgramBanner = {
  _id: string;
  slug: string;
  title: Localized;
  bannerImage: string;
  /** The programme's own logo (as on its page); preferred over the banner in the logo strip */
  logoUrl?: string;
  externalUrl: string;
};

export type Slide = {
  _id: string;
  title: Localized;
  subtitle: Localized;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  linkLabel: Localized;
  secondaryLinkUrl: string;
  secondaryLinkLabel: Localized;
};

export type Campaign = {
  _id: string;
  slug: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  coverImage: string;
  posterImage: string;
  startDate?: string;
  endDate?: string;
  hashtag: string;
  externalUrl: string;
  gallery: MediaItem[];
  downloads: Attachment[];
  featured: boolean;
};

export type PageDoc = {
  _id: string;
  slug: string;
  section: 'who-we-are' | 'general';
  title: Localized;
  summary: Localized;
  body: Localized;
  heroImage: string;
  downloads: Attachment[];
};

export type Activity = {
  title: Localized;
  description: Localized;
  image: string;
};

export type Department = {
  _id: string;
  slug: string;
  title: Localized;
  tagline: Localized;
  about: Localized;
  objectives: Bullet[];
  activities: Activity[];
  leadership: Person[];
  coverImage: string;
  logoUrl: string;
  posters: MediaItem[];
  gallery: MediaItem[];
  downloads: Attachment[];
  externalUrl: string;
};

export type ScheduleItem = {
  time: string;
  title: Localized;
  description: Localized;
};

export type VideoRef = { title: Localized; youtubeUrl: string };

export type Program = {
  _id: string;
  slug: string;
  title: Localized;
  tagline: Localized;
  overview: Localized;
  objectives: Bullet[];
  schedule: ScheduleItem[];
  coverImage: string;
  logoUrl: string;
  bannerImage: string;
  /** Poster uploaded in the admin, shown only on this programme's page; empty or missing when it has none */
  posterImage?: string;
  gallery: MediaItem[];
  videos: VideoRef[];
  downloads: Attachment[];
  isMajor: boolean;
  externalUrl: string;
  externalLabel: Localized;
};

export type LeaderCategory = 'state' | 'district' | 'party';

/** One period of leadership, oldest first in `Leader.terms` */
export type LeaderTerm = {
  /** As entered in the admin, e.g. "2024–2026" */
  period: string;
  /** District served in during this period (district leaders); empty otherwise */
  district: string;
  /** Years read from `period`; missing when it has none */
  from?: number;
  to?: number;
};

export type Leader = {
  _id: string;
  /** Leaders saved before categories existed are reported as 'state' by the API */
  category: LeaderCategory;
  name: Localized;
  designation: Localized;
  bio: Localized;
  photo: string;
  /** Group poster of a past committee; the card shows it when there is no photo */
  posterImage?: string;
  /** Every period this person led in; records saved before periods existed report their old term here */
  terms?: LeaderTerm[];
  /** The most recent period, kept for older API responses that have no `terms` */
  termLabel: string;
  termFrom?: number;
  termTo?: number;
  isCurrent: boolean;
};

export type OrgEvent = {
  _id: string;
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  startDate: string;
  endDate?: string;
  timeLabel: string;
  venue: Localized;
  mapUrl: string;
  district: string;
  coverImage: string;
  posterImage: string;
  /** Optional poster link: when set, the poster opens this address in a new tab */
  externalUrl?: string;
  speakers: Person[];
  gallery: MediaItem[];
  downloads: Attachment[];
  registrationEnabled: boolean;
  registrationUrl: string;
  featured: boolean;
};

export type MediaPostType = 'news' | 'press-release' | 'statement' | 'interview' | 'speech';

export type MediaPost = {
  _id: string;
  slug: string;
  type: MediaPostType;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  coverImage: string;
  gallery: MediaItem[];
  downloads: Attachment[];
  source: string;
  sourceUrl: string;
  author: Localized;
  tags: string[];
  publishedAt: string;
  featured: boolean;
  related?: MediaPost[];
};

export type VideoItem = {
  _id: string;
  kind: 'video' | 'podcast';
  title: Localized;
  description: Localized;
  youtubeUrl: string;
  /** Derived by the backend from youtubeUrl */
  youtubeId?: string;
  embedUrl?: string;
  audioUrl: string;
  thumbnailUrl: string;
  durationLabel: string;
  publishedAt: string;
  featured: boolean;
};

export type PublicationType = 'book' | 'article' | 'booklet' | 'pdf';

export type Publication = {
  _id: string;
  slug: string;
  type: PublicationType;
  title: Localized;
  author: Localized;
  publisher: Localized;
  description: Localized;
  body: Localized;
  coverImage: string;
  fileUrl: string;
  externalUrl: string;
  purchaseUrl: string;
  price?: number;
  pages?: number;
  language: string;
  publishedAt: string;
  featured: boolean;
};

export type Album = {
  _id: string;
  slug: string;
  title: Localized;
  description: Localized;
  coverImage: string;
  eventDate?: string;
  items: MediaItem[];
  itemCount?: number;
};

export type DownloadItem = {
  _id: string;
  title: Localized;
  description: Localized;
  category: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailUrl: string;
  downloadCount: number;
};

export type ExternalLink = {
  _id: string;
  title: Localized;
  description: Localized;
  url: string;
  logoUrl: string;
  category: 'official-portal' | 'affiliated-initiative' | 'institution';
};

export type NavPayload = {
  settings: SiteSettings;
  nav: {
    departments: { _id: string; slug: string; title: Localized }[];
    programs: { _id: string; slug: string; title: Localized; logoUrl?: string; externalUrl: string }[];
  };
};

export type HomePayload = {
  settings: SiteSettings;
  sliders: Slide[];
  campaigns: Campaign[];
  updates: MediaPost[];
  upcomingEvents: OrgEvent[];
  /** Posters for the home Events section (Event Poster in the admin), upcoming first */
  eventPosters?: OrgEvent[];
  featuredArticles: MediaPost[];
  featuredVideos: VideoItem[];
  publications: Publication[];
  focusAreas: FocusArea[];
  programBanners: ProgramBanner[];
  /** Photos for the home Photo Gallery (album and programme gallery images) */
  galleryPhotos?: MediaItem[];
};

export type SearchResult = {
  kind: string;
  path: string;
  slug: string;
  title: Localized;
  coverImage?: string;
  type?: string;
};
