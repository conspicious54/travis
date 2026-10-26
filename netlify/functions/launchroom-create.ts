import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import {
  scoreLaunchReadiness,
  deriveTier,
  type LaunchRoomRecord,
  type LaunchRoomAnswers,
  type LaunchRoomContact,
} from '../../src/lib/launchroom';

/* ───── /.netlify/functions/launchroom-create ────────────────────
   Called by Zapier (or the Typeform webhook relay) when a new
   application lands. Builds a Launch Room blob, assigns an
   unguessable id, returns the public URL.

   Idempotency: if the caller passes `response_id` (Typeform's own
   id), we store a secondary index response_id -> launchroom_id in
   a sibling blob store. A second call with the same response_id
   returns the same launchroom URL. This lets partial-submission
   webhooks replay without creating duplicates.

   Body shape (POST, application/json):
     {
       response_id?: string,        // Typeform response id
       contact: { name, email, phone },
       answers: { q4..q13 (canonical slugs) }
     }

   Response:
     200 { id, url, tier }          // success
     400 { error }                  // bad payload
     500 { error }                  // blob failure
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

  const rooms = getStore('launchrooms');
  const index = getStore('launchrooms-index');

  // Idempotency: replay by response_id returns the original.
  if (payload.response_id) {
    const existingId = await index.get(payload.response_id);
    if (existingId) {
      const existing = await rooms.get(existingId, { type: 'json' }) as LaunchRoomRecord | null;
      if (existing) {
        // Upsert with any new answers (partial submissions replay).
        const merged: LaunchRoomRecord = {
          ...existing,
          contact: { ...existing.contact, ...contact },
          answers: { ...existing.answers, ...answers },
          tier: deriveTier({ ...existing.answers, ...answers }, { ...existing.contact, ...contact }),
          updatedAt: new Date().toISOString(),
        };
        await rooms.setJSON(existingId, merged);
        return json(200, {
          id: existingId,
          url: `${SITE_ORIGIN}/customlaunchroom/${existingId}`,
          tier: merged.tier,
        });
      }
    }
  }

  const id = randomBytes(18).toString('base64url'); // 24 chars, ~144 bits
  const now = new Date().toISOString();
  const record: LaunchRoomRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    tier: deriveTier(answers, contact),
    answers,
    contact,
    checklist: {},
    visitCount: 0,
    visitLog: [],
  };

  try {
    await rooms.setJSON(id, record);
    if (payload.response_id) {
      await index.set(payload.response_id, id);
    }
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }

  return json(200, {
    id,
    url: `${SITE_ORIGIN}/customlaunchroom/${id}`,
    tier: record.tier,
    score: scoreLaunchReadiness(answers).total,
  });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
