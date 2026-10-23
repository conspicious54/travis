import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { readAttribution } from '../lib/syncUtm';
import {
  SCALERS_TRACK,
  SCALERS_HS_PROPS,
  SCALERS_MONTHLY_SALES_OPTIONS,
  SCALERS_OFFER_OPTIONS,
  SCALERS_LOGO_URL,
} from '../lib/scalers';

/* ───── /scalers/apply — Scalers application form ─────────────────
   Native React form (no Typeform) so the Scalers-specific fields
   land directly in HubSpot without a Typeform licence or embed. If
   Connor later wants to swap in a Typeform, drop its id into
   SCALERS_TYPEFORM_ID in src/lib/scalers.ts and replace the <form>
   below with the Typeform embed used in ApplyNow.tsx.

   Submit path: posts to /.netlify/functions/newform-post with
   stage=scalers_apply + track=scalers. The function forwards every
   field to Zapier → HubSpot and 302s to /scalers/book on success.

   PLACEHOLDERS:
     - the five scalers_* HubSpot property names in SCALERS_HS_PROPS
       (change there if your HubSpot admin picks different internal
       names).
──────────────────────────────────────────────────────────────────── */

export function ScalersApply() {
  const seed = useMemo(
    () => getCleanIdentity(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')),
    [],
  );

  const [asin, setAsin]                 = useState('');
  const [storeUrl, setStoreUrl]         = useState('');
  const [monthlySales, setMonthlySales] = useState('');
  const [unitsAtAmazon, setUnits]       = useState('');
  const [ppcSpend, setPpcSpend]         = useState('');
  const [offerPref, setOfferPref]       = useState('');

  const attribution = useMemo(() => {
    if (typeof window === 'undefined') return {} as Record<string, string>;
    const out: Record<string, string> = {};
    try {
      for (const [k, v] of Object.entries(readAttribution())) {
        if (v) out[k] = String(v);
      }
    } catch { /* no-op */ }
    return out;
  }, []);

  useEffect(() => {
    document.title = 'Apply for a Seller Growth Call';
    trackEvent('scalers_apply_viewed', { funnel_track: SCALERS_TRACK });
  }, []);

  const onSubmit = () => {
    trackEvent('scalers_apply_submitted', {
      funnel_track: SCALERS_TRACK,
      monthly_sales: monthlySales,
      offer_preference: offerPref,
      has_asin: Boolean(asin.trim()),
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-xl px-5 pt-8 pb-16 md:pt-14">
        <img
          src={SCALERS_LOGO_URL}
          alt="FBA Scalers"
          className="mb-6 h-10 w-auto"
          loading="eager"
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          A few quick questions before your call.
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Your coach will review your answers before the call, so the more detail here, the more useful the time together.
        </p>

        <form
          method="POST"
          action="/.netlify/functions/scalers-post"
          onSubmit={onSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <input type="hidden" name="stage" value="scalers_apply" />
          <input type="hidden" name="track" value={SCALERS_TRACK} />
          <input type="hidden" name={SCALERS_HS_PROPS.funnelTrack} value={SCALERS_TRACK} />
          <input type="hidden" name="page_path" value="/scalers/apply" />
          <input type="hidden" name="email"      value={seed.email || ''} />
          <input type="hidden" name="first_name" value={seed.firstname || ''} />
          <input type="hidden" name="last_name"  value={seed.lastname || ''} />
          <input type="hidden" name="phone"      value={seed.phone || ''} />
          {Object.entries(attribution).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Are you currently selling a product live on Amazon?
            </legend>
            <p className="text-xs text-slate-500">
              Yes keeps you here. No sends you back to the main training.
            </p>
            <div className="flex gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="scalers_selling_now" value="yes" required />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="scalers_selling_now" value="no" required />
                No
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">ASIN or Amazon store link</span>
            <input
              required
              type="text"
              name={SCALERS_HS_PROPS.asin}
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              placeholder="e.g. B0CXXXXXXX or amazon.com/dp/B0CXXXXXXX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="mt-1 block text-xs text-slate-500">
              This is the most useful one. Your coach will pull up your listing before the call.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Storefront or seller profile URL (optional)</span>
            <input
              type="url"
              name={SCALERS_HS_PROPS.storeUrl}
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://amazon.com/stores/..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Roughly how much is this product selling per month?</span>
            <select
              required
              name={SCALERS_HS_PROPS.monthlySales}
              value={monthlySales}
              onChange={(e) => setMonthlySales(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Pick one</option>
              {SCALERS_MONTHLY_SALES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              No minimum here. We work with people near zero. This is for context only.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Roughly how many units do you have sitting at Amazon right now?</span>
            <input
              required
              type="text"
              inputMode="numeric"
              name={SCALERS_HS_PROPS.unitsAtAmazon}
              value={unitsAtAmazon}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="e.g. 300"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Monthly PPC spend</span>
            <input
              required
              type="text"
              inputMode="decimal"
              name={SCALERS_HS_PROPS.monthlyPpcSpend}
              value={ppcSpend}
              onChange={(e) => setPpcSpend(e.target.value)}
              placeholder="e.g. $800"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Would you rather run this yourself, or have our team run it?
            </legend>
            <div className="space-y-2">
              {SCALERS_OFFER_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={SCALERS_HS_PROPS.offerPreference}
                    value={o.value}
                    required
                    checked={offerPref === o.value}
                    onChange={() => setOfferPref(o.value)}
                    className="mt-1"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue to booking
          </button>
          <p className="text-center text-xs text-slate-500">
            Results not typical.
          </p>
        </form>
      </main>
    </div>
  );
}
