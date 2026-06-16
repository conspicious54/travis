/* ───── PostHog helper ─────────────────────────────────────────────
   Thin wrapper around window.posthog so we can safely call it from
   React components without worrying about whether it's loaded yet.
──────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (
        distinctId: string,
        properties?: Record<string, any>,
        setOnce?: Record<string, any>
      ) => void;
      setPersonProperties: (
        properties: Record<string, any>,
        setOnce?: Record<string, any>
      ) => void;
      /* Feature flags / experiments. The vanilla PostHog snippet in
         index.html stubs these on init and the script fills them in
         once loaded. Declaring them on the Window so TypeScript sees
         them, and so getVariant() / useFeatureFlag() below have a
         single typed surface. */
      getFeatureFlag: (key: string) => string | boolean | undefined;
      isFeatureEnabled: (key: string) => boolean | undefined;
      onFeatureFlags: (cb: (flags: string[]) => void) => void;
      reloadFeatureFlags: () => void;
    };
  }
}

function ph() {
  return typeof window !== 'undefined' ? window.posthog : undefined;
}

/* First-touch person properties read at identify time. PostHog's
   built-in $initial_utm_source etc. only get set on the very first
   pageview of a session - if the visitor was anonymous for several
   pageviews before identifying, those $initial values come from the
   anonymous session start (often "direct" because UTMs land on a
   redirect, not the eventual identify event). lead_source / utm_*
   below are OUR explicit first-touch properties set at the moment
   we know who the person is - more reliable for "what brought this
   identified person in" analysis. */
function readFirstTouchProps(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  const out: Record<string, any> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (k: string) => {
      const v = params.get(k);
      return v && v.trim() ? v.trim() : null;
    };
    let utmSource = fromUrl('utm_source');
    let utmMedium = fromUrl('utm_medium');
    let utmCampaign = fromUrl('utm_campaign');
    let utmContent = fromUrl('utm_content');
    let utmTerm = fromUrl('utm_term');

    // Fall back to sessionStorage UTMs (persisted on first booking-page
    // visit so they survive the HubSpot iframe interaction).
    if (!utmSource) {
      try {
        const stored = sessionStorage.getItem('pp_utm_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          utmSource    = utmSource    || parsed.utm_source    || null;
          utmMedium    = utmMedium    || parsed.utm_medium    || null;
          utmCampaign  = utmCampaign  || parsed.utm_campaign  || null;
          utmContent   = utmContent   || parsed.utm_content   || null;
          utmTerm      = utmTerm      || parsed.utm_term      || null;
        }
      } catch { /* no-op */ }
    }

    if (utmSource)   { out.lead_source         = utmSource;   out.first_utm_source   = utmSource; }
    if (utmMedium)   { out.first_utm_medium    = utmMedium; }
    if (utmCampaign) { out.first_utm_campaign  = utmCampaign; }
    if (utmContent)  { out.first_utm_content   = utmContent; }
    if (utmTerm)     { out.first_utm_term      = utmTerm; }

    out.first_landing_url  = window.location.href;
    out.first_landing_path = window.location.pathname;
    if (document && document.referrer) out.first_referrer = document.referrer;
  } catch { /* no-op */ }
  return out;
}

import { isPlaceholder, isValidEmail } from './urlParams';

/* HubSpot tracking + GTM dataLayer types. The HS embed snippet in
   index.html stubs window._hsq as soon as it executes; the GTM
   snippet stubs window.dataLayer the same way. Declaring them on
   the Window so TypeScript sees them, and so identify / dataLayer
   pushes are type-safe across the codebase. */
declare global {
  interface Window {
    _hsq?: Array<[string, ...unknown[]]>;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/** Push a HubSpot identify so HubSpot's tracking ties the recent +
    future pageviews on this session to a contact record. Standard
    HubSpot fields (email, firstname, lastname, phone) are
    automatically applied to the contact record; custom fields are
    too, as long as the contact property exists. Safe no-op if HS
    script hasn't loaded yet (the _hsq queue is processed once it has).

    Also fires a trackPageView so the current pageview is attributed
    immediately - per HubSpot's documented pattern. */
export function identifyHubSpot(
  email: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (!isValidEmail(email)) return;
  try {
    window._hsq = window._hsq || [];
    const payload: Record<string, unknown> = { email: email.trim().toLowerCase() };
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (isPlaceholder(v)) continue;
        if (v === undefined || v === null || v === '') continue;
        payload[k] = v;
      }
    }
    window._hsq.push(['identify', payload]);
    window._hsq.push(['trackPageView']);
  } catch { /* no-op */ }
}

/** Push an event to the GTM dataLayer. GTM tags can listen for
    the `event` key and route to Google Ads conversion tracking
    (with the gclid we capture in syncUtm), Google Analytics 4,
    Meta Pixel (when the user adds it), etc.

    For Google Ads Enhanced Conversions: the email below is passed
    raw - configure GTM to SHA-256 hash it before forwarding to
    Google Ads, OR rely on Google Ads' own auto-hashing in the
    Enhanced Conversions tag config. Either way, raw is the right
    thing to send from the page since GTM's transform layer
    expects it. */
export function pushDataLayer(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    const cleaned: Record<string, unknown> = { event };
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (isPlaceholder(v)) continue;
        if (v === undefined || v === null) continue;
        cleaned[k] = v;
      }
    }
    window.dataLayer.push(cleaned);
  } catch { /* no-op */ }
}

/** Identify a user by email + set person properties. Rejects empty,
    malformed, and placeholder-style values (e.g. "_____") so a broken
    upstream merge tag never collapses real visitors into a fake
    Person. See src/lib/urlParams.ts for the placeholder definitions.

    Now also identifies the visitor on HubSpot's first-party
    tracking (so HubSpot pageviews tie to the contact) and pushes
    a `lead_identified` event to GTM's dataLayer with the email +
    captured click IDs / UTMs - GTM tags can use these to feed
    Google Ads Enhanced Conversions / Meta Pixel match keys.

    Captures first-touch attribution (lead_source / first_utm_* /
    first_landing_url) via $set_once - written only on the FIRST
    identify of this Person, so a return visit via "direct" doesn't
    overwrite the original source.

    Captured click IDs (gclid, fbclid, etc) are stamped on the
    Person via $set so any PostHog insight can break down funnels
    by acquisition channel - useful for "what's the conversion rate
    of Google Ads gclid visitors vs Meta fbclid visitors" analysis. */
export function identifyUser(email: string, properties?: Record<string, any>) {
  if (!isValidEmail(email)) return;
  const cleanEmail = email.trim().toLowerCase();
  const cleaned: Record<string, any> = {};
  if (properties) {
    for (const [k, v] of Object.entries(properties)) {
      if (isPlaceholder(v)) continue;
      cleaned[k] = v;
    }
  }
  // Pull persisted click IDs + UTMs (set when persistUtmsFromUrl
  // was called earlier in this session) and attach as Person
  // properties via $set, so PostHog insights can break down funnels
  // by acquisition channel without us threading the params through
  // every track call.
  const clickIds = readPersistedClickIdsForIdentify();
  for (const [k, v] of Object.entries(clickIds)) {
    if (v) cleaned[k] = v;
  }
  const setOnce = readFirstTouchProps();
  ph()?.identify(cleanEmail, cleaned, setOnce);

  // HubSpot tracking identify - ties pageviews to the contact
  identifyHubSpot(cleanEmail, {
    email: cleanEmail,
    firstname: cleaned.first_name,
    lastname: cleaned.last_name,
    phone: cleaned.phone,
  });

  // GTM dataLayer event - GTM tags can route this to Google Ads
  // Enhanced Conversions / Meta Pixel / GA4 with the right
  // transformations. Including click IDs so the conversion-side tag
  // doesn't have to re-read them from the URL (might be missing
  // post-redirect).
  pushDataLayer('lead_identified', {
    email: cleanEmail,
    first_name: cleaned.first_name,
    last_name: cleaned.last_name,
    phone: cleaned.phone,
    ...clickIds,
  });
}

/* Internal: dynamically read persisted ad-platform attribution
   (click IDs + Meta first-party cookies) without a static import
   of syncUtm.ts - that would create an import cycle since
   syncUtm.ts imports trackEvent from this file. Module-level
   access via sessionStorage is safe because both modules are
   pure ESM and resolved at runtime. */
function readPersistedClickIdsForIdentify(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('pp_utm_data');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, string> = {};
    for (const f of ['gclid', 'gbraid', 'wbraid', 'fbclid', 'li_fat_id', 'ttclid', '_fbp', '_fbc']) {
      const v = parsed[f];
      if (typeof v === 'string' && v.trim()) out[f] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Set person properties without re-identifying. Strips placeholder
    values for the same reason as identifyUser above. */
export function setPersonProperties(properties: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (isPlaceholder(v)) continue;
    cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) return;
  ph()?.setPersonProperties(cleaned);
}

/** Fire a custom event */
export function trackEvent(event: string, properties?: Record<string, any>) {
  ph()?.capture(event, properties);
}

/* ───── pre-built events for our funnel ───────────────────────────── */

export type BookingType = 'closer' | 'setter' | 'webinar_closer' | 'webinar_setter';

export function trackBookingPageViewed(type: BookingType) {
  trackEvent('booking_page_viewed', { booking_type: type });
}

export function trackBookingCompleted(type: BookingType, payload?: Record<string, any>) {
  trackEvent('booking_completed', { booking_type: type, ...payload });
  // Strong-intent conversion - fan out to GTM so Google Ads /
  // Meta / GA4 can record it as a conversion. All four booking
  // pages (Book / BookCall / WebinarBook / WebinarBookCall)
  // already call trackBookingCompleted, so this picks them up
  // automatically.
  pushDataLayer('booking_completed', { booking_type: type, ...payload });
}

export function trackConfirmationPageViewed(type: 'closer' | 'setter' | 'generic', personalization?: Record<string, any>) {
  trackEvent('confirmation_page_viewed', { page_type: type, ...personalization });
}

export function trackVideoPlayed(videoName: string, section: string) {
  trackEvent('video_played', { video_name: videoName, section });
}

export function trackBreakoutVideoPlayed(headline: string) {
  trackEvent('breakout_video_played', { headline });
}

export function trackTestimonialsExpanded(totalCount: number) {
  trackEvent('testimonials_expanded', { total_count: totalCount });
}

export function trackCalendarAdded(provider: string) {
  trackEvent('calendar_added', { provider });
}

export function trackCreditQuizStarted() {
  trackEvent('credit_card_quiz_started');
}

export function trackCreditQuizCompleted(tier: string, cardName: string) {
  trackEvent('credit_card_quiz_completed', { tier, card_name: cardName });
}

export function trackCreditCardApplyClicked(cardName: string, tier: string) {
  trackEvent('credit_card_apply_clicked', { card_name: cardName, tier });
}

export function trackContactSaved(region: string, platform: string) {
  trackEvent('contact_saved', { region, platform });
}

export function trackScrollIndicatorVisible() {
  trackEvent('scroll_indicator_seen');
}

/* ───── Conversion events (for Google Ads / Meta Ads) ────────────
   These push to GTM's dataLayer so GTM tags can route to:
     - Google Ads conversion tracking (uses gclid auto-attached to
       the same browser visit; configure the Google Ads conversion
       tag in GTM to fire on these `event` names)
     - GA4 conversion events
     - Meta Pixel events (when the user adds the pixel)
     - LinkedIn Insight Tag conversions

   Each conversion ALSO fires a parallel PostHog event so we get
   the same data without depending on GTM being correctly
   configured. PostHog gives us behavioral funnels;
   Google/Meta/LinkedIn get the conversion signal for ad
   optimization.

   Event names are deliberately platform-neutral - GTM tags
   transform them to the right per-platform name (e.g.
   `lead_submitted` → Google Ads "Form Submission" conversion,
   Meta "Lead" event, etc).
─────────────────────────────────────────────────────────────────── */

/** Fired on /newform submit. Top-of-funnel lead capture. */
export function trackConversionLead(properties?: Record<string, unknown>): void {
  pushDataLayer('lead_submitted', properties);
  trackEvent('conversion_lead_submitted', properties);
}

/** Fired on /applynow Typeform completion. Mid-funnel "application
    completed" milestone - many ad platforms use this as their
    optimization target above raw lead. */
export function trackConversionApplication(properties?: Record<string, unknown>): void {
  pushDataLayer('application_completed', properties);
  trackEvent('conversion_application_completed', properties);
}

/* Booking-completed conversion is fired inside trackBookingCompleted
   above (all four booking pages already call that), so no separate
   trackConversionBooking helper is needed - it would just duplicate.

   Sale-closed conversion fires SERVER-SIDE from
   netlify/functions/hubspot-to-posthog.ts when a deal hits Closed
   Won. That path doesn't touch the dataLayer (no browser context),
   so for Google Ads offline-conversion uploads use the
   hs_google_click_id / hs_facebook_click_id properties saved on
   the contact via syncContactUtms - those are designed for
   exactly this. */

/* ───── Feature flags / Experiments ────────────────────────────────
   PostHog Experiments work via feature flags. When you create an
   experiment in the PostHog UI, it generates a feature flag whose
   value is the variant key for the visitor (e.g. 'control',
   'variant-a'). PostHog handles sticky bucketing per distinct_id,
   so the same visitor always sees the same variant - even across
   anonymous→identified transitions (we have person_profiles:'always'
   in index.html, which is what makes that stitching work).

   Helpers below give us a typed, async-safe surface. The PostHog
   feature-flag payload loads asynchronously; reading the flag
   before it's loaded returns undefined. Two patterns:

   1) One-shot read (e.g. fire a tracking event with the variant):
        const variant = getVariant('newform-headline-test');

   2) Render based on flag (recommended for UI variants):
        const variant = useFeatureFlag('newform-headline-test');
        if (variant === undefined) return <Skeleton />; // still loading
        return variant === 'variant-a' ? <HeadlineA /> : <HeadlineDefault />;

   Diagnostic: PostHog autocaptures `$feature_flag_called` whenever
   getFeatureFlag is called, so you can see in the experiment UI
   that the flag is firing as expected. No extra wiring needed.
─────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';

/** One-shot synchronous read of a feature flag's variant value.
    Returns undefined until PostHog has loaded the flag payload.
    For UI rendering prefer useFeatureFlag (hook) which re-renders
    when the flag arrives. */
export function getVariant(flagKey: string): string | boolean | undefined {
  return ph()?.getFeatureFlag(flagKey);
}

/** Sync read: is a boolean flag enabled. Returns undefined while
    flags are still loading. */
export function isEnabled(flagKey: string): boolean | undefined {
  return ph()?.isFeatureEnabled(flagKey);
}

/** React hook that reads a feature flag and re-renders when the
    flag payload arrives. Returns undefined while flags are loading
    so callers can render a control / skeleton in that window.

    Example - A/B test the /newform headline:
      const variant = useFeatureFlag('newform-headline-test');
      // variant is 'control' | 'variant-a' | 'variant-b' | undefined
      const headline = variant === 'variant-a'
        ? 'How First-Time Sellers Hit $100K on Amazon'
        : 'Learn the Exact Process I Use...'; // control / undefined
      return <h1>{headline}</h1>;

    PostHog automatically fires $feature_flag_called when the flag
    is read, so the exposure event is tracked without extra code.
    Tie the experiment goal to any downstream event (e.g.
    newform_submitted, applynow_typeform_completed) in the
    PostHog UI when you create the experiment. */
export function useFeatureFlag(flagKey: string): string | boolean | undefined {
  const [value, setValue] = useState<string | boolean | undefined>(() => {
    return typeof window !== 'undefined' ? ph()?.getFeatureFlag(flagKey) : undefined;
  });
  useEffect(() => {
    const p = ph();
    if (!p) return;
    // Re-check on mount in case flags loaded between initial state
    // and effect (race during fast navigations).
    const current = p.getFeatureFlag(flagKey);
    if (current !== value) setValue(current);
    // Subscribe: PostHog fires the callback once flags are loaded
    // and again whenever they change (e.g. after identifyUser
    // triggers a re-evaluation because the identified user matches
    // a different cohort than the anonymous one).
    p.onFeatureFlags(() => {
      setValue(p.getFeatureFlag(flagKey));
    });
  }, [flagKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}
