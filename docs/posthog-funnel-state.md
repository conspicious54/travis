# PostHog Funnel - Current State

**Last updated:** 2026-06-03

This document describes the current state of PostHog instrumentation across the
full funnel: what we track, what works, what's broken, and where the drop-offs
actually live. Use this when reasoning about analytics gaps - or when adding new
events so you understand what's already in place.

## Setup

- **Project:** `375981` on `us.posthog.com`
- **Public project token (frontend snippet):** `phc_C7Tc95XjM4s2ZEMBQ9WALFQegjGZSUpmd27gE76CFtoV`
- **Hosts firing into this project:**
  - `travisfba.com` (the React app)
  - `start.travismarziani.com` (ClickFunnels)
- **Identity:** email-based via `posthog.identify(email)`. We call it whenever
  email becomes known (booking-page URL params, form submits, etc.)
- **Dashboard:** [Confirmation Page Health](https://us.posthog.com/project/375981/dashboard/1503504)
  (18 insights covering booking funnel, confirm rates, show rates, exit-popup,
  scroll, dwell, video completion, per-coach breakdowns)

## The four data layers feeding PostHog

1. **Frontend autocapture + custom events** - React app at `travisfba.com` and
   ClickFunnels pages at `start.travismarziani.com` both load the PostHog snippet
   and fire `$pageview`, `$autocapture`, plus our custom events
2. **`posthog.identify(email)` calls** - stitch anonymous browsing to identified
   Person records once we have an email
3. **HubSpot to PostHog scheduled function** -
   `netlify/functions/hubspot-to-posthog.ts` runs every 5 minutes, finds deals
   that entered specific pipeline stages, and POSTs an event per transition to
   `https://us.i.posthog.com/capture/` using the contact's email as
   `distinct_id`. Backfilled the full history once the property-name bug was
   fixed (was `hs_date_entered_<id>`, actually needed `hs_v2_date_entered_<id>`).
4. **Server-side captures from our Netlify functions** - e.g.
   `contact_timezone_synced`, `contact_utm_synced` fired client-side after the
   sync function returns ok

---

## Funnel stages, top to bottom

### Stage 1 - Acquisition (`start.travismarziani.com`)

**What we know about the entry points** (14-day samples):

| Source | Visits | % of CF traffic |
|---|---|---|
| YouTube (combined) | 1,935 | **67%** |
| Direct | 775 | 27% |
| Instagram | 74 | 3% |
| Google organic | 32 | 1% |
| passionproduct.com | 42 | 1% |

**Pages and traffic:**

| Path | Views (14d) | Unique |
|---|---|---|
| `/` (home) | 2,884 | 2,272 |
| `/nextstep` (VSL) | 571 | 451 |
| `/apply-now` | 378 | 316 |
| `/passion-product-fasttrack` | 138 | 112 |
| `/get-started` | 70 | 59 |
| `/free-book-bonus-pack` | 24 | 17 |

**Top button clicks (autocapture):**

| Button | On Page | Clicks |
|---|---|---|
| "SIGN UP TO WATCH NOW" | `/` | 726 |
| "YES! I'm Ready To Learn More" | `/nextstep` | 261 |
| "Click to Apply" | `/apply-now` | 85 |
| "Claim your $97 bootcamp" | `/passion-product-fasttrack` | 18 |

**Status: working.** Pageviews, autocapture clicks, and form submits are all
flowing. ClickFunnels snippet was installed mid-flow so anything older than
~2026-04-30 isn't there.

**Known drop-off:** home to `/nextstep` looks like ~80% in raw numbers but is
actually closer to ~24% inside target countries - much of the drop is the
country router (travisfba.com/router) sending non-target visitors away. See
"Known issues" below.

---

### Stage 2 - Country router (`travisfba.com/router`)

When someone clicks "SIGN UP TO WATCH NOW" on the CF home page, they're sent to
`travisfba.com/router`. The router checks GeoIP and forwards target-country
traffic to `/nextstep` on `start.travismarziani.com`; non-target traffic gets
filtered. Filtered audiences include India, Philippines, Bangladesh, Pakistan
and several others. Approved target: US, CA, GB, AU, NZ, IE (and a few others
on a more permissive list).

**What we see in PostHog:** 14-day window had 608 `/router` pageviews from 537
unique visitors. Of those, ~85% are allowed through.

**Status: working but invisible to cross-domain funnels.** See identity gap
below.

---

### Stage 3 - VSL and application (`start.travismarziani.com/nextstep`, `/apply-now`)

VSL plays on `/nextstep`. PostHog autocapture captures the click on
"YES! I'm Ready To Learn More" (261 in 14d) and the subsequent navigation to
`/apply-now`. From `/apply-now`, "Click to Apply" autocapture fires (85 in
14d).

**Drop-off:** `/nextstep` to `/apply-now` runs roughly 70% conversion at the
pageview level. `/apply-now` to `/book`-or-`/bookacall` runs about 30% - the
biggest leak in the upper funnel right now.

---

### Stage 4 - Booking pages (`travisfba.com/book`, `/bookacall`)

| Event | What it means |
|---|---|
| `booking_page_viewed` | Visited `/book` (closer) or `/bookacall` (setter) |
| `booking_completed` | HubSpot meeting iframe fired `meetingBookSucceeded` postMessage |
| `contact_timezone_synced` | Function wrote `hs_timezone` to contact |
| `contact_utm_synced` | Function wrote UTM properties to contact |
| `contact_utm_sync_attempted` / `contact_utm_sync_skipped` | Diagnostic: when sync was called but bailed out, and why (`no_email`, `no_utms_in_storage`, etc.) |

**Drop-off:** booking-page view to `booking_completed` averages about 60% (78
of 121 in a 7-day sample).

**Identity is captured here** - both pages call `posthog.identify(email)` once
HubSpot's postMessage returns the contact email. From this point onward,
everything the same person does maps to one PostHog Person.

**Status: working.** UTM sync was broken from launch through 5/14 because the
"don't-override" first-touch rule swallowed every real DM-setter UTM. Flipped
to last-touch overwrite on 5/15 and it's been firing reliably since.

---

### Stage 5 - Confirmation pages (`/trainingnew/setter`, `/trainingnew/closer`)

This is the most heavily-instrumented part of the funnel. Events tracked:

**View / engagement:**
- `confirmation_page_viewed` (with `page_type=setter` or `closer`)
- `scroll_depth_reached` at 25/50/75/100%
- `dwell_heartbeat` every 30s while tab is visible, capped at 10min
- `phone_number_copied`
- `wrong_region_clicked`

**Primary action - confirm via SMS or WhatsApp:**
- `setter_confirm_text_clicked` / `setter_confirm_whatsapp_clicked`
- `closer_confirm_text_clicked` / `closer_confirm_whatsapp_clicked`
- `confirm_app_switched` (proxy: tab blurred within 15s of click = they opened
  Messages/WhatsApp)
- `confirm_app_stayed` (didn't switch - likely clicked but didn't follow
  through)

**Mobile-only stickies:**
- `mobile_sticky_bar_clicked` - fires when the always-visible bottom bar is tapped

**FAQ engagement:**
- `confirmation_faq_visible` (intersection observer)
- `confirmation_faq_expanded` / `confirmation_faq_collapsed` (legacy; FAQ is
  now always-visible so these may stop firing)
- `breakout_video_played` - intent click on a video tile
- `sproutvideo_started` / `sproutvideo_paused` / `sproutvideo_completed` -
  actual play events from Sproutvideo postMessage

**Exit:**
- `exit_popup_shown` with `source` = `mouseleave` / `visibilitychange` /
  `scroll_back_to_top`
- `exit_popup_confirm_clicked` when the inline confirm-from-popup button is hit

**Calendar (closer only):**
- `calendar_added` with `provider` = Google / Apple / Outlook / ICS

**Misc:**
- `next_step_button_clicked` - the floating chevron in the bottom-right that
  smooth-scrolls to the next `<h2>`

**Person properties set on confirm:**
- `coach_first_name`, `coach_full_name`, `confirmed_via` (sms/whatsapp),
  `last_platform` (mobile/desktop)

**Status: solid.** This is the cleanest, most reliable layer of our funnel.
Confirm rate (unique-person) trended from 23.6% (mobile) / 45.7% (desktop) in
late April to ~54% / ~55% by mid-May - the optimizations stacked.

---

### Stage 6 - Show-up and beyond (HubSpot deal-stage transitions)

`netlify/functions/hubspot-to-posthog.ts` runs every 5 minutes, queries HubSpot
for deals that entered specific pipeline stages in the last 10 minutes, and
posts one PostHog event per transition. Deterministic UUID per
`(deal_id, stage_id, entered_at)` so replays are dedupe no-ops.

**Stages mapped:**

| HubSpot pipeline / stage | PostHog event |
|---|---|
| Opt-Ins / S2C Call Scheduled | `setter_call_scheduled` |
| Opt-Ins / S2C Call Completed | `setter_call_showed` |
| Opt-Ins / Close Lost | `setter_call_lost` |
| Inbound Scheduled Calls / First Call Completed | `closer_call_showed` |
| Inbound Scheduled Calls / Demo Completed | `closer_demo_completed` |
| Inbound Scheduled Calls / Enrolled | `closer_enrolled` |
| Inbound Scheduled Calls / Closed Won | `sale_closed` (with `amount` property) |
| Inbound Scheduled Calls / Closed Lost | `closer_lost` |

Each event carries `deal_id`, `deal_name`, `pipeline_id`, `pipeline_label`,
`stage_id`, `stage_label`, `amount`, `hs_entered_at`. `distinct_id` is the
associated contact's email, so events stitch to the same Person as everything
upstream.

**Status: working.** Two bugs were fixed mid-cycle:
1. Property name should have been `hs_v2_date_entered_<stageId>` not
   `hs_date_entered_<stageId>` - the v1 properties simply don't exist, so
   every query was returning 0 for ~3 weeks
2. The Private App token was missing `crm.objects.deals.read` scope - returned
   403 on every search. Added the scope, function started flowing
3. Contact lookups were rate-limited by HubSpot causing ~30% "no email" false
   positives - rewrote to batch via `/crm/v4/associations/.../batch/read` and
   `/crm/v3/objects/contacts/batch/read`, drops `skipped` from ~100 to ~1 per
   7-day backfill

---

### Stage 7 - Webinar opt-in (`/live-training`)

New flow (shipped 2026-05-15ish). When someone fills the opt-in:
- `live_training_page_viewed`
- `live_training_country_detected` (with `audience` = `target` / `non_target`)
- `live_training_registered` (with `stage`, `audience`, `country_code`)
- `live_training_register_warning` if the Netlify function returns a non-ok
- `live_training_book_call_clicked` if they click the "ready now" CTA at the
  bottom of the confirmation
- `live_training_calendar_added`, `live_training_youtube_link_clicked`

Sign-up data forwards to a Zapier webhook (`WEBINAR_ZAPIER_WEBHOOK_URL`) which
routes to ActiveCampaign (`audience=target`) or Mailchimp (`non_target`). No
HubSpot writes - that was intentionally removed.

**Status: working as of 2026-06-03 after the HubSpot dependency was stripped
out and the Zapier env var is set.**

---

## What's broken or measurably unreliable

### 1. Cross-domain identity gap

**The biggest single issue.** Cookies are domain-scoped, so a visitor
crossing from `start.travismarziani.com` to `travisfba.com` (e.g. through the
country router) gets assigned a brand new anonymous `distinct_id` in PostHog.
The same human looks like two separate Persons until they submit an email and
`posthog.identify()` fires to stitch them.

**Practical consequence:** any funnel calculation that joins between domains is
inaccurate at the Person level. Page-view counts on each domain are still
correct. The math like "home to nextstep is X%" or "apply-now to book is Y%"
is approximately right at the volume level but wrong at the per-person level.

**How to fix when you decide to:**

- **Option A** - Add a cross-domain identity bridge: when the router redirects
  from `travisfba.com` back to `start.travismarziani.com/nextstep`, append
  `?distinct_id=<value>` to the redirect URL. On the receiving page, call
  `posthog.identify(distinct_id)` with that value. PostHog merges the two
  sessions into one Person.
- **Option B** - Capture an email earlier in the funnel (e.g. a low-friction
  free guide on the home page). Once email is known, every subsequent step
  stitches. Bigger change but better UX.

### 2. Show-rate calculations are noisier than they look

The PostHog dashboard insight "Show-up rate by confirm behavior" tries to join
`closer_confirm_text_clicked` events against `closer_call_showed` events via
`person_id`. Two problems:

- **Pending deals.** A meaningful chunk of HubSpot deals stay in their initial
  stage (`Lead in` for closer, `S2C Call Scheduled` for setter) well past
  their actual call date because sales didn't update the stage. Those visitors
  are "no shows" in business terms but invisible to our event stream.
- **Sales-driven bookings.** Of 290 closer-pipeline deals from a 30-day
  sample, ~45% had a `/trainingnew/closer` pageview attached. The other ~55%
  came in through the setter team booking on the lead's behalf, never seeing
  our React confirmation page. Their show events still fire from HubSpot but
  they have no `confirm_clicked` to join against.

**Net:** the "did confirm click predict show rate" comparison is currently
limited to ~45% of total closer-call volume and the sample-per-bucket is
small (10s, not 100s). Show numbers will only be trustworthy at scale and
once sales stage hygiene improves.

### 3. About 22% of closer-deal contacts never appear in PostHog at all

Truly offline-driven leads - imported from elsewhere, manually created by
sales, etc. These will never have any PostHog data. They show up in HubSpot
events through the scheduled function but the `distinct_id` (their email)
doesn't map to a Person with any web history. Accept this; treat them as a
separate cohort.

### 4. Mobile sticky confirm bar effectively does nothing

After dropping the show threshold to 80px, the bar has captured ~1 click in
14 days against a baseline of ~50-80 confirm-click events. Mobile users tap
the banner buttons before the sticky becomes relevant. Either kill it or
re-design - it's currently dead code.

### 5. `next_step_button_clicked` is mostly noise

Real-user clicks are sparse. Most of the early data was internal testing.
Worth watching for another week before drawing conclusions.

---

## What's measurable vs not - quick reference

| Metric | Reliable? |
|---|---|
| Pageviews per page on each domain | YES |
| Within-domain conversion (e.g. confirm-page view to confirm click) | YES |
| Per-event Person property breakdowns (e.g. confirm by `coach_first_name`) | YES (post-identify) |
| HubSpot deal-stage transition counts | YES |
| Cross-domain funnel conversion at the Person level | NO - identity gap |
| Show rate from PostHog joins (confirm click to show-up) | UNRELIABLE - sample too small, pending deals confound |
| Show rate from HubSpot direct (`Lead in` to `First Call Completed`) | YES at the count level - take "decided outcomes only" and "all entries" as the bounds, real rate is between them |
| Attribution of revenue back to web behavior | LIMITED - works for self-served bookers, missing for setter-driven ones |
| Mobile vs desktop confirm rate at unique-Person level | YES (currently ~equal) |
| FAQ video completion rate | YES (Sproutvideo postMessage events) |

---

## Open items to fix when prioritized

1. **Cross-domain identity bridge** (highest ROI for analytics quality). Adds
   a `?distinct_id=` redirect at the router boundary and an `identify` call on
   the receiving page.
2. **Sales-driven booking event capture** - when the setter manually books a
   closer call via HubSpot CRM, fire a custom PostHog event with
   `booking_path=setter_initiated` so we have parity tracking for the ~55% of
   the closer pipeline that bypasses our React app.
3. **Stage hygiene reminder for the sales team** - automated alert when a deal
   sits in `Lead in` or `S2C Call Scheduled` past its scheduled call date.
   Otherwise our show-rate math is permanently floor-ed by stale data.
4. **Kill or rethink the mobile sticky bar.** Currently dead.
