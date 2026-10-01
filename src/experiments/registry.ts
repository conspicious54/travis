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
  desktopOS?: 'mac' | 'windows' | 'other';
  mobileOS?: 'ios' | 'android';
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
  /* ─────────── CYCLE 1 (started 2026-10-01) ─────────── */

  // Closer × mobile iOS: CTA personalization
  // Baseline: mobile closer ~82% confirm — near ceiling, but iOS specifically
  // is the dominant arm. Testing coach-name personalization for marginal lift.
  {
    id: 'closer-ios-cta-coach-name',
    page: 'closer',
    segment: { device: 'mobile', mobileOS: 'ios' },
    hypothesis:
      'Personalizing the CTA with the coach first name ("Confirm with Coach <X>") lifts click rate over the generic "Confirm via Text" among already-high-intent iOS mobile visitors.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',    label: 'Confirm via Text' },
      { id: 'coach-name', label: 'Confirm with Coach <Name>' },
    ],
  },

  // Closer × mobile Android: tel: fallback escape hatch
  // Baseline: Android confirm meaningfully lower than iOS on the same page -
  // suspect flaky sms:// pre-fill on some Android messaging apps.
  {
    id: 'closer-android-call-fallback',
    page: 'closer',
    segment: { device: 'mobile', mobileOS: 'android' },
    hypothesis:
      'Android sms:// pre-fill is flaky across OEMs/messaging apps. Adding a tel: fallback link below the SMS button gives visitors whose compose window broke an escape hatch, lifting confirm rate.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',            label: 'SMS button only' },
      { id: 'with-call-fallback', label: 'SMS + tel: fallback link' },
    ],
  },

  // Closer × familiarity:new: video-first page order
  // Baseline: new (never + recent) at 70% vs known at 77% - new visitors
  // need more trust-building before being asked to confirm.
  {
    id: 'closer-new-video-first',
    page: 'closer',
    segment: { familiarity: 'new' },
    hypothesis:
      'New visitors (never + recent) need to see the ResearchVideo before being asked to confirm. Placing the video above the confirm block builds enough trust to lift confirm clicks.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',     label: 'Confirm first, then video' },
      { id: 'video-first', label: 'Video first, then confirm' },
    ],
  },

  // Setter × familiarity:new: social proof + Amazon Ads badge
  {
    id: 'setter-new-amazon-ads-chip',
    page: 'setter',
    segment: { familiarity: 'new' },
    hypothesis:
      "Social proof (14k students taught + Amazon Ads Verified Partner badge) rendered directly above the confirm CTA raises trust in a sub-population that doesn't know Travis yet, lifting confirm clicks.",
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',    label: 'No chip above CTA' },
      { id: 'proof-chip', label: 'Social proof + Amazon Ads chip above CTA' },
    ],
  },

  // Closer × familiarity:known: Add-to-calendar button
  {
    id: 'closer-known-add-to-calendar',
    page: 'closer',
    segment: { familiarity: 'known' },
    hypothesis:
      "Visitors who have followed Travis for months+ already trust us - the risk is no-show, not no-trust. An Add-to-Calendar button above the confirm block captures intent via micro-commitment and should lift confirm follow-through.",
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control', label: 'No add-to-cal button' },
      { id: 'atc',     label: 'Add to Google Calendar button above confirm' },
    ],
  },

  // Setter × familiarity:known: within-24h expectation block
  {
    id: 'setter-known-within-24h',
    page: 'setter',
    segment: { familiarity: 'known' },
    hypothesis:
      "Known-cohort setter visitors have already engaged with Travis for months. A 'We'll text you within 24h' expectation-setting block above confirm reduces the between-signup-and-setter-call anxiety that drives drop-off.",
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',   label: 'Baseline confirm block' },
      { id: 'within-24h', label: '"We will text you within 24h" expectation block' },
    ],
  },

  // Closer × capital:low: launch-stat chip + scroll button
  {
    id: 'closer-low-capital-launch-stat',
    page: 'closer',
    segment: { capital: 'low' },
    hypothesis:
      "Low-capital visitors (save + none) are secretly worried they can't afford this. A '40%+ launch under $2k' stat chip below the first video with a jump-to-examples button reassures them before the confirm ask.",
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control', label: 'No stat chip' },
      { id: 'chip',    label: '40%+ launch stat + scroll-to-examples button' },
    ],
  },

  // Setter × capital:low: same chip
  {
    id: 'setter-low-capital-launch-stat',
    page: 'setter',
    segment: { capital: 'low' },
    hypothesis:
      'Same reassurance as the closer-side low-capital test, pre-call. Low-capital setter visitors need to know the barrier is lower than they fear before they commit to the next step.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control', label: 'No stat chip' },
      { id: 'chip',    label: '40%+ launch stat + scroll-to-examples button' },
    ],
  },

  // Closer × capital:high: mutual-fit micro-copy
  {
    id: 'closer-high-capital-mutual-fit',
    page: 'closer',
    segment: { capital: 'high' },
    hypothesis:
      'High-capital visitors fear a hard-sell call. A single-line "This is a mutual-fit check, not a pitch" micro-copy above the confirm CTA reduces that fear and increases follow-through.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',     label: 'No micro-copy' },
      { id: 'mutual-fit',  label: '"Mutual-fit check, not a pitch" line above CTA' },
    ],
  },

  // Setter × capital:high: same micro-copy
  {
    id: 'setter-high-capital-mutual-fit',
    page: 'setter',
    segment: { capital: 'high' },
    hypothesis:
      'Same reassurance pre-call. High-capital setter visitors drop off between signup and setter outreach when they expect a pitchy conversation. The micro-copy reframes the upcoming call.',
    startedAt: '2026-10-01',
    status: 'running',
    variants: [
      { id: 'control',     label: 'No micro-copy' },
      { id: 'mutual-fit',  label: '"Mutual-fit check, not a pitch" line above CTA' },
    ],
  },
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
  if (target.mobileOS     && !memberships.has(`mobileOS:${target.mobileOS}`))         return false;
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
  if (e.segment.mobileOS)    keys.push(`${prefix}mobileOS:${e.segment.mobileOS}`);
  if (e.segment.familiarity) keys.push(`${prefix}familiarity:${e.segment.familiarity}`);
  if (e.segment.capital)     keys.push(`${prefix}capital:${e.segment.capital}`);
  return keys;
}
