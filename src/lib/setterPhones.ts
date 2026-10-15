/* ───── setter-specific phone numbers by region ────────────────────
   Parallel to closerPhones.ts but for the setter (/trainingnew/setter)
   confirmation flow. Maps a HubSpot/OnceHub setter owner name +
   visitor region to the right phone line so the text/WhatsApp
   confirmation goes to the specific setter who owns the booking,
   not a generic team number.

   Current setter rotation: Robin + Caeden. Ibrahim/Santiago kept
   as historical fallbacks so past bookings assigned to them still
   match the right phone if the user is routed through this page.
──────────────────────────────────────────────────────────────────── */

import { PHONE_NUMBERS, type Region } from './regionPhone';
import type { PhoneEntry } from './closerPhones';

type SetterPhoneMap = Partial<Record<Region, PhoneEntry>>;

/* Key by lowercased owner name (matched with .includes() so forgiving
   on how OnceHub spells the name — "Caeden Hooks" / "Caedan Hooks"
   / "caeden" all resolve). */
const SETTER_PHONES: Record<string, SetterPhoneMap> = {
  'robin bauer': {
    us:   { display: '(628) 287-1328',   raw: '+16282871328',  label: 'Robin - US' },
    eu:   { display: '+44 7723 573445',  raw: '+447723573445', label: 'Robin - UK' },
    aunz: { display: '+61 485 041 884',  raw: '+61485041884',  label: 'Robin - AU' },
  },
  'caeden hooks': {
    us:   { display: '(762) 701-6062',   raw: '+17627016062',  label: 'Caeden - US' },
    // Caeden AU: Aloware entry #58629 lists two lines (0468 080 264
    // + 0489 089 374). Using the first one. UK still pending —
    // Aloware shows "2 Numbers" with no visible digits, falls
    // through to Robin's UK line until confirmed.
    eu:   { display: '+44 7723 573445',  raw: '+447723573445', label: 'Caeden - UK' },
    aunz: { display: '+61 468 080 264',  raw: '+61468080264',  label: 'Caeden - AU' },
  },
};

/**
 * Returns the right phone line for a given setter + visitor region.
 * Falls back to the default regional number when:
 *  - No owner name provided (unknown booking)
 *  - Owner isn't in SETTER_PHONES
 *  - Owner has no entry for this region
 */
export function getSetterPhone(
  ownerName: string | null | undefined,
  region: Region,
): PhoneEntry {
  if (ownerName && ownerName.trim()) {
    const needle = ownerName.toLowerCase().trim();
    for (const [key, map] of Object.entries(SETTER_PHONES)) {
      if (needle.includes(key) || key.includes(needle)) {
        const hit = map[region];
        if (hit) return hit;
        break;
      }
    }
    // Also allow matching on first name alone — OnceHub may send
    // just "Robin" or "Caeden" without the surname.
    for (const [key, map] of Object.entries(SETTER_PHONES)) {
      const firstName = key.split(' ')[0];
      if (firstName && needle.includes(firstName)) {
        const hit = map[region];
        if (hit) return hit;
        break;
      }
    }
  }
  const fallback = PHONE_NUMBERS[region];
  return { display: fallback.display, raw: fallback.raw, label: fallback.label };
}
