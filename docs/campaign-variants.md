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

The three sample rows in `campaignVariants.ts` are labeled
`[SAMPLE]` and set to `active: false`. Copy one as a template.

---

## Source-video CTA buttons (per-video, automatic)

Separate from the hand-written variants above. Built on the existing
YouTube UTM mapping: every video description links to the funnel as
`?utm_source=youtube&utm_campaign=<slug>`, with slugs assigned in the
**UTM Tags Tracker** tab of "Effective Ecommerce - Big Sheet". Each
slug is tagged with a **CTA type**, and the funnel's buttons echo it.
No row per video needed.

| Type | Video | `/` button | `/nextstep` button |
|---|---|---|---|
| `call_plan` | Pitches a free call + custom 90-day / 6-month game plan | GET MY FREE GAME PLAN | Build My Free Game Plan |
| `call` | Pitches a free strategy / coaching / one-on-one call | CLAIM MY FREE CALL | Get My Free Strategy Call |
| `program` | Pitches the Accelerator / mentorship program | YES, I'M READY TO START | Yes! Help Me Build My Business |
| `apply` | "Work with us" / "I want to hire / invest in you" | COUNT ME IN — LET'S TALK | I'm In — Start My Application |
| `dropshipping` | Topic is dropshipping (came for a different model) | COMPARE TO DROPSHIPPING | Explore Owning My Own Brand |
| `affiliate` | Topic is affiliate marketing / hosting / WordPress / WooCommerce | SEE ANOTHER WAY TO EARN | Explore Selling My Own Product |
| `default` | Free course / training, other affiliate-tool videos, unknown | SIGN UP TO WATCH NOW | running A/B test copy |

Topic types (`dropshipping`, `affiliate`) win over pitch types: those
viewers came for something else, so the copy invites them to compare
instead of assuming they already want Amazon FBA.

### Files

| File | Purpose |
|---|---|
| [`src/config/ctaArchetypes.ts`](../src/config/ctaArchetypes.ts) | Button copy per type — edit copy here |
| [`data/youtube-utm-tags.csv`](../data/youtube-utm-tags.csv) | Snapshot of the UTM Tags Tracker (video → slug) |
| [`src/config/videoCtas.ts`](../src/config/videoCtas.ts) | **Generated** slug → type table |
| [`src/config/videoCtaOverrides.ts`](../src/config/videoCtaOverrides.ts) | Hand-edited per-slug overrides (win over generated) |
| [`scripts/build_video_ctas.py`](../scripts/build_video_ctas.py) | Rebuilds `videoCtas.ts` from both sheets |
| [`src/lib/videoCta.ts`](../src/lib/videoCta.ts) | Resolver used by `/` and `/nextstep` |

### Matching

`utm_source=youtube` + a known `utm_campaign` slug, lowercased and
trimmed (same rules as the campaign variants above). The match is
stored in sessionStorage (`pp_cta_archetype`, `pp_source_video_id`)
and forwarded by `newform-post` on the 302 (`source_video_id`,
`cta_archetype`), so `/nextstep` keeps it.

**Preview any type** without a real link: `?cta_archetype=program`
(or any type name above).

### Precedence

On `/`: campaign variant `cta_text` → video type → default.
On `/nextstep`: video type → `nextstep-cta-copy-test` arm.

### Adding new videos

1. Add the video's slug to the UTM Tags Tracker (as you already do),
   and its CTA to the CTA sheet.
2. Download the UTM Tags Tracker tab as CSV over
   `data/youtube-utm-tags.csv`.
3. `python3 scripts/build_video_ctas.py ~/Downloads/travis-ctas.xlsx`
   — it also lists CTA-sheet videos that have no slug yet.
4. Review the diff of `src/config/videoCtas.ts`, commit, push.

Wrong type for one video? Add its slug to `videoCtaOverrides.ts`.

### Tracking

Once matched, every custom PostHog event in the tab carries
`cta_archetype` and `source_video_id` (enriched in `trackEvent`),
including `applynow_page_viewed` and `booking_completed`. The
`/newform` submission (Zapier payload) carries both fields too.

When reading the `nextstep-cta-copy-test` results, filter
`cta_archetype is not set` — matched visitors see their type's copy,
not the test arm.
