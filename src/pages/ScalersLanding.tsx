import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  PhoneCall,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Target,
  Zap,
  Compass,
} from 'lucide-react';
import { BrandMarquee } from '../components/BrandMarquee';
import { SCALERS_BRANDS, SCALERS_LOGO_URL } from '../lib/scalers';
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
// Logo source now lives in src/lib/scalers.ts (SCALERS_LOGO_URL) so
// the whole /scalers track swaps in one place.

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

export function ScalersLanding() {
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

  /* Attribution snapshot for native form POST hidden inputs. Merges
     URL params + sessionStorage so UTMs/click-IDs survive a page
     refresh. Recomputed on every render so the DOM always reflects
     the latest sessionStorage state at submit time. */
  const hiddenAttribution = useMemo(() => {
    if (typeof window === 'undefined') return {} as Record<string, string>;
    const out: Record<string, string> = {};
    try {
      for (const [k, v] of Object.entries(readAttribution())) {
        if (v) out[k] = String(v);
      }
    } catch { /* no-op */ }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, seed]);

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

  /* Background prefetch for the two pages this form submits to.
     Submission goes to /nextstep (target country) or /router
     (non-target) via a full page navigation, so the next page's
     JS chunk has to be downloaded from scratch unless it's already
     in the HTTP cache. Triggering import() during idle time (not
     on mount) warms the cache without competing with the critical
     path. By the time the visitor fills the form and submits, the
     next-step chunk is already cached and the full-page nav feels
     ~instant.

     requestIdleCallback runs when the main thread is quiet;
     setTimeout fallback covers Safari which still doesn't ship it. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefetch = () => {
      void import('./NextStep');
      void import('./Router');
    };
    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const handle = win.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => win.cancelIdleCallback?.(handle);
    }
    const t = setTimeout(prefetch, 2500);
    return () => clearTimeout(t);
  }, []);

  const ttl = formatCountdown(deadline);

  /* The previous newform-headline-test A/B experiment was paused as
     part of the initiative to reduce visible differences between
     this page and the ClickFunnels lead page it replaces. The default
     headline below is the same one running on start.travismarziani.com.
     Per-campaign headline overrides via UTM (see loadCampaignVariant
     above) still work and take precedence. */

  /* ─── NATIVE FORM POST + SERVER-SIDE 302 ──────────────────────
     The form POSTs natively to /.netlify/functions/newform-post,
     which fires Zapier server-side then returns a 302 to /nextstep
     or /router. Browser handles the submit atomically — no way
     for a JS exception, iOS tab-backgrounding, or extension to
     kill the redirect.

     This handler fires client-side analytics BEFORE the browser's
     native form POST takes over. We do NOT preventDefault (except
     on honeypot trip). We do NOT call window.location.href. The
     browser does the navigation itself. ───────────────────────── */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Honeypot trip — silently drop. preventDefault stops the
    // native submit so the bot never reaches the Netlify function.
    if (honeypot.trim()) {
      e.preventDefault();
      try { trackEvent('newform_honeypot_tripped', { honeypot_value_length: honeypot.length }); } catch { /* no-op */ }
      return;
    }

    // Rely on native HTML5 validation (required + type="email") to
    // block empty / malformed submissions. The browser shows its
    // own UI for those and prevents the submit from firing at all.
    // We don't need state-based error messages anymore.

    const cleanFirst = firstname.trim();
    const cleanLast  = lastname.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const fullPhone = composePhone(cleanPhone, dialCountry.dial);
    const audience = country?.audience ?? 'non_target';

    // Fire client-side analytics BEFORE the browser's native form
    // POST takes over. Each call is isolated — any throw stays
    // contained and does NOT block the native submit (we never
    // called preventDefault). Browser POSTs the form to the
    // Netlify function the instant this handler returns.
    try { identifyUser(cleanEmail, {
      first_name: cleanFirst, last_name: cleanLast, phone: fullPhone,
      country_code: country?.code, country_name: country?.name,
      audience, newform_dial_country: dialCountry.code, newform_dial_touched: dialTouched,
    }); } catch { /* no-op */ }

    try { trackEvent('newform_submitted', {
      audience, country_code: country?.code || 'unknown',
      country_name: country?.name || 'unknown', dial_country: dialCountry.code,
      dial_touched: dialTouched, campaign_variant_id: variant?.id ?? null,
      lead_magnet_id: leadMagnet?.id ?? null,
    }); } catch { /* no-op */ }

    try { trackConversionLead({
      email: cleanEmail, first_name: cleanFirst, last_name: cleanLast,
      phone: fullPhone, audience, country_code: country?.code,
    }); } catch { /* no-op */ }

    try { persistIdentity({
      firstname: cleanFirst, lastname: cleanLast,
      email: cleanEmail, phone: fullPhone,
    }); } catch { /* no-op */ }

    try {
      syncContactTimezone(cleanEmail, 'newform_submit');
      syncContactUtms(cleanEmail, 'newform_submit');
    } catch { /* no-op */ }

    // No preventDefault, no window.location.href. Return.
    // Browser now takes over: POSTs form to
    // /.netlify/functions/newform-post → function fires Zapier
    // server-side → returns 302 → browser navigates to /nextstep
    // or /router. All atomic, no JS required to complete the
    // submit, no way for an exception or extension to interrupt.
  };

  // Default hero copy — matches the ClickFunnels lead page verbatim.
  // Variant.headline / supporting_copy override these when a UTM
  // campaign matches an active row in campaignVariants.ts.
  const DEFAULT_EYEBROW = 'For Ambitious Amazon Sellers Struggling To Hit Their Next Ceiling';
  const DEFAULT_HEADLINE = 'Make Amazon FBA Predictable and Scalable in 60 Days';
  const DEFAULT_SUBHEAD = 'Apply for a Seller Growth Call to learn exactly what to fix, what to ignore, and what to scale next in your business.';
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
            src={SCALERS_LOGO_URL}
            alt="FBA Scalers"
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
                  For Ambitious Amazon Sellers Struggling To Hit Their{' '}
                  <span className="font-black">Next Ceiling</span>
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
                  Make Amazon FBA
                </span>{' '}
                <span className="font-black">
                  Predictable and Scalable in 60 Days
                </span>
              </>
            ) : (
              <span className="font-black">{headlineText}</span>
            )}
          </h1>
          <p className="mt-4 md:mt-5 text-base md:text-xl text-gray-700 leading-snug md:leading-relaxed max-w-2xl mx-auto">
            {DEFAULT_SUBHEAD}
          </p>

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
        <div className="relative" id="scalers-apply-form">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <form
              method="POST"
              action="/.netlify/functions/scalers-post"
              onSubmit={handleSubmit}
              className="p-5 md:p-7 space-y-4"
            >
              {/* Hidden fields — browser form POST includes every
                  input with a name attribute. These carry the geo
                  classification + attribution + campaign metadata
                  to the Netlify function, which then forwards to
                  Zapier and 302s to /nextstep or /router. All
                  derived from state so React keeps them current. */}
              <input type="hidden" name="stage" value={STAGE_TAG} />
              <input type="hidden" name="track" value="scalers" />
              <input type="hidden" name="funnel_track" value="scalers" />
              <input type="hidden" name="audience" value={country?.audience ?? 'non_target'} />
              <input type="hidden" name="country_code" value={country?.code ?? ''} />
              <input type="hidden" name="country_name" value={country?.name ?? ''} />
              <input type="hidden" name="dial_country" value={dialCountry.code} />
              <input type="hidden" name="dial_code" value={dialCountry.dial} />
              <input type="hidden" name="dial_touched" value={dialTouched ? 'true' : 'false'} />
              <input type="hidden" name="page_path" value={typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''} />
              <input type="hidden" name="campaign_variant_id" value={variant?.id ?? ''} />
              <input type="hidden" name="lead_magnet_id" value={leadMagnet?.id ?? ''} />
              <input type="hidden" name="lead_magnet_delivery" value={leadMagnet?.delivery_reference ?? ''} />
              {Object.entries(hiddenAttribution).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
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
                    name="first_name"
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
                    name="last_name"
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
                  name="email"
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
                    name="phone"
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

        {/* Brand marquee - rotating conveyor of brands we have
            worked with (Trivium pattern). Brands list is a
            PLACEHOLDER - swap SCALERS_BRANDS in src/lib/scalers.ts
            with the real names (and logoUrls once hosted) and the
            strip updates. The component gracefully falls back to
            text badges when logoUrl is empty. */}
        <section className="mt-14 md:mt-16 -mx-5 md:mx-0">
          <BrandMarquee brands={SCALERS_BRANDS} label="Brands We Have Helped Scale" />
        </section>

        {/* How It Works - 3 steps */}
        <section className="mt-20 md:mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-orange-700 mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
              From where you are now to a clear scale plan, in three steps.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                num: '01',
                icon: ClipboardList,
                title: 'Apply in under 2 minutes',
                body: 'Fill out a short application so we know your product, your numbers, and where you want to go next. No fluff, no essay.',
              },
              {
                num: '02',
                icon: PhoneCall,
                title: 'Get on your Seller Growth Call',
                body: 'A focused 1-on-1 session with a Passion Product coach. We pull up your listing, your ads, and your goals, and work through what to change first.',
              },
              {
                num: '03',
                icon: TrendingUp,
                title: 'Walk away with your scale plan',
                body: 'You leave the call with a specific, prioritized plan for your next quarter and a clear read on whether we are the right team to help you execute it.',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="absolute -top-3 -left-3 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-sm shadow-md">
                    {step.num}
                  </div>
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 text-orange-600 mb-3 ml-10">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1.5 leading-tight">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-snug">{step.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* What you walk away with - call deliverables */}
        <section className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-orange-700 mb-4">
              <Zap className="w-3.5 h-3.5" /> What You Walk Away With
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
              A real roadmap, not a sales pitch disguised as a call.
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Even if we never work together, you leave the Seller Growth Call with concrete things you can act on this week.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: 'A clear read on what is holding you back',
                body: 'Where the leverage actually lives on your listing, your ads, and your product mix.',
              },
              {
                icon: Compass,
                title: 'A prioritized plan for the next 90 days',
                body: 'Specific moves in order, so you stop guessing which thing to work on first.',
              },
              {
                icon: PhoneCall,
                title: 'Honest fit check with our team',
                body: 'Whether (and how) the Passion Product team could help you run the plan, laid out directly.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600 mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1.5 leading-tight">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-snug">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fit check - who it is / isn't for */}
        <section className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Is this a fit?
            </h2>
            <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              We would rather tell you now than waste your call slot.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">A fit if you are...</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Already selling a product live on Amazon',
                  'Ambitious about where you want this to go',
                  'Open to feedback on what to actually change',
                  'Willing to do the work your plan calls for',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-6 h-6 text-slate-400" />
                <h3 className="text-lg font-black text-slate-900">Not a fit if you...</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Do wholesale, retail arbitrage, or online arbitrage',
                  'Are only looking for a get-rich-quick angle',
                  'Will not change anything we identify together',
                  'Have no product live on Amazon yet (watch the free training first)',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-slate-700">
                    <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA - scroll back to form */}
        <section className="mt-20 max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-8 md:p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
              Ready to find out what's possible?
            </h2>
            <p className="mt-4 text-base md:text-lg text-orange-50 max-w-2xl mx-auto leading-relaxed">
              Apply for your Seller Growth Call. If we are the right team to help you execute, we will say so. If we are not, you still leave with a plan.
            </p>
            <a
              href="#scalers-apply-form"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('scalers-apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base md:text-lg font-black text-orange-700 shadow-lg transition hover:bg-orange-50 hover:scale-[1.02]"
            >
              Apply for your Seller Growth Call <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-4 text-xs text-orange-100/90">
              Nothing to pay to apply. Results not typical.
            </p>
          </div>
        </section>
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
