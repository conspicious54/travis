import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { identifyUser, trackEvent, trackConversionLead } from '../lib/posthog';
import { getCleanIdentity, persistIdentity } from '../lib/urlParams';
import { getCountry, readCachedCountryCode, type CountryInfo } from '../lib/detectCountry';
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
// Funnel splits by audience at submit:
//   target     → /nextstep DIRECTLY  (skip /router — /newform already
//                classified them as target; no reason to re-run the
//                geo gate or show the loading screen for an in-funnel
//                destination that'll render fast enough on its own)
//   non-target → /router             → DQ capital question flow
// /router remains unchanged for CF-origin visitors who arrive without
// URL identity.
const REDIRECT_TARGET      = '/nextstep';
const REDIRECT_NON_TARGET  = '/router';
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

// Passion Product logo — the exact 2-line "PASSION PRODUCT" mark
// used on the CF lead page. Hotlinked from CF's CDN for now. This
// is a temporary third-party dependency; once ready to cut over,
// self-host on our R2 bucket to remove the CF dependency (see
// TravisStage.jpg / Alexis.png for the R2 self-hosting pattern).
// The `passionproduct.com` WordPress asset that was here before
// loads the "PASSION PRODUCT FORMULA" 3-line logo instead — wrong
// mark for parity with CF.
const LOGO_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/PassionProductFormulaLogo.webp';

/* ───── Country dial codes ────────────────────────────────────────
   Target markets listed first (US / CA / UK / AU / NZ / IE), then
   secondary English-speaking + major Western European + handful of
   high-traffic international markets. Visitors can click the pill
   on the phone field to pick their country - we also prefill from
   their IP via getCountry() so the default is usually right.

   Flag column is emoji; works everywhere Apple/Google/Windows
   render Unicode flag sequences (99%+ of modern browsers).
──────────────────────────────────────────────────────────────────── */
interface DialCountry {
  code: string;      // ISO alpha-2
  name: string;
  dial: string;      // e.g. "+1"
  flag: string;      // emoji
}

const COUNTRY_DIAL: readonly DialCountry[] = [
  // Target markets (English-speaking primary)
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand',    dial: '+64',  flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland',        dial: '+353', flag: '🇮🇪' },
  // Western Europe
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷' },
  { code: 'ES', name: 'Spain',          dial: '+34',  flag: '🇪🇸' },
  { code: 'IT', name: 'Italy',          dial: '+39',  flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands',    dial: '+31',  flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium',        dial: '+32',  flag: '🇧🇪' },
  { code: 'PT', name: 'Portugal',       dial: '+351', flag: '🇵🇹' },
  { code: 'CH', name: 'Switzerland',    dial: '+41',  flag: '🇨🇭' },
  { code: 'AT', name: 'Austria',        dial: '+43',  flag: '🇦🇹' },
  // Nordics
  { code: 'SE', name: 'Sweden',         dial: '+46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',         dial: '+47',  flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark',        dial: '+45',  flag: '🇩🇰' },
  { code: 'FI', name: 'Finland',        dial: '+358', flag: '🇫🇮' },
  // Other high-traffic
  { code: 'PL', name: 'Poland',         dial: '+48',  flag: '🇵🇱' },
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore',      dial: '+65',  flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong',      dial: '+852', flag: '🇭🇰' },
  { code: 'AE', name: 'UAE',            dial: '+971', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa',   dial: '+27',  flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',         dial: '+52',  flag: '🇲🇽' },
  { code: 'JP', name: 'Japan',          dial: '+81',  flag: '🇯🇵' },
];

const DEFAULT_DIAL = COUNTRY_DIAL[0]; // US

function findDialByCountryCode(code: string | undefined | null): DialCountry {
  if (!code) return DEFAULT_DIAL;
  const upper = code.toUpperCase();
  return COUNTRY_DIAL.find((c) => c.code === upper) ?? DEFAULT_DIAL;
}

/** Compose a submission-ready phone from a visitor-typed local number
 *  plus the selected dial country.
 *   - If visitor typed a value starting with '+', trust their format
 *     and strip spaces/dashes but keep the leading '+'.
 *   - Otherwise strip all non-digit chars, drop a leading 0 (common
 *     EU/UK local-format artefact), and prepend the dial code.
 *  Result is a clean E.164-ish string suitable for HubSpot/Zapier. */
function composePhone(raw: string, dial: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return `${dial}${digits}`;
}


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
  // Dial-code country for the phone field. Synchronous initial value
  // from the sessionStorage geo cache (returning visitors / inter-tab
  // navigation) so the right flag renders on first paint with no
  // US → actual-country flicker. First-time visitors still start at
  // US, then swap when the IP API resolves in the mount effect below.
  const [dialCountry, setDialCountry] = useState<DialCountry>(() =>
    findDialByCountryCode(readCachedCountryCode())
  );
  const [dialTouched, setDialTouched] = useState(false);
  const [dialOpen, setDialOpen]       = useState(false);
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

  /* Phone field is only shown to target-market visitors (US / CA / UK /
     AU / NZ / IE — see TARGET_COUNTRIES in detectCountry.ts). Non-target
     leads route to Mailchimp and never get a sales call, so collecting
     a phone just adds friction for leads we don't phone-contact anyway.
     While geo is still resolving (country === null) we show the field
     by default — removing it after the fact would feel broken, and
     target visitors are the common case. */
  const showPhoneField = country === null || country.audience === 'target';

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
      // Prefill the dial selector from IP country when the visitor
      // hasn't manually picked one yet. If the detected code isn't in
      // COUNTRY_DIAL, findDialByCountryCode falls back to US.
      if (!dialTouched) {
        const match = findDialByCountryCode(info.code);
        setDialCountry(match);
      }
    });
  }, [seed.email, seed.phone, dialTouched]);

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
    // Phone required for target-market visitors only. Non-target
    // audiences never get a sales call anyway (Mailchimp routing,
    // email-only funnel), so collecting a phone just adds friction
    // for leads that don't need one.
    if (showPhoneField && !cleanPhone) {
      setError('Please enter your phone number so we can text you a reminder.');
      return;
    }

    setSubmitting(true);

    // Phone is composed from the visitor's selected dial country +
    // the local-format number they typed. composePhone normalizes to
    // a clean E.164-ish string (strips spaces/dashes, drops leading
    // 0s, prepends dial code) unless the visitor typed their own '+'
    // prefix, in which case we trust it. Non-target visitors never
    // saw the field, so cleanPhone is empty and composePhone returns
    // an empty string, which downstream code already handles.
    const fullPhone = composePhone(cleanPhone, dialCountry.dial);

    const countryInfo = country ?? (await getCountry().catch(() => null));
    const audience = countryInfo?.audience ?? 'non_target';

    identifyUser(cleanEmail, {
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: fullPhone,
      country_code: countryInfo?.code,
      country_name: countryInfo?.name,
      audience,
      newform_dial_country: dialCountry.code,
      newform_dial_touched: dialTouched,
    });
    trackEvent('newform_submitted', {
      audience,
      country_code: countryInfo?.code || 'unknown',
      country_name: countryInfo?.name || 'unknown',
      // Dial-country lets us see when the IP-detected country and the
      // visitor's self-selected dial differ (often means they're
      // travelling, on a VPN, or have a foreign SIM in their home
      // country). Also flags visitors who manually picked vs took
      // the IP default - 'touched' means they tapped the selector.
      dial_country: dialCountry.code,
      dial_touched: dialTouched,
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
      // Attribution envelope — URL + sessionStorage merge. Carries
      // utm_* + ad-platform click IDs + Meta first-party cookies.
      // Spread into the Zapier payload below so the full source
      // picture arrives downstream for ActiveCampaign / Mailchimp /
      // Meta CAPI routing.
      const attributionForZap = readAttribution();
      const res = await retryFetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: fullPhone,
          firstname: cleanFirst,
          lastname: cleanLast,
          stage: STAGE_TAG,
          country_code: countryInfo?.code || '',
          country_name: countryInfo?.name || '',
          audience,
          // Campaign attribution — Zapier / email automation reads
          // lead_magnet_delivery to fulfill the exact resource.
          campaign_variant_id: variant?.id || '',
          lead_magnet_id: leadMagnet?.id || '',
          lead_magnet_delivery: leadMagnet?.delivery_reference || '',
          // Phone-field metadata — dial_country is the ISO alpha-2
          // for the selector choice; dial_code is the "+X" prefix
          // prepended to the phone; dial_touched flags whether the
          // visitor manually overrode the IP default (useful for
          // VPN / traveller detection).
          dial_country: dialCountry.code,
          dial_code: dialCountry.dial,
          dial_touched: dialTouched,
          // Exact page path (incl. query string) where the submit
          // happened. Lets downstream see which campaign variant
          // URL produced the lead without having to reconstruct it
          // from the UTMs. IP address is attached server-side in the
          // Netlify function from the x-forwarded-for header.
          page_path: typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : '',
          // Full source picture
          ...attributionForZap,
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
    // Forward matched campaign attribution downstream so the next pages
    // (/loading or /router → /nextstep → /applynow → Typeform) preserve
    // which resource / variant this lead came in on. Both /loading and
    // /router pass the full query string through on their own redirect.
    if (variant?.id) fwd.set('campaign_variant_id', variant.id);
    if (leadMagnet?.id) fwd.set('lead_magnet_id', leadMagnet.id);
    // Target vs non-target branch: target goes to the fast /loading
    // path (same visual, no redundant geo re-check); non-target stays
    // on /router so the DQ capital question still fires. Unknown
    // audience (geo lookup failed) falls back to /router — safer to
    // run the full gate than skip it.
    const nextPage = audience === 'target' ? REDIRECT_TARGET : REDIRECT_NON_TARGET;
    window.location.href = `${nextPage}?${fwd.toString()}`;
  };

  // Default hero copy — matches the ClickFunnels lead page verbatim.
  // Variant.headline / supporting_copy override these when a UTM
  // campaign matches an active row in campaignVariants.ts.
  const DEFAULT_EYEBROW = 'Last Year, First Time Amazon Sellers Made Over $140 Billion In Sales';
  const DEFAULT_HEADLINE = 'Learn the Exact Process I Use to Help Sellers Reach $100K on Amazon in 2026';
  const eyebrowText = variant ? variant.supporting_copy : DEFAULT_EYEBROW;
  const headlineText = (variant?.headline) || DEFAULT_HEADLINE;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Container is max-w-[1088px] (CF's measured form-area width).
          Desktop drops horizontal padding so the content fills the
          full 1088 — otherwise px-5 shaves 40px and the hero wraps
          onto an extra line. Mobile keeps px-5 for safe-area breathing
          room on <1088 viewports. */}
      <main className="max-w-[1088px] mx-auto px-5 md:px-0 pt-6 md:pt-10 pb-16">
        {/* Logo. CF: 122x62 at every viewport; mb-9 reproduces CF's
            ~35px gap down to the eyebrow. */}
        <div className="flex justify-center mb-5 md:mb-9">
          <img
            src={LOGO_URL}
            alt="Passion Product"
            className="h-[62px] w-auto"
            loading="eager"
          />
        </div>

        {/* Hero — sizes picked so the wrapping matches CF line-for-line
            in Poppins, not just the raw pixel values from CF (which is
            Oswald, a narrower face).
              Eyebrow desktop:  32px keeps it on one line in Poppins
                               (CF's 36.72px in Oswald also 1 line, but
                               36.72 in Poppins wraps to 2).
              Headline desktop: 52px keeps it on two lines in Poppins
                               (CF's 63.6px in Oswald also 2 lines, but
                               54px+ in Poppins wraps to 3).
            Mobile sizes stay at CF-literal values (17 / 21.25) — on
            narrow viewports both pages break identically.
            Gaps measured from CF: logo→eyebrow 35px, eyebrow→headline 5px. */}
        <div className="text-center mb-8 md:mb-10">
          {eyebrowText ? (
            <p className="text-[17px] md:text-[30px] font-normal text-black leading-[1.4] md:leading-none tracking-[0.48px] mb-3 md:mb-1">
              {eyebrowText === DEFAULT_EYEBROW ? (
                <>
                  Last Year, First Time Amazon Sellers Made Over{' '}
                  <span className="font-black">$140 Billion</span> In Sales
                </>
              ) : (
                eyebrowText
              )}
            </p>
          ) : null}
          {/* Default headline: lead-in at font-semibold (600), the
              "$100K on Amazon in 2026" clause at font-black (900) — same
              Poppins face, same orange, 300-unit weight gap. Weights
              above 700 are now actually loaded (see index.css); before
              this fix anything 800/900 was faux-bolded to look identical
              to 700, which is why prior weight-only changes were
              invisible on screen. Variant headlines keep uniform weight
              since we don't know which clause to lean on. */}
          <h1 className="text-[21.25px] md:text-[52px] tracking-[0.48px] leading-[1.4] md:leading-[1.2] text-[#F28000]">
            {headlineText === DEFAULT_HEADLINE ? (
              <>
                <span className="font-semibold">
                  Learn the Exact Process I Use to Help Sellers Reach
                </span>{' '}
                <span className="font-black">
                  $100K on Amazon in 2026
                </span>
              </>
            ) : (
              <span className="font-black">{headlineText}</span>
            )}
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

              {/* Phone — dial-country selector on the left, number
                  input on the right, visually joined. Default dial is
                  prefilled from IP geolocation (see getCountry() in
                  the mount effect); visitor can override by clicking
                  the pill. composePhone normalizes before submit so
                  downstream sees a clean E.164-ish string regardless
                  of how the visitor typed it.

                  Entire field hidden for non-target audiences — those
                  leads don't get a sales call, so phone collection is
                  pure friction with no downstream payoff. See
                  showPhoneField derivation above. */}
              {showPhoneField && (
              <div>
                <label htmlFor="phone" className="sr-only">Phone</label>
                <div className="relative flex rounded-lg bg-gray-50 border border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition">
                  <button
                    type="button"
                    onClick={() => setDialOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={dialOpen}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-3 border-r border-gray-300 text-gray-800 hover:bg-gray-100 rounded-l-lg cursor-pointer font-medium"
                  >
                    <span className="text-lg leading-none" aria-hidden="true">{dialCountry.flag}</span>
                    <span className="tabular-nums text-sm">{dialCountry.dial}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dialOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
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
                    className="flex-1 min-w-0 px-4 py-3 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none rounded-r-lg"
                  />

                  {dialOpen && (
                    <>
                      {/* Overlay to close on outside click */}
                      <button
                        type="button"
                        aria-label="Close country selector"
                        onClick={() => setDialOpen(false)}
                        className="fixed inset-0 z-30 cursor-default"
                      />
                      <ul
                        role="listbox"
                        className="absolute z-40 top-full left-0 mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1"
                      >
                        {COUNTRY_DIAL.map((c) => {
                          const selected = c.code === dialCountry.code;
                          return (
                            <li key={c.code}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                  setDialCountry(c);
                                  setDialTouched(true);
                                  setDialOpen(false);
                                  trackEvent('newform_dial_country_changed', {
                                    from: dialCountry.code,
                                    to: c.code,
                                  });
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-orange-50 cursor-pointer ${selected ? 'bg-orange-50 font-semibold' : ''}`}
                              >
                                <span className="text-lg leading-none shrink-0">{c.flag}</span>
                                <span className="flex-1 min-w-0 truncate text-gray-900">{c.name}</span>
                                <span className="tabular-nums text-gray-500 shrink-0">{c.dial}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              )}

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
                className="w-full bg-[#F00300] hover:bg-[#D80200] disabled:opacity-60 disabled:cursor-not-allowed text-white text-lg md:text-xl font-black tracking-wide py-4 md:py-5 rounded-xl shadow-lg shadow-red-500/25 transition-all hover:shadow-xl active:translate-y-0"
              >
                {submitting ? 'Reserving Your Spot...' : (variant?.cta_text || 'SIGN UP TO WATCH NOW')}
              </button>

              <p className="text-xs text-gray-500 leading-relaxed">
                {showPhoneField ? (
                  <>
                    By submitting this form, you agree to receive SMS messages from Passion Product, including
                    appointment reminders and notifications. Message frequency varies. Message and data rates may apply.
                    Reply OUT to unsubscribe. Reply HELP for help. Consent is not a condition of purchase.
                  </>
                ) : (
                  <>
                    By submitting this form, you agree to receive emails from Passion Product. You can
                    unsubscribe at any time via the link at the bottom of any email.
                  </>
                )}
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
            <img
              src="https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/Passion%20Product%20Formula%20-%20ICON.png"
              alt="Passion Product Formula"
              className="w-12 h-12 rounded-lg object-contain"
              loading="lazy"
            />
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
