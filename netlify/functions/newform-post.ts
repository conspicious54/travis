import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/newform-post ──────────────────────────
   Server-side form POST + 302 fallback for the NewForm leadpage.
   NOT WIRED TO THE FORM BY DEFAULT. Standby implementation in case
   the client-side JS redirect in src/pages/NewForm.tsx continues to
   lose visitors between submit and /nextstep arrival.

   This replicates what ClickFunnels did pre-cutover: a native HTML
   form POST handled server-side, with a 302 redirect returned to
   the browser. Zero JavaScript required. No way for an uncaught
   exception, iOS Safari backgrounding, or browser extension to kill
   the redirect — the browser follows the Location header natively.

   To activate:
     1. In src/pages/NewForm.tsx, change the <form> element to:
          <form onSubmit={undefined}
                method="POST"
                action="/.netlify/functions/newform-post">
        (keep onSubmit for client-side analytics firing, but let the
        form POST through natively — the submit event handler can
        return without preventDefault)
     2. Change each <input name="..."> to the correct names below
        (email, firstname, lastname, phone, dial_country, dial_code,
        audience, country_code, country_name, variant_id, lead_magnet_id)
     3. Deploy and watch bookings recover.

   Behavior:
     - Accepts both form-urlencoded (native form POST) and JSON
       (programmatic). Parses accordingly.
     - Fires the Zapier webhook server-side. Awaited — the user is
       waiting on the 302 anyway, so a 500ms Zapier POST is fine.
     - Normalizes audience from country_code if the client didn't
       send one (same TARGET_COUNTRIES set as register-webinar.ts).
     - Returns 302 with Location: /nextstep?email=X&... or /router?...
       The browser treats this as a native navigation.
     - If the Zapier POST fails, we STILL return the 302. Lead is
       logged in the function logs for reconciliation.

   Env vars:
     WEBINAR_ZAPIER_WEBHOOK_URL   (same as register-webinar.ts)
──────────────────────────────────────────────────────────────────── */

const TARGET_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'NZ', 'IE']);
const REDIRECT_TARGET = '/nextstep';
const REDIRECT_NON_TARGET = '/router';

function classifyAudience(code: string): 'target' | 'non_target' {
  if (!code) return 'non_target';
  return TARGET_COUNTRIES.has(code.toUpperCase()) ? 'target' : 'non_target';
}

/** Parse request body as either form-urlencoded or JSON. */
function parseBody(event: HandlerEvent): Record<string, string> {
  const contentType = (
    event.headers['content-type'] ||
    event.headers['Content-Type'] ||
    ''
  ).toLowerCase();
  const raw = event.body || '';
  if (!raw) return {};

  if (contentType.includes('application/json')) {
    try {
      const obj = JSON.parse(raw);
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        out[k] = v == null ? '' : String(v);
      }
      return out;
    } catch { return {}; }
  }

  // Default: form-urlencoded (native <form method=POST>)
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

/** Build the redirect URL identically to how NewForm.tsx builds it
 *  client-side, so downstream pages receive the same query params. */
function buildRedirectUrl(audience: 'target' | 'non_target', body: Record<string, string>): string {
  const path = audience === 'target' ? REDIRECT_TARGET : REDIRECT_NON_TARGET;
  const fwd = new URLSearchParams();
  const forwardFields = [
    'email', 'firstname', 'lastname', 'phone',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_ad_group',
    'gclid', 'fbclid', 'ttclid', 'gbraid', 'wbraid', 'li_fat_id',
    '_fbp', '_fbc',
    'campaign_variant_id', 'lead_magnet_id',
  ];
  for (const key of forwardFields) {
    const v = (body[key] || '').trim();
    if (v) fwd.set(key, v);
  }
  const qs = fwd.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Extract the first client IP from Netlify's x-forwarded-for chain. */
function extractClientIp(headers: Record<string, string | undefined>): string {
  const xff = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const alt = headers['x-real-ip'] || headers['X-Real-IP'] ||
              headers['client-ip'] || headers['Client-IP'];
  return alt ? alt.trim() : '';
}

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
  campaign_variant_id: string;
  lead_magnet_id: string;
  lead_magnet_delivery: string;
  dial_country: string;
  dial_code: string;
  dial_touched: boolean;
  page_path: string;
  ip_address: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  utm_ad_group: string;
  gclid: string;
  fbclid: string;
  ttclid: string;
  gbraid: string;
  wbraid: string;
  li_fat_id: string;
  _fbp: string;
  _fbc: string;
}

async function forwardToZapier(payload: ZapierPayload): Promise<{ ok: boolean; reason?: string; status?: number }> {
  const url = (process.env.WEBINAR_ZAPIER_WEBHOOK_URL || '').trim();
  if (!url) return { ok: false, reason: 'zapier_webhook_not_configured' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, status: res.status, reason: `zapier_${res.status}` };
    return { ok: true, status: res.status };
  } catch (err) {
    console.warn('[newform-post] zapier fetch error', err);
    return { ok: false, reason: 'zapier_fetch_error' };
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    // Not POST — bounce to homepage. Shouldn't happen in practice but
    // handles people pasting the URL in their address bar.
    return { statusCode: 302, headers: { Location: '/' }, body: '' };
  }

  const body = parseBody(event);
  const s = (v?: string) => (v || '').trim();

  const email = s(body.email).toLowerCase();
  const firstname = s(body.firstname);
  const lastname = s(body.lastname);
  const phone = s(body.phone);
  const countryCode = s(body.country_code).toUpperCase();
  const countryName = s(body.country_name);

  // Server-side audience classification. Trust client if sent, else
  // derive from country_code.
  const audience: 'target' | 'non_target' =
    body.audience === 'target' || body.audience === 'non_target'
      ? body.audience
      : classifyAudience(countryCode);

  // Even if email is missing, we still redirect — the user already
  // interacted. Zapier won't get a usable lead but the user doesn't
  // get stuck on the function URL. Downstream pages can prompt again.
  if (!email || !email.includes('@')) {
    const url = buildRedirectUrl(audience, body);
    console.warn(`[newform-post] email_missing — redirecting anyway to ${url}`);
    return {
      statusCode: 302,
      headers: {
        Location: url,
        'Cache-Control': 'no-store',
      },
      body: '',
    };
  }

  // Non-target visitors always get stage/country munged to "DQ"
  // downstream so Zapier routing can short-circuit on one marker.
  const outCountryCode = audience === 'target' ? countryCode : 'DQ';
  const outCountryName = audience === 'target' ? countryName : 'DQ';

  // Fire Zapier webhook. Awaited here because the user is waiting on
  // the 302 anyway — a 500ms Zapier roundtrip is still faster than
  // the client-side flow's full-page JS boot.
  const zapResult = await forwardToZapier({
    email,
    phone,
    firstname,
    lastname,
    stage: s(body.stage) || 'newform_submit',
    is_member: false,
    audience,
    country_code: outCountryCode,
    country_name: outCountryName,
    submitted_at: new Date().toISOString(),
    campaign_variant_id: s(body.campaign_variant_id),
    lead_magnet_id: s(body.lead_magnet_id),
    lead_magnet_delivery: s(body.lead_magnet_delivery),
    dial_country: s(body.dial_country),
    dial_code: s(body.dial_code),
    dial_touched: body.dial_touched === 'true' || body.dial_touched === '1',
    page_path: s(body.page_path),
    ip_address: extractClientIp(event.headers),
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
    `[newform-post] email=${email} name="${firstname} ${lastname}" ` +
    `audience=${audience} country=${outCountryCode || '?'} ` +
    `zap_ok=${zapResult.ok} reason=${zapResult.reason || ''}`
  );

  // The redirect ALWAYS fires. If Zapier was slow or failed, the user
  // still proceeds — lead is in the function log for reconciliation.
  const url = buildRedirectUrl(audience, body);
  return {
    statusCode: 302,
    headers: {
      Location: url,
      // Prevent browsers / CDN caching the redirect — each submit
      // needs its own fresh redirect with the specific user's params.
      'Cache-Control': 'no-store',
    },
    body: '',
  };
};
