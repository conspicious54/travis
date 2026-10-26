import type { Handler, HandlerEvent } from '@netlify/functions';
import { getById, logVisit } from '../lib/launchroom-store';

/* ───── /.netlify/functions/launchroom-get ───────────────────────
   Public GET endpoint the /customlaunchroom/:id page hits on
   mount. Increments visitCount + appends to the visit log so
   HubSpot can see return-visit signals.

   Query: ?id=<nanoid>&scrollDepth=0.42 (scrollDepth optional)
   Response: 200 { record } | 404 { error:'not_found' }
──────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' });

  const id = event.queryStringParameters?.id?.trim();
  if (!id) return json(400, { error: 'missing_id' });

  const scrollDepthParam = event.queryStringParameters?.scrollDepth;
  const scrollDepth = scrollDepthParam ? Number(scrollDepthParam) : undefined;

  try {
    const existing = await getById(id);
    if (!existing) return json(404, { error: 'not_found' });

    // Visit-tracking failure shouldn't block the read, so if the
    // log write throws we still return the record we already have.
    let record = existing;
    try {
      const updated = await logVisit(id, scrollDepth);
      if (updated) record = updated;
    } catch { /* no-op */ }

    return json(200, { record });
  } catch (err) {
    return json(500, { error: 'storage_failed', detail: String(err) });
  }
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
