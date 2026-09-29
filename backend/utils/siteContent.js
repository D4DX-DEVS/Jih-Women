/**
 * Registry of admin-managed page titles and section headings.
 *
 * Keys are shared with the public site (web/src/lib/site.tsx) and the admin
 * editor (app/src/admin/org/SiteContentFields.ts). `defaults` hold the text the
 * site shipped with; `npm run seed:content` copies them into empty fields so
 * editors start from the live wording. Sections without a default for a field
 * fall back on the site to other settings (e.g. the organisation name).
 */

const PAGE_CONTENT = {
  whoWeAre: { ml: 'ഞങ്ങളെക്കുറിച്ച്', en: 'Who We Are' },
  leaders: { ml: 'നേതൃത്വം', en: 'Leaders' },
  departments: { ml: 'വകുപ്പുകൾ', en: 'Departments' },
  programs: { ml: 'പദ്ധതികൾ', en: 'Programs' },
  events: { ml: 'പരിപാടികൾ', en: 'Events' },
  news: { ml: 'വാർത്തകൾ', en: 'News' },
  pressReleases: { ml: 'പത്രക്കുറിപ്പുകൾ', en: 'Press Releases' },
  statements: { ml: 'പ്രസ്താവനകൾ', en: 'Statements' },
  interviews: { ml: 'അഭിമുഖങ്ങൾ', en: 'Interviews' },
  speeches: { ml: 'പ്രഭാഷണങ്ങൾ', en: 'Speeches' },
  videos: { ml: 'വീഡിയോകൾ', en: 'Videos' },
  podcasts: { ml: 'പോഡ്കാസ്റ്റുകൾ', en: 'Podcasts' },
  photoGallery: { ml: 'ഫോട്ടോ ഗാലറി', en: 'Photo Gallery' },
  downloads: { ml: 'ഡൗൺലോഡുകൾ', en: 'Downloads' },
  publications: { ml: 'പ്രസിദ്ധീകരണങ്ങൾ', en: 'Publications' },
  externalLinks: { ml: 'ബാഹ്യ ലിങ്കുകൾ', en: 'External Links' },
  contact: { ml: 'ബന്ധപ്പെടുക', en: 'Contact Us' },
  searchResults: { ml: 'തിരയൽ ഫലങ്ങൾ', en: 'Search results' },
};

const SECTION_CONTENT = {
  homePrograms: { heading: { ml: 'പദ്ധതികൾ', en: 'Programs' } },
  // heading/description fall back to the organisation name and footer note
  homeAbout: { label: { ml: 'ഞങ്ങളെക്കുറിച്ച്', en: 'About Us' } },
  // the message heading itself is managed under Site Settings → President's message
  homePresident: { label: { ml: 'അധ്യക്ഷയുടെ സന്ദേശം', en: "President's Message" } },
  homeNews: { heading: { ml: 'പുതിയ വാർത്തകൾ', en: 'Latest News' } },
  homeEvents: { heading: { ml: 'വരാനിരിക്കുന്ന പരിപാടികൾ', en: 'Upcoming Events' } },
  // heading falls back to "Featured Video(s)" depending on how many are shown
  homeVideos: {},
  homeCampaigns: {
    label: { ml: 'മീഡിയ സെന്റർ', en: 'Media Centre' },
    heading: { ml: 'കാമ്പയിനുകൾ', en: 'Campaigns' },
  },
  homeFeaturedArticles: {
    label: { ml: 'മീഡിയ', en: 'Media' },
    heading: { ml: 'തിരഞ്ഞെടുത്ത ലേഖനങ്ങൾ', en: 'Featured Articles' },
  },
  homePublications: {
    label: { ml: 'പ്രസിദ്ധീകരണങ്ങൾ', en: 'Publications' },
    heading: { ml: 'പ്രസിദ്ധീകരണങ്ങൾ', en: 'Publications' },
  },
  leadersCurrent: {
    label: { ml: 'നേതൃത്വം', en: 'Leaders' },
    heading: { ml: 'ഇപ്പോഴത്തെ നേതൃത്വം', en: 'Current Leadership' },
  },
  leadersPast: {
    label: { ml: 'നേതൃത്വം', en: 'Leaders' },
    heading: { ml: 'മുൻ നേതൃത്വം', en: 'Past Leadership' },
  },
  programsMajor: {
    label: { ml: 'പദ്ധതികൾ', en: 'Programs' },
    heading: { ml: 'പ്രധാന പദ്ധതികൾ', en: 'Major Programmes' },
  },
  programsOther: {
    label: { ml: 'പദ്ധതികൾ', en: 'Programs' },
    heading: { ml: 'മറ്റ് പദ്ധതികൾ', en: 'Other Programmes' },
  },
};

module.exports = {
  PAGE_CONTENT,
  SECTION_CONTENT,
  PAGE_CONTENT_KEYS: Object.keys(PAGE_CONTENT),
  SECTION_CONTENT_KEYS: Object.keys(SECTION_CONTENT),
};
