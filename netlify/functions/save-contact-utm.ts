import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/save-contact-utm ──────────────────────
   POST { email, utm_source?, utm_medium?, utm_campaign?,
          utm_content?, utm_term?, utm_id? }
   → Overwrites the contact's UTM properties with the provided
     values on every booking. Last-touch attribution: the most
     recent booking's UTM context is always what's recorded.

   Designed for the booking flow: when someone lands on /book or
   /bookacall with ?utm_source=… in the URL, we capture it client-
   side and call this function on meetingBookSucceeded. The new
   values replace whatever was previously stored, so DM-setter
   shared links and other late-touch campaigns are reflected.

   Always returns HTTP 200 to the client so a write hiccup never
   blocks the user flow. Errors land in the function log.

   Requires env var HUBSPOT_TOKEN with crm.objects.contacts.read
   AND crm.objects.contacts.write.
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const HUBSPOT_BASE = 'https://api.hubapi.com';

// Order matters only for diagnostic logging - all fields handled the same
const UTM_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
] as const;
type UtmField = (typeof UTM_FIELDS)[number];

/* Browser click-ID param name → HubSpot contact property name.
   gbraid and wbraid both fold into hs_google_click_id because
   HubSpot exposes a single Google slot - and they're both Google's
   identifiers anyway (iOS app campaigns / web-from-iOS-app). The
   gclid takes precedence if both are present on the same hit. */
const CLICK_ID_MAP: Record<string, string> = {
  gclid: 'hs_google_click_id',
  gbraid: 'hs_google_click_id',
  wbraid: 'hs_google_click_id',
  fbclid: 'hs_facebook_click_id',
  li_fat_id: 'hs_linkedin_click_id',
  ttclid: 'hs_tiktok_click_id',
};
const CLICK_ID_FIELDS = Object.keys(CLICK_ID_MAP) as Array<keyof typeof CLICK_ID_MAP>;

interface SavePayload extends Partial<Record<UtmField, string>> {
  email?: string;
  source?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  li_fat_id?: string;
  ttclid?: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(200, { ok: false, reason: 'method_not_allowed' });
  }

  let body: SavePayload = {};
  try {
    body = event.body ? (JSON.parse(event.body) as SavePayload) : {};
  } catch {
    return json(200, { ok: false, reason: 'invalid_json' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(200, { ok: false, reason: 'email_missing' });
  }

  // Collect non-empty UTM fields from the payload
  const incoming: Record<string, string> = {};
  for (const f of UTM_FIELDS) {
    const v = (body[f] || '').trim();
    if (v) incoming[f] = v;
  }

  // Map browser click-ID names → HubSpot property names. gclid wins
  // over gbraid/wbraid since real gclid is the most actionable ID
  // (works with the broadest set of Google Ads offline-conv tools).
  for (const f of CLICK_ID_FIELDS) {
    const v = ((body as Record<string, string | undefined>)[f] || '').trim();
    if (!v) continue;
    const hsProp = CLICK_ID_MAP[f];
    // Don't overwrite a gclid we already set this request with a
    // gbraid/wbraid value - first write wins, and we iterate gclid first.
    if (incoming[hsProp]) continue;
    incoming[hsProp] = v;
  }

  if (Object.keys(incoming).length === 0) {
    return json(200, { ok: false, reason: 'no_utm_fields' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { ok: false, reason: 'token_not_set' });
  }

  // Two-pass retry - HubSpot sometimes takes a moment to index a
  // brand-new contact created by the booking flow.
  for (const delayMs of [0, 2000]) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    const writeRes = await patchContact(email, incoming, token);
    if (writeRes.ok) {
      console.log(
        `[save-contact-utm] ok email=${email} wrote=${JSON.stringify(incoming)}`
      );
      return json(200, { ok: true, written: incoming });
    }
    if (writeRes.status === 404) {
      // contact not indexed yet - wait and retry
      continue;
    }
    console.warn(
      `[save-contact-utm] HubSpot ${writeRes.status} email=${email} body=${writeRes.body}`
    );
    return json(200, {
      ok: false,
      reason: 'hubspot_error',
      status: writeRes.status,
      detail: writeRes.body,
    });
  }

  console.warn(`[save-contact-utm] contact not found after retries email=${email}`);
  return json(200, { ok: false, reason: 'contact_not_found' });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}


interface PatchResult {
  ok: boolean;
  status: number;
  body: string;
}

async function patchContact(
  email: string,
  properties: Record<string, string>,
  token: string
): Promise<PatchResult> {
  const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(
    email
  )}?idProperty=email`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch {
    /* no-op */
  }
  return { ok: res.ok, status: res.status, body: bodyText.slice(0, 400) };
}
