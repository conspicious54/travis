import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/register-webinar ──────────────────────
   POST { email, phone?, stage, source?, is_member? }
   → Upserts the contact in HubSpot, sets:
     - webinar_registered = true
     - webinar_launch_stage = <the dropdown answer>
     - webinar_registration_source = 'list' | 'cold' (or whatever
       the client passed)
     - phone (only if provided — list members may skip this field)

   Always returns HTTP 200 so a CRM hiccup doesn't block the user's
   confirmation page. Errors land in the function log and PostHog.

   Requires env var HUBSPOT_TOKEN with
     crm.objects.contacts.read + crm.objects.contacts.write
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const HUBSPOT_BASE = 'https://api.hubapi.com';

interface RegisterPayload {
  email?: string;
  phone?: string;
  stage?: string;
  source?: string;
  is_member?: boolean;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(200, { ok: false, reason: 'method_not_allowed' });
  }

  let body: RegisterPayload = {};
  try {
    body = event.body ? (JSON.parse(event.body) as RegisterPayload) : {};
  } catch {
    return json(200, { ok: false, reason: 'invalid_json' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(200, { ok: false, reason: 'email_missing' });
  }
  const stage = (body.stage || '').trim();
  if (!stage) {
    return json(200, { ok: false, reason: 'stage_missing' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { ok: false, reason: 'token_not_set' });
  }

  const properties: Record<string, string> = {
    webinar_registered: 'true',
    webinar_launch_stage: stage,
    webinar_registration_source: body.is_member ? 'list' : 'cold',
    webinar_registered_at: new Date().toISOString(),
  };
  const phone = (body.phone || '').trim();
  if (phone) properties.phone = phone;

  // Upsert: try update by email; if 404, create.
  const upsertUrl = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`;
  let res = await fetch(upsertUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (res.status === 404) {
    // Contact doesn't exist — create it with email + the same props
    res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { ...properties, email } }),
    });
  }

  if (!res.ok) {
    let bodyText = '';
    try { bodyText = (await res.text()).slice(0, 300); } catch { /* no-op */ }
    console.warn(`[register-webinar] HubSpot ${res.status} email=${email} body=${bodyText}`);
    return json(200, {
      ok: false,
      reason: 'hubspot_error',
      status: res.status,
      detail: bodyText,
    });
  }

  console.log(`[register-webinar] ok email=${email} stage="${stage}" source=${properties.webinar_registration_source}`);
  return json(200, { ok: true, email, stage });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
