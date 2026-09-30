import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { identifyUser, trackEvent, trackConversionLead } from '../lib/posthog';
import { getCleanIdentity, persistIdentity } from '../lib/urlParams';
import { getCountry, type CountryInfo } from '../lib/detectCountry';
import { persistUtmsFromUrl, readAttribution, syncContactUtms } from '../lib/syncUtm';
import { syncContactTimezone } from '../lib/syncTimezone';
import { retryFetch } from '../lib/retryFetch';
import { loadCampaignVariant } from '../lib/campaignVariant';
import { findLeadMagnet } from '../config/leadMagnets';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /newform - webinar opt-in form ────────────────────────────
   1:1 rebuild of the existing ClickFunnels opt-in page (headlines,
   4 separate form fields, "Fill in the form above..." subtext,
   "SIGN UP TO WATCH NOW" CTA, SMS consent, countdown, full
   disclaimer footer) - only difference is the visual styling,
   which now matches the rest of the site (orange/amber gradient,
   white card, lucide icons) instead of CF's defaults. The
   wordmark in the original header is intentionally dropped.

   On submit:
   - identifyUser() in PostHog
   - POSTs to /.netlify/functions/register-webinar with stage
     'newform_optin' so the existing Zapier webhook routes the
     lead the same way /live-training does
   - Forwards identity in the URL to REDIRECT_TO
────────────────────────────────────────────────────────────────── */

/* ─── Config - tune as needed ──────────────────────────────────── */
// Funnel: /newform (optin) -> /router (geo gate + DQ question)
// -> /nextstep (VSL) -> /applynow (Typeform) -> ...
// The router decides allowed vs DQ country and forwards the
// qualified traffic to /nextstep. Sending the lead straight to
// /router means every newform submission gets geo-routed.
const REDIRECT_TO = '/router';
// 4-minute urgency window. Long enough to feel real (a real
// resource-allocation window, not a "fake forever" timer), short
// enough that a re-visit later in the day legitimately shows
// "expired" rather than the same "23h 59m" trick that screams
// fake urgency. The 4-hour version we had here previously was
// too obviously a marketing tactic for the buyer profile we're
// targeting.
const COUNTDOWN_MS = 4 * 60 * 1000; // 4 minutes
const COUNTDOWN_STORAGE_KEY = 'pp_newform_countdown_started_at';
const STAGE_TAG = 'newform_optin';
/* ──────────────────────────────────────────────────────────────── */

// Passion Product logo — same asset the CF lead page uses (hosted
// on passionproduct.com's WordPress). Verified 200 OK.
const LOGO_URL = 'https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png';

function getCountdownDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + COUNTDOWN_MS;
  try {
    const raw = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (raw) {
      const startedAt = parseInt(raw, 10);
      if (!Number.isNaN(startedAt)) {
        const deadline = startedAt + COUNTDOWN_MS;
        if (deadline > Date.now()) return deadline;
      }
    }
  } catch { /* no-op */ }
  const fresh = Date.now();
  try { localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(fresh)); } catch { /* no-op */ }
  return fresh + COUNTDOWN_MS;
}

function formatCountdown(deadline: number): { h: string; m: string; s: string } {
  const remaining = Math.max(0, deadline - Date.now());
  const totalSec = Math.floor(remaining / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return { h, m, s };
}

function initialFromUrl(): { firstname: string; lastname: string; email: string; phone: string } {
  if (typeof window === 'undefined') return { firstname: '', lastname: '', email: '', phone: '' };
  const id = getCleanIdentity(new URLSearchParams(window.location.search));
  return {
    firstname: id.firstname || '',
    lastname:  id.lastname  || '',
    email:     id.email     || '',
    phone:     id.phone     || '',
  };
}

export function NewForm() {
  const seed = useMemo(initialFromUrl, []);
  const [firstname, setFirstname] = useState(seed.firstname);
  const [lastname, setLastname]   = useState(seed.lastname);
  const [email, setEmail]         = useState(seed.email);
  const [phone, setPhone]         = useState(seed.phone);
  // Honeypot - hidden field humans never touch but bots fill. If
  // anything lands in here, we silently drop the submission.
  const [honeypot, setHoneypot] = useState('');
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry]     = useState<CountryInfo | null>(null);
  const [deadline] = useState<number>(() => getCountdownDeadline());
  const [, setNow] = useState<number>(() => Date.now());

  /* Campaign variant is resolved synchronously from static config on
     first render, so there's no default → variant flicker. When present,
     the variant's headline / supporting copy / CTA / offer-box content
     overrides the defaults; empty fields inherit the defaults. When
     absent (missing/unknown/inactive UTMs, or no variant at all), the
     default page renders as before. The matched id is stashed in
     sessionStorage by loadCampaignVariant so the submit payload can
     still attach attribution if URL params later get stripped. */
  const [variant] = useState(() => loadCampaignVariant());
  const leadMagnet = variant ? findLeadMagnet(variant.lead_magnet_id) : null;

  useEffect(() => {
    document.title = 'Passion Product Formula - Free Training';
    // Capture utm_* into sessionStorage so they survive the form
    // submit + redirect. syncContactUtms below picks them up.
    persistUtmsFromUrl();
    trackEvent('newform_page_viewed', {
      email_prefilled: !!seed.email,
      phone_prefilled: !!seed.phone,
    });
    getCountry().then((info) => {
      setCountry(info);
      trackEvent('newform_country_detected', {
        country_code: info.code || 'unknown',
        country_name: info.name || 'unknown',
        audience: info.audience,
        source: info.source,
      });
    });
  }, [seed.email, seed.phone]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ttl = formatCountdown(deadline);

  /* The previous newform-headline-test A/B experiment was paused as
     part of the initiative to reduce visible differences between
     this page and the ClickFunnels lead page it replaces. The default
     headline below is the same one running on start.travismarziani.com.
     Per-campaign headline overrides via UTM (see loadCampaignVariant
     above) still work and take precedence. */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Honeypot trip - silently drop the submission. Show a success-
    // looking message so the bot's success-detection scrapers don't
    // immediately flag this form. We never set submitting=true so
    // the user doesn't see anything spin if a human happened to
    // accidentally tab into the hidden field.
    if (honeypot.trim()) {
      trackEvent('newform_honeypot_tripped', {
        honeypot_value_length: honeypot.length,
      });
      return;
    }

    const cleanFirst = firstname.trim();
    const cleanLast  = lastname.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanFirst) { setError('Please enter your first name.'); return; }
    if (!cleanLast)  { setError('Please enter your last name.'); return; }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPhone) {
      setError('Please enter your phone number so we can text you a reminder.');
      return;
    }

    setSubmitting(true);

    // Phone is submitted as the visitor typed it — matches the
    // ClickFunnels lead page behavior (plain phone input, no dial-
    // code selector). Downstream Zapier / HubSpot workflows already
    // handle formatting; country_code below tells them the region.
    const fullPhone = cleanPhone;

    const countryInfo = country ?? (await getCountry().catch(() => null));
    const audience = countryInfo?.audience ?? 'non_target';

    identifyUser(cleanEmail, {
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: fullPhone,
      country_code: countryInfo?.code,
      country_name: countryInfo?.name,
      audience,
    });
    trackEvent('newform_submitted', {
      audience,
      country_code: countryInfo?.code || 'unknown',
      country_name: countryInfo?.name || 'unknown',
      // Campaign attribution — non-null when the visitor arrived
      // with a matching utm_source + utm_campaign. Lets us measure
      // per-video / per-source conversion rate and reconstruct the
      // exact resource each lead was promised.
      campaign_variant_id: variant?.id ?? null,
      lead_magnet_id: leadMagnet?.id ?? null,
    });
    // Top-of-funnel conversion - GTM tags can fan this out to
    // Google Ads "Form Submission" conversion, Meta Pixel "Lead",
    // etc. identifyUser already pushed lead_identified above
    // (which carries gclid/fbclid), so this is the conversion
    // event that maps to the lead-capture moment.
    trackConversionLead({
      email: cleanEmail,
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: fullPhone,
      audience,
      country_code: countryInfo?.code,
    });

    // Persist identity to localStorage so downstream pages
    // (/nextstep, /applynow, exit popups) can personalize even when
    // URL params get lost (browser refresh, cross-tab landing,
    // sticky-state shenanigans, etc).
    persistIdentity({
      firstname: cleanFirst,
      lastname: cleanLast,
      email: cleanEmail,
      phone: fullPhone,
    });

    try {
      // retryFetch absorbs transient network errors + 429/5xx so a
      // flaky mobile connection doesn't burn the lead. Max 3 attempts
      // with 0/500/1500ms backoff (~2s worst case).
      const res = await retryFetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: fullPhone,
          stage: STAGE_TAG,
          country_code: countryInfo?.code || '',
          country_name: countryInfo?.name || '',
          audience,
          // Campaign attribution — the downstream Zapier / email
          // automation should read lead_magnet_delivery to fulfill
          // the exact resource this lead was promised. Unknown to
          // register-webinar today; passed through as-is.
          campaign_variant_id: variant?.id || '',
          lead_magnet_id: leadMagnet?.id || '',
          lead_magnet_delivery: leadMagnet?.delivery_reference || '',
        }),
        tag: 'newform_register',
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        trackEvent('newform_register_warning', { reason: data?.reason || 'unknown' });
      }
    } catch {
      // After retryFetch exhausts attempts, swallow the error so the
      // user still moves forward in the funnel. Lead is already
      // captured client-side via identifyUser; the Zapier sync just
      // didn't make it. PostHog will show the warning event for
      // investigation.
      trackEvent('newform_register_warning', { reason: 'network_error_after_retries' });
    }

    // /newform is the EARLIEST point in the funnel where we have a
    // confirmed email. Push timezone + first-touch UTMs to HubSpot
    // here so attribution is locked in before any downstream step
    // (the server only writes UTM properties that are currently
    // empty, so first-touch survives later syncs from /book etc).
    // sendBeacon survives the redirect.
    syncContactTimezone(cleanEmail, 'newform_submit');
    syncContactUtms(cleanEmail, 'newform_submit');

    // Forward identity + ALL attribution (utm_* + ad-platform
    // click IDs like gclid, fbclid, gbraid, wbraid, li_fat_id,
    // ttclid, _fbp, _fbc) to /router so the funnel keeps
    // attribution end-to-end. Router's buildRedirectUrl passes
    // the full query string through to /nextstep, which passes
    // through to /applynow, which puts them in the Typeform as
    // hidden fields.
    //
    // readAttribution() merges URL + sessionStorage so if any
    // page in the chain stripped the URL, we still carry the
    // attribution forward from storage.
    const fwd = new URLSearchParams();
    fwd.set('email', cleanEmail);
    if (cleanFirst) fwd.set('firstname', cleanFirst);
    if (cleanLast)  fwd.set('lastname',  cleanLast);
    if (fullPhone)  fwd.set('phone',     fullPhone);
    const attribution = readAttribution();
    for (const [k, v] of Object.entries(attribution)) {
      if (v) fwd.set(k, v);
    }
    // Forward matched campaign attribution downstream so /router → /nextstep
    // → /applynow → Typeform can preserve which resource / variant this
    // lead came in on. Router already forwards the full query string.
    if (variant?.id) fwd.set('campaign_variant_id', variant.id);
    if (leadMagnet?.id) fwd.set('lead_magnet_id', leadMagnet.id);
    window.location.href = `${REDIRECT_TO}?${fwd.toString()}`;
  };

  // Default hero copy — matches the ClickFunnels lead page verbatim.
  // Variant.headline / supporting_copy override these when a UTM
  // campaign matches an active row in campaignVariants.ts.
  const DEFAULT_EYEBROW = 'Last Year, First Time Amazon Sellers Made Over $140 Billion In Sales';
  const DEFAULT_HEADLINE = 'Learn the Exact Process I Use to Help Sellers Reach $100K on Amazon in 2026';
  const eyebrowText = variant ? variant.supporting_copy : DEFAULT_EYEBROW;
  const headlineText = (variant?.headline) || DEFAULT_HEADLINE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white text-gray-900">
      <main className="max-w-4xl mx-auto px-5 pt-8 md:pt-12 pb-16">
        {/* Logo header — matches the CF lead page. Self-hosted on
            the passionproduct.com WordPress CDN (same image CF uses). */}
        <div className="flex justify-center mb-6 md:mb-8">
          <img
            src={LOGO_URL}
            alt="Passion Product"
            className="h-16 md:h-20 w-auto"
            loading="eager"
          />
        </div>

        {/* Hero — CF-matching copy by default; variant overrides
            headline / supporting_copy when a UTM campaign matches. */}
        <div className="text-center mb-10 md:mb-12">
          {eyebrowText ? (
            <p className="text-lg md:text-2xl text-gray-700 leading-snug max-w-3xl mx-auto mb-4 md:mb-5">
              {eyebrowText === DEFAULT_EYEBROW ? (
                <>
                  Last Year, First Time Amazon Sellers Made Over{' '}
                  <span className="font-bold text-gray-900">$140 Billion</span> In Sales
                </>
              ) : (
                eyebrowText
              )}
            </p>
          ) : null}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              {headlineText}
            </span>
          </h1>

          {/* "What you get" offer box — variant-controlled, hidden by
              default. Only renders when the matched variant has
              show_offer_box:true AND an offer_title. */}
          {variant?.show_offer_box && variant.offer_title ? (
            <div className="mt-8 md:mt-10 max-w-2xl mx-auto rounded-2xl border-2 border-orange-200 bg-gradient-to-b from-orange-50/70 to-white p-5 md:p-7 text-left shadow-sm">
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-orange-700 mb-2">
                What you get
              </p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">
                {variant.offer_title}
              </h2>
              {variant.offer_description ? (
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                  {variant.offer_description}
                </p>
              ) : null}
              {variant.offer_bullets.length > 0 ? (
                <ul className="space-y-1.5">
                  {variant.offer_bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm md:text-base text-gray-800">
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Form card */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-5 md:p-7 space-y-4">
              {/* Honeypot - invisible to humans, irresistible to
                  bots. Named generically (`website`) because spam
                  scripts tend to fill any URL-like field. Real
                  visitors never see / tab into this. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              >
                <label htmlFor="newform_website">Website</label>
                <input
                  id="newform_website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Form fields — placeholder-only look matches the
                  ClickFunnels lead page (no visible labels above).
                  Labels remain in the DOM as sr-only for a11y and
                  autofill hint purposes. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstname" className="sr-only">First Name</label>
                  <input
                    id="firstname"
                    type="text"
                    autoComplete="given-name"
                    inputMode="text"
                    enterKeyHint="next"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                    placeholder="Your First Name..."
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className="sr-only">Last Name</label>
                  <input
                    id="lastname"
                    type="text"
                    autoComplete="family-name"
                    inputMode="text"
                    enterKeyHint="next"
                    autoCapitalize="words"
                    spellCheck={false}
                    required
                    placeholder="Your Last Name..."
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  placeholder="Your Email Address Here..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              {/* Phone — plain input to match CF. Dial-code selector
                  was removed to reduce visible differences between
                  this page and the CF page it replaces. Downstream
                  systems (Zapier, HubSpot) use the country_code we
                  detect via IP for region context. */}
              <div>
                <label htmlFor="phone" className="sr-only">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="done"
                  required
                  placeholder="Your Phone Number Here..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <p className="text-center text-sm text-gray-700">
                Fill in the form above so we can send you your{' '}
                <span className="font-bold underline">FREE "AMAZON FBA PASSION PRODUCT" BONUSES</span>!
              </p>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-lg md:text-xl font-black tracking-wide py-4 md:py-5 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {submitting ? 'Reserving Your Spot...' : (variant?.cta_text || 'SIGN UP TO WATCH NOW')}
              </button>

              <p className="text-xs text-gray-500 leading-relaxed">
                By submitting this form, you agree to receive SMS messages from Passion Product, including
                appointment reminders and notifications. Message frequency varies. Message and data rates may apply.
                Reply OUT to unsubscribe. Reply HELP for help. Consent is not a condition of purchase.
              </p>
            </form>
          </div>
        </div>

        {/* Countdown - 4-minute window, so only MM:SS shown (HOURS
            tile would always read "00" and look weird). */}
        <div className="text-center mt-10">
          <p className="text-base md:text-lg font-bold text-orange-600 mb-4">Bonus training expires in:</p>
          <div className="flex items-center justify-center gap-3 md:gap-5">
            {[
              { v: ttl.m, label: 'MINUTES' },
              { v: ttl.s, label: 'SECONDS' },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl md:text-3xl font-black tabular-nums">
                  {unit.v}
                </div>
                <div className="mt-1.5 text-[10px] md:text-xs font-bold text-gray-500 tracking-widest">{unit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer - disclaimer blocks copied verbatim from the original */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">
              Copyright © {new Date().getFullYear()} Passion Product LLC |{' '}
              <Link to="/privacypolicy" className="text-slate-300 hover:text-white underline">Privacy Policy</Link> |{' '}
              <Link to="/termsofservice" className="text-slate-300 hover:text-white underline">Terms of Service</Link> |{' '}
              <span className="text-slate-300">Earnings Disclaimer</span>
            </p>
          </div>

        </div>
      </footer>

      <LegalDisclaimer />
    </div>
  );
}
