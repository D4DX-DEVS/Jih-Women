/**
 * Fills the organisation website with a complete set of demo content so every
 * page can be reviewed end to end before the real material arrives.
 *
 *   npm run seed:demo          add / refresh the demo content
 *   npm run seed:demo -- --clear   remove everything this script created
 *
 * Everything is tagged so it can be removed cleanly: images live under
 * org/demo/ in Spaces and documents carry slugs prefixed with "demo-" where a
 * slug exists. Re-running is safe — records are matched and updated in place.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { uploadImage, uploadPdf } = require('./demo/assets');

const { getSiteSetting } = require('../models/SiteSetting');
const Slider = require('../models/Slider');
const Campaign = require('../models/Campaign');
const Page = require('../models/Page');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Leader = require('../models/Leader');
const OrgEvent = require('../models/OrgEvent');
const MediaPost = require('../models/MediaPost');
const VideoItem = require('../models/VideoItem');
const Publication = require('../models/Publication');
const Album = require('../models/Album');
const DownloadItem = require('../models/DownloadItem');

const UPSERT = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };

// A short, innocuous, reliably embeddable clip — replace with real videos.
const DEMO_VIDEO = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

const ml = (m, e) => ({ ml: m, en: e });
const bullets = (pairs) => pairs.map(([m, e]) => ({ text: ml(m, e) }));

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

/* ────────────────────────────── artwork ────────────────────────────── */

async function buildAssets() {
  console.log('[demo] generating and uploading artwork…');

  const jobs = {
    slide1: uploadImage('slide-1', { width: 1920, height: 900, label: 'Empowering Women, Building a Better Society', sub: "Women's Wing Kerala", variant: 0 }),
    slide2: uploadImage('slide-2', { width: 1920, height: 900, label: 'Knowledge that Transforms Lives', sub: 'Study Circles', variant: 1 }),
    slide3: uploadImage('slide-3', { width: 1920, height: 900, label: 'Serving Communities with Compassion', sub: 'Social Service', variant: 2 }),

    bannerWes: uploadImage('banner-wes', { width: 1200, height: 400, label: 'Women Entrepreneurs Summit', sub: 'WES 2026', variant: 3 }),
    bannerProficia: uploadImage('banner-proficia', { width: 1200, height: 400, label: 'Proficia Professional Summit', sub: '2025', variant: 1 }),
    bannerThamheed: uploadImage('banner-thamheed', { width: 1200, height: 400, label: 'Thamheed Study Programme', sub: 'Learning', variant: 4 }),

    president: uploadImage('president', { width: 600, height: 750, label: 'President', sub: 'Portrait', variant: 2 }),

    deptThamheed: uploadImage('dept-thamheedul-mara', { width: 1400, height: 790, label: "Thamheedul Mar'a", sub: 'Department', variant: 0 }),
    deptWings: uploadImage('dept-wings', { width: 1400, height: 790, label: 'WINGS', sub: 'Students & Youth', variant: 3 }),
    deptForHer: uploadImage('dept-for-her', { width: 1400, height: 790, label: 'FOR HER', sub: 'Digital Campaign', variant: 1 }),

    progWes: uploadImage('prog-wes', { width: 1400, height: 790, label: 'Women Entrepreneurs Summit', sub: 'Programme', variant: 3 }),
    progProficia: uploadImage('prog-proficia', { width: 1400, height: 790, label: 'Proficia', sub: 'Programme', variant: 1 }),
    progThamheed: uploadImage('prog-thamheed', { width: 1400, height: 790, label: 'Thamheed', sub: 'Programme', variant: 4 }),
    progSafa: uploadImage('prog-safa-nagar', { width: 1400, height: 790, label: 'Safa Nagar', sub: 'Programme', variant: 2 }),

    campaign1: uploadImage('campaign-1', { width: 1200, height: 800, label: 'Read One Book a Month', sub: 'Campaign', variant: 1 }),
    campaign2: uploadImage('campaign-2', { width: 1200, height: 800, label: 'Clean Neighbourhood Drive', sub: 'Campaign', variant: 2 }),

    event1: uploadImage('event-1', { width: 1200, height: 1500, label: 'State Womens Conference', sub: 'Poster', variant: 0 }),
    event2: uploadImage('event-2', { width: 1200, height: 1500, label: 'Family Counselling Workshop', sub: 'Poster', variant: 3 }),
    event3: uploadImage('event-3', { width: 1400, height: 790, label: 'Annual Study Camp', sub: 'Past Event', variant: 4 }),

    news1: uploadImage('news-1', { width: 1000, height: 620, label: 'Leadership Seminar Concludes', sub: 'News', variant: 0 }),
    news2: uploadImage('news-2', { width: 1000, height: 620, label: 'Relief Work Reaches 500 Families', sub: 'News', variant: 2 }),
    news3: uploadImage('news-3', { width: 1000, height: 620, label: 'New Study Circles Launched', sub: 'News', variant: 1 }),
    news4: uploadImage('news-4', { width: 1000, height: 620, label: 'Statement on Womens Education', sub: 'Statement', variant: 3 }),
    news5: uploadImage('news-5', { width: 1000, height: 620, label: 'Interview with the President', sub: 'Interview', variant: 4 }),
    news6: uploadImage('news-6', { width: 1000, height: 620, label: 'Inaugural Address', sub: 'Speech', variant: 0 }),
    news7: uploadImage('news-7', { width: 1000, height: 620, label: 'Press Meet on Social Welfare', sub: 'Press Release', variant: 2 }),

    leader1: uploadImage('leader-1', { width: 600, height: 750, label: 'President', sub: 'Leadership', variant: 0 }),
    leader2: uploadImage('leader-2', { width: 600, height: 750, label: 'Vice President', sub: 'Leadership', variant: 1 }),
    leader3: uploadImage('leader-3', { width: 600, height: 750, label: 'General Secretary', sub: 'Leadership', variant: 2 }),
    leader4: uploadImage('leader-4', { width: 600, height: 750, label: 'Treasurer', sub: 'Leadership', variant: 3 }),
    leaderPast1: uploadImage('leader-past-1', { width: 900, height: 1200, label: 'Meeqathi 2019 - 2023', sub: 'Past Leadership', variant: 4 }),
    leaderPast2: uploadImage('leader-past-2', { width: 900, height: 1200, label: 'Meeqathi 2015 - 2019', sub: 'Past Leadership', variant: 1 }),

    pub1: uploadImage('pub-1', { width: 700, height: 950, label: 'Woman in Islam', sub: 'Book', variant: 0 }),
    pub2: uploadImage('pub-2', { width: 700, height: 950, label: 'Family and Society', sub: 'Book', variant: 3 }),
    pub3: uploadImage('pub-3', { width: 700, height: 950, label: 'Rights and Responsibilities', sub: 'Booklet', variant: 1 }),
    pub4: uploadImage('pub-4', { width: 700, height: 950, label: 'Education for All', sub: 'Article', variant: 2 }),

    video1: uploadImage('video-1', { width: 1280, height: 720, label: 'Renew Your Faith', sub: 'Video', variant: 0 }),
    video2: uploadImage('video-2', { width: 1280, height: 720, label: 'Women and Community Building', sub: 'Video', variant: 3 }),
    video3: uploadImage('video-3', { width: 1280, height: 720, label: 'Voices of Change', sub: 'Podcast', variant: 1 }),

    album1: uploadImage('album-1', { width: 1200, height: 900, label: 'State Conference 2025', sub: 'Album', variant: 0 }),
    album2: uploadImage('album-2', { width: 1200, height: 900, label: 'Relief Distribution', sub: 'Album', variant: 2 }),
    album3: uploadImage('album-3', { width: 1200, height: 900, label: 'Study Camp', sub: 'Album', variant: 4 }),

    downloadPoster: uploadImage('download-poster', { width: 900, height: 1200, label: 'Campaign Poster', sub: 'Download', variant: 3 }),

    docConstitution: uploadPdf('doc-constitution', 'Constitution', [
      'Women\'s Wing, Jamaat-e-Islami Kerala',
      '',
      'This placeholder document stands in for the real constitution PDF.',
      'Replace it from Admin -> Downloads.',
    ]),
    docReport: uploadPdf('doc-annual-report', 'Annual Report 2025', [
      'A summary of the year\'s activities.',
      '',
      'Replace this placeholder from Admin -> Downloads.',
    ]),
    docForm: uploadPdf('doc-membership-form', 'Membership Form', [
      'Name:', 'District:', 'Phone:', '', 'Replace this placeholder file from the admin panel.',
    ]),
  };

  const keys = Object.keys(jobs);
  const values = await Promise.all(keys.map((k) => jobs[k]));
  const assets = Object.fromEntries(keys.map((k, i) => [k, values[i]]));
  console.log(`[demo] ${keys.length} files uploaded`);
  return assets;
}

/* ─────────────────────────── gallery helper ─────────────────────────── */

function galleryFrom(urls, captions) {
  return urls.map((url, i) => ({
    url,
    thumbnailUrl: url,
    caption: captions[i] ?? ml('', ''),
    kind: 'image',
  }));
}

/* ────────────────────────────── seeding ────────────────────────────── */

async function seed(a) {
  /* Site settings — president's message, contact block, banners on */
  const settings = await getSiteSetting();
  settings.set({
    presidentMessage: {
      enabled: true,
      heading: ml('അധ്യക്ഷയുടെ സന്ദേശം', "President's Message"),
      name: ml('സാജിദ പി.ടി.പി', 'Sajida P.T.P'),
      designation: ml('സംസ്ഥാന അധ്യക്ഷ', 'State President'),
      photo: a.president,
      message: {
        ml:
          '<p>ജമാഅത്തെ ഇസ്‌ലാമിയുടെ രൂപീകരണം തൊട്ടേ സമൂഹത്തിന്റെ പാതിയായ സ്ത്രീകളെ സംസ്കരിക്കുവാനും സമുദ്ധരിക്കുവാനും സംഘടിപ്പിക്കുവാനും ശക്തവും ധീരവും വിപ്ലവകരവുമായ ഒട്ടേറെ ശ്രമങ്ങൾ നടത്തി. പ്രാദേശിക യൂണിറ്റുകളിൽ നിന്ന് തുടങ്ങി ദഅ്‌വത്ത് നഗറിൽ നൂറുകണക്കിന് സ്ത്രീകളെ പങ്കെടുപ്പിച്ചും ഹിറായിൽ പതിനായിരങ്ങളെയും കൂട്ടിയും കേരള വനിതാ സമ്മേളനത്തിന് ഒരു ലക്ഷം വനിതകളെയും സംഘടിപ്പിച്ച് പ്രസ്ഥാന വനിതകൾ മുന്നേറി.</p>' +
          '<p>വിജ്ഞാനവും കർമ്മവും ഒരുമിച്ചു കൊണ്ടുപോകുന്ന ഒരു തലമുറയെ വാർത്തെടുക്കുകയാണ് നമ്മുടെ ലക്ഷ്യം. ഈ വെബ്സൈറ്റ് ആ യാത്രയുടെ ഒരു ജാലകമാണ്.</p>',
        en:
          '<p>From the very formation of Jamaat-e-Islami, sustained and courageous efforts have been made to educate, uplift and organise women — half of society. Beginning in local units and growing into gatherings of hundreds at Dawah Nagar, tens of thousands at Hira and a hundred thousand women at the Kerala Women\'s Conference, the movement\'s women have carried this work forward.</p>' +
          '<p>Our aim is to raise a generation that carries knowledge and action together. This website is a window into that journey.</p>',
      },
      linkUrl: '/who-we-are/our-legacy',
    },
    phone: '+91 495 276 0786',
    whatsapp: '+91 495 276 0786',
    email: 'info@jihwomenswingkerala.org',
    workingHours: ml('തിങ്കൾ – ശനി, രാവിലെ 9.30 – വൈകിട്ട് 5.00', 'Monday – Saturday, 9.30 am – 5.00 pm'),
    address: {
      ml: 'ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ്\nവനിതാ വിഭാഗം കേരള\nകോഴിക്കോട്, കേരളം',
      en: "Jamaat e Islami Hind\nWomen's Wing Kerala\nCalicut, Kerala, India",
    },
    social: {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/',
      whatsappChannel: 'https://whatsapp.com/',
      twitter: 'https://x.com/',
    },
  });
  await settings.save();
  console.log('[demo] site settings');

  /* Home slider */
  const slides = [
    {
      order: 0,
      imageUrl: a.slide1,
      title: ml('സ്ത്രീ ശാക്തീകരണം *മികച്ച സമൂഹത്തിനായി*', 'Empowering Women Building a *Better Society*'),
      subtitle: ml(
        'ഐക്യത്തിലൂടെയും വിജ്ഞാനത്തിലൂടെയും സേവനത്തിലൂടെയും സ്ത്രീകളുടെ ശാക്തീകരണത്തിനും സമഗ്ര വികസനത്തിനും ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ് വനിതാ വിഭാഗം കേരള പ്രതിജ്ഞാബദ്ധമാണ്.',
        "Jamaat e Islami Hind Women's Wing Kerala is committed to the empowerment, education and holistic development of women through unity, knowledge and service."
      ),
      linkLabel: ml('കൂടുതൽ അറിയുക', 'Discover More'),
      linkUrl: '/programs',
      secondaryLinkLabel: ml('നമ്മുടെ പദ്ധതികൾ', 'Our Initiatives'),
      secondaryLinkUrl: '/departments',
    },
    {
      order: 1,
      imageUrl: a.slide2,
      title: ml('വിജ്ഞാനം *ജീവിതം മാറ്റുന്നു*', 'Knowledge that *Transforms Lives*'),
      subtitle: ml(
        'പഠനവൃത്തങ്ങളിലൂടെയും പരിശീലന പരിപാടികളിലൂടെയും ആയിരക്കണക്കിന് സ്ത്രീകൾ പുതിയ വഴികൾ കണ്ടെത്തുന്നു.',
        'Through study circles and training programmes, thousands of women are finding new paths forward.'
      ),
      linkLabel: ml('പഠന പദ്ധതികൾ', 'Study Programmes'),
      linkUrl: '/programs/thamheed',
      secondaryLinkLabel: ml('പ്രസിദ്ധീകരണങ്ങൾ', 'Publications'),
      secondaryLinkUrl: '/publications',
    },
    {
      order: 2,
      imageUrl: a.slide3,
      title: ml('കരുണയോടെ *സമൂഹ സേവനം*', 'Serving Communities with *Compassion*'),
      subtitle: ml(
        'ദുരിതാശ്വാസം മുതൽ ആരോഗ്യ ബോധവൽക്കരണം വരെ — സമൂഹത്തോടൊപ്പം എന്നും.',
        'From relief work to health awareness — always alongside the community.'
      ),
      linkLabel: ml('പരിപാടികൾ', 'Our Events'),
      linkUrl: '/events',
      secondaryLinkLabel: ml('ബന്ധപ്പെടുക', 'Contact Us'),
      secondaryLinkUrl: '/contact',
    },
  ];
  for (const slide of slides) {
    await Slider.findOneAndUpdate({ imageUrl: slide.imageUrl }, { $set: slide }, UPSERT);
  }
  console.log(`[demo] ${slides.length} slides`);

  /* Programme banners + full programme content */
  const programs = [
    {
      slug: 'wes',
      coverImage: a.progWes,
      bannerImage: a.bannerWes,
      objectives: bullets([
        ['വനിതാ സംരംഭകർക്ക് വേദിയൊരുക്കുക', 'Create a platform for women entrepreneurs'],
        ['വിപണന പരിശീലനം നൽകുക', 'Provide marketing and business training'],
        ['പരസ്പര ബന്ധം ശക്തിപ്പെടുത്തുക', 'Build a supportive network'],
      ]),
      schedule: [
        { time: '09:30 AM', title: ml('രജിസ്ട്രേഷൻ', 'Registration'), description: ml('പ്രതിനിധികളുടെ രജിസ്ട്രേഷൻ', 'Delegate registration and welcome') },
        { time: '10:30 AM', title: ml('ഉദ്ഘാടന സെഷൻ', 'Inaugural Session'), description: ml('ഉദ്ഘാടനവും മുഖ്യ പ്രഭാഷണവും', 'Inauguration and keynote address') },
        { time: '02:00 PM', title: ml('പാനൽ ചർച്ച', 'Panel Discussion'), description: ml('സംരംഭകത്വത്തിന്റെ വെല്ലുവിളികൾ', 'Challenges in entrepreneurship') },
      ],
      gallery: galleryFrom([a.progWes, a.bannerWes], [ml('സമ്മിറ്റ്', 'Summit'), ml('ബാനർ', 'Banner')]),
    },
    { slug: 'proficia', coverImage: a.progProficia, bannerImage: a.bannerProficia },
    { slug: 'thamheed', coverImage: a.progThamheed, bannerImage: a.bannerThamheed },
    { slug: 'safa-nagar', coverImage: a.progSafa },
  ];
  for (const p of programs) {
    const { slug, ...rest } = p;
    await Program.findOneAndUpdate({ slug }, { $set: rest }, { new: true, runValidators: true });
  }
  console.log(`[demo] ${programs.length} programmes updated`);

  /* Departments */
  const departments = [
    {
      slug: 'thamheedul-mara',
      coverImage: a.deptThamheed,
      objectives: bullets([
        ['സ്ത്രീകൾക്കിടയിൽ വിജ്ഞാന സംസ്കാരം വളർത്തുക', 'Nurture a culture of learning among women'],
        ['പ്രാദേശിക പഠനവൃത്തങ്ങൾ ശക്തിപ്പെടുത്തുക', 'Strengthen local study circles'],
      ]),
      activities: [
        { title: ml('പ്രതിവാര പഠനവൃത്തം', 'Weekly Study Circle'), description: ml('എല്ലാ ആഴ്ചയും നടക്കുന്ന പഠന സദസ്സ്', 'A weekly gathering for structured study'), image: a.deptThamheed },
        { title: ml('വാർഷിക പഠന ക്യാമ്പ്', 'Annual Study Camp'), description: ml('മൂന്ന് ദിവസത്തെ പഠന ക്യാമ്പ്', 'A three-day residential study camp'), image: a.event3 },
      ],
      leadership: [
        { name: ml('ആയിഷ കെ', 'Ayisha K'), designation: ml('കൺവീനർ', 'Convener'), photo: a.leader2 },
        { name: ml('റഹ്‌മത്ത് പി', 'Rahmath P'), designation: ml('സെക്രട്ടറി', 'Secretary'), photo: a.leader3 },
      ],
      gallery: galleryFrom([a.deptThamheed, a.event3, a.album3], [ml('പഠനവൃത്തം', 'Study circle'), ml('ക്യാമ്പ്', 'Camp'), ml('സദസ്സ്', 'Session')]),
      downloads: [{ title: ml('വാർഷിക റിപ്പോർട്ട്', 'Annual Report'), url: a.docReport, mimeType: 'application/pdf', sizeBytes: 0 }],
    },
    {
      slug: 'wings',
      coverImage: a.deptWings,
      objectives: bullets([
        ['വിദ്യാർഥിനികൾക്ക് നേതൃപരിശീലനം', 'Leadership training for students'],
        ['കാമ്പസ് കൂട്ടായ്മകൾ ശക്തിപ്പെടുത്തുക', 'Strengthen campus collectives'],
      ]),
      leadership: [{ name: ml('ഫാത്തിമ എസ്', 'Fathima S'), designation: ml('കൺവീനർ', 'Convener'), photo: a.leader4 }],
      gallery: galleryFrom([a.deptWings, a.album1], [ml('വിംഗ്സ്', 'WINGS'), ml('സമ്മേളനം', 'Conference')]),
    },
    {
      slug: 'for-her',
      coverImage: a.deptForHer,
      posters: galleryFrom([a.campaign1, a.campaign2, a.downloadPoster], [ml('കാമ്പയിൻ', 'Campaign'), ml('ശുചിത്വം', 'Cleanliness'), ml('പോസ്റ്റർ', 'Poster')]),
      gallery: galleryFrom([a.deptForHer], [ml('ഫോർ ഹെർ', 'FOR HER')]),
    },
  ];
  for (const d of departments) {
    const { slug, ...rest } = d;
    await Department.findOneAndUpdate({ slug }, { $set: rest }, { new: true, runValidators: true });
  }
  console.log(`[demo] ${departments.length} departments updated`);

  /* Who We Are pages get a hero image and a real body */
  const pageBodies = {
    ideology: {
      heroImage: a.slide2,
      body: {
        ml: '<h2>അടിസ്ഥാന ആദർശം</h2><p>ഇസ്‌ലാമിന്റെ സമഗ്രമായ ജീവിത വീക്ഷണമാണ് പ്രസ്ഥാനത്തിന്റെ അടിത്തറ. വ്യക്തി, കുടുംബം, സമൂഹം എന്നീ തലങ്ങളിൽ നീതിയും കാരുണ്യവും സ്ഥാപിക്കുക എന്നതാണ് ലക്ഷ്യം.</p><h3>പ്രധാന തത്ത്വങ്ങൾ</h3><ul><li>ഏകദൈവ വിശ്വാസം</li><li>നീതിയും സമത്വവും</li><li>വിജ്ഞാനവും കർമ്മവും</li></ul>',
        en: '<h2>Our Foundation</h2><p>The movement rests on the comprehensive vision of life that Islam offers. Its aim is to establish justice and compassion at the level of the individual, the family and society.</p><h3>Core principles</h3><ul><li>Belief in the oneness of God</li><li>Justice and equality</li><li>Knowledge joined to action</li></ul>',
      },
    },
    'our-values': {
      heroImage: a.slide3,
      body: {
        ml: '<h2>നമ്മെ നയിക്കുന്ന മൂല്യങ്ങൾ</h2><ul><li><strong>കാരുണ്യം</strong> — എല്ലാ പ്രവർത്തനത്തിന്റെയും അടിസ്ഥാനം</li><li><strong>നീതി</strong> — വിവേചനമില്ലാത്ത സമീപനം</li><li><strong>വിജ്ഞാനം</strong> — ആജീവനാന്ത പഠനം</li><li><strong>സേവനം</strong> — സമൂഹത്തോടുള്ള ഉത്തരവാദിത്തം</li></ul>',
        en: '<h2>The values that guide us</h2><ul><li><strong>Compassion</strong> — the ground of every activity</li><li><strong>Justice</strong> — an approach without discrimination</li><li><strong>Knowledge</strong> — lifelong learning</li><li><strong>Service</strong> — responsibility towards society</li></ul>',
      },
      downloads: [{ title: ml('ഭരണഘടന', 'Constitution'), url: a.docConstitution, mimeType: 'application/pdf', sizeBytes: 0 }],
    },
    constitution: {
      heroImage: a.slide1,
      body: {
        ml: '<h2>ഭരണഘടന</h2><p>സംഘടനയുടെ ഘടന, അംഗത്വം, ഭരണസമിതി, തിരഞ്ഞെടുപ്പ് എന്നിവ സംബന്ധിച്ച വ്യവസ്ഥകൾ ഭരണഘടനയിൽ വിശദമാക്കുന്നു. പൂർണ്ണ രൂപം താഴെ ഡൗൺലോഡ് ചെയ്യാം.</p>',
        en: '<h2>Constitution</h2><p>The constitution sets out the structure of the organisation, its membership, governing council and elections. The full document can be downloaded below.</p>',
      },
      downloads: [{ title: ml('ഭരണഘടന (PDF)', 'Constitution (PDF)'), url: a.docConstitution, mimeType: 'application/pdf', sizeBytes: 0 }],
    },
    'our-legacy': {
      heroImage: a.album1,
      body: {
        ml: '<h2>പൈതൃകം</h2><p>പതിറ്റാണ്ടുകളായി കേരളത്തിലെ സ്ത്രീകൾക്കിടയിൽ വിജ്ഞാനവും ശാക്തീകരണവും വളർത്തുന്ന പ്രവർത്തനങ്ങളാണ് പ്രസ്ഥാനം നടത്തിയത്.</p><h3>നാഴികക്കല്ലുകൾ</h3><ul><li>പ്രാദേശിക യൂണിറ്റുകളുടെ രൂപീകരണം</li><li>ദഅ്‌വത്ത് നഗർ സമ്മേളനം</li><li>ഹിറാ സമ്മേളനം</li><li>കേരള വനിതാ സമ്മേളനം</li></ul>',
        en: '<h2>Our legacy</h2><p>For decades the movement has worked to grow knowledge and empowerment among the women of Kerala.</p><h3>Milestones</h3><ul><li>Formation of local units</li><li>The Dawah Nagar gathering</li><li>The Hira conference</li><li>The Kerala Women\'s Conference</li></ul>',
      },
    },
  };
  for (const [slug, patch] of Object.entries(pageBodies)) {
    await Page.findOneAndUpdate({ slug }, { $set: patch }, { new: true, runValidators: true });
  }
  console.log(`[demo] ${Object.keys(pageBodies).length} pages enriched`);

  /* Leaders */
  const leaders = [
    { name: ml('സാജിദ പി.ടി.പി', 'Sajida P.T.P'), designation: ml('സംസ്ഥാന അധ്യക്ഷ', 'State President'), photo: a.leader1, isCurrent: true, order: 0 },
    { name: ml('ഖദീജ എം', 'Khadeeja M'), designation: ml('വൈസ് പ്രസിഡന്റ്', 'Vice President'), photo: a.leader2, isCurrent: true, order: 1 },
    { name: ml('സുഹ്‌റ കെ.ടി', 'Suhra K.T'), designation: ml('ജനറൽ സെക്രട്ടറി', 'General Secretary'), photo: a.leader3, isCurrent: true, order: 2 },
    { name: ml('നസീമ വി', 'Naseema V'), designation: ml('ട്രഷറർ', 'Treasurer'), photo: a.leader4, isCurrent: true, order: 3 },
    { name: ml('മീഖാത്തി 2019 – 2023', 'Meeqathi 2019 – 2023'), designation: ml('മുൻ ഭരണസമിതി', 'Previous Council'), posterImage: a.leaderPast1, termLabel: '2019 – 2023', termFrom: 2019, termTo: 2023, isCurrent: false, order: 0 },
    { name: ml('മീഖാത്തി 2015 – 2019', 'Meeqathi 2015 – 2019'), designation: ml('മുൻ ഭരണസമിതി', 'Previous Council'), posterImage: a.leaderPast2, termLabel: '2015 – 2019', termFrom: 2015, termTo: 2019, isCurrent: false, order: 1 },
  ];
  for (const l of leaders) {
    await Leader.findOneAndUpdate({ 'name.en': l.name.en }, { $set: l }, UPSERT);
  }
  console.log(`[demo] ${leaders.length} leaders`);

  /* Events */
  const events = [
    {
      slug: 'state-womens-conference-2026',
      title: ml('സംസ്ഥാന വനിതാ സമ്മേളനം 2026', "State Women's Conference 2026"),
      summary: ml('കേരളത്തിലെ വനിതാ പ്രവർത്തകരുടെ സംസ്ഥാനതല സംഗമം.', 'A state-level gathering of women workers from across Kerala.'),
      description: {
        ml: '<p>ഒരു ദിവസം നീണ്ടുനിൽക്കുന്ന സമ്മേളനത്തിൽ പ്രഭാഷണങ്ങൾ, പാനൽ ചർച്ചകൾ, പ്രദർശനങ്ങൾ എന്നിവ ഉൾപ്പെടുന്നു.</p><p>എല്ലാ ജില്ലകളിൽ നിന്നുമുള്ള പ്രതിനിധികൾ പങ്കെടുക്കും.</p>',
        en: '<p>A full-day conference of addresses, panel discussions and exhibitions.</p><p>Delegates from every district will take part.</p>',
      },
      startDate: daysFromNow(28),
      endDate: daysFromNow(28),
      timeLabel: '9:30 AM – 5:00 PM',
      venue: ml('ടാഗോർ ഹാൾ, കോഴിക്കോട്', 'Tagore Hall, Calicut'),
      district: 'Kozhikode',
      coverImage: a.event1,
      posterImage: a.event1,
      speakers: [
        { name: ml('സാജിദ പി.ടി.പി', 'Sajida P.T.P'), designation: ml('സംസ്ഥാന അധ്യക്ഷ', 'State President'), photo: a.leader1 },
        { name: ml('ഖദീജ എം', 'Khadeeja M'), designation: ml('വൈസ് പ്രസിഡന്റ്', 'Vice President'), photo: a.leader2 },
      ],
      registrationEnabled: true,
      featured: true,
      gallery: galleryFrom([a.album1, a.slide1], [ml('വേദി', 'Venue'), ml('സമ്മേളനം', 'Conference')]),
    },
    {
      slug: 'family-counselling-workshop',
      title: ml('കുടുംബ കൗൺസലിംഗ് ശിൽപശാല', 'Family Counselling Workshop'),
      summary: ml('കൗൺസലർമാർക്കുള്ള രണ്ട് ദിവസത്തെ പരിശീലനം.', 'A two-day training for counsellors.'),
      description: {
        ml: '<p>കുടുംബ പ്രശ്നങ്ങളിൽ ഇടപെടുന്ന പ്രവർത്തകർക്കുള്ള പ്രായോഗിക പരിശീലനം.</p>',
        en: '<p>Practical training for volunteers who support families in difficulty.</p>',
      },
      startDate: daysFromNow(52),
      endDate: daysFromNow(53),
      timeLabel: '10:00 AM – 4:00 PM',
      venue: ml('വനിതാ വിഭാഗം ഓഫീസ്, കോഴിക്കോട്', "Women's Wing Office, Calicut"),
      district: 'Kozhikode',
      coverImage: a.event2,
      posterImage: a.event2,
      registrationEnabled: true,
    },
    {
      slug: 'annual-study-camp-2025',
      title: ml('വാർഷിക പഠന ക്യാമ്പ് 2025', 'Annual Study Camp 2025'),
      summary: ml('മൂന്ന് ദിവസത്തെ പഠന ക്യാമ്പ് വിജയകരമായി പൂർത്തിയായി.', 'The three-day residential study camp concluded successfully.'),
      description: {
        ml: '<p>200-ലധികം പ്രവർത്തകർ പങ്കെടുത്ത ക്യാമ്പിൽ പഠന സെഷനുകളും ചർച്ചകളും നടന്നു.</p>',
        en: '<p>More than 200 workers took part in study sessions and discussions.</p>',
      },
      startDate: daysFromNow(-60),
      endDate: daysFromNow(-58),
      venue: ml('ഹിറാ സെന്റർ, മലപ്പുറം', 'Hira Centre, Malappuram'),
      district: 'Malappuram',
      coverImage: a.event3,
      gallery: galleryFrom([a.event3, a.album3, a.album2], [ml('ക്യാമ്പ്', 'Camp'), ml('സെഷൻ', 'Session'), ml('സമാപനം', 'Closing')]),
    },
  ];
  for (const e of events) {
    const { slug, ...rest } = e;
    await OrgEvent.findOneAndUpdate({ slug }, { $set: { slug, ...rest } }, UPSERT);
  }
  console.log(`[demo] ${events.length} events`);

  /* Media centre */
  const posts = [
    { slug: 'leadership-seminar-concludes', type: 'news', cover: a.news1, featured: true, days: -3,
      title: ml('നേതൃത്വ ശിൽപശാല വിജയകരമായി സമാപിച്ചു', 'Leadership Seminar Concludes Successfully'),
      excerpt: ml('നൂറിലധികം പ്രവർത്തകർ പങ്കെടുത്ത ശിൽപശാല കോഴിക്കോട് നടന്നു.', 'More than a hundred workers took part in the seminar held at Calicut.') },
    { slug: 'relief-work-reaches-500-families', type: 'news', cover: a.news2, featured: true, days: -9,
      title: ml('ദുരിതാശ്വാസം 500 കുടുംബങ്ങളിലേക്ക്', 'Relief Work Reaches 500 Families'),
      excerpt: ml('മഴക്കെടുതിയിൽ ബാധിതരായ കുടുംബങ്ങൾക്ക് സഹായമെത്തിച്ചു.', 'Support reached families affected by the recent floods.') },
    { slug: 'new-study-circles-launched', type: 'news', cover: a.news3, days: -18,
      title: ml('പുതിയ പഠനവൃത്തങ്ങൾ ആരംഭിച്ചു', 'New Study Circles Launched'),
      excerpt: ml('ഈ വർഷം 40 പുതിയ പഠനവൃത്തങ്ങൾ ആരംഭിച്ചു.', 'Forty new study circles have begun this year.') },
    { slug: 'statement-on-womens-education', type: 'statement', cover: a.news4, days: -6,
      title: ml('സ്ത്രീ വിദ്യാഭ്യാസത്തെക്കുറിച്ചുള്ള പ്രസ്താവന', "Statement on Women's Education"),
      excerpt: ml('പെൺകുട്ടികളുടെ ഉന്നത വിദ്യാഭ്യാസം ഉറപ്പാക്കണമെന്ന് വനിതാ വിഭാഗം.', "The Women's Wing calls for guaranteed higher education for girls.") },
    { slug: 'interview-with-the-president', type: 'interview', cover: a.news5, days: -13,
      title: ml('അധ്യക്ഷയുമായുള്ള അഭിമുഖം', 'Interview with the President'),
      excerpt: ml('പ്രസ്ഥാനത്തിന്റെ ഭാവി പദ്ധതികളെക്കുറിച്ച് സംസാരിക്കുന്നു.', 'Speaking about the movement\'s plans for the years ahead.') },
    { slug: 'inaugural-address-state-conference', type: 'speech', cover: a.news6, days: -21,
      title: ml('സമ്മേളന ഉദ്ഘാടന പ്രഭാഷണം', 'Inaugural Address at the State Conference'),
      excerpt: ml('സമ്മേളനത്തിന്റെ ഉദ്ഘാടന പ്രഭാഷണത്തിന്റെ പൂർണ്ണ രൂപം.', 'The full text of the inaugural address.') },
    { slug: 'press-meet-on-social-welfare', type: 'press-release', cover: a.news7, days: -30,
      title: ml('സാമൂഹ്യക്ഷേമത്തെക്കുറിച്ച് പത്രസമ്മേളനം', 'Press Meet on Social Welfare'),
      excerpt: ml('പുതിയ ക്ഷേമ പദ്ധതികൾ പ്രഖ്യാപിച്ചു.', 'New welfare initiatives were announced.') },
  ];
  for (const p of posts) {
    await MediaPost.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          slug: p.slug,
          type: p.type,
          title: p.title,
          excerpt: p.excerpt,
          body: {
            ml: `<p>${p.excerpt.ml}</p><p>പ്രവർത്തകരും പൊതുജനങ്ങളും ഒരുപോലെ പങ്കെടുത്ത പരിപാടിയിൽ വിവിധ സെഷനുകൾ നടന്നു. വിശദമായ റിപ്പോർട്ട് ഉടൻ പ്രസിദ്ധീകരിക്കും.</p>`,
            en: `<p>${p.excerpt.en}</p><p>The programme brought together workers and members of the public across several sessions. A detailed report will follow shortly.</p>`,
          },
          coverImage: p.cover,
          author: ml('വാർത്താ വിഭാഗം', 'Media Desk'),
          tags: ['demo'],
          publishedAt: daysFromNow(p.days),
          featured: Boolean(p.featured),
        },
      },
      UPSERT
    );
  }
  console.log(`[demo] ${posts.length} media posts`);

  /* Videos and podcasts */
  const videos = [
    { kind: 'video', order: 0, featured: true, thumbnailUrl: a.video1, durationLabel: '4:12',
      title: ml('വിശ്വാസം പുതുക്കുക', 'Renew Your Faith'),
      description: ml('അല്ലാഹുവുമായുള്ള ബന്ധം ശക്തിപ്പെടുത്താനുള്ള ഓർമ്മപ്പെടുത്തൽ.', 'A reminder to strengthen our connection with Allah and live a purposeful life.') },
    { kind: 'video', order: 1, featured: true, thumbnailUrl: a.video2, durationLabel: '8:40',
      title: ml('സ്ത്രീകളും സമൂഹനിർമ്മാണവും', 'Women and Community Building'),
      description: ml('സമൂഹനിർമ്മാണത്തിൽ സ്ത്രീകളുടെ പങ്ക്.', 'The role of women in building strong communities.') },
    { kind: 'podcast', order: 0, thumbnailUrl: a.video3, durationLabel: '22:05',
      title: ml('മാറ്റത്തിന്റെ ശബ്ദങ്ങൾ — എപ്പിസോഡ് 1', 'Voices of Change — Episode 1'),
      description: ml('പ്രവർത്തകരുമായുള്ള സംഭാഷണ പരമ്പര.', 'A conversation series with workers in the field.') },
  ];
  for (const v of videos) {
    await VideoItem.findOneAndUpdate(
      { 'title.en': v.title.en },
      { $set: { ...v, youtubeUrl: DEMO_VIDEO, publishedAt: daysFromNow(-10) } },
      UPSERT
    );
  }
  console.log(`[demo] ${videos.length} videos and podcasts`);

  /* Publications */
  const publications = [
    { slug: 'woman-in-islam', type: 'book', cover: a.pub1, pages: 220, order: 0, featured: true,
      title: ml('ഇസ്‌ലാമിലെ സ്ത്രീ', 'Woman in Islam'),
      author: ml('ഡോ. ആയിഷ റഹ്‌മാൻ', 'Dr. Ayisha Rahman') },
    { slug: 'family-and-society', type: 'book', cover: a.pub2, pages: 180, order: 1,
      title: ml('കുടുംബവും സമൂഹവും', 'Family and Society'),
      author: ml('സുഹ്‌റ കെ.ടി', 'Suhra K.T') },
    { slug: 'rights-and-responsibilities', type: 'booklet', cover: a.pub3, pages: 48, order: 2,
      title: ml('അവകാശങ്ങളും ഉത്തരവാദിത്തങ്ങളും', 'Rights and Responsibilities'),
      author: ml('വനിതാ വിഭാഗം', "Women's Wing") },
    { slug: 'education-for-all', type: 'article', cover: a.pub4, order: 3,
      title: ml('എല്ലാവർക്കും വിദ്യാഭ്യാസം', 'Education for All'),
      author: ml('ഖദീജ എം', 'Khadeeja M') },
  ];
  for (const p of publications) {
    await Publication.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          slug: p.slug,
          type: p.type,
          title: p.title,
          author: p.author,
          publisher: ml('വനിതാ വിഭാഗം പ്രസിദ്ധീകരണം', "Women's Wing Publications"),
          description: {
            ml: 'ഈ പ്രസിദ്ധീകരണം പ്രസ്ഥാനത്തിന്റെ കാഴ്ചപ്പാട് വിശദമാക്കുന്നു. ഡെമോ ഉള്ളടക്കം — യഥാർത്ഥ വിവരണം അഡ്മിൻ പാനലിൽ നിന്ന് ചേർക്കുക.',
            en: 'This publication sets out the movement\'s perspective. Demo content — replace the description from the admin panel.',
          },
          body: {
            ml: '<p>ഉള്ളടക്കത്തിന്റെ വിശദമായ രൂപം ഇവിടെ ചേർക്കാം.</p>',
            en: '<p>The full text of the article can be placed here.</p>',
          },
          coverImage: p.cover,
          fileUrl: a.docReport,
          pages: p.pages,
          language: 'ml',
          order: p.order,
          featured: Boolean(p.featured),
          publishedAt: daysFromNow(-90),
        },
      },
      UPSERT
    );
  }
  console.log(`[demo] ${publications.length} publications`);

  /* Photo albums */
  const albums = [
    { slug: 'state-conference-2025', cover: a.album1, order: 0,
      title: ml('സംസ്ഥാന സമ്മേളനം 2025', 'State Conference 2025'),
      items: galleryFrom([a.album1, a.slide1, a.news1, a.event1, a.leaderPast1, a.deptWings],
        [ml('ഉദ്ഘാടനം', 'Inauguration'), ml('സദസ്സ്', 'The gathering'), ml('പ്രഭാഷണം', 'Address'), ml('പോസ്റ്റർ', 'Poster'), ml('ഭരണസമിതി', 'Council'), ml('വിംഗ്സ്', 'WINGS')]) },
    { slug: 'relief-distribution', cover: a.album2, order: 1,
      title: ml('ദുരിതാശ്വാസ വിതരണം', 'Relief Distribution'),
      items: galleryFrom([a.album2, a.news2, a.campaign2, a.deptForHer],
        [ml('വിതരണം', 'Distribution'), ml('സഹായം', 'Support'), ml('കാമ്പയിൻ', 'Campaign'), ml('സന്നദ്ധപ്രവർത്തകർ', 'Volunteers')]) },
    { slug: 'annual-study-camp', cover: a.album3, order: 2,
      title: ml('വാർഷിക പഠന ക്യാമ്പ്', 'Annual Study Camp'),
      items: galleryFrom([a.album3, a.event3, a.deptThamheed, a.slide2, a.video2],
        [ml('ക്യാമ്പ്', 'Camp'), ml('സെഷൻ', 'Session'), ml('പഠനവൃത്തം', 'Study circle'), ml('ചർച്ച', 'Discussion'), ml('സമാപനം', 'Closing')]) },
  ];
  for (const al of albums) {
    await Album.findOneAndUpdate(
      { slug: al.slug },
      {
        $set: {
          slug: al.slug,
          title: al.title,
          description: ml('ഡെമോ ആൽബം — യഥാർത്ഥ ചിത്രങ്ങൾ അഡ്മിൻ പാനലിൽ നിന്ന് ചേർക്കുക.', 'Demo album — upload the real photographs from the admin panel.'),
          coverImage: al.cover,
          eventDate: daysFromNow(-45),
          items: al.items,
          order: al.order,
        },
      },
      UPSERT
    );
  }
  console.log(`[demo] ${albums.length} albums`);

  /* Downloads */
  const downloads = [
    { title: ml('ഭരണഘടന', 'Constitution'), category: 'constitution', fileUrl: a.docConstitution, mimeType: 'application/pdf', order: 0,
      description: ml('സംഘടനയുടെ ഭരണഘടനയുടെ പൂർണ്ണ രൂപം.', 'The full text of the organisation\'s constitution.') },
    { title: ml('വാർഷിക റിപ്പോർട്ട് 2025', 'Annual Report 2025'), category: 'report', fileUrl: a.docReport, mimeType: 'application/pdf', order: 1,
      description: ml('കഴിഞ്ഞ വർഷത്തെ പ്രവർത്തന റിപ്പോർട്ട്.', 'A report of last year\'s activities.') },
    { title: ml('അംഗത്വ ഫോറം', 'Membership Form'), category: 'form', fileUrl: a.docForm, mimeType: 'application/pdf', order: 2,
      description: ml('അംഗത്വത്തിനുള്ള അപേക്ഷാ ഫോറം.', 'Application form for membership.') },
    { title: ml('കാമ്പയിൻ പോസ്റ്റർ', 'Campaign Poster'), category: 'poster', fileUrl: a.downloadPoster, thumbnailUrl: a.downloadPoster, mimeType: 'image/webp', order: 3,
      description: ml('പ്രചാരണത്തിനായി ഉപയോഗിക്കാവുന്ന പോസ്റ്റർ.', 'A poster you can share for the campaign.') },
  ];
  for (const d of downloads) {
    await DownloadItem.findOneAndUpdate({ 'title.en': d.title.en }, { $set: d }, UPSERT);
  }
  console.log(`[demo] ${downloads.length} downloads`);

  /* Campaigns */
  const campaigns = [
    { slug: 'read-one-book-a-month', cover: a.campaign1, order: 0, featured: true, hashtag: '#ReadEveryMonth',
      title: ml('മാസത്തിൽ ഒരു പുസ്തകം', 'Read One Book a Month'),
      summary: ml('വായനാ ശീലം വളർത്താനുള്ള വർഷം മുഴുവൻ നീളുന്ന കാമ്പയിൻ.', 'A year-long campaign to build the habit of reading.') },
    { slug: 'clean-neighbourhood-drive', cover: a.campaign2, order: 1, hashtag: '#SafaNagar',
      title: ml('ശുചിത്വ അയൽപക്കം', 'Clean Neighbourhood Drive'),
      summary: ml('ശുചിത്വവും പരിസ്ഥിതി സംരക്ഷണവും ലക്ഷ്യമിടുന്ന കാമ്പയിൻ.', 'A campaign for cleanliness and care of the environment.') },
  ];
  for (const c of campaigns) {
    await Campaign.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          slug: c.slug,
          title: c.title,
          summary: c.summary,
          body: {
            ml: `<p>${c.summary.ml}</p><p>പ്രാദേശിക യൂണിറ്റുകൾ വഴിയാണ് കാമ്പയിൻ നടപ്പാക്കുന്നത്. പങ്കെടുക്കാൻ അടുത്തുള്ള യൂണിറ്റുമായി ബന്ധപ്പെടുക.</p>`,
            en: `<p>${c.summary.en}</p><p>The campaign runs through local units. Contact the unit nearest to you to take part.</p>`,
          },
          coverImage: c.cover,
          posterImage: c.cover,
          hashtag: c.hashtag,
          startDate: daysFromNow(-20),
          endDate: daysFromNow(160),
          order: c.order,
          featured: Boolean(c.featured),
          gallery: galleryFrom([c.cover], [ml('കാമ്പയിൻ', 'Campaign')]),
        },
      },
      UPSERT
    );
  }
  console.log(`[demo] ${campaigns.length} campaigns`);
}

/* ────────────────────────────── clearing ────────────────────────────── */

async function clear() {
  const results = await Promise.all([
    Slider.deleteMany({ imageUrl: /\/org\/demo\// }),
    Campaign.deleteMany({ slug: { $in: ['read-one-book-a-month', 'clean-neighbourhood-drive'] } }),
    Leader.deleteMany({ photo: /\/org\/demo\// }),
    Leader.deleteMany({ posterImage: /\/org\/demo\// }),
    OrgEvent.deleteMany({ slug: { $in: ['state-womens-conference-2026', 'family-counselling-workshop', 'annual-study-camp-2025'] } }),
    MediaPost.deleteMany({ tags: 'demo' }),
    VideoItem.deleteMany({ thumbnailUrl: /\/org\/demo\// }),
    Publication.deleteMany({ slug: { $in: ['woman-in-islam', 'family-and-society', 'rights-and-responsibilities', 'education-for-all'] } }),
    Album.deleteMany({ slug: { $in: ['state-conference-2025', 'relief-distribution', 'annual-study-camp'] } }),
    DownloadItem.deleteMany({ fileUrl: /\/org\/demo\// }),
  ]);
  const removed = results.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
  console.log(`[demo] removed ${removed} demo records`);
  console.log('[demo] note: images stay in Spaces under org/demo/ — delete them there if you want them gone');
}

/* ────────────────────────────────────────────────────────────────────── */

(async () => {
  try {
    await connectDB();
    if (process.argv.includes('--clear')) {
      await clear();
    } else {
      const assets = await buildAssets();
      await seed(assets);
      console.log('[demo] done — open the site and browse every section');
    }
    await mongoose.connection.close();
  } catch (err) {
    console.error('[demo] failed:', err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
})();
