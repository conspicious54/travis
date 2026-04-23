/* ───── confirmation-page instrumentation hooks ──────────────────
   Engagement/intent signals for /trainingnew/setter and
   /trainingnew/closer. Each hook is self-contained and cleans up
   on unmount so it's safe to drop into pages that mount/unmount
   during normal navigation.
──────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react';
import { trackEvent } from './posthog';

type Location = 'setter' | 'closer';

/* ─── scroll depth ──────────────────────────────────────────────── */

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

/**
 * Fires `scroll_depth_reached` once per milestone (25/50/75/100%)
 * per page load. Properties: { faq_location, depth_pct }.
 */
export function useScrollDepth(location: Location) {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const compute = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const m of SCROLL_MILESTONES) {
        if (pct >= m && !firedRef.current.has(m)) {
          firedRef.current.add(m);
          trackEvent('scroll_depth_reached', {
            faq_location: location,
            depth_pct: m,
          });
        }
      }
    };

    // Throttle to rAF so we don't hammer PostHog on scroll
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        compute();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Fire once on mount in case the page is already scrolled (deep link)
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [location]);
}

/* ─── dwell time heartbeat ──────────────────────────────────────── */

/**
 * Fires `dwell_heartbeat` every 30 seconds the tab is visible,
 * capped at 10 minutes so we don't flood PostHog from idle tabs.
 * Pair with the page_viewed event to get a real dwell distribution.
 */
export function useDwellHeartbeat(location: Location) {
  useEffect(() => {
    const start = Date.now();
    const HEARTBEAT_MS = 30_000;
    const MAX_MS = 10 * 60_000;
    let lastSent = 0;

    const tick = () => {
      if (document.hidden) return;
      const elapsedMs = Date.now() - start;
      if (elapsedMs > MAX_MS) return;
      // Skip if we already sent a heartbeat for this second-bucket
      const seconds = Math.floor(elapsedMs / 1000);
      if (seconds === lastSent) return;
      lastSent = seconds;
      trackEvent('dwell_heartbeat', {
        faq_location: location,
        seconds_on_page: seconds,
      });
    };

    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [location]);
}

/* ─── phone number copy ─────────────────────────────────────────── */

/**
 * Fires `phone_number_copied` when the user copies text and the
 * selection contains (any prefix of) the displayed phone number. We
 * strip non-digits before comparing so formatting differences don't
 * matter.
 */
export function usePhoneCopyTracking(
  phoneDisplay: string,
  location: Location,
  region: string
) {
  useEffect(() => {
    if (!phoneDisplay) return;
    const phoneDigits = phoneDisplay.replace(/\D/g, '');
    if (phoneDigits.length < 6) return;

    const onCopy = () => {
      const sel = window.getSelection()?.toString() || '';
      const selDigits = sel.replace(/\D/g, '');
      if (!selDigits) return;
      // Treat a copy as "phone copied" if 6+ digits of it match. Covers
      // partial selection of the number and the case where someone
      // grabs surrounding context along with it.
      if (
        selDigits.length >= 6 &&
        (phoneDigits.includes(selDigits) || selDigits.includes(phoneDigits.slice(-7)))
      ) {
        trackEvent('phone_number_copied', {
          faq_location: location,
          region,
        });
      }
    };

    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [phoneDisplay, location, region]);
}

/* ─── confirm app-switch proxy ──────────────────────────────────── */

/**
 * Returns a fn to call at the moment a confirm button is clicked.
 * If the tab blurs within 15 seconds, we fire
 * `confirm_app_switched` — a proxy for "they actually opened
 * Messages/WhatsApp instead of just clicking and bailing". If they
 * stay on the page, we fire `confirm_app_stayed`. Either way, one
 * outcome event per click.
 */
export function useConfirmAppSwitch(location: Location) {
  const pendingRef = useRef<{
    channel: 'sms' | 'whatsapp';
    coach: string;
    clickedAt: number;
    timeoutId: number;
  } | null>(null);

  useEffect(() => {
    const onBlur = () => {
      const pending = pendingRef.current;
      if (!pending) return;
      const elapsed = Date.now() - pending.clickedAt;
      if (elapsed <= 15_000) {
        trackEvent('confirm_app_switched', {
          faq_location: location,
          channel: pending.channel,
          coach_first_name: pending.coach,
          latency_ms: elapsed,
        });
      }
      window.clearTimeout(pending.timeoutId);
      pendingRef.current = null;
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [location]);

  return (channel: 'sms' | 'whatsapp', coach: string) => {
    // If a previous click is still pending, clear it so we don't
    // double-fire from a stale timer.
    if (pendingRef.current) window.clearTimeout(pendingRef.current.timeoutId);
    const timeoutId = window.setTimeout(() => {
      trackEvent('confirm_app_stayed', {
        faq_location: location,
        channel,
        coach_first_name: coach,
      });
      pendingRef.current = null;
    }, 15_000);
    pendingRef.current = {
      channel,
      coach,
      clickedAt: Date.now(),
      timeoutId,
    };
  };
}

/* ─── Sproutvideo player events ─────────────────────────────────── */

/**
 * Listens for postMessage events from Sproutvideo iframes and
 * forwards them as PostHog events. Call once near the root of a
 * page that embeds Sproutvideo players. Cross-origin, so we can't
 * inspect the iframes themselves — this just reacts to whatever the
 * player posts.
 *
 * Observed Sproutvideo message shapes include keys like `type` or
 * `messageName` with values "play", "pause", "completed", and
 * optional `percentComplete`. We normalize to
 * `sproutvideo_<kind>` and attach the raw payload for debugging.
 */
export function useSproutvideoTracking(location: Location) {
  useEffect(() => {
    const MILESTONE_KEYS: Record<string, string> = {
      play: 'sproutvideo_started',
      played: 'sproutvideo_started',
      pause: 'sproutvideo_paused',
      paused: 'sproutvideo_paused',
      completed: 'sproutvideo_completed',
      complete: 'sproutvideo_completed',
      ended: 'sproutvideo_completed',
    };
    const seenPerVideo = new Map<string, Set<string>>();

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.includes('sproutvideo.com')) return;
      let data: any = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;

      const kind = String(data.type || data.messageName || data.event || '').toLowerCase();
      const eventName = MILESTONE_KEYS[kind];
      if (!eventName) return;

      const videoId = String(data.videoId || data.id || data.player || 'unknown');
      let seen = seenPerVideo.get(videoId);
      if (!seen) {
        seen = new Set();
        seenPerVideo.set(videoId, seen);
      }
      if (seen.has(eventName)) return;
      seen.add(eventName);

      trackEvent(eventName, {
        faq_location: location,
        video_id: videoId,
        percent_complete: typeof data.percentComplete === 'number' ? data.percentComplete : undefined,
      });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [location]);
}
