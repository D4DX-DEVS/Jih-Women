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
  };
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
  gallery: MediaItem[];
  videos: VideoRef[];
  downloads: Attachment[];
  isMajor: boolean;
  externalUrl: string;
  externalLabel: Localized;
};

export type Leader = {
  _id: string;
  name: Localized;
  designation: Localized;
  bio: Localized;
  photo: string;
  posterImage: string;
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
    programs: { _id: string; slug: string; title: Localized; externalUrl: string }[];
  };
};

export type HomePayload = {
  settings: SiteSettings;
  sliders: Slide[];
  campaigns: Campaign[];
  updates: MediaPost[];
  upcomingEvents: OrgEvent[];
  featuredArticles: MediaPost[];
  featuredVideos: VideoItem[];
  publications: Publication[];
  focusAreas: FocusArea[];
  programBanners: ProgramBanner[];
};

export type SearchResult = {
  kind: string;
  path: string;
  slug: string;
  title: Localized;
  coverImage?: string;
  type?: string;
};
