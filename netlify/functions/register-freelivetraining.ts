import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/register-freelivetraining ─────────────
   Dedicated opt-in forwarder for the /freelivetraining webinar
   page. Deliberately split from register-webinar.ts so the webinar
   flow has zero shared surface with the main-funnel opt-in path
   (NewForm, Scalers, legacy /live-training). Those still point at
   register-webinar; this is wired to its own Zapier Catch Hook via
   its own env var, so the two Zaps can evolve independently without
   either regressing the other.

   POST { email, phone?, firstname?, lastname?, country_code?,
          country_name?, audience?, dial_country?, dial_code?,
          dial_touched?, page_path? }
   → Forwards the payload (plus submission timestamp + client IP)
     to the Zapier webhook configured via
     FREELIVETRAINING_ZAPIER_WEBHOOK_URL. Zapier handles list
     management (ActiveCampaign), reminder emails, and any downstream
     automation. This function does nothing else.

   Always returns HTTP 200 so a hiccup doesn't block the user's
   confirmation page. Status of the Zap forward is in the response
   body + function log.

   Env vars (set in Netlify → Site settings → Environment variables):
     FREELIVETRAINING_ZAPIER_WEBHOOK_URL   the Zapier "Catch Hook" URL
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
  firstname?: string;
  lastname?: string;
  country_code?: string;
  country_name?: string;
  audience?: 'target' | 'non_target';
  dial_country?: string;
  dial_code?: string;
  dial_touched?: boolean;
  page_path?: string;
  // Ad-click attribution. Always forwarded to Zapier (empty string
  // when absent) so Zap filters / routing / Google Ads + Meta CAPI
  // steps can map them regardless of whether a given test record
  // happened to carry a value.
  gclid?: string;
  fbclid?: string;
  _fbp?: string;
  _fbc?: string;
}

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

  const countryCode = (body.country_code || '').trim().toUpperCase();
  const countryName = (body.country_name || '').trim();
  const audience: 'target' | 'non_target' =
    body.audience === 'target' || body.audience === 'non_target'
      ? body.audience
      : classifyAudience(countryCode);

  // Non-target: replace actual country with "DQ" so Zapier filters /
  // list routing can short-circuit on one value regardless of which
  // non-target country the visitor is in. Mirrors register-webinar's
  // convention so if you ever consolidate downstream Zap logic, both
  // feeds look the same.
  const outCountryCode = audience === 'target' ? countryCode : 'DQ';
  const outCountryName = audience === 'target' ? countryName : 'DQ';
  const s = (v?: string) => (v || '').trim();

  const zapResult = await forwardToZapier({
    source: 'freelivetraining',
    email,
    phone: s(body.phone),
    firstname: s(body.firstname),
    lastname: s(body.lastname),
    audience,
    country_code: outCountryCode,
    country_name: outCountryName,
    submitted_at: new Date().toISOString(),
    dial_country: s(body.dial_country),
    dial_code: s(body.dial_code),
    dial_touched: body.dial_touched === true,
    page_path: s(body.page_path),
    ip_address: extractClientIp(event.headers) || '',
    // Attribution — always emitted, empty string when the client
    // didn't carry one. Lets Zapier map every field in sample view.
    gclid:  s(body.gclid),
    fbclid: s(body.fbclid),
    _fbp:   s(body._fbp),
    _fbc:   s(body._fbc),
  });

  console.log(
    `[register-freelivetraining] email=${email} ` +
    `name="${s(body.firstname)} ${s(body.lastname)}".trim() ` +
    `audience=${audience} country=${outCountryCode || '?'} ` +
    `zap_ok=${zapResult.ok} reason=${zapResult.reason || ''}`
  );

  return json(200, {
    ok: zapResult.ok,
    email,
    audience,
    country_code: countryCode || null,
    zapier: zapResult,
  });
};

/* Every field is required (no "?") because the function always emits
   every field — empty string / false if missing — so Zapier can see
   and map them in the Zap editor regardless of whether a given
   sample record happens to carry a value. If a field were omitted
   when empty, Zapier's "sample data" view would hide it and
   downstream Zap steps couldn't reference it. */
interface ZapierPayload {
  source: 'freelivetraining';
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  audience: 'target' | 'non_target';
  country_code: string;
  country_name: string;
  submitted_at: string;
  dial_country: string;
  dial_code: string;
  dial_touched: boolean;
  page_path: string;
  ip_address: string;
  gclid: string;
  fbclid: string;
  _fbp: string;
  _fbc: string;
}

async function forwardToZapier(
  payload: ZapierPayload
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const url = (process.env.FREELIVETRAINING_ZAPIER_WEBHOOK_URL || '').trim();
  if (!url) return { ok: false, reason: 'zapier_webhook_not_configured' };
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[register-freelivetraining] zapier fetch error', err);
    return { ok: false, reason: 'zapier_fetch_error' };
  }
  if (!res.ok) {
    let body = '';
    try { body = (await res.text()).slice(0, 200); } catch { /* no-op */ }
    console.warn(`[register-freelivetraining] zapier ${res.status}: ${body}`);
    return { ok: false, status: res.status, reason: `zapier_${res.status}` };
  }
  return { ok: true, status: res.status };
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

function extractClientIp(headers: Record<string, string | undefined>): string | undefined {
  const xff = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const alt = headers['x-real-ip'] || headers['X-Real-IP'] ||
              headers['client-ip'] || headers['Client-IP'];
  if (alt) return alt.trim();
  return undefined;
}
