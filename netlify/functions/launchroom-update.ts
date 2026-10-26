import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import type { LaunchRoomRecord, LaunchRoomChecklist } from '../../src/lib/launchroom';

/* ───── /.netlify/functions/launchroom-update ────────────────────
   Called by the /customlaunchroom/:id page when the lead ticks a
   step or writes their commitment answer. Also used server-side
   as a lightweight "set commitment, push to HubSpot" entry point.

   Body (POST, application/json):
     {
       id: string,
       checklist?: { step1?: boolean, step2?: boolean, step3?: boolean },
       commitment?: string,
     }

   Returns 200 { record } on success.
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const COMMITMENT_MAX = 1000;

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

  const rooms = getStore('launchrooms');
  const record = (await rooms.get(id, { type: 'json' })) as LaunchRoomRecord | null;
  if (!record) return json(404, { error: 'not_found' });

  const updated: LaunchRoomRecord = {
    ...record,
    checklist: { ...record.checklist, ...(payload.checklist ?? {}) },
    commitment:
      typeof payload.commitment === 'string'
        ? payload.commitment.slice(0, COMMITMENT_MAX)
        : record.commitment,
    updatedAt: new Date().toISOString(),
  };

  try {
    await rooms.setJSON(id, updated);
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }

  return json(200, { record: updated });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
