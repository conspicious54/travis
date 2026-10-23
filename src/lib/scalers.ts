/* ───── Scalers track — placeholder registry ─────────────────────
   Every piece of Scalers content that still needs real data lives
   here. When Connor sends the real VSL / OnceHub page / Typeform
   / HubSpot property names, swap the values below and the whole
   track updates in one place.

   DO NOT scatter Scalers URLs/IDs across individual page files.
   Everything funnels through this module.
──────────────────────────────────────────────────────────────────── */

export const SCALERS_TRACK = 'scalers' as const;
export const MAIN_TRACK = 'main' as const;
export type FunnelTrack = typeof SCALERS_TRACK | typeof MAIN_TRACK;

/** FBA Scalers wordmark + arrow logo. Hosted on the same R2 bucket
 *  as the coach photos. UPLOAD STEP: Connor needs to drop the logo
 *  file at this exact filename on the R2 bucket for it to resolve.
 *  Height on the pages is capped around 48px so the orange arrow
 *  reads at a glance without crowding the hero. */
export const SCALERS_LOGO_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/FBA-Scalers-Logo.png';

/** The Wistia (or Vimeo, or self-hosted mp4) ID that renders on
 *  /scalers/vsl. Placeholder = the same clip used on /nextstep so
 *  the page still visibly works. Swap when Connor records the real
 *  Scalers VSL. */
export const SCALERS_VSL_WISTIA_ID = 'b59ry1rcif';

/** OnceHub booking page name for the Seller Growth Call calendar.
 *  Placeholder = the main setter calendar so bookings still land
 *  somewhere real while this is being set up. Replace with the
 *  Scalers-specific OnceHub page name when it's issued. */
export const SCALERS_ONCEHUB_PAGE = 'PLACEHOLDER-seller-growth-call';

/** Typeform form_id for the Scalers application. Not currently
 *  wired — the Scalers apply page uses a native React form instead
 *  (ScalersApply.tsx) so we don't block on a Typeform licensing
 *  decision. If Connor later wants a Typeform, drop its id here
 *  and switch ScalersApply.tsx to the Typeform embed used by
 *  ApplyNow.tsx. */
export const SCALERS_TYPEFORM_ID = '';

/** HubSpot contact-property names the Scalers form writes to.
 *  Create these in HubSpot (or override here if your admin picks
 *  different internal names). The Zapier webhook forwards whatever
 *  keys are set on the request body, so these names appear in
 *  Zapier → HubSpot step mapping as-is. */
export const SCALERS_HS_PROPS = {
  funnelTrack:        'funnel_track',           // dropdown: main | scalers
  asin:               'scalers_asin',           // single-line text
  storeUrl:           'scalers_store_url',      // single-line text
  monthlySales:       'scalers_monthly_sales',  // dropdown: 0 | <1k | 1k_5k | 5k_25k | 25k+
  unitsAtAmazon:      'scalers_units_at_amazon',
  monthlyPpcSpend:    'scalers_monthly_ppc_spend',
  offerPreference:    'scalers_offer_preference', // dropdown: dfy | dwy | unsure
};

/** Standardised option sets. If HubSpot's internal values differ,
 *  change them here — not in the form. */
export const SCALERS_MONTHLY_SALES_OPTIONS = [
  { value: '0',       label: '$0 — not selling yet' },
  { value: '<1k',     label: 'Under $1,000 / month' },
  { value: '1k_5k',   label: '$1,000 – $5,000 / month' },
  { value: '5k_25k',  label: '$5,000 – $25,000 / month' },
  { value: '25k+',    label: '$25,000+ / month' },
] as const;

export const SCALERS_OFFER_OPTIONS = [
  { value: 'dfy',    label: 'Have your team run it for me' },
  { value: 'dwy',    label: 'Teach me to run it myself' },
  { value: 'unsure', label: 'Not sure yet — want to hear both' },
] as const;

/** Routing: where a qualified Scalers lead goes after the server
 *  geo gate decides they're target. Non-target still goes to
 *  /router regardless of track (DQ UX is track-agnostic). */
export const SCALERS_NEXT_AFTER_SUBMIT = '/scalers/vsl';
export const SCALERS_APPLY_PATH        = '/scalers/apply';
export const SCALERS_BOOK_PATH         = '/scalers/book';
export const SCALERS_CONFIRMATION_PATH = '/scalers/confirmation';

/** localStorage key the qualifier modal uses to avoid re-nagging a
 *  visitor who already answered this session. Session-scoped (we
 *  clear it on new tab via sessionStorage, not localStorage) so a
 *  returning visitor can re-answer if they come back later. */
export const SCALERS_QUALIFIER_SESSION_KEY = 'pp_scalers_qualifier_answered';
