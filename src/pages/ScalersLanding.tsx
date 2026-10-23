import { useEffect, useMemo, useState } from 'react';
import { identifyUser, trackEvent, trackConversionLead } from '../lib/posthog';
import { getCleanIdentity, persistIdentity } from '../lib/urlParams';
import { persistUtmsFromUrl, readAttribution } from '../lib/syncUtm';
import { LegalDisclaimer } from '../components/LegalDisclaimer';
import { SCALERS_TRACK, SCALERS_HS_PROPS, SCALERS_LOGO_URL } from '../lib/scalers';

/* ───── /scalers — Scalers-track leadpage ──────────────────────────
   Mirrors the main NewForm structurally (hidden attribution, native
   HTML POST to newform-post.ts) but with Scalers-angled copy and
   track=scalers baked in. The Netlify function reads track and 302s
   to /scalers/vsl (target) or /router?track=scalers (non-target)
   instead of /nextstep.

   PLACEHOLDERS marked below — Scalers hero copy is a draft Connor
   needs to approve. No prices, no student revenue figures, no em
   dashes per the public-page copy rules.
──────────────────────────────────────────────────────────────────── */

export function ScalersLanding() {
  const seed = useMemo(
    () => getCleanIdentity(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')),
    [],
  );
  const [email, setEmail]       = useState(seed.email || '');
  const [firstName, setFirstName] = useState(seed.firstname || '');
  const [lastName, setLastName]   = useState(seed.lastname || '');
  const [phone, setPhone]       = useState(seed.phone || '');
  const [honeypot, setHoneypot] = useState('');

  const hiddenAttribution = useMemo(() => {
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
    document.title = 'Passion Product Scalers — Audit Your Amazon Listing';
    persistUtmsFromUrl();
    trackEvent('scalers_landing_viewed', { funnel_track: SCALERS_TRACK });
  }, []);

  const onSubmit = () => {
    if (honeypot) {
      trackEvent('scalers_landing_honeypot_tripped');
      return;
    }
    try {
      persistIdentity({ email, firstname: firstName, lastname: lastName, phone });
      identifyUser(email, { first_name: firstName, last_name: lastName, phone });
      trackConversionLead({ email, first_name: firstName, last_name: lastName, phone, funnel_track: SCALERS_TRACK });
      trackEvent('scalers_landing_submitted', { funnel_track: SCALERS_TRACK });
    } catch { /* no-op */ }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-2xl px-5 pt-10 pb-16 md:pt-16">
        <img
          src={SCALERS_LOGO_URL}
          alt="FBA Scalers"
          className="mb-8 h-12 w-auto"
          loading="eager"
        />
        {/* SCALERS PLACEHOLDER: hero copy. Angle per Connor:
            "You've done the hard part. If it's not selling, the
            problem is usually PPC and the listing, not the product." */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Your product is live on Amazon. It's just not moving.
        </h1>
        <p className="mt-5 text-lg text-slate-700 sm:text-xl">
          You've done the hard part. Inventory is at Amazon, PPC is running, and the sales aren't matching the spend. In most cases the problem isn't the product. It's the listing and the ads.
        </p>
        <p className="mt-4 text-base text-slate-600">
          Book a Seller Growth Call and we'll audit your listing, show you what's dragging it, and lay out the next move.
        </p>

        <form
          method="POST"
          action="/.netlify/functions/scalers-post"
          onSubmit={onSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <input type="hidden" name="stage" value="scalers_landing" />
          <input type="hidden" name="track" value={SCALERS_TRACK} />
          <input type="hidden" name={SCALERS_HS_PROPS.funnelTrack} value={SCALERS_TRACK} />
          <input type="hidden" name="page_path" value="/scalers" />
          {Object.entries(hiddenAttribution).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {/* Honeypot — real users don't fill this; bots do. */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
            aria-hidden="true"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">First name</span>
              <input
                required
                type="text"
                name="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last name</span>
              <input
                required
                type="text"
                name="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              required
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Get my Seller Growth Call
          </button>
        </form>

        <LegalDisclaimer />
      </main>
    </div>
  );
}
