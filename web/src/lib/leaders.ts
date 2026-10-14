import type { Lang, Leader, LeaderTerm } from './types';

/** Kerala districts as the admin stores them (English), with their Malayalam names */
const DISTRICT_ML: Record<string, string> = {
  Thiruvananthapuram: 'തിരുവനന്തപുരം',
  Kollam: 'കൊല്ലം',
  Pathanamthitta: 'പത്തനംതിട്ട',
  Alappuzha: 'ആലപ്പുഴ',
  Kottayam: 'കോട്ടയം',
  Idukki: 'ഇടുക്കി',
  Ernakulam: 'എറണാകുളം',
  Thrissur: 'തൃശ്ശൂർ',
  Palakkad: 'പാലക്കാട്',
  Malappuram: 'മലപ്പുറം',
  Kozhikode: 'കോഴിക്കോട്',
  Wayanad: 'വയനാട്',
  Kannur: 'കണ്ണൂർ',
  Kasaragod: 'കാസർകോട്',
};

/** A stored district in the visitor's language; any name outside the list is shown as stored. */
export function districtName(value: string, lang: Lang): string {
  return (lang === 'ml' && DISTRICT_ML[value]) || value;
}

/**
 * A leader's periods, oldest first. The API sends `terms`; an older API sends only the
 * single term label (or years), which becomes the one period.
 */
export function leaderTerms(leader: Leader): LeaderTerm[] {
  if (leader.terms?.length) return leader.terms;
  const label = leader.termLabel?.trim();
  if (label) return [{ period: label, district: '', from: leader.termFrom, to: leader.termTo }];
  const years = [leader.termFrom, leader.termTo].filter(Boolean);
  return years.length ? [{ period: years.join('–'), district: '', from: leader.termFrom, to: leader.termTo }] : [];
}

/** The most recent period (latest end year); the last one listed when none has a year. */
export function latestTerm(terms: LeaderTerm[]): LeaderTerm | undefined {
  let latest: LeaderTerm | undefined;
  for (const term of terms) {
    if (term.from === undefined || term.to === undefined) continue;
    if (!latest || term.to > latest.to! || (term.to === latest.to && term.from > latest.from!)) latest = term;
  }
  return latest ?? terms[terms.length - 1];
}

/** Text compared with dashes and spaces evened out, so "2019 – 2023" matches "2019–2023". */
const comparable = (text: string) => text.replace(/\s*[-–—]\s*/g, '–').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * What a leader card shows: the district (of the latest period) and every period,
 * comma-separated. When the person served in different districts, each period names
 * its own district so no period is credited to the wrong one.
 *
 * The years are shown once on a page: `periods` is left empty when everything it would
 * say is already in view, i.e. the leader's only period is the heading above the card
 * (`shownPeriod`) or every period is already part of the leader's name
 * ("Meeqathi 2019 – 2023").
 */
export function leaderTermSummary(
  leader: Leader,
  lang: Lang,
  { name = '', shownPeriod = '' }: { name?: string; shownPeriod?: string } = {}
): { district: string; periods: string } {
  const terms = leaderTerms(leader).filter((term) => term.period || term.district);
  const districts = new Set(terms.map((term) => term.district).filter(Boolean));
  const latest = latestTerm(terms);
  const district = latest?.district || (districts.size === 1 ? [...districts][0] : '');

  const dated = terms.filter((term) => term.period);
  const inName = comparable(name);
  const alreadyShown =
    (dated.length === 1 && shownPeriod && comparable(dated[0].period) === comparable(shownPeriod)) ||
    (dated.length > 0 && inName && dated.every((term) => inName.includes(comparable(term.period))));
  const periods = alreadyShown
    ? ''
    : dated
        .map((term) =>
          districts.size > 1 && term.district ? `${term.period} (${districtName(term.district, lang)})` : term.period
        )
        .join(', ');
  return { district: district ? districtName(district, lang) : '', periods };
}

export type LeaderGroup = { period: string; leaders: Leader[] };

/**
 * Splits leaders by their latest period ("2024–2026"), newest period first, so each
 * group can be headed by its years. Each leader appears once. Leaders without any
 * period come first, in a group with an empty `period`, so that group (shown without a
 * heading) never reads as part of the period heading above it.
 */
export function groupLeadersByPeriod(leaders: Leader[]): LeaderGroup[] {
  const groups = new Map<string, { group: LeaderGroup; from?: number; to?: number; first: number }>();
  leaders.forEach((leader, index) => {
    const latest = latestTerm(leaderTerms(leader));
    const period = latest?.period ?? '';
    const entry = groups.get(period);
    if (entry) entry.group.leaders.push(leader);
    else groups.set(period, { group: { period, leaders: [leader] }, from: latest?.from, to: latest?.to, first: index });
  });
  const rank = (n: number | undefined) => (n === undefined ? -Infinity : n);
  return [...groups.values()]
    .sort((a, b) => {
      if (!a.group.period !== !b.group.period) return a.group.period ? 1 : -1;
      return rank(b.to) - rank(a.to) || rank(b.from) - rank(a.from) || a.first - b.first;
    })
    .map(({ group }) => group);
}
