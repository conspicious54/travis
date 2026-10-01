/* ───── Experiment registry ───────────────────────────────────────
   One source of truth for every active and historical split test on
   the confirmation pages.

   Rules enforced by convention + the dev-time validator at the
   bottom of this file:

     1. One running experiment per {page, segment-lane} at a time.
        A "lane" is a single segment facet, e.g. device:mobile or
        familiarity:known. We never run two tests simultaneously in
        the same lane.

     2. Every segment lane should ALWAYS have one running experiment.
        If a lane's current experiment just declared a winner, the
        next hypothesis is queued in-place by setting status back to
        'running' with new copy. Historical experiments stay in the
        file with status: 'completed'.

     3. Variants are deterministic per visitor: hash(distinct_id +
        experiment.id) -> variant index. Sticky across return visits.

     4. Experiments only assign a variant to visitors whose
        memberships (from segments.ts) match ALL constraints in
        `segment`. Non-matching visitors see no variant for this
        experiment (useExperiment returns null).

     5. Winners merge back by deleting the experiment entry and
        folding the winning variant into the page code, then
        starting the next hypothesis. The history row flips to
        status: 'completed' and stays as a record.

   Metric columns (confirm_click_rate / dwell_sec / video_pct) are
   filled in when a winner is declared - they're a snapshot of the
   PostHog numbers at the call, not live telemetry. ───────────────── */

import type { SegmentFacts } from './segments';
import { visitorMemberships } from './segments';

export type Page = 'setter' | 'closer';
export type ExperimentStatus = 'running' | 'completed';

/** Segment targeting: experiment runs only when visitor matches ALL
 *  listed facets. Leaving a facet unset means "doesn't matter". */
export interface SegmentTarget {
  device?: 'mobile' | 'desktop';
  desktopOS?: 'mac' | 'windows';
  familiarity?: 'new' | 'known';
  capital?: 'high' | 'low';
}

export interface Variant {
  /** Stable id, used in PostHog breakdowns. Keep short. */
  id: string;
  /** Human-readable label for the experiment registry. */
  label: string;
}

export interface Experiment {
  /** Stable id. Kebab-case. Used as PostHog event property + sticky
      storage key, so renaming later orphans historic data. */
  id: string;
  page: Page;
  segment: SegmentTarget;
  /** Short sentence - what we're testing and why we think it moves
      the needle. Shows up in the agent-run cycle summary. */
  hypothesis: string;
  /** YYYY-MM-DD. */
  startedAt: string;
  status: ExperimentStatus;
  /** Two or more variants. Index 0 is control. The agent-run cycle
      requires at least two for a running test. */
  variants: readonly Variant[];
  /** Winner id, filled when status=completed. */
  winner?: string;
  /** Snapshot metrics at winner call, for the historical record. */
  result?: {
    sampleSize: Record<string, number>;
    confirmClickRate?: Record<string, number>;
    dwellSecMedian?: Record<string, number>;
    videoPctMedian?: Record<string, number>;
    pValue?: number;
    notes?: string;
  };
}

/* ─────────────────────────── ACTIVE REGISTRY ────────────────────
   Add rows below. Keep running count per lane = 1.
   Lanes are: device:mobile, device:desktop, desktopOS:mac,
   desktopOS:windows, familiarity:new, familiarity:known,
   capital:high, capital:low — times 2 pages = 16 lanes.
──────────────────────────────────────────────────────────────────── */

export const EXPERIMENTS: readonly Experiment[] = [
  // Seeded empty - the first cycle's job is to propose + populate.
];

/* ─────────────────────────── LOOKUP HELPERS ─────────────────────── */

/** All running experiments that this visitor is eligible for on the
 *  given page. Multiple results = independent concurrent assignments
 *  (per the design choice: one visitor can be in several segment
 *  lanes, each with its own test). */
export function eligibleExperiments(
  page: Page,
  facts: SegmentFacts
): Experiment[] {
  const memberships = visitorMemberships(facts);
  return EXPERIMENTS.filter((e) => {
    if (e.status !== 'running') return false;
    if (e.page !== page) return false;
    return matchesSegment(memberships, e.segment);
  });
}

export function matchesSegment(
  memberships: Set<string>,
  target: SegmentTarget
): boolean {
  if (target.device       && !memberships.has(`device:${target.device}`))             return false;
  if (target.desktopOS    && !memberships.has(`desktopOS:${target.desktopOS}`))       return false;
  if (target.familiarity  && !memberships.has(`familiarity:${target.familiarity}`))   return false;
  if (target.capital      && !memberships.has(`capital:${target.capital}`))           return false;
  return true;
}

/** Find an experiment by id (running or completed). */
export function findExperiment(id: string): Experiment | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}

/* ─────────────── Deterministic variant assignment ──────────────────
   FNV-1a 32-bit hash. Small, no deps, deterministic across devices.
   Keyed on distinct_id + experiment.id so the same visitor always
   lands in the same variant for a given experiment, and different
   experiments produce independent assignments. ──────────────────── */

export function assignVariant(
  experiment: Experiment,
  distinctId: string
): Variant {
  const h = fnv1a(`${distinctId}::${experiment.id}`);
  const idx = h % experiment.variants.length;
  return experiment.variants[idx];
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/* ────────────── Dev-time self-check ────────────────────────────────
   Running on module load catches "two tests in the same lane" and
   malformed configs before they ship. Only runs in dev builds —
   prod builds skip to avoid startup cost. ──────────────────────── */

if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  validateRegistry();
}

export function validateRegistry(): void {
  const laneSeen = new Map<string, string>(); // laneKey -> experimentId
  for (const e of EXPERIMENTS) {
    if (e.status !== 'running') continue;
    if (e.variants.length < 2) {
      console.warn(`[experiments] "${e.id}" has <2 variants`);
    }
    const laneKeys = laneKeysFor(e);
    for (const key of laneKeys) {
      const existing = laneSeen.get(key);
      if (existing && existing !== e.id) {
        console.warn(
          `[experiments] lane collision on ${key}: "${existing}" and "${e.id}" both running`
        );
      }
      laneSeen.set(key, e.id);
    }
  }
}

function laneKeysFor(e: Experiment): string[] {
  const keys: string[] = [];
  const prefix = `${e.page}/`;
  if (e.segment.device)      keys.push(`${prefix}device:${e.segment.device}`);
  if (e.segment.desktopOS)   keys.push(`${prefix}desktopOS:${e.segment.desktopOS}`);
  if (e.segment.familiarity) keys.push(`${prefix}familiarity:${e.segment.familiarity}`);
  if (e.segment.capital)     keys.push(`${prefix}capital:${e.segment.capital}`);
  return keys;
}
