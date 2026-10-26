import type { Handler, HandlerEvent } from '@netlify/functions';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { upsertByResponseId } from '../lib/launchroom-store';
import { mapTypeformPayload, isPartialEvent } from '../lib/typeform-mapping';

/* ───── /.netlify/functions/typeform-webhook ─────────────────────
   Receives Typeform's native webhook payload directly (bypassing
   Zapier) so we capture BOTH complete submissions and partial
   per-answer events in one place.

   Typeform's webhook config:
     - URL: https://start.travismarziani.com/.netlify/functions/typeform-webhook
     - Secret: set in Typeform's webhook panel, mirror into
       env var TYPEFORM_WEBHOOK_SECRET on Netlify. Signature arrives
       as the `typeform-signature` header (sha256).
     - "Track partial submissions" ON — fires per-answer, each
       event carries the same `token` (response_id) so our upsert
       stays idempotent.

   Response:
     200 { id, url, tier, partial }
     401 if signature mismatch and TYPEFORM_WEBHOOK_SECRET is set
     400 if body unparseable or no response_id
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, typeform-signature',
  'Content-Type': 'application/json',
};

const SITE_ORIGIN =
  process.env.PUBLIC_SITE_ORIGIN
  || process.env.URL
  || 'https://start.travismarziani.com';

/** Zapier/AC webhook URL — if set, we POST the resolved record
 *  there whenever a FINAL (non-partial) response lands so the Zap
 *  can send Email A, kick off the 30-minute delay branch, and
 *  write back to HubSpot. If unset the function still succeeds —
 *  the blob is created, just no email fires. */
const RELAY_WEBHOOK_URL = process.env.LAUNCHROOM_RELAY_WEBHOOK_URL;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  const rawBody = event.body ?? '';

  // Signature verification (optional — only enforced if the secret
  // is configured on Netlify). Prevents randoms from forging Launch
  // Rooms by hitting the public URL.
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET;
  if (secret) {
    const sig = event.headers['typeform-signature'] || event.headers['Typeform-Signature'];
    if (!sig || !verifySignature(secret, rawBody, sig)) {
      return json(401, { error: 'bad_signature' });
    }
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return json(400, { error: 'invalid_json' }); }

  const mapped = mapTypeformPayload(payload as any);
  if (!mapped) return json(400, { error: 'no_response_id' });

  let record;
  try {
    record = await upsertByResponseId({
      responseId: mapped.responseId,
      contact: mapped.contact,
      answers: mapped.answers,
    });
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }

  const partial = isPartialEvent(payload as any);
  const url = `${SITE_ORIGIN}/customlaunchroom/${record.id}`;

  // Only relay to the Zap on FINAL events so Email A doesn't
  // fire per-answer. Partial events quietly build the blob so
  // when the final event (or the 30-min sweep) lands, the room
  // is already populated.
  if (!partial && RELAY_WEBHOOK_URL) {
    try {
      await fetch(RELAY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          url,
          tier: record.tier,
          contact: record.contact,
          answers: record.answers,
          event: 'typeform_complete',
        }),
      });
    } catch { /* relay failure shouldn't fail the webhook — Typeform retries noisily */ }
  }

  return json(200, { id: record.id, url, tier: record.tier, partial });
};

function verifySignature(secret: string, rawBody: string, signatureHeader: string): boolean {
  // Typeform signs as: `sha256=<base64 hmac-sha256>`
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
