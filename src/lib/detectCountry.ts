/* ───── client-side country detection ─────────────────────────────
   Fetches the visitor's country via a free no-auth IP-to-geo API
   (country.is - returns just IP + country code, no rate limit
   advertised) and caches in sessionStorage so we don't re-fetch
   on every page navigation.

   Returns the ISO 3166-1 alpha-2 country code (e.g. "US", "CA"),
   plus a human-readable country name when we can derive one.

   Used by the webinar opt-in so we can pass country to the Zapier
   webhook for downstream routing (ActiveCampaign for target
   markets, Mailchimp for everywhere else).
──────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'pp_country_data';

export type Audience = 'target' | 'non_target';

/* ─── Target countries for webinar / list routing ─────────────────
   Anything in this set goes to the "target" audience bucket (which
   our Zapier webhook routes to ActiveCampaign). Anything else is
   "non_target" (routed to Mailchimp). Edit this list - and only
   this list - to change routing. No code changes needed elsewhere.
──────────────────────────────────────────────────────────────────── */
const TARGET_COUNTRIES = new Set([
  'US', // United States
  'CA', // Canada
  'GB', // United Kingdom
  'AU', // Australia
  'NZ', // New Zealand
  'IE', // Ireland
]);

export function classifyAudience(countryCode: string): Audience {
  if (!countryCode) return 'non_target';
  return TARGET_COUNTRIES.has(countryCode.toUpperCase()) ? 'target' : 'non_target';
}

export interface CountryInfo {
  code: string;          // "US"
  name: string;          // "United States" (best-effort)
  audience: Audience;    // "target" | "non_target"
  source: 'cache' | 'api' | 'fallback';
}

// Minimal ISO code → English name map for the countries we actually
// route on. Anything outside this just keeps the ISO code as name.
const ISO_TO_NAME: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  NZ: 'New Zealand',
  IE: 'Ireland',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PT: 'Portugal',
  PK: 'Pakistan',
  IN: 'India',
  BD: 'Bangladesh',
  PH: 'Philippines',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  EG: 'Egypt',
  ZA: 'South Africa',
  NG: 'Nigeria',
  MX: 'Mexico',
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  CN: 'China',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  IL: 'Israel',
  TR: 'Turkey',
  PL: 'Poland',
  CZ: 'Czech Republic',
  RO: 'Romania',
  UA: 'Ukraine',
  RU: 'Russia',
};

function readCache(): CountryInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string') {
      // Always recompute audience on read in case the target list
      // changed between page loads.
      return {
        code: parsed.code,
        name: parsed.name || parsed.code,
        audience: classifyAudience(parsed.code),
        source: 'cache',
      };
    }
  } catch { /* no-op */ }
  return null;
}

function writeCache(info: CountryInfo) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code: info.code, name: info.name }));
  } catch { /* no-op */ }
}

let inflight: Promise<CountryInfo> | null = null;

/**
 * Resolve the visitor's country code + name. Cached for the session.
 * Returns a fallback {code: '', name: ''} if the lookup fails so the
 * caller never throws.
 */
export function getCountry(): Promise<CountryInfo> {
  const cached = readCache();
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('https://api.country.is/', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { country?: string };
      const code = (data.country || '').toUpperCase();
      if (!code || code.length !== 2) throw new Error('invalid_code');
      const info: CountryInfo = {
        code,
        name: ISO_TO_NAME[code] || code,
        audience: classifyAudience(code),
        source: 'api',
      };
      writeCache(info);
      return info;
    } catch (err) {
      return { code: '', name: '', audience: 'non_target' as const, source: 'fallback' as const };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
