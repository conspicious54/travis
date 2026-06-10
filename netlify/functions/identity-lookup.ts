import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

/* ───── /.netlify/functions/identity-lookup ─────────────────────────
   Called from /router on travisfba.com. Reads the visitor's IP and
   User-Agent from the incoming request headers, hashes them with
   the same scheme as identity-capture, and looks up the matching
   identity record in the Blobs store.

   Returns:
     { found: false }                            - no match (common case
                                                   for visitors who didn't
                                                   come via the CF form)
     { found: false, reason: "..." }             - lookup attempted but
                                                   failed (storage error,
                                                   etc.)
     { found: true, email, firstname, lastname,
       phone, phid }                             - identity recovered;
                                                   client should call
                                                   posthog.identify(email)

   No auth required - it's safe for the client to call this. The
   returned identity is keyed by the SAME IP+UA that made the
   request, so a visitor can only see their own identity.
─────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const TTL_MS = 5 * 60 * 1000;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { found: false, error: 'method_not_allowed' });
  }

  const ip = extractIp(event);
  const ua = (event.headers['user-agent'] || '').trim();

  if (!ip || !ua) {
    return json(200, { found: false, reason: 'no_request_ip_or_ua' });
  }

  const key = hashIpUa(ip, ua);

  let record: Record<string, unknown> | null = null;
  try {
    const store = getStore('identity-bridge');
    record = (await store.get(key, { type: 'json' })) as Record<string, unknown> | null;
  } catch (err) {
    console.warn('[identity-lookup] blob read error', err);
    return json(200, { found: false, reason: 'lookup_error' });
  }

  if (!record || !record.email) {
    return json(200, { found: false });
  }

  // Defensive TTL check (Blobs may or may not auto-expire depending
  // on plan/config). If the record is older than TTL_MS we treat it
  // as missing so stale CF submissions from days ago don't pollute
  // a fresh /router visit.
  const capturedAt = typeof record.captured_at === 'string' ? record.captured_at : null;
  if (capturedAt) {
    const ageMs = Date.now() - new Date(capturedAt).getTime();
    if (ageMs > TTL_MS) {
      return json(200, { found: false, reason: 'expired' });
    }
  }

  return json(200, {
    found: true,
    email: record.email,
    firstname: record.firstname || undefined,
    lastname: record.lastname || undefined,
    phone: record.phone || undefined,
    phid: record.phid || undefined,
  });
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

function extractIp(event: HandlerEvent): string {
  // Netlify Functions expose the real client IP at this header.
  const direct = event.headers['x-nf-client-connection-ip'];
  if (direct) return direct.trim();
  // Fall back to first IP in X-Forwarded-For chain.
  const fwd = event.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return '';
}
