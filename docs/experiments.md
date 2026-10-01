# Confirmation-page split-test framework

A/B tests on `/trainingnew/setter` and `/trainingnew/closer`, scoped
by visitor segment. Every segment lane runs **exactly one** test at
a time; the goal is a continuous cycle of hypothesize → ship →
measure → declare winner → merge → next hypothesis.

## Segments (lanes)

Four orthogonal dimensions, binary values. Each facet × each page =
one lane. 8 lanes per page, 16 total.

| Dimension | Values | Source |
|---|---|---|
| `device` | mobile / desktop | user-agent sniff |
| `desktopOS` | mac / windows | user-agent sniff; mobile skips this lane |
| `familiarity` | new / known | Typeform "how long followed Travis" (new = never + recent; known = months + over_year) |
| `capital` | high / low | Typeform "capital available" (high = have + access; low = save + none) |

Unknown values on familiarity/capital are **excluded** from any
experiment lane - we don't dilute test cells with visitors we can't
segment confidently.

A single visitor can qualify for several lanes at once (e.g. a
mobile + new + low-capital person matches 3 lanes). Independent
variant assignment per lane, so three concurrent tests all get
their own branch. Tests should target non-overlapping page surface
to keep results interpretation clean.

## The three KPIs

Every experiment is judged on three metrics; the winner is the
variant that beats control on at least one (and doesn't regress the
other two).

1. **Confirm-click rate** → `setter_confirm_text_clicked` /
   `closer_confirm_text_clicked` divided by
   `confirmation_page_viewed`. Windows users are excluded (no SMS
   click to measure).
2. **Dwell time** → sum of `confirmation_dwell_heartbeat` events per
   session × 15s. Longer dwell = more engaged.
3. **Video % watched** → `main_video_final_pct` fires on tab-hide
   or unmount with the high-water-mark pct. Also
   `main_video_watch_bucket` fires 25/50/75/100 thresholds.

## The event enrichment

Every PostHog event fires with
`active_experiments: ["exp-id:variant-id", ...]` as a property. One
PostHog Insights filter (`active_experiments CONTAINS "x:a"`)
isolates any metric to one arm. No per-event wiring in page code.

## Workflow

### Adding a new test

1. Edit [`src/experiments/registry.ts`](../src/experiments/registry.ts).
   Append one row to `EXPERIMENTS`:
   ```ts
   {
     id: 'setter-mobile-cta-copy',
     page: 'setter',
     segment: { device: 'mobile' },
     hypothesis: '...',
     startedAt: '2026-10-01',
     status: 'running',
     variants: [
       { id: 'control', label: 'Confirm via Text' },
       { id: 'bold',    label: 'YES - I\'ll be there' },
     ],
   }
   ```

2. In the component you want to vary, branch on the variant:
   ```tsx
   import { useExperiment } from '../experiments/useExperiment';
   const v = useExperiment('setter-mobile-cta-copy');
   const label = v?.id === 'bold' ? "YES - I'll be there" : 'Confirm via Text';
   ```

3. Commit + push. Netlify auto-deploys. Data starts flowing on next
   visit; `experiments_assigned` + `active_experiments` on every
   event tag the session.

### The cycle (weekly)

User prompt: *"check experiments"* (or similar).

Agent runs:

1. For each running experiment, query PostHog for sample size per
   arm. Minimum 300 per arm before stat-sig can be called.
2. For each metric, compute lift + significance:
   - Click rate: two-proportion z-test, p < 0.05
   - Dwell: Mann-Whitney U on per-session dwell seconds
   - Video %: Mann-Whitney U on per-session final pct
3. For each experiment that's reached significance on at least one
   KPI without regressing the others:
   - Declare the winner
   - Fold winning variant into page code (delete the branch, keep
     the winner's copy)
   - Flip registry entry to `status: 'completed'`, fill
     `winner` + `result` snapshot
   - Propose next hypothesis for that lane
4. Each lane without an active experiment gets a proposed next
   test. User reviews proposals before shipping.

### Rules of the system

- **No lane runs more than one experiment** at a time. The dev-time
  validator in `registry.ts` warns on collisions.
- **Each lane always has an experiment** running (goal; the registry
  starts seeded empty, cycle 1 populates all 16 lanes).
- **Deterministic assignment**: same visitor + same experiment =
  same variant across return visits. We hash `distinct_id +
  experiment.id`.
- **Winners merge back** into page code - the registry doesn't
  carry winning variants forward. Keeps the component code honest
  about what's actually live.
- **Historical completed experiments stay** in the registry with
  their result snapshot as the audit trail.

## File map

| File | Purpose |
|---|---|
| [`src/experiments/segments.ts`](../src/experiments/segments.ts) | Segment taxonomy + resolver |
| [`src/experiments/registry.ts`](../src/experiments/registry.ts) | Active + completed experiment rows |
| [`src/experiments/assignments.ts`](../src/experiments/assignments.ts) | Module-level cache; wires enrichment into `trackEvent` |
| [`src/experiments/useExperiment.ts`](../src/experiments/useExperiment.ts) | React hooks for init + variant lookup |
| [`src/components/TrainingNewSections.tsx`](../src/components/TrainingNewSections.tsx) | ResearchVideo fires watch-pct telemetry |
| [`src/lib/posthog.ts`](../src/lib/posthog.ts) | `trackEvent` enrichment + `getDistinctId` |
