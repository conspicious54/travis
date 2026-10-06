import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanParam } from '../lib/urlParams';

/* ───── /loading — fast-path VSL bridge ─────────────────────────────
   A stripped-down copy of /router for target-country visitors who just
   submitted /newform. They've already been geo-classified as target by
   /newform, so there's no need to re-run the ipapi.co lookup, the DQ
   capital question flow, or the server-side identity bridge (identity
   is already in the URL from the form submit).

   Jobs:
     - Show the same loading animation as /router so target-path visitors
       get the identical visual bridge between submit and VSL.
     - Fire the same router tracking webhook so analytics stay consistent.
     - identifyUser from URL params (fast — no bridge call needed).
     - Preserve the full query string on the redirect to /nextstep so
       attribution + identity carry through unchanged.

   /router stays unchanged for:
     - Non-target /newform visitors (so they still hit the DQ capital
       question).
     - CF-origin visitors arriving from start.travismarziani.com without
       URL identity (so the server-side identity bridge still runs).
──────────────────────────────────────────────────────────────────── */

const DESTINATION = '/nextstep';
const TRACKING_ENDPOINT = 'https://dashboardpp.vercel.app/api/webhooks/router';
// Lower bound so the animation has time to play through; the fetch +
// redirect usually completes within this. Shorter than /router's full
// path because we're skipping the ipapi.co + identity-bridge calls.
const MIN_DISPLAY_MS = 1200;

function getPassthroughParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function fireTracking(): Promise<void> {
  const p = getPassthroughParams();
  const data = {
    email: p.get('email') || '',
    first_name: p.get('first_name') || '',
    last_name: p.get('last_name') || '',
    country: p.get('country') || '',
    // We know result up front — this path is only reached when /newform
    // already classified the visitor as target. Keeps dashboard
    // segmentation consistent with /router emits.
    result: 'qualified',
    has_500: '',
    utm_source:   p.get('utm_source')   || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_medium:   p.get('utm_medium')   || '',
  };
  return fetch(TRACKING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(() => {})
    .catch(() => {});
}

function buildRedirectUrl(): string {
  // Preserve the full query string — identity, UTMs, click IDs, campaign
  // variant IDs, lead magnet IDs. Downstream pages (/nextstep → /applynow)
  // chain the same forwarding.
  const qs = window.location.search;
  return qs ? `${DESTINATION}${qs}` : DESTINATION;
}

export function Loading() {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const params = getPassthroughParams();
    const incomingEmail = (getCleanParam(params, 'email') || '').toLowerCase();
    if (incomingEmail && incomingEmail.includes('@')) {
      identifyUser(incomingEmail, {
        first_name: getCleanParam(params, 'first_name') || getCleanParam(params, 'firstname') || '',
        last_name:  getCleanParam(params, 'last_name')  || getCleanParam(params, 'lastname')  || '',
      });
    }

    trackEvent('loading_visited', {
      has_email: !!incomingEmail,
      utm_source:   params.get('utm_source')   || null,
      utm_medium:   params.get('utm_medium')   || null,
      utm_campaign: params.get('utm_campaign') || null,
    });

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? prev : prev + Math.random() * 10));
    }, 150);

    const startedAt = Date.now();
    (async () => {
      await fireTracking();
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      trackEvent('loading_redirecting', { destination: DESTINATION });
      window.location.replace(buildRedirectUrl());
    })();

    return () => clearInterval(progressInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient blobs — same visual as /router's loading screen */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-20 h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
              <Rocket className="w-8 h-8 text-orange-400 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white via-orange-50 to-orange-100 bg-clip-text text-transparent">
            Your training resources are loading...
          </h1>

          <p className="text-slate-400 text-sm">
            Preparing your personalized experience
          </p>
        </div>

        <div className="relative w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/50">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-orange-500/50"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/50 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
