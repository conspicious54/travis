import { useEffect } from 'react';
import { trackEvent, trackConfirmationPageViewed } from '../lib/posthog';
import { SCALERS_TRACK, SCALERS_LOGO_URL } from '../lib/scalers';

/* ───── /scalers/confirmation — Seller Growth Call confirmation ────
   Minimal thank-you page for the Scalers track. If you want this
   to render the full /trainingnew/closer treatment (coach bio,
   phone, calendar add, text/WhatsApp CTA), swap the body below
   for the TrainingNewCloser page component — but note that page
   requires an `owner` URL param to resolve a closer. Until Scalers
   has a defined closer rotation, this standalone page is cleaner.

   PLACEHOLDER: swap body copy, add resource links, etc.
──────────────────────────────────────────────────────────────────── */

export function ScalersConfirmation() {
  useEffect(() => {
    document.title = 'Passion Product Scalers — Call Confirmed';
    trackConfirmationPageViewed('generic', { funnel_track: SCALERS_TRACK });
    trackEvent('scalers_confirmation_viewed', { funnel_track: SCALERS_TRACK });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-xl px-5 pt-14 pb-16 text-center">
        <img
          src={SCALERS_LOGO_URL}
          alt="FBA Scalers"
          className="mx-auto mb-8 h-12 w-auto"
          loading="eager"
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          You're booked.
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          Check your email for the calendar invite. Your closer will audit your listing before the call.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Results not typical.
        </p>
      </main>
    </div>
  );
}
