# Campaign Variants — /newform lead page

The `/newform` lead page renders variant-specific content when a
visitor lands with a matching `utm_source` + `utm_campaign`. When
no match, the default page is shown.

The goal: make each YouTube (or Instagram, or email) link feel
directly tied to the content the visitor just came from —
headline, offer, and CTA all match the promise of the originating
video.

---

## Where the data lives

Two configuration tables, both plain TypeScript files, versioned
in git, easy to edit inline:

| File | Purpose |
|---|---|
| [`src/config/leadMagnets.ts`](../src/config/leadMagnets.ts) | Reusable resources (checklist, prompt pack, calculator, strategy call) — each with an id, name, and delivery reference |
| [`src/config/campaignVariants.ts`](../src/config/campaignVariants.ts) | One row per `utm_source` + `utm_campaign` pair with the headline, offer box copy, and lead-magnet id |
| [`src/lib/campaignVariant.ts`](../src/lib/campaignVariant.ts) | The matcher — reads URL, normalizes, resolves. Should not need edits. |

## Adding a new campaign (typical flow)

1. **Pick a `utm_campaign` value.** Kebab-case. Usually one per video.
   Example: `product-research-2026-oct`.

2. **Add or reuse a lead magnet** in `src/config/leadMagnets.ts`.
   Give it a stable `id`, a `name`, and the `delivery_reference` your
   email automation needs to fulfill it (Zapier tag, file URL, etc.).

3. **Add a campaign row** in `src/config/campaignVariants.ts`:
   - `id` — stable, kebab-case
   - `utm_source` + `utm_campaign` — the exact strings on the link
   - `internal_name` — human label for you
   - `content_url` — the YouTube / IG URL for reference
   - `active: true`
   - `headline` — headline copy
   - `supporting_copy` — optional eyebrow line (empty = no eyebrow)
   - `lead_magnet_id` — references leadMagnets.ts
   - `show_offer_box` — set true to show the "what you get" box
   - `offer_title`, `offer_description`, `offer_bullets` — box copy
   - `cta_text` — optional button-label override (empty = default)

4. **Tag your outbound link** using the exact utm values from step 3:
   ```
   https://travisfba.com/newform?utm_source=youtube&utm_campaign=product-research-2026-oct
   ```

5. **Commit + push.** Netlify redeploys automatically.

## Matching rules

- Both `utm_source` and `utm_campaign` are normalized (lowercased +
  trimmed) before comparison. Casual capitalization on outbound
  links is fine.
- Match against the **first ACTIVE row** where both fields match.
- No match → default page.
- Missing UTMs → default page.
- Row with `active: false` → skipped.

## Fallback / inheritance behavior

- If the variant's `headline` is empty (`''`), the default headline shows.
- If `supporting_copy` is empty, the eyebrow line is hidden.
- If `cta_text` is empty, the default button label shows.
- If `show_offer_box: false`, the offer box is not rendered even
  when the other fields are filled.
- If `lead_magnet_id` references an inactive or missing row in
  leadMagnets.ts, no magnet is attached to the submission.

## Attribution — what gets sent with form submissions

When a visitor submits the /newform, the following are sent along:

- All standard UTM params + ad-platform click IDs (unchanged from before)
- `campaign_variant_id` — id of the matched variant (or empty)
- `lead_magnet_id` — id of the promised resource (or empty)
- `lead_magnet_delivery` — the raw `delivery_reference` string, for
  Zapier / email-automation to route the correct resource to the
  right email sequence

Your downstream Zapier or email-automation should read
`lead_magnet_delivery` to decide which resource to send.

The matched `campaign_variant_id` is also stashed in
sessionStorage (`pp_matched_campaign_variant_id`) so mid-funnel
navigation that strips URL params can still recover it.

## PostHog tracking

Every `newform_submitted` event now carries `campaign_variant_id`
and `lead_magnet_id` (both nullable). Filter or group by these in
PostHog to see per-video conversion, per-magnet conversion, and
downstream funnel behavior.

## Fallback for VSL / sales-focused videos

Not every video should offer a lead magnet. For sales-focused
content, the variant can point at a `strategy_call_flow`-style
lead magnet, hide the offer box, and re-word the CTA (e.g.
"BOOK MY FREE CALL"). See the `sample-yt-vsl` example row.

## Sample data

The three sample rows currently in `campaignVariants.ts` are
labeled `[SAMPLE]` in their `internal_name`. Delete them or turn
`active: false` before shipping real campaign copy.

## Later extensions (not built yet)

- **Different funnel destinations per variant.** Right now every
  submission goes to `/router`. A variant-specific destination
  could be added by threading `variant.redirect_to` through the
  submit handler.
- **Move config to Netlify Blobs / a headless CMS** so non-devs
  can edit variants without a git commit. The matcher already
  reads from an in-memory table — swap the source module without
  changing consumers.
- **Instagram-specific variants** — same mechanism, just add rows
  with `utm_source: 'instagram'` once the agency coordinates
  outbound tagging.
