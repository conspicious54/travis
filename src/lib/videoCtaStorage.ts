/* ───── Video CTA session storage ──────────────────────────────────
   Tiny, dependency-free read/write of the source-video CTA match for
   this tab. Split out of videoCta.ts so posthog.ts can enrich every
   event without pulling the full video table into every page bundle.
──────────────────────────────────────────────────────────────────── */

import { isCtaArchetype, type CtaArchetype } from '../config/ctaArchetypes';

const SS_ARCHETYPE = 'pp_cta_archetype';
const SS_VIDEO_ID = 'pp_source_video_id';

export function readStoredVideoCta(): { archetype: CtaArchetype | null; videoId: string | null } {
  if (typeof window === 'undefined') return { archetype: null, videoId: null };
  try {
    const a = window.sessionStorage.getItem(SS_ARCHETYPE);
    return {
      archetype: isCtaArchetype(a) ? a : null,
      videoId: window.sessionStorage.getItem(SS_VIDEO_ID),
    };
  } catch {
    return { archetype: null, videoId: null };
  }
}

export function writeStoredVideoCta(archetype: CtaArchetype, videoId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SS_ARCHETYPE, archetype);
    if (videoId) window.sessionStorage.setItem(SS_VIDEO_ID, videoId);
    else window.sessionStorage.removeItem(SS_VIDEO_ID);
  } catch {
    /* no-op — private mode, quota, etc. */
  }
}

/** Analytics props for this tab's match; empty when nothing matched. */
export function getStoredVideoCtaProps(): { cta_archetype?: CtaArchetype; source_video_id?: string } {
  const s = readStoredVideoCta();
  const out: { cta_archetype?: CtaArchetype; source_video_id?: string } = {};
  if (s.archetype) out.cta_archetype = s.archetype;
  if (s.videoId) out.source_video_id = s.videoId;
  return out;
}
