import type { Handler, HandlerEvent } from '@netlify/functions';
import { upsertByResponseId, createRecord } from '../lib/launchroom-store';
import { scoreLaunchReadiness } from '../../src/lib/launchroom';
import type { LaunchRoomAnswers, LaunchRoomContact } from '../../src/lib/launchroom';

/* ───── /.netlify/functions/launchroom-create ────────────────────
   Canonical-input entry point. Used by Zapier (or any direct
   caller) that already has canonicalised answer slugs.

   For raw Typeform payloads, call /typeform-webhook instead —
   that function maps Typeform's native shape then upserts via
   the same shared store helper.

   Body (POST, application/json):
     { response_id?, contact: {name,email,phone,firstName},
       answers: { q4..q13 (canonical slugs) } }

   Response:
     200 { id, url, tier, score }
     400 { error }
     500 { error }
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SITE_ORIGIN =
  process.env.PUBLIC_SITE_ORIGIN
  || process.env.URL
  || 'https://start.travismarziani.com';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  let payload: {
    response_id?: string;
    contact?: LaunchRoomContact;
    answers?: LaunchRoomAnswers;
  };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const contact = payload.contact ?? {};
  const answers = payload.answers ?? {};

  if (!contact.email && !payload.response_id) {
    return json(400, { error: 'need_email_or_response_id' });
  }

  try {
    const record = payload.response_id
      ? await upsertByResponseId({ responseId: payload.response_id, contact, answers })
      : await createRecord({ contact, answers });

    return json(200, {
      id: record.id,
      url: `${SITE_ORIGIN}/customlaunchroom/${record.id}`,
      tier: record.tier,
      score: scoreLaunchReadiness(record.answers).total,
    });
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
