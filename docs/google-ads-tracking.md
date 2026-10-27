# Google Ads tracking

## Two outcomes

| Outcome | Authoritative source | Ads use |
| --- | --- | --- |
| Booked call | Fresh confirmed OnceHub booking on the paid acquisition calendars | Primary; campaign optimization |
| Customer / sale signal | Native HubSpot Customer lifecycle event, fixed $6,000 estimated value | Secondary; observation only |

PostHog supports funnel analysis; it is not an intermediate delivery service for Google Ads. HubSpot Lead/SQL/Opportunity lifecycle changes do not establish that a booking happened.

## Booking delivery

`/book` (BKC-Q45L7MVX52, closer) and `/bookacall` (BKC-P9JY2GLKJX, setter) authenticate the OnceHub iframe message, validate the completion event and calendar, then use `src/lib/booking.ts` to publish one `booked_call` event. Guest identity comes from explicit OnceHub guest fields, including `payload.custom_fields`; attendees are not used to guess the customer.

GTM-PFM6WLRP routes this event to `AW-17226149122/5JlrCMSwxdccEILaiJZA`. Transaction ID comes from `booking_id`; event `user_data` comes from `enhanced_conversion_data` through the Code User-Provided Data variable. The website supplies normalized SHA-256 email and, when international format is available, phone.

The callback waits for tag processing or a short timeout before navigation. This proves browser processing, not receipt by Google's servers. Missing/blocked GTM cannot indefinitely block a booked customer's confirmation page.

Google Ads Count One means one lead conversion per ad click. Transaction ID independently deduplicates the same booking. For operational appointment totals, use OnceHub. Do not interpret Ads counts as every calendar appointment.

Only these two paid acquisition routes are migrated. The DM, webinar and Scalers booking routes retain their previous analytics behavior. Check the full route for each campaign before using those funnels for acquisition; do not broaden calendar eligibility automatically.

## Attribution

`save-contact-utm` writes real GCLIDs to `hs_google_click_id`. GBRAID/WBRAID remain distinct in the browser/form/webhook attribution envelope; they must not be uploaded as GCLIDs. There is no verified native HubSpot braid-property mapping in this implementation.

The browser marks a CRM update successful only after a server acknowledgement. Failures remain retryable on a later sync invocation. The endpoint retries briefly while a newly created OnceHub contact is indexed. This remains best effort, not a durable attribution job; preserve a deal-linked acquisition snapshot when implementing revenue imports.

## Sales delivery: native HubSpot connection

Use the existing HubSpot Customer event at the user's selected fixed **$6,000** value. Keep it Secondary. This is an estimated customer value, not the actual amount on each deal or collected cash. It can report sales outcomes without adding another integration or affecting booking-based bidding.

There is no custom sales uploader or Google Cloud dependency in this setup. Actual Closed Won deal-amount imports are deferred. The existing `hubspot-to-posthog` analytics job is independent of the native HubSpot-to-Google connection.

Do not add the booking action's $1 placeholder or other lifecycle-event values to Customer value and call that total revenue. Do not combine booking and sale counts as unique customers.

## Validation

Run `node scripts/test-tracking.mjs` and `npm run build`.

The regression harness stubs analytics and HTTP delivery and sends no real conversions. It covers documented payloads, identity precedence, concurrent callbacks, blocked storage/GTM, normalizations, status/calendar rejection, GCLID mapping and acknowledged CRM sync.

A production sign-off still requires coordinated real setter and closer test bookings in Tag Assistant, matching HubSpot records, and a later eligible paid-attribution check. Direct visits to confirmation pages must not fire booking conversions. The native Customer event should remain visible in HubSpot sync diagnostics and Secondary in Google Ads.
