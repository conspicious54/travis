/* ───── Campaign variants table ───────────────────────────────────
   Maps exact utm_source + utm_campaign pairs to a page configuration
   for the /newform lead page. When a visitor lands with a matching
   pair, the page renders the variant's headline, offer box, and CTA.
   When no match, the default page is shown.

   Adding a variant:
     1. Pick a stable `id` (kebab-case).
     2. Set `utm_source` + `utm_campaign` to the EXACT strings you'll
        use on the outbound YouTube/Instagram/email link.
     3. Reference an active `lead_magnet_id` from
        src/config/leadMagnets.ts.
     4. Fill in `headline`, plus offer-box fields if you want the
        "what you get" section shown (`show_offer_box: true`).
     5. Leave optional fields ('') to inherit the default page copy.

   Matching is case-insensitive; both source and campaign are
   normalized (lowercased + trimmed) before comparison. The first
   ACTIVE row that matches both fields wins.

   Fallback:
     - Missing UTMs → default page
     - Unknown / inactive pair → default page
     - Variant with empty optional field → default field shown
     - show_offer_box:false → offer box not rendered

   SAMPLE ROWS below are marked as such — replace with real
   variants when copy is ready.
──────────────────────────────────────────────────────────────────── */

export interface CampaignVariant {
  /** Stable identifier — sent with form submissions for attribution. */
  id: string;
  /** Exact utm_source value to match (e.g. 'youtube', 'instagram'). */
  utm_source: string;
  /** Exact utm_campaign value to match. Usually one per video. */
  utm_campaign: string;
  /** Human-readable internal label — not shown to visitors. */
  internal_name: string;
  /** Originating video / content URL, for reference in this table. */
  content_url: string;
  /** Whether this configuration is served. Inactive rows never match. */
  active: boolean;
  /** Campaign-specific headline. Empty string = inherit default. */
  headline: string;
  /** Optional supporting text override (the eyebrow line above the
      headline). Empty = inherit default. */
  supporting_copy: string;
  /** Reference to a resource in leadMagnets.ts. Empty = no magnet
      (defaults to whatever the default page offers). */
  lead_magnet_id: string;
  /** Whether to display the "what you get" section. */
  show_offer_box: boolean;
  /** Title shown in the offer box. */
  offer_title: string;
  /** Short explanation of the offer shown in the offer box. */
  offer_description: string;
  /** Bullet points shown in the offer box. */
  offer_bullets: readonly string[];
  /** Optional CTA button-label override. Empty = inherit default. */
  cta_text: string;
}

export const CAMPAIGN_VARIANTS: readonly CampaignVariant[] = [
  // ─── SAMPLE ROWS — replace with real variants ──────────────────
  {
    id: 'sample-yt-product-research',
    utm_source: 'youtube',
    utm_campaign: 'product-research-video',
    internal_name: '[SAMPLE] YouTube · product-research video',
    content_url: 'https://www.youtube.com/watch?v=EXAMPLE',
    active: true,
    headline: 'Get the Exact Product Research Checklist I Use',
    supporting_copy: 'The same one that helped find products doing $100K+/mo',
    lead_magnet_id: 'sample-product-research-checklist',
    show_offer_box: true,
    offer_title: 'Product Research Checklist',
    offer_description:
      'The 12-step framework I run every new product idea through before spending a dollar on inventory.',
    offer_bullets: [
      'The 4 filters that kill 80% of bad ideas fast',
      'How to verify real demand (not just search volume)',
      "The margin check most people skip",
    ],
    cta_text: 'GET THE CHECKLIST',
  },
  {
    id: 'sample-yt-ai-prompts',
    utm_source: 'youtube',
    utm_campaign: 'ai-prompts-video',
    internal_name: '[SAMPLE] YouTube · ai-prompts video',
    content_url: 'https://www.youtube.com/watch?v=EXAMPLE',
    active: true,
    headline: 'Get the AI Prompts I Use to Find Winning Amazon Products',
    supporting_copy: '',
    lead_magnet_id: 'sample-ai-prompts-pack',
    show_offer_box: true,
    offer_title: 'AI Prompts for Product Research',
    offer_description:
      'The exact prompts I paste into ChatGPT and Claude to speed up niche + product research.',
    offer_bullets: [
      '12 prompts covering the full research flow',
      'Copy-paste ready, no fluff',
      'Works with any AI model',
    ],
    cta_text: 'GET THE PROMPTS',
  },
  {
    id: 'sample-yt-vsl',
    utm_source: 'youtube',
    utm_campaign: 'story-vsl',
    internal_name: '[SAMPLE] YouTube · sales-focused / VSL video',
    content_url: 'https://www.youtube.com/watch?v=EXAMPLE',
    active: true,
    headline: 'Book Your Free Amazon Strategy Call',
    supporting_copy: 'Skip the guessing. Talk to a real coach who has done this.',
    lead_magnet_id: 'sample-strategy-call',
    show_offer_box: false,
    offer_title: '',
    offer_description: '',
    offer_bullets: [],
    cta_text: 'BOOK MY FREE CALL',
  },
];
