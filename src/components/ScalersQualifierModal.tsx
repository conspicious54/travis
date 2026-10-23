import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/posthog';
import { SCALERS_QUALIFIER_SESSION_KEY } from '../lib/scalers';

/* ───── Scalers qualifier modal ────────────────────────────────────
   Shows on the main landing page's first paint. One question:
   "Do you already have a product live on Amazon?" Yes routes the
   visitor to /scalers (the Scalers-track leadpage). No dismisses
   the modal and the visitor continues on the main funnel.

   Dismissal persists for the session (sessionStorage) so the modal
   doesn't re-nag a visitor who already answered. It also auto-skips
   when the user lands directly with ?track=scalers in the URL
   (they already self-selected via an ad or shortlink).

   Shopify / non-Amazon sellers naturally pick "No" — the Scalers
   offer is Amazon-specific (PPC, listings, FBA inventory), and
   that's exactly what the question copy prompts them on.
──────────────────────────────────────────────────────────────────── */

export function ScalersQualifierModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('track') === 'scalers') return;
      if (sessionStorage.getItem(SCALERS_QUALIFIER_SESSION_KEY)) return;
      // Delay one tick so the leadpage paints first — the modal
      // then floats over an already-rendered page, not a blank one.
      const t = setTimeout(() => {
        setOpen(true);
        trackEvent('scalers_qualifier_shown');
      }, 350);
      return () => clearTimeout(t);
    } catch { /* no-op */ }
  }, []);

  if (!open) return null;

  const close = (answer: 'yes' | 'no') => {
    try { sessionStorage.setItem(SCALERS_QUALIFIER_SESSION_KEY, answer); } catch { /* no-op */ }
    trackEvent('scalers_qualifier_answered', { answer });
    setOpen(false);
    if (answer === 'yes') navigate('/scalers');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scalers-qualifier-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <h2
          id="scalers-qualifier-title"
          className="text-xl font-semibold text-slate-900 sm:text-2xl"
        >
          Before we start.
        </h2>
        <p className="mt-3 text-base text-slate-700">
          Do you already have a product live on Amazon?
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Shopify, Etsy, or other platforms count as no. We mean a live listing on Amazon.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => close('yes')}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Yes, I'm selling on Amazon
          </button>
          <button
            type="button"
            onClick={() => close('no')}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Not yet, or I sell elsewhere
          </button>
        </div>
      </div>
    </div>
  );
}
