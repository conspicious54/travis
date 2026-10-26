import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import type { LaunchRoomRecord } from '../../src/lib/launchroom';

/* ───── /.netlify/functions/launchroom-get ───────────────────────
   Public GET endpoint used by the /customlaunchroom/:id page to
   hydrate itself on load. Also increments visitCount + appends to
   visitLog so HubSpot sees return-visit signals ("viewed Launch
   Room 3x today" etc).

   Query: ?id=<nanoid>&scrollDepth=0.42 (scrollDepth optional)

   Response:
     200 { record } | 404 { error: 'not_found' }
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const VISIT_LOG_MAX = 50;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' });

  const id = event.queryStringParameters?.id?.trim();
  if (!id) return json(400, { error: 'missing_id' });

  const scrollDepthParam = event.queryStringParameters?.scrollDepth;
  const scrollDepth = scrollDepthParam ? Number(scrollDepthParam) : undefined;

  const rooms = getStore('launchrooms');
  const record = (await rooms.get(id, { type: 'json' })) as LaunchRoomRecord | null;
  if (!record) return json(404, { error: 'not_found' });

  // Visit tracking — count every GET as a visit. We don't try to
  // dedupe within a session because return visits are themselves
  // the signal we care about.
  const now = new Date().toISOString();
  const nextVisitLog = [...record.visitLog, { at: now, scrollDepth }].slice(-VISIT_LOG_MAX);
  const updated: LaunchRoomRecord = {
    ...record,
    visitCount: record.visitCount + 1,
    lastVisitAt: now,
    visitLog: nextVisitLog,
    updatedAt: now,
  };
  try {
    await rooms.setJSON(id, updated);
  } catch {
    // Visit-tracking failure shouldn't block the read.
  }

  return json(200, { record: updated });
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
