import { Link } from 'react-router';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Scale,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useSite } from '../lib/site';
import { t } from '../lib/i18n';
import type { FocusArea } from '../lib/types';

/** Lucide icons the admin picker offers for a focus area (names match the backend enum) */
const FOCUS_ICONS: Record<string, LucideIcon> = {
  'graduation-cap': GraduationCap,
  users: Users,
  'heart-handshake': HeartHandshake,
  'calendar-days': CalendarDays,
  megaphone: Megaphone,
  handshake: Handshake,
  'book-open': BookOpen,
  sprout: Sprout,
  'shield-check': ShieldCheck,
  stethoscope: Stethoscope,
  scale: Scale,
  lightbulb: Lightbulb,
};

// Dividers between cells. Each breakpoint range has its own mutually exclusive rules
// (max-md / md:max-lg / lg), so no rule has to out-rank another in the stylesheet.
const FOCUS_CELL = [
  'group block min-w-0 border-plum-100 px-3 py-4 text-center transition sm:px-4 sm:py-6',
  // two columns on phones: a divider before every second cell, a rule above each cell after row one
  'max-md:[&:nth-child(2n)]:border-s max-md:[&:nth-child(n+3)]:border-t',
  // three columns from md
  'md:max-lg:[&:nth-child(3n+2)]:border-s md:max-lg:[&:nth-child(3n)]:border-s md:max-lg:[&:nth-child(n+4)]:border-t',
  // one row of six from lg (a seventh or eighth area starts a second row under a rule)
  'lg:[&:nth-child(6n+2)]:border-s lg:[&:nth-child(6n+3)]:border-s lg:[&:nth-child(6n+4)]:border-s',
  'lg:[&:nth-child(6n+5)]:border-s lg:[&:nth-child(6n)]:border-s lg:[&:nth-child(n+7)]:border-t',
].join(' ');

/**
 * The admin-managed Focus strip (Organisation Website → Focus). The caller decides
 * whether to render it: both the home page and About Us show it only while the
 * Focus switch (`settings.sections.focusAreas`) is on.
 */
export default function FocusStrip({ areas, id }: { areas: FocusArea[]; id?: string }) {
  const { lang, path } = useSite();

  return (
    <div id={id} className="rounded-3xl bg-white p-2 shadow-card md:p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {areas.map((area) => {
          const Icon = FOCUS_ICONS[area.icon] ?? GraduationCap;
          const body = (
            <>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-magenta-50 text-magenta-500 transition group-hover:bg-magenta-500 group-hover:text-white sm:h-14 sm:w-14">
                <Icon size={22} />
              </span>
              <span className="mt-2.5 block font-display text-[13.5px] font-semibold leading-snug text-plum-800 sm:mt-3.5 sm:text-[15px]">
                {t(area.title, lang)}
              </span>
              <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-muted sm:mt-1.5 sm:text-[12.5px]">
                {t(area.description, lang)}
              </span>
            </>
          );

          if (!area.linkUrl) {
            return (
              <div key={area._id} className={FOCUS_CELL}>
                {body}
              </div>
            );
          }

          return /^https?:\/\//i.test(area.linkUrl) ? (
            <a key={area._id} href={area.linkUrl} target="_blank" rel="noreferrer" className={FOCUS_CELL}>
              {body}
            </a>
          ) : (
            <Link key={area._id} to={path(area.linkUrl)} className={FOCUS_CELL}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
