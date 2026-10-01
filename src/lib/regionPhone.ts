/* ───── regional phone detection ──────────────────────────────────
   Shared between /trainingnew/setter and /trainingnew/closer so both
   pages text-to-confirm to the right number.
──────────────────────────────────────────────────────────────────── */

export type Region = 'us' | 'eu' | 'aunz';

export const PHONE_NUMBERS: Record<Region, { display: string; raw: string; label: string }> = {
  us:   { display: '(405) 347-4762',   raw: '+14053474762',  label: 'US / Canada' },
  eu:   { display: '+44 7723 573445',  raw: '+447723573445', label: 'Europe / UK' },
  aunz: { display: '+61 485 041 884',  raw: '+61485041884',  label: 'Australia / NZ' },
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
