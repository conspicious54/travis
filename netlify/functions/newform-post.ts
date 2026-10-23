import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/newform-post ──────────────────────────
   Server-side form POST + 302 for the NewForm leadpage. This is the
   LIVE handler for the NewForm submit — src/pages/NewForm.tsx
   natively POSTs here (method=POST, action=/.netlify/functions/
   newform-post) and the browser follows the 302 we return. Zero
   client-side JS required for the navigation. This replicates what
   ClickFunnels did pre-cutover.

   Behavior:
     - Accepts form-urlencoded (native form POST) and JSON.
     - Resolves country from Netlify's edge `x-nf-geo` header
       (server-side, un-blockable) and falls back to the client's
       `country_code` field only when the edge header is absent.
     - Classifies audience against ALLOWED_COUNTRIES (same list as
       src/pages/Router.tsx — US/CA/AU/NZ + all Europe) and 302s to
       /nextstep (target) or /router (non_target).
     - Overwrites body.country_code / body.country_name / body.audience
       with the server-resolved values so downstream (/router,
       /nextstep, Zapier) all see the same truth.
     - Fires the Zapier webhook server-side, awaited. Even if Zapier
       fails, the user still gets their 302 — lead is in the function
       log for reconciliation.

   Env vars:
     WEBINAR_ZAPIER_WEBHOOK_URL   (same as register-webinar.ts)
──────────────────────────────────────────────────────────────────── */

/* ───── allowed-country list ────────────────────────────────────────
   Mirrors the ALLOWED_COUNTRIES list in src/pages/Router.tsx so
   client + server agree on who's qualified. US/CA/AU/NZ + all of
   Europe. Non-target → /router for the DQ question UX. Target →
   straight to /nextstep. ──────────────────────────────────────── */

const EUROPE_COUNTRIES = new Set([
  'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC',
  'ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE',
  'CH','UA','GB','VA',
]);
const ALLOWED_COUNTRIES = new Set(['US', 'CA', 'AU', 'NZ', ...EUROPE_COUNTRIES]);
const REDIRECT_TARGET = '/nextstep';
const REDIRECT_NON_TARGET = '/router';

function classifyAudience(code: string): 'target' | 'non_target' {
  if (!code) return 'non_target';
  return ALLOWED_COUNTRIES.has(code.toUpperCase()) ? 'target' : 'non_target';
}

/* ───── Netlify edge geo ─────────────────────────────────────────────
   Netlify's CDN detects the visitor's country from their IP and
   exposes it on every function invocation as the `x-nf-geo` header.
   This is server-side truth: it fires BEFORE any client-side JS,
   can't be blocked by ad blockers, and is identical to what Netlify
   uses for its own geo-based asset routing. This replaces the
   previous dependency on NewForm's client-side country.is call,
   which was blocked by ad blockers ~3-5% of the time.

   The header value is base64-encoded JSON of the shape
   `{"country":{"code":"US","name":"United States"}, ...}`. Fall
   back to a parsed-string decode if base64 fails (some older
   Netlify runtimes emit it as a plain JSON string). ──────────── */

function readNetlifyGeo(
  headers: Record<string, string | undefined>,
): { code: string; name: string } {
  const raw = headers['x-nf-geo'] || headers['X-Nf-Geo'] || '';
  if (!raw) return { code: '', name: '' };
  const tryParse = (s: string): { code: string; name: string } | null => {
    try {
      const obj = JSON.parse(s) as { country?: { code?: string; name?: string } };
      const code = (obj?.country?.code || '').toUpperCase();
      const name = obj?.country?.name || '';
      if (code) return { code, name };
    } catch { /* no-op */ }
    return null;
  };
  // Try base64 first (current Netlify runtime behaviour)
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const parsed = tryParse(decoded);
    if (parsed) return parsed;
  } catch { /* no-op */ }
  // Fall back to raw JSON string
  const parsed = tryParse(raw);
  if (parsed) return parsed;
  return { code: '', name: '' };
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
    'email', 'first_name', 'last_name', 'phone',
    // Geo + audience are set by this function from Netlify's edge
    // `x-nf-geo` header, overriding whatever the client posted.
    // /router reads country_code from the URL as its ground truth,
    // so forwarding the server-resolved values closes the ad-blocker
    // leak that was sending DQ-country leads (BD, IN, PK, etc.) to
    // the closer VSL.
    'country_code', 'country_name', 'audience',
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
  const bodyCountryCode = s(body.country_code).toUpperCase();
  const bodyCountryName = s(body.country_name);

  // Netlify edge geo = server-side truth. Prefer it over whatever
  // the client reported (which can be '' when ad blockers kill the
  // country.is call in NewForm). This is the fix for DQ-country
  // leads slipping through to /nextstep.
  const edgeGeo = readNetlifyGeo(event.headers as Record<string, string | undefined>);
  const countryCode = edgeGeo.code || bodyCountryCode;
  const countryName = edgeGeo.name || bodyCountryName;
  const geoSource = edgeGeo.code
    ? 'edge'
    : bodyCountryCode
      ? 'body'
      : 'none';

  // Server-side audience classification. Edge geo is authoritative:
  // if Netlify's CDN placed the visitor in a DQ country, we ignore
  // whatever `audience` the client posted. Only fall back to the
  // client-reported audience when the edge header is absent AND the
  // client sent an explicit audience value.
  const audience: 'target' | 'non_target' =
    countryCode
      ? classifyAudience(countryCode)
      : body.audience === 'target' || body.audience === 'non_target'
        ? body.audience
        : 'non_target';

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

  // Overwrite body with the resolved values so buildRedirectUrl and
  // any downstream handler sees the server-side truth, not whatever
  // the client posted. The /router page reads country_code from the
  // URL as its ground truth, so this closes the ad-blocker gap end
  // to end.
  body.country_code = outCountryCode;
  body.country_name = outCountryName;
  body.audience = audience;

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
    `audience=${audience} country=${outCountryCode || '?'} geo_src=${geoSource} ` +
    `edge=${edgeGeo.code || '-'} body=${bodyCountryCode || '-'} ` +
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
