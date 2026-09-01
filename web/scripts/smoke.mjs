/**
 * Headless walkthrough: mounts every route in jsdom against the live API and
 * reports React errors, failed requests and pages that never render content.
 *
 *   node scripts/smoke.mjs
 */
import { JSDOM } from 'jsdom';

const API = process.env.VITE_API_URL || 'http://localhost:4998';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:4000/',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
dom.window.scrollTo = () => {};
dom.window.scroll = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
globalThis.scrollTo = () => {};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = false;
if (!dom.window.matchMedia) {
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

// Capture anything React or the app complains about
const problems = [];
const origError = console.error;
const origWarn = console.warn;
console.error = (...args) => {
  problems.push(String(args[0]).slice(0, 300));
  origError(...args);
};
console.warn = (...args) => {
  const msg = String(args[0]);
  if (!/React Router Future Flag/i.test(msg)) problems.push(msg.slice(0, 300));
};

const failedRequests = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const res = await realFetch(input, init);
  if (!res.ok) failedRequests.push(`${res.status} ${String(input).replace(API, '')}`);
  return res;
};

const { mount } = await import('../.smoke/smoke-entry.js');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function render(path, expect) {
  const el = document.getElementById('root');
  const root = mount(el, path);

  let text = '';
  for (let i = 0; i < 60; i++) {
    await wait(100);
    text = el.textContent || '';
    if (expect.every((needle) => text.includes(needle))) break;
  }

  const matched = expect.filter((needle) => text.includes(needle));
  root.unmount();
  await wait(20);

  return {
    path,
    chars: text.length,
    matched: matched.length,
    total: expect.length,
    missing: expect.filter((n) => !text.includes(n)),
  };
}

const ROUTES = [
  ['/ml', ['ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ്', 'അധ്യക്ഷയുടെ സന്ദേശം', 'വിദ്യാഭ്യാസം']],
  ['/en', ['Jamaat e Islami Hind', "President's Message", 'Education', 'Latest News']],
  ['/en/who-we-are', ['Who We Are', 'Ideology', 'Our Values']],
  ['/en/who-we-are/ideology', ['Ideology', 'Our Foundation']],
  ['/en/who-we-are/constitution', ['Constitution', 'Downloads']],
  ['/en/departments', ['Departments', "Thamheedul Mar'a", 'WINGS']],
  ['/en/departments/thamheedul-mara', ["Thamheedul Mar'a", 'Objectives', 'Activities', 'Leadership']],
  ['/en/programs', ['Programmes', 'Women Entrepreneurs Summit', 'Proficia']],
  ['/en/programs/wes', ['Women Entrepreneurs Summit', 'Overview', 'Schedule']],
  ['/en/leaders', ['Leaders', 'Current Leadership', 'Sajida P.T.P', 'Past Leadership']],
  ['/en/events', ['Events', "State Women's Conference 2026"]],
  ['/en/events/state-womens-conference-2026', ["State Women's Conference", 'Venue', 'Speakers', 'Register']],
  ['/en/events/annual-study-camp-2025', ['Annual Study Camp 2025', 'Gallery']],
  ['/en/media/news', ['News', 'Leadership Seminar Concludes']],
  ['/en/media/news/leadership-seminar-concludes', ['Leadership Seminar Concludes', 'Published']],
  ['/en/media/statement', ['Statements', "Statement on Women's Education"]],
  ['/en/media/interview', ['Interviews', 'Interview with the President']],
  ['/en/media/speech', ['Speeches', 'Inaugural Address']],
  ['/en/media/press-release', ['Press Releases', 'Press Meet on Social Welfare']],
  ['/en/media/videos', ['Videos', 'Renew Your Faith']],
  ['/en/media/podcasts', ['Podcasts', 'Voices of Change']],
  ['/en/media/gallery', ['Photo Gallery', 'State Conference 2025']],
  ['/en/media/gallery/state-conference-2025', ['State Conference 2025']],
  ['/en/media/downloads', ['Downloads', 'Constitution', 'Membership Form']],
  ['/en/publications', ['Publications', 'Woman in Islam']],
  ['/en/publications/woman-in-islam', ['Woman in Islam', 'Author']],
  ['/en/campaigns/read-one-book-a-month', ['Read One Book a Month']],
  ['/en/links', ['External Links', 'Aramam Magazine']],
  ['/en/contact', ['Contact Us', 'Write to us', 'Office Address']],
  ['/en/search?q=conference', ['Search results']],
  ['/en/no-such-page', ['Page not found']],
  ['/en/events/does-not-exist', ['Page not found']],
];

console.log(`\nWalking ${ROUTES.length} routes against ${API}\n`);

let ok = 0;
const weak = [];
for (const [path, expect] of ROUTES) {
  const r = await render(path, expect);
  const pass = r.missing.length === 0;
  if (pass) ok++;
  else weak.push(r);
  console.log(
    `  ${pass ? 'ok  ' : 'MISS'}  ${path.padEnd(46)} ${String(r.chars).padStart(5)} chars  ${r.matched}/${r.total}`
  );
}

console.log(`\n${ok}/${ROUTES.length} routes rendered everything expected`);

/* ── Header lockup regression check ──────────────────────────────────────
   The uploaded logo is the parent organisation's Malayalam mark. Printing
   "Jamaat e Islami Hind" beside it duplicated the name and overflowed the
   row, which pushed nav items on top of the logo and the actions. */
const layout = [];
{
  const el = document.getElementById('root');
  const root = mount(el, '/en');
  for (let i = 0; i < 50; i++) {
    await wait(100);
    if ((el.textContent || '').includes('Latest News')) break;
  }

  const header = el.querySelector('header');
  const headerText = header ? header.textContent || '' : '';
  const hasLogoImage = Boolean(header && header.querySelector('img'));
  const dupes = (headerText.match(/Jamaat e Islami Hind/g) || []).length;
  const wingShown = /Women's Wing/.test(headerText);
  const navItems = el.querySelectorAll('header nav > a, header nav > div').length;

  layout.push(['logo rendered as an image', hasLogoImage]);
  layout.push(['organisation name not repeated beside it', dupes === 0]);
  layout.push(['wing name still shown', wingShown]);
  layout.push(['all 7 nav items present', navItems === 7]);

  root.unmount();
  await wait(20);
}

console.log('\nHeader lockup:');
for (const [label, pass] of layout) console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label}`);
const layoutOk = layout.every(([, pass]) => pass);

if (weak.length) {
  console.log('\nMissing content:');
  for (const w of weak) console.log(`  ${w.path} -> ${w.missing.join(' | ')}`);
}

const realProblems = problems.filter(
  (p) => !/not wrapped in act|useLayoutEffect does nothing on the server/i.test(p)
);
console.log(`\nConsole errors/warnings: ${realProblems.length}`);
for (const p of [...new Set(realProblems)].slice(0, 12)) console.log('  -', p);

console.log(`Failed API requests: ${failedRequests.length}`);
for (const f of [...new Set(failedRequests)].slice(0, 12)) console.log('  -', f);

console.log('');
process.exit(weak.length || realProblems.length || !layoutOk ? 1 : 0);
