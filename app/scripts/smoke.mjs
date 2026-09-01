/**
 * Headless walkthrough of the admin console: signs in, opens every section of
 * both workspaces and reports React errors, failed requests and blank screens.
 *
 *   ADMIN_USERNAME=… ADMIN_PASSWORD=… node scripts/smoke.mjs
 */
import { JSDOM } from 'jsdom';

const API = process.env.VITE_API_URL || 'http://localhost:4998';
const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/admin',
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
globalThis.FormData = dom.window.FormData;
globalThis.localStorage = dom.window.localStorage;
globalThis.getComputedStyle = dom.window.getComputedStyle;
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
globalThis.scrollTo = () => {};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = clearTimeout;

const problems = [];
const origError = console.error;
console.error = (...args) => {
  problems.push(String(args[0]).slice(0, 300));
  origError(...args);
};
console.warn = (...args) => problems.push(String(args[0]).slice(0, 300));

const failedRequests = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const res = await realFetch(input, init);
  if (!res.ok) failedRequests.push(`${res.status} ${String(input).replace(API, '')}`);
  return res;
};

// Sign in the way the panel does, then hand the token to the app
const login = await realFetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: USER, password: PASS }),
});
if (!login.ok) {
  console.log('could not sign in — check ADMIN_USERNAME / ADMIN_PASSWORD');
  process.exit(1);
}
const { token } = await login.json();

const { mount } = await import('../.smoke/smoke-entry.js');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(workspace, section, expect) {
  dom.window.localStorage.setItem('wes_admin_token', token);
  dom.window.localStorage.setItem('admin_workspace', workspace);
  dom.window.localStorage.setItem('org_admin_section', section);

  const el = document.getElementById('root');
  const root = mount(el);

  let text = '';
  for (let i = 0; i < 60; i++) {
    await wait(100);
    text = el.textContent || '';
    if (expect.every((n) => text.includes(n))) break;
  }

  root.unmount();
  await wait(20);
  return { section, chars: text.length, missing: expect.filter((n) => !text.includes(n)) };
}

const SECTIONS = [
  ['overview', ['Organisation Website', 'Content', 'Focus areas']],
  ['site-settings', ['Site Settings', 'Identity', "President's message", 'Home page sections']],
  ['sliders', ['Home Slider', 'Status', 'Published']],
  ['focus-areas', ['Focus Areas', 'Education', 'Empowerment']],
  ['campaigns', ['Campaigns', 'Read One Book a Month']],
  ['pages', ['Pages', 'Ideology', 'Our Values']],
  ['departments', ['Departments', "Thamheedul Mar'a", 'WINGS']],
  ['programs', ['Programmes', 'Women Entrepreneurs Summit']],
  ['leaders', ['Leaders', 'Sajida P.T.P']],
  ['events', ['Events', "State Women's Conference 2026"]],
  ['event-rsvps', ['Event Registrations', 'Export Excel']],
  ['media-posts', ['News & Statements', 'Leadership Seminar Concludes']],
  ['videos', ['Videos & Podcasts', 'Renew Your Faith']],
  ['albums', ['Photo Gallery', 'State Conference 2025']],
  ['downloads', ['Downloads', 'Constitution']],
  ['publications', ['Publications', 'Woman in Islam']],
  ['external-links', ['External Links', 'Aramam Magazine']],
  ['contact', ['Contact Messages', 'Export Excel']],
  ['newsletter', ['Newsletter', 'Export Excel']],
];

console.log(`\nOpening ${SECTIONS.length + 1} admin screens against ${API}\n`);

let ok = 0;
const weak = [];
for (const [section, expect] of SECTIONS) {
  const r = await open('org', section, expect);
  const pass = r.missing.length === 0;
  if (pass) ok++;
  else weak.push(r);
  console.log(`  ${pass ? 'ok  ' : 'MISS'}  org / ${section.padEnd(20)} ${String(r.chars).padStart(5)} chars`);
}

/* ── Create/edit forms ───────────────────────────────────────────────── */

function clickByText(el, tag, text) {
  const nodes = [...el.querySelectorAll(tag)];
  const hit = nodes.find((n) => (n.textContent || '').trim().toLowerCase().includes(text.toLowerCase()));
  if (hit) hit.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  return Boolean(hit);
}

async function openForm(section, expectLabels) {
  dom.window.localStorage.setItem('wes_admin_token', token);
  dom.window.localStorage.setItem('admin_workspace', 'org');
  dom.window.localStorage.setItem('org_admin_section', section);

  const el = document.getElementById('root');
  const root = mount(el);

  // wait for the list, then press "New"
  for (let i = 0; i < 50; i++) {
    await wait(100);
    if ((el.textContent || '').includes('New ')) break;
  }
  clickByText(el, 'button', 'New ');

  let text = '';
  for (let i = 0; i < 40; i++) {
    await wait(100);
    text = el.textContent || '';
    if (text.includes('Fields marked')) break;
  }

  const openedOk = text.includes('Fields marked');
  const labelsFound = expectLabels.filter((l) => text.includes(l));
  const requiredStars = el.querySelectorAll('.field-req').length;
  const inputs = el.querySelectorAll('input, textarea, select').length;

  // Save with nothing filled in — the panel should explain what is missing
  let validation = '';
  if (openedOk) {
    clickByText(el, 'button', 'Save');
    for (let i = 0; i < 25; i++) {
      await wait(100);
      const t = el.textContent || '';
      const m = t.match(/(Please fill in [^.]{3,120}?\.|[A-Z][A-Za-z ()]{2,60} is required\.)/);
      if (m) {
        validation = m[1];
        break;
      }
    }
  }

  root.unmount();
  await wait(20);
  return { section, openedOk, labelsFound, expectLabels, requiredStars, inputs, validation };
}

const FORMS = [
  ['sliders', ['Slide image', 'Headline', 'Primary button']],
  ['focus-areas', ['Title', 'Description', 'Icon']],
  ['events', ['Event title', 'Start date', 'Venue', 'Registration']],
  ['media-posts', ['Type', 'Title', 'Excerpt', 'Body']],
  ['downloads', ['Title', 'Category', 'File']],
  ['external-links', ['Title', 'Link']],
];

console.log('\nOpening create forms\n');
let formsOk = 0;
for (const [section, labels] of FORMS) {
  const r = await openForm(section, labels);
  const pass = r.openedOk && r.labelsFound.length === r.expectLabels.length && r.requiredStars > 0 && r.validation;
  if (pass) formsOk++;
  console.log(
    `  ${pass ? 'ok  ' : 'MISS'}  ${section.padEnd(16)} ${String(r.inputs).padStart(3)} inputs  ` +
      `${r.requiredStars} required marks  labels ${r.labelsFound.length}/${r.expectLabels.length}`
  );
  console.log(`         validation: ${r.validation || '(none shown)'}`);
}
console.log(`\n${formsOk}/${FORMS.length} forms opened, starred required fields and explained what was missing`);

const wes = await open('wes', 'overview', ['Registrations & Attendance', 'Payment QR', 'Check-ins', 'Gallery']);
const wesPass = wes.missing.length === 0;
if (wesPass) ok++;
else weak.push({ ...wes, section: 'wes workspace' });
console.log(`  ${wesPass ? 'ok  ' : 'MISS'}  wes / dashboard          ${String(wes.chars).padStart(5)} chars`);

console.log(`\n${ok}/${SECTIONS.length + 1} admin screens rendered everything expected`);
if (weak.length) {
  console.log('\nMissing content:');
  for (const w of weak) console.log(`  ${w.section} -> ${w.missing.join(' | ')}`);
}

const real = problems.filter((p) => !/not wrapped in act|useLayoutEffect does nothing/i.test(p));
console.log(`\nConsole errors/warnings: ${real.length}`);
for (const p of [...new Set(real)].slice(0, 12)) console.log('  -', p);
console.log(`Failed API requests: ${failedRequests.length}`);
for (const f of [...new Set(failedRequests)].slice(0, 12)) console.log('  -', f);
console.log('');
process.exit(weak.length || real.length || formsOk !== FORMS.length ? 1 : 0);
