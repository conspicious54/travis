/* ───── Manual video → CTA type overrides ──────────────────────────
   Hand-edited. Wins over the generated src/config/videoCtas.ts, and
   survives re-running scripts/build_video_ctas.py.

   Keyed by the utm_campaign slug from the UTM Tags Tracker (lowercase).
   Use it when the classifier picks the wrong type for a video, or for
   a brand-new video that isn't in the CTA sheet yet:

     'findmanufacturersep2026': 'call_plan',

   Types: 'call_plan' | 'call' | 'program' | 'apply' | 'dropshipping' |
   'affiliate' | 'default'
   (see src/config/ctaArchetypes.ts).
──────────────────────────────────────────────────────────────────── */

import type { CtaArchetype } from './ctaArchetypes';

export const VIDEO_CTA_OVERRIDES: Readonly<Record<string, CtaArchetype>> = {
};
