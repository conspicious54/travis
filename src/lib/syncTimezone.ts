/* ───── browser-side timezone sync to HubSpot ─────────────────────
   Fire-and-forget: capture the browser's IANA timezone identifier
   (the one the OS / phone is set to) and POST it to a Netlify
   function that writes it onto the contact's hs_timezone property.

   HubSpot SMS/email automations can then format meeting times in
   the recipient's local zone without any guesswork.

   This call NEVER blocks. If it fails, the user's booking flow is
   unaffected. Errors are logged to PostHog as
   contact_timezone_sync_failed and to console.
──────────────────────────────────────────────────────────────────── */

import { trackEvent } from './posthog';

let lastSyncedKey = '';

export function syncContactTimezone(
  email: string | null | undefined,
  source: 'book_redirect' | 'closer_confirmation' | 'setter_confirmation'
) {
  if (!email || !email.includes('@')) return;
  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    /* old browsers — give up silently */
  }
  if (!timezone) return;

  // Avoid hammering the function on re-renders or refreshes within
  // the same session.
  const key = `${email.trim().toLowerCase()}|${timezone}`;
  if (key === lastSyncedKey) return;
  lastSyncedKey = key;

  const payload = JSON.stringify({ email, timezone, source });

  // Use sendBeacon when available so the request survives the page
  // unloading right after a booking redirect. Falls back to fetch.
  const url = '/.netlify/functions/save-contact-timezone';
  let queued = false;
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      queued = navigator.sendBeacon(url, blob);
    } catch {
      /* fall through to fetch */
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
          trackEvent('contact_timezone_sync_failed', { source, status: res.status });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data?.ok) {
          trackEvent('contact_timezone_synced', { source, timezone });
        } else {
          trackEvent('contact_timezone_sync_failed', { source, reason: data?.reason });
        }
      })
      .catch((err) => {
        trackEvent('contact_timezone_sync_failed', { source, reason: 'network_error' });
        // eslint-disable-next-line no-console
        console.warn('[syncTimezone] failed', err);
      });
  } else {
    // sendBeacon doesn't give us a response, so we optimistically log
    trackEvent('contact_timezone_synced', { source, timezone, via: 'beacon' });
  }
}
