/* ───── Dial-code country list (shared) ─────────────────────────
   Pulled from the local copy in NewForm.tsx so a secondary funnel
   page (/freelivetraining) can show the same selector without
   duplicating the data. NewForm still owns its own local copy —
   intentionally — so a change here can't accidentally break the
   main funnel.
──────────────────────────────────────────────────────────────────── */

export interface DialCountry {
  code: string;      // ISO alpha-2
  name: string;
  dial: string;      // e.g. "+1"
  flag: string;      // emoji
}

export const COUNTRY_DIAL: readonly DialCountry[] = [
  // Target markets (English-speaking primary)
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand',    dial: '+64',  flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland',        dial: '+353', flag: '🇮🇪' },
  // Western Europe
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { code: 'ES', name: 'Spain',          dial: '+34',  flag: '🇪🇸' },
  { code: 'IT', name: 'Italy',          dial: '+39',  flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands',    dial: '+31',  flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium',        dial: '+32',  flag: '🇧🇪' },
  { code: 'PT', name: 'Portugal',       dial: '+351', flag: '🇵🇹' },
  { code: 'CH', name: 'Switzerland',    dial: '+41',  flag: '🇨🇭' },
  { code: 'AT', name: 'Austria',        dial: '+43',  flag: '🇦🇹' },
  // Nordics
  { code: 'SE', name: 'Sweden',         dial: '+46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',         dial: '+47',  flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark',        dial: '+45',  flag: '🇩🇰' },
  { code: 'FI', name: 'Finland',        dial: '+358', flag: '🇫🇮' },
  // Other high-traffic
  { code: 'PL', name: 'Poland',         dial: '+48',  flag: '🇵🇱' },
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore',      dial: '+65',  flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong',      dial: '+852', flag: '🇭🇰' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa',   dial: '+27',  flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',         dial: '+52',  flag: '🇲🇽' },
  { code: 'JP', name: 'Japan',          dial: '+81',  flag: '🇯🇵' },
];

export const DEFAULT_DIAL: DialCountry = COUNTRY_DIAL[0]; // US

export function findDialByCountryCode(code: string | undefined | null): DialCountry {
  if (!code) return DEFAULT_DIAL;
  const upper = code.toUpperCase();
  return COUNTRY_DIAL.find((c) => c.code === upper) ?? DEFAULT_DIAL;
}

/** Compose a submission-ready phone from a visitor-typed local number
 *  plus the selected dial country.
 *   - If the visitor typed a value starting with '+', trust their format
 *     and strip spaces/dashes but keep the leading '+'.
 *   - Otherwise strip all non-digit chars, drop a leading 0 (common
 *     EU/UK local-format artefact), and prepend the dial code.
 *  Result is a clean E.164-ish string suitable for HubSpot/Zapier. */
export function composePhone(raw: string, dial: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return `${dial}${digits}`;
}
