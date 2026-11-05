import { useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanParam } from '../lib/urlParams';

/* ───── /dq - capital question, no geo gate ────────────────────────
   Router.tsx clone that skips the country check entirely and lands
   every visitor on the "Do you have $500?" DQ question. Use when
   a paid ad audience is already pre-qualified on country (or
   deliberately geo-mixed) and we only want the capital split.

   Identity, tracking, and redirect destinations are kept in sync
   with Router.tsx on purpose so downstream dashboards treat both
   entry points identically.
─────────────────────────────────────────────────────────────────── */

// "No $500" answers now land on the in-app Whop checkout at /fast-track
// (kept in sync with Router.tsx so both DQ entry points go the same place).
const GROUP_B_URL = '/fast-track';
const DQ_YES_URL = 'https://thepassionproductformula.com/waitlist';
const TRACKING_ENDPOINT = 'https://dashboardpp.vercel.app/api/webhooks/router';

function getPassthroughParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function fireTracking(extraParams?: Record<string, string>): Promise<void> {
  const p = getPassthroughParams();
  const data = {
    email: p.get('email') || '',
    first_name: p.get('first_name') || '',
    last_name: p.get('last_name') || '',
    country: extraParams?.country || p.get('country') || '',
    result: extraParams?.result || p.get('result') || '',
    has_500: extraParams?.has_500 || p.get('has_500') || '',
    utm_source: p.get('utm_source') || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_medium: p.get('utm_medium') || '',
  };
  try {
    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch { /* no-op */ }
  return Promise.resolve();
}

function buildRedirectUrl(baseUrl: string, extraParams: Record<string, string>): string {
  const incoming = getPassthroughParams();
  const merged = new URLSearchParams(incoming);
  for (const [key, value] of Object.entries(extraParams)) {
    merged.set(key, value);
  }
  const qs = merged.toString();
  return qs ? baseUrl + '?' + qs : baseUrl;
}

async function doRedirect(baseUrl: string, extraParams: Record<string, string>) {
  const url = buildRedirectUrl(baseUrl, extraParams);
  trackEvent('router_decision', {
    outcome: extraParams.result || 'unknown',
    country: extraParams.country || '',
    has_500: extraParams.has_500 || '',
    destination: baseUrl,
    entry: 'dq',
  });
  await fireTracking(extraParams);
  window.location.replace(url);
}

function CapitalQuestion({ detectedCountry }: { detectedCountry: string }) {
  return (
    <div className="max-w-md w-full relative z-10">
      <div className="text-center mb-8">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
            <DollarSign className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Quick Question Before We Continue
        </h1>

        <p className="text-lg text-white font-medium mb-2">
          Do you have at least $500 USD to invest in launching on Amazon?
        </p>

        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
          Our approach to building an Amazon business varies depending on your starting capital. This helps us point you to the right resources.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => doRedirect(DQ_YES_URL, { result: 'formula', has_500: 'yes', country: detectedCountry })}
            className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
          >
            Yes, I Have $500+
          </button>
          <button
            onClick={() => doRedirect(GROUP_B_URL, { result: 'fasttrack', has_500: 'no', country: detectedCountry })}
            className="px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium rounded-xl transition-all border border-slate-700/50 cursor-pointer text-sm"
          >
            No, Not Right Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function DQ() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingEmail = (getCleanParam(params, 'email') || '').toLowerCase();
    const firstName = getCleanParam(params, 'first_name') || getCleanParam(params, 'firstname') || '';
    const lastName = getCleanParam(params, 'last_name') || getCleanParam(params, 'lastname') || '';
    const incomingPhid = getCleanParam(params, 'phid') || '';
    if (incomingEmail && incomingEmail.includes('@')) {
      identifyUser(incomingEmail, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
    } else if (incomingPhid) {
      identifyUser(incomingPhid);
    }

    trackEvent('router_visited', {
      has_email: !!incomingEmail,
      has_phid: !!incomingPhid,
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      entry: 'dq',
    });
    trackEvent('router_dq_question_shown', {
      country: (params.get('country_code') || '').toUpperCase() || 'unknown',
      source: 'dq_route',
    });
  }, []);

  // Country still carried through for tracking/redirect parity; just
  // not used as a gate. Reads whatever the URL supplied, else empty.
  const incomingCountry = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('country_code') || '').toUpperCase()
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent"></div>

      <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-orange-300/30 rounded-full animate-pulse delay-100"></div>
      <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-orange-400/20 rounded-full animate-pulse delay-200"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500/30 rounded-full animate-pulse delay-300"></div>

      <CapitalQuestion detectedCountry={incomingCountry} />
    </div>
  );
}
