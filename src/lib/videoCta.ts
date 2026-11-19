/* ───── YouTube video → CTA type resolver ──────────────────────────
   Uses the existing YouTube UTM mapping: every video description links
   to the funnel as ?utm_source=youtube&utm_campaign=<slug>, with the
   slug assigned in the UTM Tags Tracker sheet
   (data/youtube-utm-tags.csv). scripts/build_video_ctas.py joins that
   sheet with the CTA sheet into src/config/videoCtas.ts:
   slug → CTA type (see src/config/ctaArchetypes.ts).

   Resolution (first hit wins):
     1. ?cta_archetype=<type> — explicit type. Forwarded by newform-post
        on the 302 to /nextstep; also lets you preview any type.
     2. utm_source=youtube + a known utm_campaign slug. Same matching
        rules as campaignVariants (lowercased + trimmed).
     3. Whatever was matched earlier in this tab (sessionStorage), so
        later funnel pages keep the copy even if params drop.

   Unknown / missing → 'default': pages render exactly as before.
   Synchronous against static config: no flicker.
──────────────────────────────────────────────────────────────────── */

import {
  CTA_ARCHETYPE_COPY,
  isCtaArchetype,
  type ArchetypeCopy,
  type CtaArchetype,
} from '../config/ctaArchetypes';
import { VIDEO_CTAS } from '../config/videoCtas';
import { VIDEO_CTA_OVERRIDES } from '../config/videoCtaOverrides';
import { normalizeUtm } from './campaignVariant';
import { readStoredVideoCta, writeStoredVideoCta } from './videoCtaStorage';

export { getStoredVideoCtaProps } from './videoCtaStorage';

export interface VideoCta {
  /** Matched YouTube video id, or null. */
  videoId: string | null;
  /** CTA type. 'default' = no copy change. */
  archetype: CtaArchetype;
  /** Copy for the type, or null when archetype is 'default'. */
  copy: ArchetypeCopy | null;
}

/* slug → [archetype, videoId]. Overrides win. Built once, lazily. */
let lookup: Map<string, readonly [CtaArchetype, string | null]> | null = null;
function getLookup() {
  if (lookup) return lookup;
  lookup = new Map();
  for (const [slug, arch, videoId] of VIDEO_CTAS) lookup.set(slug, [arch, videoId]);
  for (const [slug, arch] of Object.entries(VIDEO_CTA_OVERRIDES)) {
    const key = normalizeUtm(slug);
    lookup.set(key, [arch, lookup.get(key)?.[1] ?? null]);
  }
  return lookup;
}

function build(videoId: string | null, archetype: CtaArchetype): VideoCta {
  return {
    videoId,
    archetype,
    copy: archetype === 'default' ? null : CTA_ARCHETYPE_COPY[archetype],
  };
}

/** Pure resolution from a query string (no storage). */
export function resolveVideoCtaFromParams(params: URLSearchParams): VideoCta | null {
  const source = normalizeUtm(params.get('utm_source'));
  const campaign = normalizeUtm(params.get('utm_campaign'));
  const hit = source === 'youtube' && campaign ? getLookup().get(campaign) ?? null : null;

  // source_video_id is what newform-post forwards to /nextstep.
  const forwardedId = (params.get('source_video_id') || '').trim();
  const videoId = hit?.[1] ?? (forwardedId || null);

  const explicit = normalizeUtm(params.get('cta_archetype'));
  if (isCtaArchetype(explicit)) return build(videoId, explicit);
  if (hit) return build(videoId, hit[0]);
  return null;
}

/** Resolve from the current URL, falling back to this tab's earlier
    match. Stores a fresh URL match so later pages inherit it. Safe to
    call during render (SSR-safe, never throws). */
export function loadVideoCta(): VideoCta {
  if (typeof window === 'undefined') return build(null, 'default');
  let fromUrl: VideoCta | null = null;
  try {
    fromUrl = resolveVideoCtaFromParams(new URLSearchParams(window.location.search));
  } catch {
    fromUrl = null;
  }
  if (fromUrl) {
    writeStoredVideoCta(fromUrl.archetype, fromUrl.videoId);
    return fromUrl;
  }
  const s = readStoredVideoCta();
  if (s.archetype) return build(s.videoId, s.archetype);
  return build(null, 'default');
}
