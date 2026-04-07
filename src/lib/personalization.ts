/* ───── personalization layer ──────────────────────────────────────
   Reads Typeform answers from localStorage (persisted by /book and
   /bookacall) and exposes a normalized object with answer "tags" so
   the confirmation pages can show the most relevant content for each
   visitor.

   We normalize each value before matching:
   - lowercase
   - smart quotes / curly apostrophes flattened
   - punctuation collapsed to spaces
   - whitespace collapsed

   Then we match against unique fingerprint words for each answer.
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

/* Normalize a string for matching: lowercase, strip smart quotes,
   replace punctuation with spaces, collapse whitespace. This makes
   matching robust against curly apostrophes, periods, hyphens, etc. */
function normalize(s: string | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    // smart/curly quotes → straight
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // em/en dashes → hyphen → space
    .replace(/[\u2013\u2014]/g, '-')
    // strip ALL punctuation to spaces (keeps letters, numbers, spaces)
    .replace(/[^a-z0-9\s]/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/* True if `needle` (already normalized) appears in `haystack` */
function has(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

function mapRegion(val: string): Region {
  const v = normalize(val);
  if (!v) return 'unknown';
  if (has(v, 'new zealand') || v === 'nz') return 'newzealand';
  if (has(v, 'australia') || v === 'au') return 'australia';
  if (has(v, 'canada')) return 'canada';
  if (has(v, 'europe') || has(v, 'uk') || has(v, 'united kingdom')) return 'europe';
  if (has(v, 'usa') || has(v, 'united states') || v === 'us') return 'usa';
  return 'unknown';
}

function mapReason(val: string): Reason {
  const v = normalize(val);
  if (!v) return 'unknown';
  // Each option has one unique fingerprint word
  if (has(v, 'asset')) return 'asset';
  if (has(v, 'freedom')) return 'freedom';
  if (has(v, 'exploring')) return 'exploring';
  return 'unknown';
}

function mapSituation(val: string): Situation {
  const v = normalize(val);
  if (!v) return 'unknown';
  // Order matters — check more specific phrases first
  if (has(v, 'stuck')) return 'amazon_stuck';
  if (has(v, 'tried entrepreneurship') || has(v, 'roadmap')) return 'tried_failed';
  if (has(v, 'never started')) return 'never_started';
  if (has(v, 'researching') || has(v, 'evaluating')) return 'researching';
  return 'unknown';
}

function mapTravis(val: string): TravisHistory {
  const v = normalize(val);
  if (!v) return 'unknown';
  // Order matters — "over a year" must check before "months"
  if (has(v, 'over a year') || has(v, 'over year')) return 'over_year';
  if (has(v, 'haven t seen') || has(v, 'havent seen') || has(v, 'never seen') || has(v, 'haven t')) return 'never';
  if (has(v, 'recently discovered') || has(v, 'recently')) return 'recent';
  if (has(v, 'several months') || has(v, 'months')) return 'months';
  return 'unknown';
}

function mapValue(val: string): ValuedFeature {
  const v = normalize(val);
  if (!v) return 'unknown';
  // "1:1" becomes "1 1" after normalize. Also "one-on-one" → "one on one"
  if (has(v, '1 1') || has(v, 'one on one') || has(v, '1on1')) return 'one_on_one';
  if (has(v, 'group coaching') || has(v, 'small group') || has(v, 'group calls')) return 'group_calls';
  if (has(v, 'curriculum') || has(v, 'worksheets')) return 'curriculum';
  if (has(v, 'community') || has(v, 'accountability')) return 'community';
  return 'unknown';
}

function mapCapital(val: string): Capital {
  const v = normalize(val);
  if (!v) return 'unknown';
  // Order matters — check most specific first
  if (has(v, 'do not have') || has(v, 'don t have') || has(v, 'dont have')) return 'none';
  if (has(v, 'set aside') || has(v, 'have capital')) return 'have';
  if (has(v, 'can access') || has(v, 'access the capital') || has(v, 'access capital')) return 'access';
  if (has(v, 'would need time') || has(v, 'need time to save') || has(v, 'save the capital') || has(v, 'save capital')) return 'save';
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
