import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/posthog';
import {
  SCALERS_TRACK,
  SCALERS_VSL_WISTIA_ID,
  SCALERS_APPLY_PATH,
  SCALERS_LOGO_URL,
} from '../lib/scalers';

/* ───── /scalers/vsl — Scalers VSL ─────────────────────────────────
   Placeholder video (currently points at the main VSL's Wistia id)
   until Connor records the Scalers-specific VSL. Swap the id in
   src/lib/scalers.ts and this page updates automatically.

   PLACEHOLDERS marked below:
     - headline copy (approve wording)
     - Wistia id in SCALERS_VSL_WISTIA_ID (points at main VSL for now)
     - no video-progress milestones yet (main /nextstep has quartile
       tracking; add equivalents here once the real VSL is in place
       and we know its runtime)
──────────────────────────────────────────────────────────────────── */

export function ScalersVsl() {
  const navigate = useNavigate();

  // Preserve any URL params (email, utm, etc.) when sending the
  // visitor on to /scalers/apply so attribution survives the hop.
  const applyHref = useMemo(() => {
    if (typeof window === 'undefined') return SCALERS_APPLY_PATH;
    const qs = window.location.search || '';
    return qs ? `${SCALERS_APPLY_PATH}${qs}` : SCALERS_APPLY_PATH;
  }, []);

  useEffect(() => {
    document.title = 'Passion Product Scalers — Audit Walkthrough';
    trackEvent('scalers_vsl_viewed', { funnel_track: SCALERS_TRACK });
  }, []);

  const onCta = () => {
    trackEvent('scalers_vsl_cta_clicked', { funnel_track: SCALERS_TRACK });
    navigate(applyHref);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-3xl px-5 pt-8 pb-16 md:pt-14">
        <img
          src={SCALERS_LOGO_URL}
          alt="FBA Scalers"
          className="mb-6 h-10 w-auto"
          loading="eager"
        />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          How we audit stuck Amazon listings.
        </h1>
        <p className="mt-3 text-base text-slate-700 sm:text-lg">
          Watch this short walkthrough. When you're ready, apply for a Seller Growth Call and we'll pull up your listing live on the call.
        </p>

        <div
          className="relative mt-8 w-full overflow-hidden rounded-xl bg-slate-900 shadow-xl"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            title="Scalers audit walkthrough"
            src={`https://fast.wistia.net/embed/iframe/${SCALERS_VSL_WISTIA_ID}?seo=true&videoFoam=true`}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            onLoad={() => trackEvent('scalers_vsl_started', { funnel_track: SCALERS_TRACK })}
          />
        </div>

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCta}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Apply for a Seller Growth Call
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Results not typical. Individual outcomes depend on effort, product, and market.
        </p>
      </main>
    </div>
  );
}
