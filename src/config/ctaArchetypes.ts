/* ───── CTA types (archetypes) ──────────────────────────────────────
   Every YouTube video pitches one of a handful of offers in its
   description-link CTA. When a visitor arrives from a known video we
   swap the funnel's button copy to echo that promise, so the click
   feels like a continuation of what Travis just said.

   Which video maps to which type: src/config/videoCtas.ts (generated
   from the CTA sheet by scripts/build_video_ctas.py) plus manual
   overrides in src/config/videoCtaOverrides.ts.

   'default' means "no change": the page keeps today's copy (and, on
   /nextstep, the running PostHog CTA-copy A/B test).

   Precedence on /: a campaignVariants.ts row's cta_text wins, then the
   video's type below, then the page default.
──────────────────────────────────────────────────────────────────── */

export type CtaArchetype =
  | 'call_plan' | 'call' | 'program' | 'apply'   // pitch-based (what the video's CTA promised)
  | 'dropshipping' | 'affiliate'                  // topic-based (viewer came for a different model)
  | 'default';

export const CTA_ARCHETYPES: readonly CtaArchetype[] = [
  'call_plan', 'call', 'program', 'apply', 'dropshipping', 'affiliate', 'default',
];

export interface ArchetypeCopy {
  /** Human label for docs / dashboards. */
  label: string;
  /** What the video promises (for reference only). */
  promise: string;
  /** Submit button on the / lead page (default: SIGN UP TO WATCH NOW). */
  newform_button: string;
  /** Green CTA on /nextstep (default: the nextstep-cta-copy-test arm). */
  nextstep_button: string;
}

export const CTA_ARCHETYPE_COPY: Record<Exclude<CtaArchetype, 'default'>, ArchetypeCopy> = {
  call_plan: {
    label: 'Free call + custom game plan',
    promise: 'Free call where the team builds you a 90-day / 6-month game plan or roadmap',
    newform_button: 'GET MY FREE GAME PLAN',
    nextstep_button: 'Build My Free Game Plan',
  },
  call: {
    label: 'Free strategy call',
    promise: 'Free strategy / coaching / one-on-one call',
    newform_button: 'CLAIM MY FREE CALL',
    nextstep_button: 'Get My Free Strategy Call',
  },
  program: {
    label: 'Accelerator program',
    promise: 'The Accelerator / mentorship program ("opened up spots")',
    newform_button: "YES, I'M READY TO START",
    nextstep_button: 'Yes! Help Me Build My Business',
  },
  apply: {
    label: 'Work with us / apply',
    promise: '"Work with us", "I want to hire / invest in you"',
    newform_button: "LET'S WORK WITH TRAVIS",
    nextstep_button: "Yes! Start My Application",
  },
  /* Topic-based types: the viewer came for a different business model.
     Still send them straight into the Amazon funnel, but word it as an
     invitation ("too", "curious?") rather than assuming Amazon FBA is
     what they came for. No comparisons. These win over the pitch-based
     types above. */
  dropshipping: {
    label: 'Dropshipping video',
    promise: 'Video about dropshipping (viewer came for a different model)',
    newform_button: 'EXPLORE AMAZON FBA TOO',
    nextstep_button: "I'm Curious, Show Me More",
  },
  affiliate: {
    label: 'Affiliate / website-tool video',
    promise: 'Affiliate marketing, web hosting, WordPress / WooCommerce tutorials',
    newform_button: 'CURIOUS? SEE AMAZON FBA',
    nextstep_button: "Yes, I'm Open To Amazon FBA",
  },
};

export function isCtaArchetype(v: unknown): v is CtaArchetype {
  return typeof v === 'string' && (CTA_ARCHETYPES as readonly string[]).includes(v);
}
