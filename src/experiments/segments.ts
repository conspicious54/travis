/* ───── Visitor segments ──────────────────────────────────────────
   Experiment lanes run inside segments. A single visitor can match
   several segments at once (e.g. mobile + new + low-capital).

   Four orthogonal dimensions:
     - device:              mobile | desktop
     - desktopOS:           mac | windows               (desktop only)
     - travisFamiliarity:   new | known                 (new = never/recent,
                                                        known = months/over_year)
     - capital:             high | low                  (high = have/access,
                                                        low = save/none)

   'unknown' values on familiarity/capital are intentionally excluded
   from any experiment lane - we don't dilute test cells with visitors
   we can't segment confidently.

   Design note: segments are returned as a bag of memberships rather
   than a single "which cell am I in?" value, because experiments
   target one dimension at a time (not a fully-crossed cell), and a
   visitor who qualifies for several concurrent experiments gets an
   independent assignment in each.
──────────────────────────────────────────────────────────────────── */

import type { TravisHistory, Capital } from '../lib/personalization';

export type Device = 'mobile' | 'desktop';
export type DesktopOS = 'mac' | 'windows' | null; // null when mobile
export type Familiarity = 'new' | 'known' | 'unknown';
export type CapitalBucket = 'high' | 'low' | 'unknown';

export interface SegmentFacts {
  device: Device;
  desktopOS: DesktopOS;
  familiarity: Familiarity;
  capital: CapitalBucket;
}

/** Full set of segment "labels" the visitor belongs to. An experiment
 *  with `segment: { device: 'mobile' }` targets any visitor whose
 *  memberships contains 'device:mobile'. */
export function visitorMemberships(facts: SegmentFacts): Set<string> {
  const m = new Set<string>();
  m.add(`device:${facts.device}`);
  if (facts.desktopOS) m.add(`desktopOS:${facts.desktopOS}`);
  if (facts.familiarity !== 'unknown') m.add(`familiarity:${facts.familiarity}`);
  if (facts.capital !== 'unknown') m.add(`capital:${facts.capital}`);
  return m;
}

/* Browser-side resolvers.
   These intentionally mirror detection logic already used elsewhere
   (detectPlatform in TrainingNewSetter/Closer, personalization
   lib) rather than importing from them, so segments.ts has no React
   dependencies and can be imported from utility code. */

export function detectDevice(ua: string): Device {
  if (/iPhone|iPad|iPod|Android/.test(ua)) return 'mobile';
  return 'desktop';
}

export function detectDesktopOS(ua: string): DesktopOS {
  // Only meaningful on desktop. On mobile we return null so the
  // desktop-OS lane simply doesn't match for mobile visitors.
  if (/iPhone|iPad|iPod|Android/.test(ua)) return null;
  if (/Mac OS X|Macintosh/.test(ua)) return 'mac';
  if (/Windows NT/i.test(ua)) return 'windows';
  return null; // Linux etc. fall out of this lane too
}

export function mapFamiliarity(history: TravisHistory | undefined): Familiarity {
  if (history === 'never' || history === 'recent') return 'new';
  if (history === 'months' || history === 'over_year') return 'known';
  return 'unknown';
}

export function mapCapitalBucket(capital: Capital | undefined): CapitalBucket {
  if (capital === 'have' || capital === 'access') return 'high';
  if (capital === 'save' || capital === 'none') return 'low';
  return 'unknown';
}

/** Convenience: read everything the client knows about this visitor. */
export function resolveSegmentFacts(input: {
  userAgent: string;
  travisHistory: TravisHistory | undefined;
  capital: Capital | undefined;
}): SegmentFacts {
  return {
    device: detectDevice(input.userAgent),
    desktopOS: detectDesktopOS(input.userAgent),
    familiarity: mapFamiliarity(input.travisHistory),
    capital: mapCapitalBucket(input.capital),
  };
}
