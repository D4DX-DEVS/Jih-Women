/**
 * Seeds the organisation website with its baseline structure — the pages,
 * departments, programmes and links named in the Functional Requirements.
 * Idempotent: re-running updates the same documents by slug.
 *
 *   npm run seed:org
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const { getSiteSetting } = require('../models/SiteSetting');
const Page = require('../models/Page');
const Department = require('../models/Department');
const Program = require('../models/Program');
const ExternalLink = require('../models/ExternalLink');
const FocusArea = require('../models/FocusArea');

const upsertOptions = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };

const PAGES = [
  {
    slug: 'ideology',
    section: 'who-we-are',
    order: 1,
    title: { ml: 'ആദർശം', en: 'Ideology' },
    summary: {
      ml: 'ജമാഅത്തെ ഇസ്‌ലാമി വനിതാ വിഭാഗം മുന്നോട്ടുവെക്കുന്ന ആദർശ അടിത്തറ.',
      en: 'The ideological foundation of the Women\'s Wing of Jamaat-e-Islami Kerala.',
    },
    body: {
      ml: '<p>ഇവിടെ ആദർശം സംബന്ധിച്ച ഉള്ളടക്കം അഡ്മിൻ പാനലിൽ നിന്ന് ചേർക്കുക.</p>',
      en: '<p>Add the ideology content from the admin panel.</p>',
    },
  },
  {
    slug: 'our-values',
    section: 'who-we-are',
    order: 2,
    title: { ml: 'നമ്മുടെ മൂല്യങ്ങൾ', en: 'Our Values' },
    summary: {
      ml: 'പ്രവർത്തനങ്ങളെ നയിക്കുന്ന അടിസ്ഥാന മൂല്യങ്ങൾ.',
      en: 'The core values that guide our work.',
    },
    body: {
      ml: '<p>ഇവിടെ മൂല്യങ്ങൾ സംബന്ധിച്ച ഉള്ളടക്കം ചേർക്കുക.</p>',
      en: '<p>Add the values content from the admin panel.</p>',
    },
  },
  {
    slug: 'constitution',
    section: 'who-we-are',
    order: 3,
    title: { ml: 'ഭരണഘടന', en: 'Constitution' },
    summary: {
      ml: 'സംഘടനാ ഭരണഘടനയും അതിന്റെ അടിസ്ഥാന വ്യവസ്ഥകളും.',
      en: 'The constitution of the organisation and its founding provisions.',
    },
    body: {
      ml: '<p>ഭരണഘടനയുടെ ഉള്ളടക്കവും PDF ഡൗൺലോഡും അഡ്മിൻ പാനലിൽ നിന്ന് ചേർക്കുക.</p>',
      en: '<p>Add the constitution text and PDF download from the admin panel.</p>',
    },
  },
  {
    slug: 'our-legacy',
    section: 'who-we-are',
    order: 4,
    title: { ml: 'നമ്മുടെ പൈതൃകം', en: 'Our Legacy' },
    summary: {
      ml: 'പതിറ്റാണ്ടുകളായുള്ള പ്രവർത്തന ചരിത്രം.',
      en: 'Decades of service and movement history.',
    },
    body: {
      ml: '<p>ചരിത്രവും നാഴികക്കല്ലുകളും ഇവിടെ ചേർക്കുക.</p>',
      en: '<p>Add the history and milestones here.</p>',
    },
  },
];

const DEPARTMENTS = [
  {
    slug: 'thamheedul-mara',
    order: 1,
    title: { ml: 'തംഹീദുൽ മർഅ', en: "Thamheedul Mar'a" },
    tagline: {
      ml: 'സ്ത്രീ ശാക്തീകരണത്തിനായുള്ള പഠന-പരിശീലന വിഭാഗം.',
      en: 'The study and training department for women\'s empowerment.',
    },
    about: {
      ml: '<p>തംഹീദുൽ മർഅ വിഭാഗത്തെക്കുറിച്ചുള്ള വിവരണം അഡ്മിൻ പാനലിൽ നിന്ന് ചേർക്കുക.</p>',
      en: '<p>Add the description of Thamheedul Mar\'a from the admin panel.</p>',
    },
    objectives: [],
    activities: [],
  },
  {
    slug: 'wings',
    order: 2,
    title: { ml: 'വിംഗ്സ്', en: 'WINGS' },
    tagline: {
      ml: 'വിദ്യാർഥിനികൾക്കും യുവതികൾക്കുമുള്ള വേദി.',
      en: 'A platform for students and young women.',
    },
    about: {
      ml: '<p>വിംഗ്സ് വിഭാഗത്തെക്കുറിച്ചുള്ള വിവരണം ചേർക്കുക.</p>',
      en: '<p>Add the WINGS introduction from the admin panel.</p>',
    },
    objectives: [],
    activities: [],
  },
  {
    slug: 'for-her',
    order: 3,
    title: { ml: 'ഫോർ ഹെർ', en: 'FOR HER' },
    tagline: {
      ml: 'സ്ത്രീകൾക്കായുള്ള ഡിജിറ്റൽ കാമ്പയിൻ വേദി.',
      en: 'A digital campaign platform for women.',
    },
    about: {
      ml: '<p>ഫോർ ഹെർ വിഭാഗത്തെക്കുറിച്ചുള്ള വിവരണവും പോസ്റ്ററുകളും ചേർക്കുക.</p>',
      en: '<p>Add the FOR HER description and posters from the admin panel.</p>',
    },
    objectives: [],
    activities: [],
  },
];

const PROGRAMS = [
  {
    slug: 'wes',
    order: 1,
    isMajor: true,
    title: { ml: 'വിമൻ എന്റർപ്രണേഴ്‌സ് സമ്മിറ്റ്', en: 'Women Entrepreneurs Summit (WES)' },
    tagline: {
      ml: 'വനിതാ സംരംഭകർക്കായുള്ള സംസ്ഥാനതല സമ്മിറ്റ്.',
      en: 'A state-level summit for women entrepreneurs.',
    },
    overview: {
      ml: '<p>WES സംബന്ധിച്ച വിവരണം ചേർക്കുക. രജിസ്ട്രേഷനും വിശദാംശങ്ങളും പ്രത്യേക വെബ്സൈറ്റിൽ.</p>',
      en: '<p>Add the WES overview here. Registration and full details live on the dedicated WES site.</p>',
    },
    externalLabel: { ml: 'WES വെബ്സൈറ്റ് സന്ദർശിക്കുക', en: 'Visit the WES website' },
    externalUrl: '',
  },
  {
    slug: 'proficia',
    order: 2,
    isMajor: true,
    title: { ml: 'പ്രൊഫീഷ്യ', en: 'Proficia' },
    tagline: {
      ml: 'പ്രൊഫഷണൽ വനിതകൾക്കായുള്ള പദ്ധതി.',
      en: 'An initiative for professional women.',
    },
    overview: {
      ml: '<p>പ്രൊഫീഷ്യ പദ്ധതിയുടെ വിവരണം ചേർക്കുക.</p>',
      en: '<p>Add the Proficia programme overview.</p>',
    },
  },
  {
    slug: 'thamheed',
    order: 3,
    isMajor: true,
    title: { ml: 'തംഹീദ്', en: 'Thamheed' },
    tagline: {
      ml: 'പഠന-പരിശീലന പദ്ധതി.',
      en: 'A study and training programme.',
    },
    overview: {
      ml: '<p>തംഹീദ് പദ്ധതിയുടെ വിവരണം ചേർക്കുക.</p>',
      en: '<p>Add the Thamheed programme overview.</p>',
    },
  },
  {
    slug: 'safa-nagar',
    order: 4,
    isMajor: true,
    title: { ml: 'സഫാ നഗർ', en: 'Safa Nagar' },
    tagline: {
      ml: 'ശുചിത്വ-പരിസ്ഥിതി കാമ്പയിൻ.',
      en: 'A cleanliness and environment campaign.',
    },
    overview: {
      ml: '<p>സഫാ നഗർ പദ്ധതിയുടെ വിവരണം ചേർക്കുക.</p>',
      en: '<p>Add the Safa Nagar programme overview.</p>',
    },
  },
];

const LINKS = [
  {
    url: 'https://www.aramam.co.in/',
    category: 'official-portal',
    order: 1,
    title: { ml: 'ആരാമം മാസിക', en: 'Aramam Magazine' },
    description: {
      ml: 'വനിതാ വിഭാഗത്തിന്റെ മാസിക.',
      en: 'The monthly magazine of the Women\'s Wing.',
    },
  },
  {
    url: 'https://forher.co.in/',
    category: 'official-portal',
    order: 2,
    title: { ml: 'ഫോർ ഹെർ', en: 'FOR HER' },
    description: { ml: 'ഫോർ ഹെർ ഔദ്യോഗിക പോർട്ടൽ.', en: 'The official FOR HER portal.' },
  },
  {
    url: 'https://prabodhanam.net/',
    category: 'institution',
    order: 3,
    title: { ml: 'പ്രബോധനം', en: 'Prabodhanam' },
    description: { ml: 'പ്രബോധനം വാരിക.', en: 'Prabodhanam weekly.' },
  },
  {
    url: 'https://bodhanam.net/',
    category: 'institution',
    order: 4,
    title: { ml: 'ബോധനം', en: 'Bodhanam' },
    description: { ml: 'ബോധനം ത്രൈമാസിക.', en: 'Bodhanam quarterly.' },
  },
  {
    url: 'https://islamonlive.in/',
    category: 'institution',
    order: 5,
    title: { ml: 'ഇസ്‌ലാം ഓൺലൈവ്', en: 'Islam Onlive' },
    description: { ml: 'ഇസ്‌ലാം ഓൺലൈവ് പോർട്ടൽ.', en: 'The Islam Onlive portal.' },
  },
];


const FOCUS_AREAS = [
  {
    icon: 'graduation-cap',
    order: 1,
    title: { ml: 'വിദ്യാഭ്യാസം', en: 'Education' },
    description: {
      ml: 'ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസവും ആജീവനാന്ത പഠനവും പ്രോത്സാഹിപ്പിക്കുന്നു.',
      en: 'Promoting quality education and lifelong learning.',
    },
  },
  {
    icon: 'users',
    order: 2,
    title: { ml: 'ശാക്തീകരണം', en: 'Empowerment' },
    description: {
      ml: 'ആത്മവിശ്വാസമുള്ള, കഴിവുറ്റ, സ്വതന്ത്രരായ സ്ത്രീകളെ വളർത്തുന്നു.',
      en: 'Building confident, capable and independent women.',
    },
  },
  {
    icon: 'heart-handshake',
    order: 3,
    title: { ml: 'സാമൂഹിക സേവനം', en: 'Social Service' },
    description: {
      ml: 'സമൂഹത്തെ സേവിക്കുകയും ക്രിയാത്മകമായ മാറ്റം സൃഷ്ടിക്കുകയും ചെയ്യുന്നു.',
      en: 'Serving communities and creating a positive impact.',
    },
  },
  {
    icon: 'calendar-days',
    order: 4,
    title: { ml: 'പരിപാടികൾ', en: 'Events' },
    description: {
      ml: 'പ്രചോദനവും മാറ്റവും നൽകുന്ന പരിപാടികൾ സംഘടിപ്പിക്കുന്നു.',
      en: 'Organizing events that inspire and bring change.',
    },
  },
  {
    icon: 'megaphone',
    order: 5,
    title: { ml: 'ബോധവൽക്കരണം', en: 'Awareness' },
    description: {
      ml: 'സാമൂഹിക, ആരോഗ്യ, നിയമ വിഷയങ്ങളിൽ അവബോധം സൃഷ്ടിക്കുന്നു.',
      en: 'Creating awareness on social, health and legal issues.',
    },
  },
  {
    icon: 'handshake',
    order: 6,
    title: { ml: 'നേതൃത്വം', en: 'Leadership' },
    description: {
      ml: 'നാളെയുടെ നേതാക്കളെ വാർത്തെടുക്കുന്നു.',
      en: 'Nurturing future leaders for a better tomorrow.',
    },
  },
];

async function run() {
  await connectDB();

  const settings = await getSiteSetting();
  if (!settings.siteName?.ml) {
    settings.set({
      siteName: {
        ml: 'ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ് വനിതാ വിഭാഗം കേരള',
        en: "Jamaat e Islami Hind Women's Wing Kerala",
      },
      tagline: {
        ml: 'സ്ത്രീ ശാക്തീകരണം · സമൂഹ ശാക്തീകരണം',
        en: 'Empowering Women. Strengthening Society.',
      },
      topBarText: {
        ml: 'സ്ത്രീ ശാക്തീകരണം · സമൂഹ ശാക്തീകരണം',
        en: 'Empowering Women. Strengthening Society.',
      },
      joinLabel: { ml: 'അംഗമാകുക', en: 'Join Us' },
      presidentMessage: {
        enabled: true,
        heading: { ml: 'അധ്യക്ഷയുടെ സന്ദേശം', en: "President's Message" },
      },
    });
    await settings.save();
    console.log('[seed] site settings initialised');
  }

  for (const area of FOCUS_AREAS) {
    await FocusArea.findOneAndUpdate({ 'title.en': area.title.en }, { $set: area }, upsertOptions);
  }
  console.log(`[seed] ${FOCUS_AREAS.length} focus areas`);

  for (const page of PAGES) {
    await Page.findOneAndUpdate({ slug: page.slug }, { $set: page }, upsertOptions);
  }
  console.log(`[seed] ${PAGES.length} pages`);

  for (const dept of DEPARTMENTS) {
    await Department.findOneAndUpdate({ slug: dept.slug }, { $set: dept }, upsertOptions);
  }
  console.log(`[seed] ${DEPARTMENTS.length} departments`);

  for (const program of PROGRAMS) {
    await Program.findOneAndUpdate({ slug: program.slug }, { $set: program }, upsertOptions);
  }
  console.log(`[seed] ${PROGRAMS.length} programmes`);

  for (const link of LINKS) {
    await ExternalLink.findOneAndUpdate({ url: link.url }, { $set: link }, upsertOptions);
  }
  console.log(`[seed] ${LINKS.length} external links`);

  await mongoose.connection.close();
  console.log('[seed] done');
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
