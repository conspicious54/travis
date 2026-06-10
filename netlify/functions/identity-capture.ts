import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

/* ───── /.netlify/functions/identity-capture ────────────────────────
   Webhook receiver for ClickFunnels. Stores visitor identity keyed
   by sha256(ip + user_agent) so the /router page on travisfba.com
   can look it up server-side after the cross-domain redirect.

   This solves the /router identity gap: CF and travisfba.com are
   different root domains (no shared cookies, no shared localStorage,
   so client-side identity bridging fails). CF fires this webhook on
   form submit; the function stashes the identity under an IP+UA key;
   /router queries identity-lookup using the same key derived from
   the incoming request headers and identifies the visitor in PostHog.

   Expected webhook body (CF varies field names):
     email                                   - required
     first_name OR firstname                 - optional
     last_name OR lastname                   - optional
     phone                                   - optional
     phid                                    - optional, PostHog distinct_id
                                               from CF-side session, captured
                                               by Footer Code script as a
                                               hidden form field
     ip / visitor_ip / customer_ip /
     ip_address                              - REQUIRED for matching
     user_agent / ua / browser               - REQUIRED for matching

   TTL: 5 minutes. The visitor reaches /router within seconds of
   form submit; anything older is irrelevant and is purged.

   Optional shared-secret header X-Webhook-Secret can be enforced via
   env var CF_WEBHOOK_SECRET so random POSTs can't pollute the store.
─────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
  'Content-Type': 'application/json',
};

const TTL_MS = 5 * 60 * 1000;

interface CapturePayload {
  email?: string;
  first_name?: string;
  firstname?: string;
  last_name?: string;
  lastname?: string;
  phone?: string;
  phid?: string;
  ip?: string;
  visitor_ip?: string;
  customer_ip?: string;
  ip_address?: string;
  user_agent?: string;
  ua?: string;
  browser?: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  // Optional shared-secret enforcement
  const secret = process.env.CF_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      event.headers['x-webhook-secret'] ||
      event.headers['X-Webhook-Secret'] ||
      '';
    if (provided !== secret) {
      return json(401, { ok: false, error: 'unauthorized' });
    }
  }

  let body: CapturePayload = {};
  try {
    body = event.body ? (JSON.parse(event.body) as CapturePayload) : {};
  } catch {
    return json(200, { ok: false, error: 'invalid_json' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    return json(200, { ok: false, error: 'email_missing_or_invalid' });
  }

  const ip = (
    body.ip ||
    body.visitor_ip ||
    body.customer_ip ||
    body.ip_address ||
    ''
  ).trim();
  const ua = (body.user_agent || body.ua || body.browser || '').trim();

  if (!ip || !ua) {
    console.warn(
      '[identity-capture] missing ip or ua in payload',
      Object.keys(body).join(',')
    );
    return json(200, {
      ok: false,
      error: 'ip_or_ua_missing',
      received_fields: Object.keys(body),
    });
  }

  const firstname = (body.first_name || body.firstname || '').trim();
  const lastname = (body.last_name || body.lastname || '').trim();
  const phone = (body.phone || '').trim();
  const phid = (body.phid || '').trim();

  const key = hashIpUa(ip, ua);

  const record = {
    email,
    firstname: firstname || undefined,
    lastname: lastname || undefined,
    phone: phone || undefined,
    phid: phid || undefined,
    captured_at: new Date().toISOString(),
    // Stash the raw IP fragment for debugging (first half only - not
    // logging the whole thing back at debug callers).
    ip_prefix: ip.split('.').slice(0, 2).join('.') + '.x.x',
  };

  try {
    const store = getStore('identity-bridge');
    await store.setJSON(key, record, {
      metadata: { expires_at: Date.now() + TTL_MS },
    });
  } catch (err) {
    console.error('[identity-capture] blob write error', err);
    return json(200, { ok: false, error: 'storage_error' });
  }

  console.log(
    `[identity-capture] stored key=${key.slice(0, 12)}... email=${email}`
  );
  return json(200, { ok: true, key_prefix: key.slice(0, 12) });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

function hashIpUa(ip: string, ua: string): string {
  const hash = createHash('sha256');
  hash.update(ip);
  hash.update('|');
  hash.update(ua);
  return hash.digest('hex');
}
