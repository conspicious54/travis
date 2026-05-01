/* ───── closer-specific phone numbers by region ────────────────────
   Map a HubSpot meeting owner name (the "organizer") + the visitor's
   region to the right Kixie line. Used by /trainingnew/closer so the
   text/WhatsApp confirmation goes to the actual closer assigned to
   that meeting, not a generic team number.

   If the owner isn't in the map or their region-specific number isn't
   set, we fall back to the default PHONE_NUMBERS for that region.
──────────────────────────────────────────────────────────────────── */

import { PHONE_NUMBERS, type Region } from './regionPhone';

export interface PhoneEntry {
  display: string;
  raw: string; // E.164 format: +1..., +44..., +61...
  label: string;
}

type CloserPhoneMap = Partial<Record<Region, PhoneEntry>>;

/* Key by lowercased owner name (match on includes() so "Matthew Kemp"
   also matches if HubSpot returns "Matt Kemp") */
const CLOSER_PHONES: Record<string, CloserPhoneMap> = {
  'matthew kemp': {
    us:   { display: '(661) 795-2338',   raw: '+16617952338',  label: 'Matthew — US' },
    eu:   { display: '+44 7463 588086',  raw: '+447463588086', label: 'Matthew — UK' },
    aunz: { display: '+61 468 080 516',  raw: '+61468080516',  label: 'Matthew — AU' },
  },
  'jorge rodriguez': {
    us:   { display: '(661) 466-2286',   raw: '+16614662286',  label: 'Jorge — US' },
    eu:   { display: '+44 7782 229912',  raw: '+447782229912', label: 'Jorge — UK' },
    aunz: { display: '+61 468 082 890',  raw: '+61468082890',  label: 'Jorge — AU' },
  },
  'sharlee fuentes': {
    us:   { display: '(478) 800-7090',   raw: '+14788007090',  label: 'Sharlee — US' },
    // Sharlee has no UK or AU line yet — default to Jesse for those regions
    eu:   { display: '+44 7463 587844',  raw: '+447463587844', label: 'Jesse — UK' },
    aunz: { display: '+61 468 080 264',  raw: '+61468080264',  label: 'Jesse — AU' },
  },
  'jesse saunders': {
    us:   { display: '(661) 560-4412',   raw: '+16615604412',  label: 'Jesse — US' },
    eu:   { display: '+44 7463 587844',  raw: '+447463587844', label: 'Jesse — UK' },
    aunz: { display: '+61 468 080 264',  raw: '+61468080264',  label: 'Jesse — AU' },
  },
  'zac solipsism': {
    us:   { display: '(661) 475-5982',   raw: '+16614755982',  label: 'Zac — US' },
    eu:   { display: '+44 7782 229912',  raw: '+447782229912', label: 'Zac — UK' },
    aunz: { display: '+61 468 082 890',  raw: '+61468082890',  label: 'Zac — AU' },
  },
};

/**
 * Returns the right phone line for a given meeting owner + visitor region.
 * Falls back to the default regional number when:
 *  - No owner name provided (org unknown)
 *  - Owner isn't mapped in CLOSER_PHONES
 *  - Owner has no entry for this region
 */
export function getCloserPhone(
  ownerName: string | null | undefined,
  region: Region
): PhoneEntry {
  if (ownerName && ownerName.trim()) {
    const needle = ownerName.toLowerCase().trim();
    for (const [key, map] of Object.entries(CLOSER_PHONES)) {
      if (needle.includes(key) || key.includes(needle)) {
        const hit = map[region];
        if (hit) return hit;
        // owner matched but no number for this region — fall through
        break;
      }
    }
  }
  const fallback = PHONE_NUMBERS[region];
  return { display: fallback.display, raw: fallback.raw, label: fallback.label };
}
