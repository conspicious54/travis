/* ───── browser-side UTM capture + sync to HubSpot ────────────────
   On the booking pages (/book, /bookacall), we grab any utm_*
   params from the URL, persist them in sessionStorage (so they
   survive a HubSpot iframe interaction), and POST them to the
   save-contact-utm function after the meetingBookSucceeded event.

   The server only writes UTM properties that are currently empty,
   so first-touch attribution is preserved.
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

const STORAGE_KEY = 'pp_utm_data';

export type UtmData = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

/** Read utm_* params from the current URL (case-insensitive).
    Skips placeholder values (e.g. "_____") so a broken merge tag
    doesn't pollute HubSpot UTM properties. */
export function readUtmFromUrl(): UtmData {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: UtmData = {};
  for (const field of UTM_FIELDS) {
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

/** Persist UTMs in sessionStorage so they survive form submission. */
export function persistUtmsFromUrl(): UtmData {
  if (typeof window === 'undefined') return {};
  const fromUrl = readUtmFromUrl();
  if (Object.keys(fromUrl).length === 0) {
    return readPersistedUtms();
  }
  try {
    const merged = { ...readPersistedUtms(), ...fromUrl };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return fromUrl;
  }
}

export function readPersistedUtms(): UtmData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as UtmData;
  } catch {
    return {};
  }
}

let lastSyncedKey = '';

/**
 * Fire-and-forget POST to /.netlify/functions/save-contact-utm.
 * Never blocks the booking flow. Server respects "don't override
 * existing values" - only fills in UTM properties that are empty.
 */
export function syncContactUtms(
  email: string | null | undefined,
  source:
    | 'book_redirect'
    | 'bookacall_redirect'
    | 'setter_confirmation'
    | 'closer_confirmation'
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
  const utms = readPersistedUtms();
  if (Object.keys(utms).length === 0) {
    trackEvent('contact_utm_sync_skipped', { source, reason: 'no_utms_in_storage' });
    return;
  }

  const key = `${email.trim().toLowerCase()}|${JSON.stringify(utms)}`;
  if (key === lastSyncedKey) {
    trackEvent('contact_utm_sync_skipped', { source, reason: 'duplicate_in_session' });
    return;
  }
  lastSyncedKey = key;

  const payload = JSON.stringify({ email, source, ...utms });
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
