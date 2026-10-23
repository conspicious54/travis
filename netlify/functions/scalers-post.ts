import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/scalers-post ───────────────────────────
   Dedicated server-side handler for the Scalers track. Intentionally
   SEPARATE from newform-post.ts so Scalers can be iterated without
   ever touching the main-funnel function. Mirrors newform-post.ts
   behavior (edge geo gate, Zapier forward, 302 redirect) but with
   Scalers-specific destinations and payload fields.

   Submissions arrive from:
     - /scalers (stage=scalers_landing) → 302 to /scalers/vsl
     - /scalers/apply (stage=scalers_apply) → 302 to /scalers/book

   Non-target (DQ) leads go to the external waitlist URL (same as
   the main /router's DQ outcome), skipping /router entirely so the
   Scalers track never bleeds into the main funnel.
──────────────────────────────────────────────────────────────────── */

const EUROPE_COUNTRIES = new Set([
  'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC',
  'ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE',
  'CH','UA','GB','VA',
]);
const ALLOWED_COUNTRIES = new Set(['US', 'CA', 'AU', 'NZ', ...EUROPE_COUNTRIES]);
const DQ_WAITLIST_URL = 'https://thepassionproductformula.com/waitlist';

function classifyAudience(code: string): 'target' | 'non_target' {
  if (!code) return 'non_target';
  return ALLOWED_COUNTRIES.has(code.toUpperCase()) ? 'target' : 'non_target';
}

function destinationFor(stage: string, audience: 'target' | 'non_target'): string {
  if (audience === 'non_target') return DQ_WAITLIST_URL;
  return stage === 'scalers_apply' ? '/scalers/book' : '/scalers/vsl';
}

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
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const parsed = tryParse(decoded);
    if (parsed) return parsed;
  } catch { /* no-op */ }
  const parsed = tryParse(raw);
  if (parsed) return parsed;
  return { code: '', name: '' };
}

function parseBody(event: HandlerEvent): Record<string, string> {
  const contentType = (
    event.headers['content-type'] || event.headers['Content-Type'] || ''
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
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function buildRedirectUrl(path: string, body: Record<string, string>): string {
  // External DQ URL — forward nothing (waitlist page handles its own flow).
  if (path.startsWith('http')) return path;

  const fwd = new URLSearchParams();
  const forwardFields = [
    'email', 'first_name', 'last_name', 'phone',
    'country_code', 'country_name', 'audience', 'funnel_track', 'track',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_ad_group',
    'gclid', 'fbclid', 'ttclid', 'gbraid', 'wbraid', 'li_fat_id',
    '_fbp', '_fbc',
    'scalers_asin', 'scalers_store_url', 'scalers_monthly_sales',
    'scalers_units_at_amazon', 'scalers_monthly_ppc_spend',
    'scalers_offer_preference', 'scalers_selling_now',
  ];
  for (const key of forwardFields) {
    const v = (body[key] || '').trim();
    if (v) fwd.set(key, v);
  }
  const qs = fwd.toString();
  return qs ? `${path}?${qs}` : path;
}

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

interface ScalersZapierPayload {
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  stage: string;
  funnel_track: 'scalers';
  audience: 'target' | 'non_target';
  country_code: string;
  country_name: string;
  submitted_at: string;
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
  scalers_asin: string;
  scalers_store_url: string;
  scalers_monthly_sales: string;
  scalers_units_at_amazon: string;
  scalers_monthly_ppc_spend: string;
  scalers_offer_preference: string;
  scalers_selling_now: string;
}

async function forwardToZapier(payload: ScalersZapierPayload): Promise<{ ok: boolean; reason?: string; status?: number }> {
  // Reuses WEBINAR_ZAPIER_WEBHOOK_URL so Scalers submits land in the
  // same Zap. The Zap can branch on funnel_track='scalers' to route
  // these records to Scalers-specific HubSpot workflows. If you'd
  // rather have a dedicated Scalers Zap, set SCALERS_ZAPIER_WEBHOOK_URL
  // in Netlify env vars and swap the reference below.
  const url = (process.env.SCALERS_ZAPIER_WEBHOOK_URL
    || process.env.WEBINAR_ZAPIER_WEBHOOK_URL
    || '').trim();
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
    console.warn('[scalers-post] zapier fetch error', err);
    return { ok: false, reason: 'zapier_fetch_error' };
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 302, headers: { Location: '/scalers' }, body: '' };
  }

  const body = parseBody(event);
  const s = (v?: string) => (v || '').trim();

  const email = s(body.email).toLowerCase();
  const firstname = s(body.first_name) || s(body.firstname);
  const lastname  = s(body.last_name)  || s(body.lastname);
  const phone = s(body.phone);
  const stage = s(body.stage) || 'scalers_landing';

  const edgeGeo = readNetlifyGeo(event.headers as Record<string, string | undefined>);
  const bodyCountryCode = s(body.country_code).toUpperCase();
  const countryCode = edgeGeo.code || bodyCountryCode;
  const countryName = edgeGeo.name || s(body.country_name);
  const audience = classifyAudience(countryCode);

  // Overwrite body with resolved values so downstream pages see server truth.
  body.country_code  = audience === 'target' ? countryCode : 'DQ';
  body.country_name  = audience === 'target' ? countryName : 'DQ';
  body.audience      = audience;
  body.funnel_track  = 'scalers';

  // Even if email is missing, redirect — the user already interacted.
  if (!email || !email.includes('@')) {
    const url = buildRedirectUrl(destinationFor(stage, audience), body);
    console.warn(`[scalers-post] email_missing — redirecting anyway to ${url}`);
    return {
      statusCode: 302,
      headers: { Location: url, 'Cache-Control': 'no-store' },
      body: '',
    };
  }

  const zapResult = await forwardToZapier({
    email, phone, firstname, lastname,
    stage,
    funnel_track: 'scalers',
    audience,
    country_code: body.country_code,
    country_name: body.country_name,
    submitted_at: new Date().toISOString(),
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
    scalers_asin:              s(body.scalers_asin),
    scalers_store_url:         s(body.scalers_store_url),
    scalers_monthly_sales:     s(body.scalers_monthly_sales),
    scalers_units_at_amazon:   s(body.scalers_units_at_amazon),
    scalers_monthly_ppc_spend: s(body.scalers_monthly_ppc_spend),
    scalers_offer_preference:  s(body.scalers_offer_preference),
    scalers_selling_now:       s(body.scalers_selling_now),
  });

  console.log(
    `[scalers-post] email=${email} name="${firstname} ${lastname}" ` +
    `stage=${stage} audience=${audience} country=${body.country_code || '?'} ` +
    `edge=${edgeGeo.code || '-'} body=${bodyCountryCode || '-'} ` +
    `zap_ok=${zapResult.ok} reason=${zapResult.reason || ''}`
  );

  const url = buildRedirectUrl(destinationFor(stage, audience), body);
  return {
    statusCode: 302,
    headers: { Location: url, 'Cache-Control': 'no-store' },
    body: '',
  };
};
