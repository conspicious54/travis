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
  firstname?: string;
  lastname?: string;
  stage?: string;
  is_member?: boolean;
  country_code?: string;
  country_name?: string;
  audience?: 'target' | 'non_target';
  // Campaign attribution — set by /newform when a UTM campaign matched
  // a variant in src/config/campaignVariants.ts. Downstream Zapier /
  // email automation should read lead_magnet_delivery to fulfill the
  // exact resource the lead was promised.
  campaign_variant_id?: string;
  lead_magnet_id?: string;
  lead_magnet_delivery?: string;
  // Phone-field metadata (set only when the dial selector was shown).
  //   dial_country: ISO alpha-2 of the selector choice (e.g. "US", "GB")
  //   dial_code:    the actual "+X" prefix prepended to the phone (e.g. "+1", "+44")
  //   dial_touched: true if visitor manually overrode the IP default
  dial_country?: string;
  dial_code?: string;
  dial_touched?: boolean;
  // Full attribution envelope — UTM params + ad-platform click IDs +
  // Meta first-party cookies. Forwarded verbatim so Zapier /
  // ActiveCampaign / Mailchimp / Meta CAPI can tie the lead to the
  // source that produced them.
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_ad_group?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  gbraid?: string;
  wbraid?: string;
  li_fat_id?: string;
  _fbp?: string;
  _fbc?: string;
}

// Server-side fallback in case the client didn't send audience -
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
  const firstname = (body.firstname || '').trim();
  const lastname = (body.lastname || '').trim();
  const submittedAt = new Date().toISOString();
  // Normalize string fields: trim + drop empty so Zapier sees clean
  // "field missing" vs "field is empty string".
  const s = (v?: string) => {
    const t = (v || '').trim();
    return t ? t : undefined;
  };

  const zapResult = await forwardToZapier({
    email,
    phone,
    firstname,
    lastname,
    stage,
    is_member: !!body.is_member,
    audience,
    country_code: countryCode,
    country_name: countryName,
    submitted_at: submittedAt,
    // Campaign attribution
    campaign_variant_id: s(body.campaign_variant_id),
    lead_magnet_id: s(body.lead_magnet_id),
    lead_magnet_delivery: s(body.lead_magnet_delivery),
    // Phone / dial metadata
    dial_country: s(body.dial_country),
    dial_code: s(body.dial_code),
    dial_touched: body.dial_touched === true ? true : undefined,
    // Attribution envelope — only forward fields that were provided
    utm_source:   s(body.utm_source),
    utm_medium:   s(body.utm_medium),
    utm_campaign: s(body.utm_campaign),
    utm_content:  s(body.utm_content),
    utm_term:     s(body.utm_term),
    utm_ad_group: s(body.utm_ad_group),
    gclid:        s(body.gclid),
    fbclid:       s(body.fbclid),
    ttclid:       s(body.ttclid),
    gbraid:       s(body.gbraid),
    wbraid:       s(body.wbraid),
    li_fat_id:    s(body.li_fat_id),
    _fbp:         s(body._fbp),
    _fbc:         s(body._fbc),
  });

  console.log(
    `[register-webinar] email=${email} name="${firstname} ${lastname}".trim() ` +
    `stage="${stage}" audience=${audience} country=${countryCode || '?'} ` +
    `magnet=${body.lead_magnet_id || '-'} variant=${body.campaign_variant_id || '-'} ` +
    `utm=${body.utm_source || '-'}/${body.utm_campaign || '-'} ` +
    `zap_ok=${zapResult.ok} reason=${zapResult.reason || ''}`
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
  firstname: string;
  lastname: string;
  stage: string;
  is_member: boolean;
  audience: 'target' | 'non_target';
  country_code: string;
  country_name: string;
  submitted_at: string;
  campaign_variant_id?: string;
  lead_magnet_id?: string;
  lead_magnet_delivery?: string;
  dial_country?: string;
  dial_code?: string;
  dial_touched?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_ad_group?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  gbraid?: string;
  wbraid?: string;
  li_fat_id?: string;
  _fbp?: string;
  _fbc?: string;
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
