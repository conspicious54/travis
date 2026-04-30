import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/save-contact-timezone ──────────────────
   POST { email, timezone, source? }
   → PATCHes the contact in HubSpot, setting the default `hs_timezone`
     property so SMS/email automations can render meeting times in the
     recipient's local zone.

   We accept any IANA-style identifier the browser produces from
   Intl.DateTimeFormat().resolvedOptions().timeZone (e.g.
   "America/New_York"). HubSpot accepts these as the value of the
   `hs_timezone` enumeration property. If a future HubSpot release
   tightens validation, the response 4xx will surface in the function
   logs so we can adjust formatting.

   Always returns 200 to the client so a CRM-write failure never
   blocks the user's booking flow. Errors land in the function log.

   Requires env var HUBSPOT_TOKEN with crm.objects.contacts.write.
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const HUBSPOT_BASE = 'https://api.hubapi.com';

interface SavePayload {
  email?: string;
  timezone?: string;
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
  const timezone = (body.timezone || '').trim();
  const source = (body.source || 'unknown').trim();

  if (!email || !email.includes('@')) {
    return json(200, { ok: false, reason: 'email_missing' });
  }
  if (!timezone || !timezone.includes('/')) {
    // Reject obvious junk — IANA names always contain a slash
    // (e.g. America/New_York). UTC and the like aren't useful here.
    return json(200, { ok: false, reason: 'timezone_invalid', timezone });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { ok: false, reason: 'token_not_set' });
  }

  // Try once, then retry once after 2s. HubSpot occasionally takes a
  // moment to index a brand-new contact created by the booking flow.
  for (const delayMs of [0, 2000]) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    const res = await patchContactTimezone(email, timezone, token);
    if (res.ok) {
      console.log(`[save-contact-timezone] ok email=${email} tz=${timezone} source=${source}`);
      return json(200, { ok: true, email, timezone, source });
    }
    if (res.status === 404) {
      // contact not found yet — wait and retry
      continue;
    }
    // Real error (auth/scope/validation). Log and bail.
    console.warn(
      `[save-contact-timezone] HubSpot ${res.status} email=${email} tz=${timezone} body=${res.body}`
    );
    return json(200, {
      ok: false,
      reason: 'hubspot_error',
      status: res.status,
      detail: res.body,
    });
  }

  console.warn(`[save-contact-timezone] contact not found after retries email=${email}`);
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

async function patchContactTimezone(
  email: string,
  timezone: string,
  token: string
): Promise<PatchResult> {
  // Update by email using HubSpot's idProperty parameter — saves us a
  // separate "find contact by email" call.
  const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(
    email
  )}?idProperty=email`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { hs_timezone: timezone },
    }),
  });
  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch {
    /* no-op */
  }
  return { ok: res.ok, status: res.status, body: bodyText.slice(0, 400) };
}
