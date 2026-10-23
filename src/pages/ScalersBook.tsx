import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent, trackBookingPageViewed, trackBookingCompleted } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import {
  SCALERS_TRACK,
  SCALERS_ONCEHUB_PAGE,
  SCALERS_CONFIRMATION_PATH,
  SCALERS_LOGO_URL,
} from '../lib/scalers';

/* ───── /scalers/book — Seller Growth Call booking ────────────────
   OnceHub embed for the Scalers-specific calendar. Mirrors Book.tsx
   / BookCall.tsx structure: listens for the oncehub.booking.scheduled
   postMessage, fires booking_completed with booking_type='scalers_closer',
   and routes to /scalers/confirmation.

   PLACEHOLDERS:
     - OnceHub page name in SCALERS_ONCEHUB_PAGE (currently points
       at a non-existent "seller-growth-call" page so the embed
       will render OnceHub's not-found view until Connor swaps in
       the real page name).
──────────────────────────────────────────────────────────────────── */

export function ScalersBook() {
  const navigate = useNavigate();
  const seed = useMemo(
    () => getCleanIdentity(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')),
    [],
  );

  const oncehubUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (seed.email) params.set('email', seed.email);
    if (seed.firstname) params.set('name', [seed.firstname, seed.lastname].filter(Boolean).join(' '));
    if (seed.phone) params.set('mobile_phone', seed.phone);
    const qs = params.toString();
    return `https://meetings.hubspot.com/${SCALERS_ONCEHUB_PAGE}${qs ? `?${qs}` : ''}`;
  }, [seed]);

  useEffect(() => {
    document.title = 'Passion Product Scalers — Schedule Your Seller Growth Call';
    trackBookingPageViewed('closer');
    trackEvent('scalers_book_viewed', { funnel_track: SCALERS_TRACK });

    const onMessage = (e: MessageEvent) => {
      if (!e?.data) return;
      const raw = typeof e.data === 'string' ? e.data : '';
      if (!raw.includes('booking.scheduled')) return;
      try {
        const payload = JSON.parse(raw);
        if (payload?.type && String(payload.type).includes('booking.scheduled')) {
          trackBookingCompleted('closer', {
            funnel_track: SCALERS_TRACK,
            scheduled_at: payload?.payload?.starting_time,
          });
          trackEvent('scalers_booking_completed', { funnel_track: SCALERS_TRACK });
          navigate(SCALERS_CONFIRMATION_PATH);
        }
      } catch { /* no-op */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-3xl px-5 pt-8 pb-16 md:pt-14">
        <img
          src={SCALERS_LOGO_URL}
          alt="FBA Scalers"
          className="mb-6 h-10 w-auto"
          loading="eager"
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Pick a time for your Seller Growth Call.
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Your closer will have your audit pulled up when you arrive.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Seller Growth Call scheduler"
            src={oncehubUrl}
            className="h-[720px] w-full"
            allow="camera; microphone; autoplay; encrypted-media; fullscreen"
          />
        </div>
      </main>
    </div>
  );
}
