/* ───── React hooks for experiments ──────────────────────────────
   Two surfaces:

     - useExperimentInit({ page }):
         Call ONCE near the top of each confirmation page component.
         Reads personalization + user-agent + PostHog distinct_id,
         builds segment facts, populates the module-level assignment
         cache (so trackEvent + useExperiment both see the same
         picture), fires one `experiments_assigned` event per visit
         so PostHog knows which arms this session was in.

     - useExperiment(experimentId):
         Returns the Variant object for the given experiment, or
         null if the visitor isn't eligible / init hasn't run yet.
         Component code: const variant = useExperiment('x'); then
         branch on variant?.id === 'bold-cta'.

   Everything is sticky across return visits because
   assignVariant() is deterministic in distinct_id.
──────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import {
  initVisitorAssignments,
  getAssignedVariantForVisitor,
  activeAssignmentTokens,
} from './assignments';
import {
  resolveSegmentFacts,
  type SegmentFacts,
} from './segments';
import type { Page, Variant } from './registry';
import { getPersonalization } from '../lib/personalization';
import { getDistinctId, trackEvent } from '../lib/posthog';

export function useExperimentInit(params: { page: Page }): {
  initialized: boolean;
  facts: SegmentFacts | null;
} {
  const [initialized, setInitialized] = useState(false);
  const [facts, setFacts] = useState<SegmentFacts | null>(null);

  useEffect(() => {
    const p = getPersonalization();
    const resolved = resolveSegmentFacts({
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      travisHistory: p.travisHistory,
      capital: p.capital,
    });
    const distinctId = getDistinctId() ?? 'anon';
    const assignments = initVisitorAssignments({
      page: params.page,
      facts: resolved,
      distinctId,
    });
    setFacts(resolved);
    setInitialized(true);

    // Fire once per page mount. Lets PostHog Insights filter any
    // metric by which arm the visitor was in without needing to
    // group-by on each individual event.
    if (assignments.length > 0) {
      trackEvent('experiments_assigned', {
        page: params.page,
        active_experiments: activeAssignmentTokens(),
        segment_device: resolved.device,
        segment_desktop_os: resolved.desktopOS,
        segment_familiarity: resolved.familiarity,
        segment_capital: resolved.capital,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { initialized, facts };
}

/** Returns the Variant object for `experimentId` once init has run,
 *  or null if the visitor is outside the segment / init hasn't
 *  completed yet. Component code can safely render control while
 *  waiting on hydration - null just means "no override, use default
 *  branch". */
export function useExperiment(experimentId: string): Variant | null {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    setVariant(getAssignedVariantForVisitor(experimentId));
    // Re-check on next microtask in case initVisitorAssignments is
    // scheduled slightly later than this hook's first render.
    const t = setTimeout(() => {
      setVariant(getAssignedVariantForVisitor(experimentId));
    }, 0);
    return () => clearTimeout(t);
  }, [experimentId]);

  return variant;
}
