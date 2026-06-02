import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/register-webinar ──────────────────────
   POST { email, phone?, stage, source?, is_member?, country_code?,
          country_name? }
   → Upserts the contact in HubSpot, sets:
     - webinar_registered = true
     - webinar_launch_stage = <the dropdown answer>
     - webinar_registration_source = 'list' | 'cold'
     - webinar_country, webinar_country_code (from client-side IP geo)
     - phone (only if provided — list members may skip this field)
   → POSTs the full payload to a Zapier webhook so Zapier can route
     to ActiveCampaign (target countries) or Mailchimp (everywhere
     else) without us hardcoding the routing logic.

   Always returns HTTP 200 so a CRM hiccup doesn't block the user's
   confirmation page. Errors land in the function log and PostHog.

   Env vars (set in Netlify):
     HUBSPOT_TOKEN          contacts.read + contacts.write
     WEBINAR_ZAPIER_WEBHOOK_URL   Zapier "Catch Hook" URL for this
                                  webinar — change between webinars
                                  to point at different Zaps
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
  country_code?: string;
  country_name?: string;
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

  const countryCode = (body.country_code || '').trim().toUpperCase();
  const countryName = (body.country_name || '').trim();

  const properties: Record<string, string> = {
    webinar_registered: 'true',
    webinar_launch_stage: stage,
    webinar_registration_source: body.is_member ? 'list' : 'cold',
    webinar_registered_at: new Date().toISOString(),
  };
  if (countryCode) properties.webinar_country_code = countryCode;
  if (countryName) properties.webinar_country = countryName;
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

  // Forward the registration to Zapier so Zapier can route it to
  // ActiveCampaign (target countries) or Mailchimp (others) using
  // country_code. Single env var lets you swap which Zap receives
  // webhooks per webinar without redeploying.
  const zapResult = await forwardToZapier({
    email,
    phone,
    stage,
    is_member: !!body.is_member,
    country_code: countryCode,
    country_name: countryName,
    submitted_at: new Date().toISOString(),
  });

  console.log(
    `[register-webinar] ok email=${email} stage="${stage}" ` +
    `country=${countryCode || '?'} source=${properties.webinar_registration_source} ` +
    `zap_ok=${zapResult.ok} zap_reason=${zapResult.reason || ''}`
  );
  return json(200, {
    ok: true,
    email,
    stage,
    country_code: countryCode || null,
    zapier: zapResult,
  });
};

interface ZapierPayload {
  email: string;
  phone: string;
  stage: string;
  is_member: boolean;
  country_code: string;
  country_name: string;
  submitted_at: string;
}

async function forwardToZapier(
  payload: ZapierPayload
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const url = (process.env.WEBINAR_ZAPIER_WEBHOOK_URL || '').trim();
  if (!url) return { ok: false, reason: 'zapier_not_configured' };
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[register-webinar] zapier fetch error', err);
    return { ok: false, reason: 'zapier_fetch_error' };
  }
  if (!res.ok) {
    let body = '';
    try { body = (await res.text()).slice(0, 200); } catch { /* no-op */ }
    console.warn(`[register-webinar] zapier ${res.status}: ${body}`);
    return { ok: false, status: res.status, reason: `zapier_${res.status}` };
  }
  return { ok: true, status: res.status };
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
