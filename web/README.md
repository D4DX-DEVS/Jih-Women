# Women's Wing — Jamaat-e-Islami Kerala

Official organisation website. Vite + React 19 + TypeScript + Tailwind CSS, consuming the
shared Express/MongoDB backend in [`../backend`](../backend).

## Running locally

```bash
npm install
cp .env.example .env      # set VITE_API_URL to the backend URL
npm run dev               # http://localhost:4000
```

The backend must be running (`cd ../backend && npm run dev`) and its `CLIENT_ORIGIN`
must include `http://localhost:4000`.

To populate the baseline structure (Who We Are pages, departments, programmes,
external links) run once:

```bash
cd ../backend && npm run seed:org
```

## Languages

Malayalam is the primary language and the default; English is optional and falls back to
Malayalam when a field is left blank. Every route is language-prefixed:

```
/ml            /en            → home
/ml/events     /en/events     → events
```

`/` redirects to `/ml`. The language switcher in the header swaps the prefix and keeps
the rest of the path.

## Structure

```
src/
  lib/
    api.ts        fetch helpers + useApi hook
    i18n.ts       UI string dictionary, bilingual field reader
    format.ts     dates, file sizes, YouTube URL parsing
    site.tsx      SiteProvider — settings, nav, active language, path() helper
    types.ts      API response types
  components/
    Layout.tsx    header + footer shell
    Header.tsx    navigation, language switcher, search
    Footer.tsx    contact, quick links, social
    Primitives.tsx  Container, Section, Button, PageHeader, Loading, Pagination…
    Cards.tsx     post/event/campaign/leader/album/publication cards, lightbox
  pages/          one file per route group
```

## Home page composition

The home page is assembled from these admin-managed pieces, in order. Each can be
switched off under **Site Settings → Home page sections** without deleting content.

| Section | Managed in |
| --- | --- |
| Announcement bar (tagline + socials) | Site Settings → Identity / Social media |
| Hero slider | Home Slider |
| Programme banner strip | Programmes → *Home page banner* (wide ~3:1 artwork) |
| President's message | Site Settings → President's message |
| Focus areas (icon strip) | Focus Areas |
| Latest news · Upcoming events · Featured video | News & Statements, Events, Videos |
| Campaigns, Featured articles, Publications | their own collections |
| Newsletter signup (footer) | Inbox → Newsletter |

Slide headlines support inline highlighting: wrap words in asterisks and they render
in magenta — `Building a *Better Society*`.

Programmes only appear in the banner strip once a **Home page banner** image is
uploaded, so the strip stays empty rather than showing broken artwork.

## Design system

| Token | Value | Used for |
| --- | --- | --- |
| `plum-800` | `#2C0A4D` | announcement bar, footer, hero wash, headings |
| `magenta-500` | `#E6187E` | primary buttons, accents, active nav |
| `mist` | `#FAF7FC` | page background |
| `ink` | `#241436` | body text |

Type: **Playfair Display** for display headings, **Poppins** for UI, **Anek Malayalam**
for Malayalam (it inherits automatically wherever Latin faces have no Malayalam glyphs).

## Content management

Everything on this site is edited from the admin console (`../app` → `/admin` →
**Organisation Site** workspace). No content is hardcoded.

## Deployment

`netlify.toml` is configured for Netlify with an SPA redirect. Set `VITE_API_URL`
in the hosting dashboard to the deployed backend URL.
