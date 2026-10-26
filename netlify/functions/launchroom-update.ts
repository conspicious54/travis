import type { Handler, HandlerEvent } from '@netlify/functions';
import { applyPatch } from '../lib/launchroom-store';
import type { LaunchRoomChecklist } from '../../src/lib/launchroom';

/* ───── /.netlify/functions/launchroom-update ────────────────────
   Called by the /customlaunchroom/:id page when the lead ticks
   a step or edits their commitment. Also usable server-side for
   anywhere we want to patch state onto a record.

   Body (POST, application/json):
     { id, checklist?, commitment? }
   Response: 200 { record } | 404 | 500
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  let payload: {
    id?: string;
    checklist?: LaunchRoomChecklist;
    commitment?: string;
  };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const id = payload.id?.trim();
  if (!id) return json(400, { error: 'missing_id' });

  try {
    const record = await applyPatch({
      id,
      checklist: payload.checklist,
      commitment: payload.commitment,
    });
    if (!record) return json(404, { error: 'not_found' });
    return json(200, { record });
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
