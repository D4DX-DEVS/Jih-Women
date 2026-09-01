import { useState } from 'react';
import { Link } from 'react-router';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import { apiPost } from '../lib/api';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import { whatsappHref } from '../lib/format';
import { Container } from './Primitives';

export default function Footer() {
  const { lang, data, path, s } = useSite();
  const settings = data?.settings;
  const departments = data?.nav.departments ?? [];

  const socials = [
    { href: settings?.social?.facebook, Icon: Facebook, label: 'Facebook' },
    { href: settings?.social?.instagram, Icon: Instagram, label: 'Instagram' },
    { href: settings?.social?.youtube, Icon: Youtube, label: 'YouTube' },
    { href: settings?.social?.twitter, Icon: Twitter, label: 'X' },
    { href: settings?.social?.whatsappChannel, Icon: MessageCircle, label: 'WhatsApp' },
    { href: settings?.email ? `mailto:${settings.email}` : '', Icon: Mail, label: 'Email' },
  ].filter((x) => Boolean(x.href));

  const quickLinks = [
    { label: s('aboutUs'), to: path('/who-we-are') },
    { label: s('visionMission'), to: path('/who-we-are/ideology') },
    { label: s('departments'), to: path('/departments') },
    { label: s('programs'), to: path('/programs') },
    { label: s('events'), to: path('/events') },
    { label: s('mediaNews'), to: path('/media/news') },
    { label: s('photoGallery'), to: path('/media/gallery') },
    { label: s('contact'), to: path('/contact') },
  ];

  return (
    <footer className="relative overflow-hidden bg-plum-800 text-white/70">
      <div className="leaf-watermark pointer-events-none absolute inset-0" />
      <span className="pointer-events-none absolute -end-28 top-10 h-72 w-72 rounded-full bg-magenta-500/15 blur-3xl" />

      <Container className="relative py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to={path('/')}
              className="flex items-center gap-3"
              aria-label={t(settings?.siteName, lang) || "Women's Wing Kerala"}
            >
              {settings?.logoUrl ? (
                /* The mark is dark ink, so it needs a light plate on the deep
                   footer. The wing name sits beside it, as in the header. */
                <>
                  <img
                    src={settings.logoUrl}
                    alt=""
                    className="h-12 w-auto max-w-[190px] shrink-0 rounded-lg bg-white/95 object-contain object-left px-2.5 py-2"
                  />
                  <span className="leading-[1.3]">
                    <span className="block whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.15em] text-magenta-300">
                      {lang === 'ml' ? 'വനിതാ വിഭാഗം' : "Women's Wing"}
                    </span>
                    <span className="block whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/55">
                      {lang === 'ml' ? 'കേരള' : 'Kerala'}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10">
                    <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
                      <path
                        d="M32 12c-5 6-9 9.5-9 15v18h18V27c0-5.5-4-9-9-15z"
                        fill="none"
                        stroke="#F49BC6"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />
                      <path d="M20 30v15M44 30v15" stroke="#F49BC6" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-[14px] font-bold uppercase tracking-wide text-white">
                      {lang === 'ml' ? 'ജമാഅത്തെ ഇസ്‌ലാമി ഹിന്ദ്' : 'Jamaat e Islami Hind'}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-magenta-300">
                      {lang === 'ml' ? 'വനിതാ വിഭാഗം കേരള' : "Women's Wing Kerala"}
                    </span>
                  </span>
                </>
              )}
            </Link>

            <p className="mt-5 text-[13.5px] leading-relaxed">
              {t(settings?.footerNote, lang) ||
                (lang === 'ml'
                  ? 'പുരോഗമനപരവും നീതിപൂർവകവുമായ ഒരു സമൂഹത്തിനായി മുസ്‌ലിം സ്ത്രീകളുടെ ശാക്തീകരണവും സമഗ്ര വികസനവും ലക്ഷ്യമിടുന്നു.'
                  : 'Working towards the empowerment and holistic development of Muslim women for a progressive and just society.')}
            </p>

            {socials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socials.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-magenta-500 hover:text-white"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterColumn title={s('quickLinks')}>
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition hover:text-magenta-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={s('departments')}>
            {departments.length > 0 ? (
              departments.map((d) => (
                <li key={d._id}>
                  <Link to={path(`/departments/${d.slug}`)} className="transition hover:text-magenta-300">
                    {t(d.title, lang)}
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <Link to={path('/departments')} className="transition hover:text-magenta-300">
                  {s('departments')}
                </Link>
              </li>
            )}
          </FooterColumn>

          <FooterColumn title={s('contact')}>
            {settings?.phone && (
              <li className="flex gap-3">
                <Phone size={15} className="mt-1 shrink-0 text-magenta-300" />
                <a href={`tel:${settings.phone}`} className="transition hover:text-magenta-300">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.whatsapp && (
              <li className="flex gap-3">
                <MessageCircle size={15} className="mt-1 shrink-0 text-magenta-300" />
                <a
                  href={whatsappHref(settings.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-magenta-300"
                >
                  {settings.whatsapp}
                </a>
              </li>
            )}
            {settings?.email && (
              <li className="flex gap-3">
                <Mail size={15} className="mt-1 shrink-0 text-magenta-300" />
                <a href={`mailto:${settings.email}`} className="break-all transition hover:text-magenta-300">
                  {settings.email}
                </a>
              </li>
            )}
            {t(settings?.address, lang) && (
              <li className="flex gap-3">
                <MapPin size={15} className="mt-1 shrink-0 text-magenta-300" />
                <span className="whitespace-pre-line leading-relaxed">
                  {t(settings?.address, lang)}
                </span>
              </li>
            )}
          </FooterColumn>

          {settings?.sections?.newsletter !== false && (
            <div>
              <FooterHeading>{s('newsletter')}</FooterHeading>
              <p className="mb-4 text-[13.5px] leading-relaxed">{s('newsletterBlurb')}</p>
              <NewsletterForm />
            </div>
          )}
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-[12.5px] text-white/50 md:flex-row">
          <span>
            © {new Date().getFullYear()} {t(settings?.siteName, lang)}. {s('allRightsReserved')}.
          </span>
          <div className="flex items-center gap-5">
            <Link to={path('/who-we-are')} className="transition hover:text-white">
              {s('privacyPolicy')}
            </Link>
            <span className="opacity-30">|</span>
            <Link to={path('/who-we-are')} className="transition hover:text-white">
              {s('termsConditions')}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
      {children}
      <span className="mt-2 block h-0.5 w-8 rounded-full bg-magenta-500" />
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className="space-y-2.5 text-[13.5px]">{children}</ul>
    </div>
  );
}

function NewsletterForm() {
  const { s } = useSite();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await apiPost('/api/site/newsletter', { email });
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (status === 'done') {
    return (
      <p className="rounded-2xl border border-magenta-400/40 bg-magenta-500/10 px-4 py-3 text-[13px] text-magenta-200">
        {s('subscribed')}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={s('enterYourEmail')}
        className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-white/40 focus:border-magenta-400"
      />
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-xl bg-magenta-500 px-5 py-2.5 text-[13.5px] font-medium text-white transition hover:bg-magenta-600 disabled:opacity-60"
      >
        {status === 'sending' ? s('sending') : s('subscribe')}
      </button>
    </form>
  );
}
