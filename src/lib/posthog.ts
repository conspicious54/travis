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

/** Identify a user by email + set person properties */
export function identifyUser(email: string, properties?: Record<string, any>) {
  if (!email) return;
  ph()?.identify(email, properties);
}

/** Set person properties without re-identifying */
export function setPersonProperties(properties: Record<string, any>) {
  ph()?.setPersonProperties(properties);
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
