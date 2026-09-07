import type { Lang, Localized } from './types';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'ml', label: 'മലയാളം', short: 'ML' },
  { code: 'en', label: 'English', short: 'EN' },
];

export const DEFAULT_LANG: Lang = 'ml';

export function isLang(value: string | undefined): value is Lang {
  return value === 'ml' || value === 'en';
}

/** Reads a bilingual field, falling back to the other language when empty. */
export function t(value: Localized | undefined | null, lang: Lang): string {
  if (!value) return '';
  const primary = value[lang];
  if (primary && primary.trim()) return primary;
  const fallback = lang === 'ml' ? value.en : value.ml;
  return fallback || '';
}

/**
 * Active-language only (no cross-language fallback).
 * Use for chrome that must never show Malayalam while English is selected
 * (mobile menu, footer). Empty English stays empty so UI string fallbacks can apply.
 */
export function tLang(value: Localized | undefined | null, lang: Lang): string {
  if (!value) return '';
  const primary = value[lang];
  return primary && primary.trim() ? primary : '';
}

/** True when a bilingual field has content in either language. */
export function has(value: Localized | undefined | null): boolean {
  return Boolean(value && ((value.ml && value.ml.trim()) || (value.en && value.en.trim())));
}

type Dict = Record<string, Localized>;

const STRINGS: Dict = {
  home: { ml: 'ഹോം', en: 'Home' },
  whoWeAre: { ml: 'ഞങ്ങളെക്കുറിച്ച്', en: 'Who We Are' },
  departments: { ml: 'വകുപ്പുകൾ', en: 'Departments' },
  programs: { ml: 'പദ്ധതികൾ', en: 'Programs' },
  leaders: { ml: 'നേതൃത്വം', en: 'Leaders' },
  events: { ml: 'പരിപാടികൾ', en: 'Events' },
  media: { ml: 'മീഡിയ', en: 'Media' },
  publications: { ml: 'പ്രസിദ്ധീകരണങ്ങൾ', en: 'Publications' },
  externalLinks: { ml: 'ബാഹ്യ ലിങ്കുകൾ', en: 'External Links' },
  contact: { ml: 'ബന്ധപ്പെടുക', en: 'Contact Us' },

  ideology: { ml: 'ആദർശം', en: 'Ideology' },
  ourValues: { ml: 'നമ്മുടെ മൂല്യങ്ങൾ', en: 'Our Values' },
  constitution: { ml: 'ഭരണഘടന', en: 'Constitution' },
  ourLegacy: { ml: 'നമ്മുടെ പൈതൃകം', en: 'Our Legacy' },

  campaigns: { ml: 'കാമ്പയിനുകൾ', en: 'Campaigns' },
  updates: { ml: 'പുതിയ വാർത്തകൾ', en: 'Updates' },
  featuredArticles: { ml: 'തിരഞ്ഞെടുത്ത ലേഖനങ്ങൾ', en: 'Featured Articles' },
  upcomingEvents: { ml: 'വരാനിരിക്കുന്ന പരിപാടികൾ', en: 'Upcoming Events' },
  pastEvents: { ml: 'കഴിഞ്ഞ പരിപാടികൾ', en: 'Past Events' },
  featuredVideos: { ml: 'തിരഞ്ഞെടുത്ത വീഡിയോകൾ', en: 'Featured Videos' },

  news: { ml: 'വാർത്തകൾ', en: 'News' },
  pressReleases: { ml: 'പത്രക്കുറിപ്പുകൾ', en: 'Press Releases' },
  statements: { ml: 'പ്രസ്താവനകൾ', en: 'Statements' },
  interviews: { ml: 'അഭിമുഖങ്ങൾ', en: 'Interviews' },
  speeches: { ml: 'പ്രഭാഷണങ്ങൾ', en: 'Speeches' },
  videos: { ml: 'വീഡിയോകൾ', en: 'Videos' },
  podcasts: { ml: 'പോഡ്കാസ്റ്റുകൾ', en: 'Podcasts' },
  photoGallery: { ml: 'ഫോട്ടോ ഗാലറി', en: 'Photo Gallery' },
  downloads: { ml: 'ഡൗൺലോഡുകൾ', en: 'Downloads' },
  mediaCentre: { ml: 'മീഡിയ സെന്റർ', en: 'Media Centre' },

  books: { ml: 'പുസ്തകങ്ങൾ', en: 'Books' },
  articles: { ml: 'ലേഖനങ്ങൾ', en: 'Articles' },
  booklets: { ml: 'ലഘുലേഖകൾ', en: 'Booklets' },
  pdfLibrary: { ml: 'PDF ലൈബ്രറി', en: 'PDF Library' },

  currentLeadership: { ml: 'ഇപ്പോഴത്തെ നേതൃത്വം', en: 'Current Leadership' },
  pastLeadership: { ml: 'മുൻ നേതൃത്വം', en: 'Past Leadership' },

  overview: { ml: 'അവലോകനം', en: 'Overview' },
  objectives: { ml: 'ലക്ഷ്യങ്ങൾ', en: 'Objectives' },
  activities: { ml: 'പ്രവർത്തനങ്ങൾ', en: 'Activities' },
  schedule: { ml: 'പരിപാടി ക്രമം', en: 'Schedule' },
  gallery: { ml: 'ഗാലറി', en: 'Gallery' },
  about: { ml: 'ആമുഖം', en: 'About' },
  speakers: { ml: 'പ്രഭാഷകർ', en: 'Speakers' },
  venue: { ml: 'വേദി', en: 'Venue' },
  date: { ml: 'തീയതി', en: 'Date' },
  time: { ml: 'സമയം', en: 'Time' },

  readMore: { ml: 'കൂടുതൽ വായിക്കുക', en: 'Read more' },
  viewAll: { ml: 'എല്ലാം കാണുക', en: 'View all' },
  viewDetails: { ml: 'വിശദാംശങ്ങൾ', en: 'View details' },
  download: { ml: 'ഡൗൺലോഡ്', en: 'Download' },
  visitWebsite: { ml: 'വെബ്സൈറ്റ് സന്ദർശിക്കുക', en: 'Visit website' },
  register: { ml: 'രജിസ്റ്റർ ചെയ്യുക', en: 'Register' },
  registerNow: { ml: 'ഇപ്പോൾ രജിസ്റ്റർ ചെയ്യുക', en: 'Register now' },
  search: { ml: 'തിരയുക', en: 'Search' },
  searchPlaceholder: { ml: 'വെബ്സൈറ്റിൽ തിരയുക…', en: 'Search the website…' },
  menu: { ml: 'മെനു', en: 'Menu' },
  close: { ml: 'അടയ്ക്കുക', en: 'Close' },
  loading: { ml: 'ലോഡ് ചെയ്യുന്നു…', en: 'Loading…' },
  nothingHere: { ml: 'ഉള്ളടക്കം ലഭ്യമല്ല.', en: 'Nothing here yet.' },
  notFoundTitle: { ml: 'പേജ് കണ്ടെത്താനായില്ല', en: 'Page not found' },
  notFoundBody: {
    ml: 'നിങ്ങൾ തിരയുന്ന പേജ് നീക്കം ചെയ്യപ്പെട്ടതോ വിലാസം തെറ്റായതോ ആകാം.',
    en: 'The page you are looking for may have been moved or the address is incorrect.',
  },
  backHome: { ml: 'ഹോമിലേക്ക് മടങ്ങുക', en: 'Back to home' },
  errorTitle: { ml: 'എന്തോ പിഴവ് സംഭവിച്ചു', en: 'Something went wrong' },
  retry: { ml: 'വീണ്ടും ശ്രമിക്കുക', en: 'Try again' },
  previous: { ml: 'മുമ്പത്തേത്', en: 'Previous' },
  next: { ml: 'അടുത്തത്', en: 'Next' },
  all: { ml: 'എല്ലാം', en: 'All' },

  officeAddress: { ml: 'ഓഫീസ് വിലാസം', en: 'Office Address' },
  phone: { ml: 'ഫോൺ', en: 'Phone' },
  whatsapp: { ml: 'വാട്‌സ്ആപ്പ്', en: 'WhatsApp' },
  email: { ml: 'ഇമെയിൽ', en: 'Email' },
  workingHours: { ml: 'പ്രവൃത്തി സമയം', en: 'Working Hours' },
  contactForm: { ml: 'ഞങ്ങൾക്ക് എഴുതുക', en: 'Write to us' },
  yourName: { ml: 'നിങ്ങളുടെ പേര്', en: 'Your name' },
  yourEmail: { ml: 'ഇമെയിൽ', en: 'Email address' },
  yourPhone: { ml: 'ഫോൺ നമ്പർ', en: 'Phone number' },
  district: { ml: 'ജില്ല', en: 'District' },
  subject: { ml: 'വിഷയം', en: 'Subject' },
  message: { ml: 'സന്ദേശം', en: 'Message' },
  send: { ml: 'അയക്കുക', en: 'Send' },
  sending: { ml: 'അയക്കുന്നു…', en: 'Sending…' },
  messageSent: {
    ml: 'നന്ദി! നിങ്ങളുടെ സന്ദേശം ലഭിച്ചു. ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടും.',
    en: 'Thank you! Your message has been received. We will be in touch soon.',
  },
  registrationSent: {
    ml: 'രജിസ്ട്രേഷൻ ലഭിച്ചു. നന്ദി!',
    en: 'Your registration has been received. Thank you!',
  },
  requiredField: { ml: 'ഈ വിവരം നിർബന്ധമാണ്', en: 'This field is required' },
  place: { ml: 'സ്ഥലം', en: 'Place' },
  notes: { ml: 'കുറിപ്പുകൾ', en: 'Notes' },
  optional: { ml: 'ഐച്ഛികം', en: 'optional' },

  followUs: { ml: 'ഞങ്ങളെ പിന്തുടരുക', en: 'Follow us' },
  quickLinks: { ml: 'പ്രധാന ലിങ്കുകൾ', en: 'Quick links' },
  allRightsReserved: { ml: 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം', en: 'All rights reserved' },
  socialMedia: { ml: 'സോഷ്യൽ മീഡിയ', en: 'Social Media' },
  affiliated: { ml: 'അനുബന്ധ സംരംഭങ്ങൾ', en: 'Affiliated Initiatives' },
  institutions: { ml: 'സ്ഥാപനങ്ങൾ', en: 'Institutions' },
  officialPortals: { ml: 'ഔദ്യോഗിക പോർട്ടലുകൾ', en: 'Official Portals' },
  searchResults: { ml: 'തിരയൽ ഫലങ്ങൾ', en: 'Search results' },
  noResults: { ml: 'ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല.', en: 'No results found.' },
  majorProgrammes: { ml: 'പ്രധാന പദ്ധതികൾ', en: 'Major Programmes' },
  otherProgrammes: { ml: 'മറ്റ് പദ്ധതികൾ', en: 'Other Programmes' },
  relatedPosts: { ml: 'അനുബന്ധ വാർത്തകൾ', en: 'Related posts' },
  publishedOn: { ml: 'പ്രസിദ്ധീകരിച്ചത്', en: 'Published' },
  source: { ml: 'ഉറവിടം', en: 'Source' },
  author: { ml: 'രചയിതാവ്', en: 'Author' },
  publisher: { ml: 'പ്രസാധകൻ', en: 'Publisher' },
  pages: { ml: 'പേജുകൾ', en: 'Pages' },
  readOnline: { ml: 'ഓൺലൈനിൽ വായിക്കുക', en: 'Read online' },
  buy: { ml: 'വാങ്ങുക', en: 'Buy' },
  photos: { ml: 'ചിത്രങ്ങൾ', en: 'Photos' },
  officialDocuments: { ml: 'ഔദ്യോഗിക രേഖകൾ', en: 'Official Documents' },
  leadership: { ml: 'നേതൃത്വം', en: 'Leadership' },
  posters: { ml: 'പോസ്റ്ററുകൾ', en: 'Posters' },
  latestNews: { ml: 'പുതിയ വാർത്തകൾ', en: 'Latest News' },
  viewAllNews: { ml: 'എല്ലാ വാർത്തകളും', en: 'View All News' },
  viewAllEvents: { ml: 'എല്ലാ പരിപാടികളും', en: 'View All Events' },
  viewMoreVideos: { ml: 'കൂടുതൽ വീഡിയോകൾ', en: 'View More Videos' },
  featuredVideo: { ml: 'തിരഞ്ഞെടുത്ത വീഡിയോ', en: 'Featured Video' },
  presidentMessage: { ml: 'അധ്യക്ഷയുടെ സന്ദേശം', en: "President's Message" },
  ourInitiatives: { ml: 'നമ്മുടെ പദ്ധതികൾ', en: 'Our Initiatives' },
  discoverMore: { ml: 'കൂടുതൽ അറിയുക', en: 'Discover More' },
  joinUs: { ml: 'അംഗമാകുക', en: 'Join Us' },
  followUsShort: { ml: 'പിന്തുടരുക:', en: 'Follow Us:' },
  newsletter: { ml: 'ന്യൂസ്‌ലെറ്റർ', en: 'Newsletter' },
  newsletterBlurb: {
    ml: 'ഞങ്ങളുടെ ന്യൂസ്‌ലെറ്ററിൽ ചേരൂ, പുതിയ വിവരങ്ങൾ അറിയൂ.',
    en: 'Subscribe to our newsletter and stay updated.',
  },
  enterYourEmail: { ml: 'നിങ്ങളുടെ ഇമെയിൽ', en: 'Enter your email' },
  subscribe: { ml: 'സബ്‌സ്ക്രൈബ്', en: 'Subscribe' },
  subscribed: { ml: 'നന്ദി! നിങ്ങൾ സബ്‌സ്ക്രൈബ് ചെയ്തു.', en: "Thank you! You're subscribed." },
  privacyPolicy: { ml: 'സ്വകാര്യതാ നയം', en: 'Privacy Policy' },
  termsConditions: { ml: 'നിബന്ധനകളും വ്യവസ്ഥകളും', en: 'Terms & Conditions' },
  aboutUs: { ml: 'ഞങ്ങളെക്കുറിച്ച്', en: 'About Us' },
  mediaNews: { ml: 'മീഡിയ & വാർത്തകൾ', en: 'Media & News' },
  visionMission: { ml: 'ദർശനവും ദൗത്യവും', en: 'Our Vision & Mission' },
  readFullMessage: { ml: 'പൂർണ്ണ സന്ദേശം വായിക്കുക', en: 'Read the full message' },
  skipToContent: { ml: 'ഉള്ളടക്കത്തിലേക്ക് പോകുക', en: 'Skip to content' },

  footerWing: { ml: 'വനിതാ വിഭാഗം', en: "Women's Wing" },
  footerKerala: { ml: 'കേരള', en: 'Kerala' },
  footerOrgName: { ml: 'ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ്', en: 'Jamaat e Islami Hind' },
  footerOrgFull: { ml: 'വനിതാ വിഭാഗം കേരള', en: "Women's Wing Kerala" },
  footerBlurb: {
    ml: 'പുരോഗമനപരവും നീതിപൂർവകവുമായ ഒരു സമൂഹത്തിനായി മുസ്‌ലിം സ്ത്രീകളുടെ ശാക്തീകരണവും സമഗ്ര വികസനവും ലക്ഷ്യമിടുന്നു.',
    en: 'Working towards the empowerment and holistic development of Muslim women for a progressive and just society.',
  },
};

export function useStrings(lang: Lang) {
  return (key: keyof typeof STRINGS | string): string => {
    const entry = STRINGS[key];
    if (!entry) return key;
    return t(entry, lang);
  };
}

export function str(key: string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return t(entry, lang);
}
