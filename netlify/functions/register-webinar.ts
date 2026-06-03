import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/register-webinar ──────────────────────
   POST { email, phone?, stage, is_member?, country_code?,
          country_name?, audience? }
   → Forwards the payload to the Zapier webhook configured via
     WEBINAR_ZAPIER_WEBHOOK_URL. Zapier handles list management,
     country-based routing (AC / Mailchimp), and any downstream
     automation. This function does nothing else.

   Always returns HTTP 200 so a hiccup doesn't block the user's
   confirmation page. Status of the Zap forward is in the response
   body + function log.

   Env vars (set in Netlify → Site settings → Environment variables):
     WEBINAR_ZAPIER_WEBHOOK_URL   the Zapier "Catch Hook" URL
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

interface RegisterPayload {
  email?: string;
  phone?: string;
  stage?: string;
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

  const countryCode = (body.country_code || '').trim().toUpperCase();
  const countryName = (body.country_name || '').trim();
  const audience: 'target' | 'non_target' =
    body.audience === 'target' || body.audience === 'non_target'
      ? body.audience
      : classifyAudience(countryCode);

  const phone = (body.phone || '').trim();
  const submittedAt = new Date().toISOString();

  const zapResult = await forwardToZapier({
    email,
    phone,
    stage,
    is_member: !!body.is_member,
    audience,
    country_code: countryCode,
    country_name: countryName,
    submitted_at: submittedAt,
  });

  console.log(
    `[register-webinar] email=${email} stage="${stage}" audience=${audience} ` +
    `country=${countryCode || '?'} zap_ok=${zapResult.ok} reason=${zapResult.reason || ''}`
  );

  return json(200, {
    ok: zapResult.ok,
    email,
    stage,
    audience,
    country_code: countryCode || null,
    zapier: zapResult,
  });
};

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
  if (!url) return { ok: false, reason: 'zapier_webhook_not_configured' };
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
