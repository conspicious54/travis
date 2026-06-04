/* ───── PostHog helper ─────────────────────────────────────────────
   Thin wrapper around window.posthog so we can safely call it from
   React components without worrying about whether it's loaded yet.
──────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (distinctId: string, properties?: Record<string, any>) => void;
      setPersonProperties: (properties: Record<string, any>) => void;
    };
  }
}

function ph() {
  return typeof window !== 'undefined' ? window.posthog : undefined;
}

/* Placeholder values commonly emitted by ActiveCampaign / Mailchimp /
   HubSpot when a contact's merge field is empty. We must NEVER pass
   these through to posthog.identify - doing so collapses every real
   visitor with the same broken email link onto a single fictional
   Person. The 2026-06 "_____" Person had ~2700 events from dozens of
   different cities pollute its history before we caught this. */
const PLACEHOLDER_PATTERN = /^[_\-*~.\s]+$/;
const KNOWN_PLACEHOLDERS = new Set([
  'firstname', 'first_name', 'lastname', 'last_name', 'email', 'phone',
  'firstname', 'lastname', 'fname', 'lname',
  'null', 'undefined', 'none', 'unknown', 'n/a', 'na',
  '*|email|*', '*|fname|*', '*|lname|*',
]);

function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return true;
  if (PLACEHOLDER_PATTERN.test(v)) return true;
  if (KNOWN_PLACEHOLDERS.has(v.toLowerCase())) return true;
  // Unsubstituted merge-tag patterns
  if (/^\{\{.+\}\}$/.test(v)) return true; // {{firstname}}
  if (/^\[.+\]$/.test(v)) return true;     // [FIRST_NAME]
  if (/^%[A-Z_]+%$/.test(v)) return true;  // %FIRSTNAME%
  if (/^\*\|.+\|\*$/.test(v)) return true; // *|EMAIL|* Mailchimp
  return false;
}

function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const v = email.trim();
  if (v.length < 5) return false;
  if (!v.includes('@')) return false;
  if (!v.includes('.')) return false;
  if (isPlaceholder(v)) return false;
  return true;
}

/** Identify a user by email + set person properties. Rejects empty,
    malformed, and placeholder-style values (e.g. "_____") so a broken
    AC merge tag never collapses real visitors into a fake Person. */
export function identifyUser(email: string, properties?: Record<string, any>) {
  if (!isValidEmail(email)) return;
  const cleaned: Record<string, any> = {};
  if (properties) {
    for (const [k, v] of Object.entries(properties)) {
      if (isPlaceholder(v)) continue;
      cleaned[k] = v;
    }
  }
  ph()?.identify(email.trim().toLowerCase(), cleaned);
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

export function trackBookingPageViewed(type: 'closer' | 'setter') {
  trackEvent('booking_page_viewed', { booking_type: type });
}

export function trackBookingCompleted(type: 'closer' | 'setter', payload?: Record<string, any>) {
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
