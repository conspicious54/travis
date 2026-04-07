/* ───── personalization layer ──────────────────────────────────────
   Reads Typeform answers from localStorage (persisted by /book and
   /bookacall) and exposes a normalized object with answer "tags" so
   the confirmation pages can show the most relevant content for each
   visitor.

   Each Typeform answer comes through as a long string. We match the
   string against substrings to map it to a stable tag (e.g. "asset",
   "freedom", "exploring") so the rest of the app doesn't have to know
   the exact answer copy.
──────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'pp_booking_data';

export type Region = 'usa' | 'canada' | 'europe' | 'australia' | 'newzealand' | 'unknown';
export type Reason = 'asset' | 'freedom' | 'exploring' | 'unknown';
export type Situation = 'never_started' | 'tried_failed' | 'amazon_stuck' | 'researching' | 'unknown';
export type TravisHistory = 'over_year' | 'months' | 'recent' | 'never' | 'unknown';
export type ValuedFeature = 'group_calls' | 'one_on_one' | 'curriculum' | 'community' | 'unknown';
export type Capital = 'have' | 'access' | 'save' | 'none' | 'unknown';

export interface Personalization {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  region: Region;
  reason: Reason;
  situation: Situation;
  travisHistory: TravisHistory;
  valuedFeature: ValuedFeature;
  capital: Capital;
  // raw values for debugging / fallback display
  raw: Record<string, string>;
}

function readStorage(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function lc(s: string | undefined): string {
  return (s || '').toLowerCase();
}

function mapRegion(val: string): Region {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('usa') || v.includes('united states') || v === 'us') return 'usa';
  if (v.includes('canada')) return 'canada';
  if (v.includes('europe') || v.includes('uk') || v.includes('united kingdom')) return 'europe';
  if (v.includes('new zealand') || v === 'nz') return 'newzealand';
  if (v.includes('australia') || v === 'au') return 'australia';
  return 'unknown';
}

function mapReason(val: string): Reason {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('asset') || v.includes('without trading')) return 'asset';
  if (v.includes('freedom') || v.includes('9-to-5') || v.includes('9 to 5') || v.includes('quit')) return 'freedom';
  if (v.includes('exploring') || v.includes('figure out') || v.includes('makes the most sense')) return 'exploring';
  return 'unknown';
}

function mapSituation(val: string): Situation {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('never started') || v.includes('structure and accountability')) return 'never_started';
  if (v.includes('tried entrepreneurship') || v.includes("didn't have the right roadmap") || v.includes('didnt have the right roadmap')) return 'tried_failed';
  if (v.includes('currently sell on amazon') || v.includes('stuck and need')) return 'amazon_stuck';
  if (v.includes('researching') || v.includes('evaluating')) return 'researching';
  return 'unknown';
}

function mapTravis(val: string): TravisHistory {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('over a year') || v.includes('over year')) return 'over_year';
  if (v.includes('several months') || v.includes('months')) return 'months';
  if (v.includes('recently discovered') || v.includes('recently')) return 'recent';
  if (v.includes("haven't seen") || v.includes('havent seen') || v.includes('never seen')) return 'never';
  return 'unknown';
}

function mapValue(val: string): ValuedFeature {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('group coaching') || v.includes('small group')) return 'group_calls';
  if (v.includes('one-on-one') || v.includes('one on one') || v.includes('1-on-1')) return 'one_on_one';
  if (v.includes('curriculum') || v.includes('worksheets') || v.includes('roadmap')) return 'curriculum';
  if (v.includes('community') || v.includes('accountability')) return 'community';
  return 'unknown';
}

function mapCapital(val: string): Capital {
  const v = lc(val);
  if (!v) return 'unknown';
  if (v.includes('have capital set aside') || v.includes('set aside')) return 'have';
  if (v.includes('can access') || v.includes('access the capital')) return 'access';
  if (v.includes('would need time') || v.includes('save the capital')) return 'save';
  if (v.includes('do not have') || v.includes("don't have")) return 'none';
  return 'unknown';
}

export function getPersonalization(): Personalization {
  const raw = readStorage();

  const firstName = raw.firstname || '';
  const lastName = raw.lastname || '';

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    email: raw.email || '',
    phone: raw.phone || '',
    region: mapRegion(raw.location || ''),
    reason: mapReason(raw.reason || ''),
    situation: mapSituation(raw.tried || ''),
    travisHistory: mapTravis(raw.travis || ''),
    valuedFeature: mapValue(raw.value || ''),
    capital: mapCapital(raw.money || ''),
    raw,
  };
}
