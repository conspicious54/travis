import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/save-contact-utm ──────────────────────
   POST { email, utm_source?, utm_medium?, utm_campaign?,
          utm_content?, utm_term?, utm_id? }
   → For each provided UTM field, write it to the HubSpot contact
     ONLY IF that property is currently empty. Existing values are
     never overwritten — first-touch attribution is preserved.

   Designed for the booking flow: when someone lands on /book or
   /bookacall with ?utm_source=… in the URL, we capture it client-
   side and call this function on meetingBookSucceeded. If the
   contact already has utm_source from an earlier touch, we leave
   it alone.

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

// Order matters only for diagnostic logging — all fields handled the same
const UTM_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
] as const;
type UtmField = (typeof UTM_FIELDS)[number];

interface SavePayload extends Partial<Record<UtmField, string>> {
  email?: string;
  source?: string;
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
  if (Object.keys(incoming).length === 0) {
    return json(200, { ok: false, reason: 'no_utm_fields' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { ok: false, reason: 'token_not_set' });
  }

  // Two-pass retry — HubSpot sometimes takes a moment to index a
  // brand-new contact created by the booking flow.
  for (const delayMs of [0, 2000]) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    const existing = await readContactUtms(email, token);
    if (existing === 'not_found') continue;
    if (existing === 'error') {
      return json(200, { ok: false, reason: 'lookup_failed' });
    }

    // Build the property bag: only include fields where the current
    // value is empty/missing. Anything already set stays.
    const toWrite: Record<string, string> = {};
    const skipped: Record<string, string> = {};
    for (const [field, newValue] of Object.entries(incoming)) {
      const current = existing[field];
      if (!current) {
        toWrite[field] = newValue;
      } else {
        skipped[field] = current;
      }
    }

    if (Object.keys(toWrite).length === 0) {
      console.log(
        `[save-contact-utm] no empty fields to fill for ${email} — preserved: ${Object.keys(skipped).join(', ')}`
      );
      return json(200, { ok: true, written: {}, preserved: skipped });
    }

    const writeRes = await patchContact(email, toWrite, token);
    if (writeRes.ok) {
      console.log(
        `[save-contact-utm] ok email=${email} wrote=${JSON.stringify(toWrite)} preserved=${JSON.stringify(skipped)}`
      );
      return json(200, { ok: true, written: toWrite, preserved: skipped });
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

type ReadResult = Record<string, string | undefined> | 'not_found' | 'error';

async function readContactUtms(email: string, token: string): Promise<ReadResult> {
  const propsParam = UTM_FIELDS.join(',');
  const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(
    email
  )}?idProperty=email&properties=${propsParam}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    console.warn('[save-contact-utm] read fetch error', err);
    return 'error';
  }
  if (res.status === 404) return 'not_found';
  if (!res.ok) {
    console.warn(`[save-contact-utm] read non-ok ${res.status}`);
    return 'error';
  }
  const data = (await res.json().catch(() => ({}))) as { properties?: Record<string, string> };
  return data.properties || {};
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
