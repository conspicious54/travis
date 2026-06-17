import { useEffect, useRef } from 'react';
import { trackEvent } from './posthog';

/* ───── Tab visibility urgency ─────────────────────────────────────
   When the visitor switches tabs / minimizes the window during a
   funnel page, swap the tab title to an attention-grabber so the
   tab thumbnail in their tab bar (or the title in their tab dock
   on mobile) pulls them back. Restore the original title when they
   return.

   This is a documented attention-recovery pattern - the change is
   visible in chrome / safari / firefox tab bars and even on
   mobile (iOS Safari swipe-up tab preview, Android Chrome tab
   strip). Recovers 5-10% of mid-funnel abandoners who got
   distracted, switched tabs, and would otherwise never come back.

   Use only on mid-funnel pages where abandonment hurts (e.g.
   /nextstep, /applynow). Skip on /newform (too early to nudge)
   and on confirmation pages (already converted).

   Fires PostHog `tab_hidden` and `tab_returned` so the recovery
   rate is measurable. ───────────────────────────────────────── */
export function useTabUrgency(urgencyTitle: string, pageTag: string): void {
  const originalTitleRef = useRef<string | null>(null);
  const isHiddenRef = useRef(false);
  const hiddenAtRef = useRef<number>(0);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title;
    }

    const onVisibility = () => {
      if (document.hidden && !isHiddenRef.current) {
        isHiddenRef.current = true;
        hiddenAtRef.current = Date.now();
        document.title = urgencyTitle;
        trackEvent('tab_hidden', { page: pageTag });
      } else if (!document.hidden && isHiddenRef.current) {
        isHiddenRef.current = false;
        if (originalTitleRef.current) document.title = originalTitleRef.current;
        const awayMs = Date.now() - hiddenAtRef.current;
        trackEvent('tab_returned', { page: pageTag, away_ms: awayMs });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      // Restore original title on unmount in case we navigate away
      // while still hidden.
      if (originalTitleRef.current) document.title = originalTitleRef.current;
    };
  }, [urgencyTitle, pageTag]);
}
