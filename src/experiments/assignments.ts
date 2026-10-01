/* ───── Visitor's active variant assignments ─────────────────────
   Single module-level cache that holds the current visitor's set of
   active-experiment variant assignments. Populated at page mount
   from the registry + segment facts + the PostHog distinct_id.
   Read by trackEvent (to enrich every event with active_experiments)
   and by useExperiment (to return the branch for a given id).

   Why module-level rather than React context: trackEvent is called
   from hooks and from plain lib code (confirmationTracking.ts,
   posthog.ts, etc.). A context would mean threading providers
   through every call site. One cache that both React and lib code
   can read keeps the enrichment uniform.
──────────────────────────────────────────────────────────────────── */

import {
  EXPERIMENTS,
  assignVariant,
  eligibleExperiments,
  type Experiment,
  type Variant,
  type Page,
} from './registry';
import type { SegmentFacts } from './segments';
import { setActiveExperimentsReader } from '../lib/posthog';

export interface Assignment {
  experimentId: string;
  variantId: string;
}

let cache: Map<string, Assignment> = new Map(); // experimentId -> assignment
let currentFacts: SegmentFacts | null = null;
let currentDistinctId: string | null = null;
let currentPage: Page | null = null;

/** Populate the cache for a visitor + page. Called once per page
 *  mount from useExperimentContext. Safe to call repeatedly - it
 *  rebuilds the cache from scratch (determinism guarantees the
 *  same visitor+page produces the same assignments). */
export function initVisitorAssignments(params: {
  page: Page;
  facts: SegmentFacts;
  distinctId: string;
}): Assignment[] {
  cache = new Map();
  currentFacts = params.facts;
  currentDistinctId = params.distinctId;
  currentPage = params.page;

  const eligible = eligibleExperiments(params.page, params.facts);
  const assignments: Assignment[] = [];
  for (const exp of eligible) {
    const variant = assignVariant(exp, params.distinctId);
    const a: Assignment = { experimentId: exp.id, variantId: variant.id };
    cache.set(exp.id, a);
    assignments.push(a);
  }
  return assignments;
}

/** For useExperiment. Returns the Variant object for an experiment,
 *  or null if the visitor isn't eligible / isn't initialized yet /
 *  the experiment doesn't exist. */
export function getAssignedVariantForVisitor(experimentId: string): Variant | null {
  const a = cache.get(experimentId);
  if (!a) return null;
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) return null;
  return exp.variants.find((v) => v.id === a.variantId) ?? null;
}

/** For trackEvent enrichment. Returns the flat array of
 *  "<experimentId>:<variantId>" strings. Fits cleanly as a single
 *  array property on a PostHog event. */
export function activeAssignmentTokens(): string[] {
  const tokens: string[] = [];
  for (const a of cache.values()) {
    tokens.push(`${a.experimentId}:${a.variantId}`);
  }
  return tokens;
}

// Wire trackEvent's enrichment hook to our token reader. Done at
// module load (one-time, idempotent). Any trackEvent call anywhere
// in the app now auto-attaches the active assignments.
setActiveExperimentsReader(activeAssignmentTokens);

/** For the agent-run cycle: dump what the current visitor is in. */
export function debugAssignments(): {
  page: Page | null;
  facts: SegmentFacts | null;
  distinctId: string | null;
  assignments: Assignment[];
} {
  return {
    page: currentPage,
    facts: currentFacts,
    distinctId: currentDistinctId,
    assignments: Array.from(cache.values()),
  };
}

/** The companion helper for the specific experiment we're branching
 *  on. Returns null when the visitor isn't eligible. */
export function getAssignedExperiment(experimentId: string): Experiment | null {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) return null;
  if (!cache.has(experimentId)) return null;
  return exp;
}
