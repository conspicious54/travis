/* ───── Campaign variant resolver ─────────────────────────────────
   Reads utm_source + utm_campaign from the URL, normalizes them,
   and returns the matching active CampaignVariant (if any).

   Resolution is synchronous against a static config, so the
   correct variant is available on first render — no flicker
   from default → variant.

   Also handles per-session persistence: the matched variant id
   is stashed in sessionStorage so form submissions later in
   the visit still carry the attribution even if URL params
   get stripped by intermediate pages.
──────────────────────────────────────────────────────────────────── */

import { CAMPAIGN_VARIANTS, type CampaignVariant } from '../config/campaignVariants';

const SESSION_KEY = 'pp_matched_campaign_variant_id';

/** Lowercase + trim. UTMs are typically ASCII; we normalize to survive
    casual capitalization differences on outbound links. */
export function normalizeUtm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

/** Read utm_source + utm_campaign directly from the current URL. */
export function readCampaignFromURL(): { source: string; campaign: string } {
  if (typeof window === 'undefined') return { source: '', campaign: '' };
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: normalizeUtm(params.get('utm_source')),
      campaign: normalizeUtm(params.get('utm_campaign')),
    };
  } catch {
    return { source: '', campaign: '' };
  }
}

/** Find the first active variant matching both source and campaign
    after normalization. Returns null when either is empty, no active
    row matches, or the table is empty. */
export function resolveCampaignVariant(
  source: string,
  campaign: string
): CampaignVariant | null {
  const s = normalizeUtm(source);
  const c = normalizeUtm(campaign);
  if (!s || !c) return null;
  for (const v of CAMPAIGN_VARIANTS) {
    if (!v.active) continue;
    if (normalizeUtm(v.utm_source) === s && normalizeUtm(v.utm_campaign) === c) {
      return v;
    }
  }
  return null;
}

/** Read URL, resolve variant, and stash the matched id in sessionStorage
    so the current tab's form submissions can carry the attribution
    even if URL params get stripped later. Safe to call at mount time. */
export function loadCampaignVariant(): CampaignVariant | null {
  const { source, campaign } = readCampaignFromURL();
  const variant = resolveCampaignVariant(source, campaign);
  if (variant && typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SESSION_KEY, variant.id);
    } catch {
      /* no-op — private mode, quota, etc. */
    }
  }
  return variant;
}

/** Read the previously-stashed variant id, if any. Used by downstream
    pages that want to preserve attribution but don't re-read URL. */
export function getStoredVariantId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
