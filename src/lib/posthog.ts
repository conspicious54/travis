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

/** Identify a user by email + set person properties. Rejects empty,
    malformed, and placeholder-style values (e.g. "_____") so a broken
    upstream merge tag never collapses real visitors into a fake
    Person. See src/lib/urlParams.ts for the placeholder definitions.

    Also captures first-touch attribution (lead_source / first_utm_* /
    first_landing_url) via $set_once - written only on the FIRST
    identify of this Person, so a return visit via "direct" doesn't
    overwrite the original "instagram" / "youtube" / "email" source.
    Use Insights or Cohorts on `lead_source` to segment your funnel
    by acquisition channel. */
export function identifyUser(email: string, properties?: Record<string, any>) {
  if (!isValidEmail(email)) return;
  const cleaned: Record<string, any> = {};
  if (properties) {
    for (const [k, v] of Object.entries(properties)) {
      if (isPlaceholder(v)) continue;
      cleaned[k] = v;
    }
  }
  const setOnce = readFirstTouchProps();
  ph()?.identify(email.trim().toLowerCase(), cleaned, setOnce);
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
