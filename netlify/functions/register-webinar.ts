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
  audience?: 'target' | 'non_target';
}

// Server-side fallback in case the client didn't send audience —
// must mirror the TARGET_COUNTRIES set in src/lib/detectCountry.ts.
const TARGET_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'NZ', 'IE']);
function classifyAudience(code: string): 'target' | 'non_target' {
  if (!code) return 'non_target';
  return TARGET_COUNTRIES.has(code.toUpperCase()) ? 'target' : 'non_target';
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
  // Trust the client's audience if it sent one, otherwise classify
  // server-side from the country code. Either way we have a value.
  const audience: 'target' | 'non_target' = body.audience === 'target' || body.audience === 'non_target'
    ? body.audience
    : classifyAudience(countryCode);

  const properties: Record<string, string> = {
    webinar_registered: 'true',
    webinar_launch_stage: stage,
    webinar_registration_source: body.is_member ? 'list' : 'cold',
    webinar_registered_at: new Date().toISOString(),
    webinar_audience: audience,
  };
  if (countryCode) properties.webinar_country_code = countryCode;
  if (countryName) properties.webinar_country = countryName;
  const phone = (body.phone || '').trim();
  if (phone) properties.phone = phone;

  // Fire Zapier and HubSpot IN PARALLEL — neither depends on the
  // other succeeding. Zapier is the source of truth for list/email
  // management; HubSpot is just CRM tagging. If HubSpot fails (e.g.
  // a custom property doesn't exist yet), the registration is still
  // captured downstream.
  const [zapResult, hubspotResult] = await Promise.all([
    forwardToZapier({
      email,
      phone,
      stage,
      is_member: !!body.is_member,
      audience,
      country_code: countryCode,
      country_name: countryName,
      submitted_at: new Date().toISOString(),
    }),
    upsertHubspotContact(email, properties, token),
  ]);

  console.log(
    `[register-webinar] email=${email} stage="${stage}" ` +
    `audience=${audience} country=${countryCode || '?'} ` +
    `zap_ok=${zapResult.ok} zap_reason=${zapResult.reason || ''} ` +
    `hs_ok=${hubspotResult.ok} hs_reason=${hubspotResult.reason || ''}`
  );

  // The user-facing "ok" is whether the LIST sync succeeded. HubSpot
  // is best-effort and doesn't gate the response.
  return json(200, {
    ok: zapResult.ok,
    email,
    stage,
    audience,
    country_code: countryCode || null,
    zapier: zapResult,
    hubspot: hubspotResult,
  });
};

async function upsertHubspotContact(
  email: string,
  properties: Record<string, string>,
  token: string
): Promise<{ ok: boolean; status?: number; reason?: string; detail?: string }> {
  // PATCH by email; on 404 create new. If properties include fields
  // that don't exist on the contact object, HubSpot 400s the whole
  // request. We return the failure without re-trying — the caller
  // treats this as best-effort.
  const upsertUrl = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`;
  let res: Response;
  try {
    res = await fetch(upsertUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties }),
    });
  } catch (err) {
    return { ok: false, reason: 'hubspot_fetch_error' };
  }

  if (res.status === 404) {
    try {
      res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { ...properties, email } }),
      });
    } catch (err) {
      return { ok: false, reason: 'hubspot_create_fetch_error' };
    }
  }

  if (res.ok) return { ok: true, status: res.status };

  let bodyText = '';
  try { bodyText = (await res.text()).slice(0, 300); } catch { /* no-op */ }
  console.warn(`[register-webinar] HubSpot ${res.status} email=${email} body=${bodyText}`);
  return { ok: false, status: res.status, reason: 'hubspot_error', detail: bodyText };
}

interface ZapierPayload {
  email: string;
  phone: string;
  stage: string;
  is_member: boolean;
  audience: 'target' | 'non_target';
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
