/* ───── regional phone detection ──────────────────────────────────
   Shared between /trainingnew/setter and /trainingnew/closer so both
   pages text-to-confirm to the right number.
──────────────────────────────────────────────────────────────────── */

export type Region = 'us' | 'eu' | 'aunz';

export const PHONE_NUMBERS: Record<Region, { display: string; raw: string; label: string }> = {
  us:   { display: '(830) 357-7613',   raw: '+18303577613',  label: 'US / Canada' },
  eu:   { display: '+44 7853 306509',  raw: '+447853306509', label: 'Europe / UK' },
  aunz: { display: '+61 489 089 374',  raw: '+61489089374',  label: 'Australia / NZ' },
};

export function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland') || tz.startsWith('Pacific/Chatham') || tz === 'NZ') {
      return 'aunz';
    }
    if (tz.startsWith('Europe/') || tz.startsWith('Atlantic/') || tz.startsWith('Africa/')) {
      return 'eu';
    }
  } catch {
    /* fallback */
  }
  return 'us';
}
