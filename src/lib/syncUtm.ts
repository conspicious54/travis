/* ───── Browser-side attribution capture + sync to HubSpot ─────────
   Captures TWO families of URL-based attribution params and sends
   them server-side to land on the matching HubSpot contact
   properties so Google Ads / Meta Ads / LinkedIn Ads can do their
   offline-conversion tracking off the CRM contact:

   1. Standard UTMs (utm_source / utm_medium / utm_campaign / etc)
   2. Ad-platform click IDs:
        gclid  → hs_google_click_id   (Google Ads — required for
                                       GCLID-based offline conv)
        gbraid → also folded into hs_google_click_id (Google's iOS
                 in-app click id; HubSpot only has one Google slot)
        wbraid → ditto (Google's iOS web-from-app click id)
        fbclid → hs_facebook_click_id (Meta — ready for when the
                                       Meta Pixel + offline conv
                                       integration goes live)
        li_fat_id → hs_linkedin_click_id
        ttclid    → hs_tiktok_click_id

   Both families share the same sessionStorage envelope so a single
   persist + sync round-trip carries everything. The save-contact-
   utm function knows how to map browser-side names to the right
   HubSpot property names.
──────────────────────────────────────────────────────────────────── */

import { trackEvent } from './posthog';
import { isPlaceholder } from './urlParams';

const UTM_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
] as const;

/* Browser-side click-ID param names. Each ad platform uses a
   different query-string key. We read all of them from the URL and
   send to the server, which maps to the matching HubSpot
   hs_*_click_id property. gbraid and wbraid both end up under
   hs_google_click_id since HubSpot only exposes one Google slot. */
const CLICK_ID_FIELDS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'li_fat_id',
  'ttclid',
] as const;

/* Meta first-party cookies. Set by the Meta pixel when it loads
   on the page; we read them from document.cookie and stash them
   alongside click IDs so they're available for Meta Conversions
   API (server-side conversion uploads, more reliable than the
   browser pixel against adblockers / ITP). Until the Meta pixel
   is installed these will always be empty - capture is silent
   and starts working the moment the pixel goes in. */
const FB_COOKIE_FIELDS = ['_fbp', '_fbc'] as const;

const STORAGE_KEY = 'pp_utm_data';

export type UtmData = Partial<Record<(typeof UTM_FIELDS)[number], string>>;
export type ClickIdData = Partial<Record<(typeof CLICK_ID_FIELDS)[number], string>>;
export type FbCookieData = Partial<Record<(typeof FB_COOKIE_FIELDS)[number], string>>;
export type AttributionData = UtmData & ClickIdData & FbCookieData;

/* Internal: case-insensitive URL param read with placeholder strip */
function readParamsFromUrl<T extends string>(fields: readonly T[]): Partial<Record<T, string>> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<Record<T, string>> = {};
  for (const field of fields) {
    const direct = params.get(field);
    if (direct && !isPlaceholder(direct)) {
      result[field] = direct;
      continue;
    }
    for (const [k, v] of params.entries()) {
      if (k.toLowerCase() === field && v && !isPlaceholder(v)) {
        result[field] = v;
        break;
      }
    }
  }
  return result;
}

/** Read utm_* params from the current URL (case-insensitive).
    Skips placeholder values (e.g. "_____") so a broken merge tag
    doesn't pollute HubSpot UTM properties. */
export function readUtmFromUrl(): UtmData {
  return readParamsFromUrl(UTM_FIELDS);
}

/** Read ad-platform click IDs (gclid / fbclid / etc) from URL. */
export function readClickIdsFromUrl(): ClickIdData {
  return readParamsFromUrl(CLICK_ID_FIELDS);
}

/** Read Meta first-party cookies (_fbp / _fbc) from document.cookie.
    These are set by the Meta pixel when it loads - empty until the
    pixel is installed. Captured here so the Conversions API path
    (server-side) has the cookies whenever Meta integration goes in. */
export function readFbCookies(): FbCookieData {
  if (typeof document === 'undefined') return {};
  const result: FbCookieData = {};
  const cookies = document.cookie || '';
  for (const name of FB_COOKIE_FIELDS) {
    const match = cookies.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    if (match && match[1]) result[name] = decodeURIComponent(match[1]);
  }
  return result;
}

/** Read full attribution envelope from URL + Meta cookies in one
    shot. Convenience for places that want to forward everything. */
export function readAttributionFromUrl(): AttributionData {
  return { ...readUtmFromUrl(), ...readClickIdsFromUrl(), ...readFbCookies() };
}

/** Persist UTMs (and any click IDs found in the URL) in
    sessionStorage so they survive form submission. Despite the
    name, this also writes click IDs - kept as persistUtmsFromUrl
    so the existing call sites don't churn. */
export function persistUtmsFromUrl(): AttributionData {
  if (typeof window === 'undefined') return {};
  const fromUrl = readAttributionFromUrl();
  if (Object.keys(fromUrl).length === 0) {
    return readPersistedUtms();
  }
  try {
    const merged: AttributionData = { ...readPersistedUtms(), ...fromUrl };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return fromUrl;
  }
}

/** Read the persisted attribution envelope (UTMs + click IDs).
    Type name is historical - the storage now holds both. */
export function readPersistedUtms(): AttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as AttributionData;
  } catch {
    return {};
  }
}

/** Read just the click-ID portion of persisted attribution. */
export function readPersistedClickIds(): ClickIdData {
  const all = readPersistedUtms();
  const out: ClickIdData = {};
  for (const f of CLICK_ID_FIELDS) {
    if (all[f]) out[f] = all[f];
  }
  return out;
}

let lastSyncedKey = '';

/**
 * Fire-and-forget POST to /.netlify/functions/save-contact-utm.
 * Now sends BOTH UTMs and ad-platform click IDs (gclid, fbclid,
 * etc) - server maps click IDs to hs_*_click_id properties.
 * Never blocks the booking flow.
 */
export function syncContactUtms(
  email: string | null | undefined,
  // Free-form source label (e.g. 'newform_submit', 'applynow_view',
  // 'book_redirect') - used only as a diagnostic tag in PostHog.
  source: string
) {
  // Observability: fire one attempt event so we can see invocation rate
  // independent of whether the sync succeeded. Diagnostics for the
  // "why is contact_utm_synced near zero" investigation.
  trackEvent('contact_utm_sync_attempted', {
    source,
    has_email: !!email && email.includes('@'),
  });

  if (!email || !email.includes('@')) {
    trackEvent('contact_utm_sync_skipped', { source, reason: 'no_email' });
    return;
  }
  const attribution = readPersistedUtms();
  if (Object.keys(attribution).length === 0) {
    trackEvent('contact_utm_sync_skipped', { source, reason: 'no_utms_in_storage' });
    return;
  }

  const key = `${email.trim().toLowerCase()}|${JSON.stringify(attribution)}`;
  if (key === lastSyncedKey) {
    trackEvent('contact_utm_sync_skipped', { source, reason: 'duplicate_in_session' });
    return;
  }
  lastSyncedKey = key;

  const payload = JSON.stringify({ email, source, ...attribution });
  const url = '/.netlify/functions/save-contact-utm';

  // sendBeacon survives the post-booking redirect
  let queued = false;
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      queued = navigator.sendBeacon(url, blob);
    } catch {
      /* fall through */
    }
  }

  if (!queued) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
      .then(async (res) => {
        if (!res.ok) {
          trackEvent('contact_utm_sync_failed', { source, status: res.status });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data?.ok) {
          trackEvent('contact_utm_synced', {
            source,
            written: Object.keys(data.written || {}),
          });
        } else {
          trackEvent('contact_utm_sync_failed', { source, reason: data?.reason });
        }
      })
      .catch(() => {
        trackEvent('contact_utm_sync_failed', { source, reason: 'network_error' });
      });
  } else {
    trackEvent('contact_utm_synced', {
      source,
      via: 'beacon',
      utm_fields: Object.keys(utms),
    });
  }
}
