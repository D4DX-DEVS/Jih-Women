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
import { str, tLang } from '../lib/i18n';
import { whatsappHref } from '../lib/format';
import { Container } from './Primitives';

export default function Footer() {
  const { lang, data, path } = useSite();
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
    { label: str('aboutUs', lang), to: path('/who-we-are') },
    { label: str('visionMission', lang), to: path('/who-we-are/ideology') },
    { label: str('departments', lang), to: path('/departments') },
    { label: str('programs', lang), to: path('/programs') },
    { label: str('events', lang), to: path('/events') },
    { label: str('mediaNews', lang), to: path('/media/news') },
    { label: str('photoGallery', lang), to: path('/media/gallery') },
    { label: str('contact', lang), to: path('/contact') },
  ];

  const siteName = tLang(settings?.siteName, lang) || str('footerOrgFull', lang);
  const footerNote = tLang(settings?.footerNote, lang) || str('footerBlurb', lang);
  const address = tLang(settings?.address, lang);
  /* Malayalam mark from CMS; English uses the same English wordmark as the header */
  const brandLogo = lang === 'en' ? '/logo.png' : settings?.logoUrl || '/logo.png';
  const showCmsLogoPlate = lang === 'ml' && Boolean(settings?.logoUrl);

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
              aria-label={siteName}
            >
              {showCmsLogoPlate ? (
                /* The mark is dark ink, so it needs a light plate on the deep
                   footer. The wing name sits beside it, as in the header. */
                <>
                  <img
                    src={brandLogo}
                    alt=""
                    className="h-12 w-auto max-w-[190px] shrink-0 rounded-lg bg-white/95 object-contain object-left px-2.5 py-2"
                  />
                  <span className="leading-[1.3]">
                    <span className="block whitespace-normal text-[11px] font-bold uppercase tracking-[0.15em] text-magenta-300 sm:whitespace-nowrap">
                      {str('footerWing', lang)}
                    </span>
                    <span className="block whitespace-normal text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/55 sm:whitespace-nowrap">
                      {str('footerKerala', lang)}
                    </span>
                  </span>
                </>
              ) : (
                <img
                  src={brandLogo}
                  alt={siteName}
                  className="h-12 w-auto max-w-[220px] shrink-0 object-contain object-left"
                />
              )}
            </Link>

            <p className="mt-5 text-[13.5px] leading-relaxed">
              {footerNote}
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

          <FooterColumn title={str('quickLinks', lang)}>
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition hover:text-magenta-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={str('departments', lang)}>
            {departments.length > 0 ? (
              departments.map((d) => {
                const title = tLang(d.title, lang);
                if (!title) return null;
                return (
                  <li key={d._id}>
                    <Link to={path(`/departments/${d.slug}`)} className="transition hover:text-magenta-300">
                      {title}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li>
                <Link to={path('/departments')} className="transition hover:text-magenta-300">
                  {str('departments', lang)}
                </Link>
              </li>
            )}
          </FooterColumn>

          <FooterColumn title={str('contact', lang)}>
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
            {address && (
              <li className="flex gap-3">
                <MapPin size={15} className="mt-1 shrink-0 text-magenta-300" />
                <span className="whitespace-pre-line leading-relaxed">
                  {address}
                </span>
              </li>
            )}
          </FooterColumn>

          {settings?.sections?.newsletter !== false && (
            <div>
              <FooterHeading>{str('newsletter', lang)}</FooterHeading>
              <p className="mb-4 text-[13.5px] leading-relaxed">{str('newsletterBlurb', lang)}</p>
              <NewsletterForm />
            </div>
          )}
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-center text-[12.5px] text-white/50 sm:flex-row sm:text-start">
          <span className="min-w-0">
            © {new Date().getFullYear()} {siteName}. {str('allRightsReserved', lang)}.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to={path('/who-we-are')} className="transition hover:text-white">
              {str('privacyPolicy', lang)}
            </Link>
            <span className="opacity-30">|</span>
            <Link to={path('/who-we-are')} className="transition hover:text-white">
              {str('termsConditions', lang)}
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
  const { lang } = useSite();
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
        {str('subscribed', lang)}
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
        placeholder={str('enterYourEmail', lang)}
        className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-[13.5px] text-white outline-none transition placeholder:text-white/40 focus:border-magenta-400"
      />
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-xl bg-magenta-500 px-5 py-2.5 text-[13.5px] font-medium text-white transition hover:bg-magenta-600 disabled:opacity-60"
      >
        {status === 'sending' ? str('sending', lang) : str('subscribe', lang)}
      </button>
    </form>
  );
}
