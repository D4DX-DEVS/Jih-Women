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
import { useSite } from '../lib/site';
import { str, tLang } from '../lib/i18n';
import { whatsappHref } from '../lib/format';
import { OFFICE_ADDRESS, OFFICE_EMAIL, OFFICE_PHONE, telHref } from '../lib/contact';
import { Container } from './Primitives';

export default function Footer() {
  const { data, path } = useSite();
  const settings = data?.settings;
  const departments = data?.nav.departments ?? [];

  const socials = [
    { href: settings?.social?.facebook, Icon: Facebook, label: 'Facebook' },
    { href: settings?.social?.instagram, Icon: Instagram, label: 'Instagram' },
    { href: settings?.social?.youtube, Icon: Youtube, label: 'YouTube' },
    { href: settings?.social?.twitter, Icon: Twitter, label: 'X' },
    { href: `mailto:${OFFICE_EMAIL}`, Icon: Mail, label: 'Email' },
  ].filter((x) => Boolean(x.href));

  /* Footer is always shown in English, independent of the site's ML/EN toggle. */
  const quickLinks = [
    { label: str('aboutUs', 'en'), to: path('/who-we-are') },
    { label: str('contact', 'en'), to: path('/contact') },
  ];

  const siteName = tLang(settings?.siteName, 'en') || str('footerOrgFull', 'en');
  /* Malayalam mark from CMS; English uses the same English wordmark as the header */
  const brandLogo = '/logo.png';
  const showCmsLogoPlate = false;

  return (
    <footer className="relative overflow-hidden bg-plum-800 text-white/70">
      <div className="leaf-watermark pointer-events-none absolute inset-0" />
      <span className="pointer-events-none absolute -end-28 top-10 h-72 w-72 rounded-full bg-magenta-500/15 blur-3xl" />

      <Container className="relative py-7 md:py-8">
        {/* Phones: brand, then Quick Links beside Departments, then Contact.
            Tablet: brand across the top (logo and icons side by side), three columns below.
            Desktop: four columns. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-[0.8fr_1fr_1.4fr] md:gap-x-8 lg:grid-cols-[1.2fr_0.7fr_1fr_1.4fr]">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4 md:col-span-3 md:flex-row md:items-center md:justify-between lg:col-span-1 lg:flex-col lg:items-start lg:justify-start">
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
                      {str('footerWing', 'en')}
                    </span>
                    <span className="block whitespace-normal text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/55 sm:whitespace-nowrap">
                      {str('footerKerala', 'en')}
                    </span>
                  </span>
                </>
              ) : (
                <img
                  src={brandLogo}
                  alt={siteName}
                  className="h-auto max-h-11 w-auto max-w-[min(100%,220px)] object-contain object-left brightness-0 invert"
                />
              )}
            </Link>

            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

          <FooterColumn title={str('quickLinks', 'en')}>
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="inline-block -my-1.5 py-1.5 transition hover:text-magenta-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={str('departments', 'en')}>
            {departments.length > 0 ? (
              departments.map((d) => {
                const title = tLang(d.title, 'en');
                if (!title) return null;
                return (
                  <li key={d._id}>
                    <Link to={path(`/departments/${d.slug}`)} className="inline-block -my-1.5 py-1.5 transition hover:text-magenta-300">
                      {title}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li>
                <Link to={path('/departments')} className="inline-block -my-1.5 py-1.5 transition hover:text-magenta-300">
                  {str('departments', 'en')}
                </Link>
              </li>
            )}
          </FooterColumn>

          <FooterColumn title={str('contact', 'en')} className="col-span-2 md:col-span-1">
            <li className="flex gap-3">
              <Phone size={15} className="mt-1 shrink-0 text-magenta-300" />
              <a href={telHref(OFFICE_PHONE)} className="inline-block -my-1.5 py-1.5 transition hover:text-magenta-300">
                {OFFICE_PHONE}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle size={15} className="mt-1 shrink-0 text-magenta-300" />
              <a
                href={whatsappHref(OFFICE_PHONE)}
                target="_blank"
                rel="noreferrer"
                className="inline-block -my-1.5 py-1.5 transition hover:text-magenta-300"
              >
                {OFFICE_PHONE}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail size={15} className="mt-1 shrink-0 text-magenta-300" />
              <a href={`mailto:${OFFICE_EMAIL}`} className="inline-block -my-1.5 py-1.5 break-all transition hover:text-magenta-300">
                {OFFICE_EMAIL}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin size={15} className="mt-1 shrink-0 text-magenta-300" />
              <span className="whitespace-pre-line leading-relaxed">{OFFICE_ADDRESS}</span>
            </li>
          </FooterColumn>

        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-3 text-center text-[12.5px] text-white/50 sm:flex-row sm:text-start">
          <span className="min-w-0">
            © {new Date().getFullYear()} {siteName}. {str('allRightsReserved', 'en')}.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to={path('/who-we-are')} className="-my-2 inline-block py-2 transition hover:text-white">
              {str('privacyPolicy', 'en')}
            </Link>
            <span className="opacity-30">|</span>
            <Link to={path('/who-we-are')} className="-my-2 inline-block py-2 transition hover:text-white">
              {str('termsConditions', 'en')}
            </Link>
            {/* Below xl "Powered by" wraps to its own line, so the divider would dangle */}
            <span className="hidden opacity-30 xl:inline">|</span>
            <span className="flex basis-full items-center justify-center gap-1.5 sm:justify-end xl:basis-auto">
              Powered by
              <a
                href="https://d4dx.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="-my-2 inline-flex items-center gap-1.5 py-2 font-medium text-white/70 transition hover:text-white"
              >
                {/* D4DX mark (white, from d4dx.co), sized to the text */}
                <img src="/d4dx-mark.png" alt="" className="h-3.5 w-auto shrink-0 object-contain" />
                D4DX Innovations LLP
              </a>
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
      {children}
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-magenta-500" />
    </div>
  );
}

function FooterColumn({
  title,
  className = '',
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <FooterHeading>{title}</FooterHeading>
      <ul className="space-y-1.5 text-[13.5px]">{children}</ul>
    </div>
  );
}
