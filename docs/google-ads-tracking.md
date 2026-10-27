# Google Ads tracking

## Two outcomes

| Outcome | Authoritative source | Ads use |
| --- | --- | --- |
| Booked call | Fresh confirmed OnceHub booking on the paid acquisition calendars | Primary; campaign optimization |
| Closed Won sale | Actual amount on the Closed Won HubSpot deal | Separate Secondary import initially |

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

## Sales delivery: not yet implemented

The user selected **Closed Won deal amount**, not collected cash. The existing native HubSpot Customer conversion sends a fixed $6,000 contact-lifecycle value and is not actual revenue. The existing `hubspot-to-posthog` job does not upload Google Ads sales conversions.

An actual-revenue import requires:

- A separate import conversion action, initially Secondary, with unique deal/order ID.
- The actual deal amount and its currency, original Closed Won timestamp and an unambiguous associated buyer contact.
- Supported matching identifiers and the existing applicable consent state; no guessed consent or substituted identifier types.
- Retry visibility, duplicate suppression, and a defined policy for deal amount edits or reversals. Do not count re-entering Closed Won as a new sale.
- An authorized Google Data Manager API connection, or a managed import source that supports these fields. Native HubSpot lifecycle sync alone cannot supply actual deal amounts.

Do not connect this import to the website booking action, turn on sale-based bidding, or add booking and sale values together as revenue. The booking action's current $1 is a lead-value placeholder.

## Validation

Run `node scripts/test-tracking.mjs` and `npm run build`.

The regression harness stubs analytics and HTTP delivery and sends no real conversions. It covers documented payloads, identity precedence, concurrent callbacks, blocked storage/GTM, normalizations, status/calendar rejection, GCLID mapping and acknowledged CRM sync.

A production sign-off still requires coordinated real setter and closer test bookings in Tag Assistant, matching HubSpot records, and a later eligible paid-attribution check. Direct visits to confirmation pages must not fire booking conversions. A real Closed Won import must be validated separately after connecting the sales importer.
