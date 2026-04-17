import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/meeting-lookup ────────────────────────
   Given a contact email, look up their most recent Appointment (or
   Meeting) in HubSpot via the Private App token and return booking
   details including the Zoom / video URL.

   URL:  /.netlify/functions/meeting-lookup?email=someone@example.com
         /.netlify/functions/meeting-lookup?email=X&debug=1   (verbose)

   Requires env var HUBSPOT_TOKEN (the Private App access token).

   When anything goes wrong we still return HTTP 200 with
   { found: false, reason, detail } so the client-side hydration
   just falls back to URL params silently.
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

type DebugEntry = { step: string; url?: string; status?: number; body?: unknown };

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const email = (event.queryStringParameters?.email || '').trim().toLowerCase();
  const debug = event.queryStringParameters?.debug === '1';
  const trace: DebugEntry[] = [];

  if (!email || !email.includes('@')) {
    return json(200, { found: false, reason: 'email_missing' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { found: false, reason: 'token_not_set' });
  }

  try {
    // 1. Find the contact by email
    const contact = await findContactId(email, token, trace);
    if (!contact) {
      return json(200, { found: false, reason: 'contact_not_found', email, ...(debug ? { trace } : {}) });
    }
    const contactId = contact.id;

    // 2. Find the most recent appointment/meeting for that contact
    const found = await findLatestAppointmentForContact(contactId, token, trace);
    if (!found) {
      return json(200, {
        found: false,
        reason: 'no_meeting_found',
        contactId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        ...(debug ? { trace } : {}),
      });
    }

    // 3. Fetch the owner name
    let ownerName: string | undefined;
    const ownerId = found.properties?.hubspot_owner_id as string | undefined;
    if (ownerId) {
      ownerName = await getOwnerName(ownerId, token, trace).catch(() => undefined);
    }

    const p = found.properties || {};
    const pick = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = p[k];
        if (v !== undefined && v !== null && v !== '') return String(v);
      }
      return undefined;
    };

    return json(200, {
      found: true,
      source: found.source,
      appointmentId: found.id,
      contactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      startIso: toIso(pick('hs_appointment_start', 'hs_meeting_start_time')),
      endIso: toIso(pick('hs_appointment_end', 'hs_meeting_end_time')),
      title: pick('hs_appointment_name', 'hs_meeting_title'),
      joinUrl: pick(
        'hs_appointment_location',
        'hs_meeting_location',
        'hs_meeting_external_url',
        'hs_videoconference_link'
      ),
      ownerId,
      ownerName,
      ...(debug ? { rawProperties: p, trace } : {}),
    });
  } catch (err) {
    console.error('[meeting-lookup]', err);
    return json(200, {
      found: false,
      reason: 'exception',
      detail: String(err instanceof Error ? err.message : err),
      ...(debug ? { trace } : {}),
    });
  }
};

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

function toIso(v: string | undefined): string | undefined {
  if (!v) return undefined;
  // HubSpot returns timestamps as epoch ms strings sometimes
  if (/^\d{13}$/.test(v)) {
    const d = new Date(parseInt(v, 10));
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function hubspotFetch(
  url: string,
  init: RequestInit,
  trace: DebugEntry[],
  step: string
): Promise<Response> {
  const res = await fetch(url, init);
  const entry: DebugEntry = { step, url, status: res.status };
  if (!res.ok) {
    try {
      entry.body = await res.clone().json();
    } catch {
      entry.body = await res.clone().text();
    }
  }
  trace.push(entry);
  return res;
}

interface ContactData {
  id: string;
  firstName?: string;
  lastName?: string;
}

async function findContactId(
  email: string,
  token: string,
  trace: DebugEntry[]
): Promise<ContactData | null> {
  // Request firstname + lastname properties so we don't need a second call
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=firstname,lastname`;
  const res = await hubspotFetch(
    url,
    { headers: { Authorization: `Bearer ${token}` } },
    trace,
    'find_contact'
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`contact lookup ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  if (!data.id) return null;
  return {
    id: String(data.id),
    firstName: data.properties?.firstname || undefined,
    lastName: data.properties?.lastname || undefined,
  };
}

/** Try the Appointments object first (newer), then fall back to
    Meetings engagements. Uses v4 associations endpoint for robustness. */
async function findLatestAppointmentForContact(
  contactId: string,
  token: string,
  trace: DebugEntry[]
): Promise<{ id: string; properties: Record<string, unknown>; source: string } | null> {
  // Properties to request — HubSpot ignores ones that don't exist
  const properties = [
    'hs_appointment_start',
    'hs_appointment_end',
    'hs_appointment_name',
    'hs_appointment_location',
    'hs_meeting_start_time',
    'hs_meeting_end_time',
    'hs_meeting_title',
    'hs_meeting_location',
    'hs_meeting_external_url',
    'hs_videoconference_link',
    'hs_meeting_outcome',
    'hs_appointment_status',
    'hubspot_owner_id',
    'createdate',
    'hs_createdate',
  ];

  const tryObjectType = async (objectType: string) => {
    // v4 associations: contact -> objectType
    const assocUrl = `https://api.hubapi.com/crm/v4/objects/contacts/${contactId}/associations/${encodeURIComponent(objectType)}?limit=100`;
    const assocRes = await hubspotFetch(
      assocUrl,
      { headers: { Authorization: `Bearer ${token}` } },
      trace,
      `assoc_${objectType}`
    );
    if (!assocRes.ok) return null;
    const assocData = await assocRes.json();
    const ids: string[] = (assocData?.results || [])
      .map((r: { toObjectId?: string | number; id?: string | number }) => String(r.toObjectId ?? r.id ?? ''))
      .filter(Boolean);
    if (ids.length === 0) return null;

    // Batch read — returns properties for all associated records
    const batchUrl = `https://api.hubapi.com/crm/v3/objects/${encodeURIComponent(objectType)}/batch/read`;
    const batchRes = await hubspotFetch(
      batchUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties,
          inputs: ids.map((id) => ({ id })),
        }),
      },
      trace,
      `batch_${objectType}`
    );
    if (!batchRes.ok) return null;
    const batchData = await batchRes.json();
    const allResults = (batchData?.results || []) as Array<{
      id: string;
      properties: Record<string, unknown>;
      createdAt?: string;
    }>;
    if (allResults.length === 0) return null;

    // Skip canceled appointments. HubSpot prefixes the title with
    // "Canceled:" when an appointment is canceled.
    const isCanceled = (r: { properties: Record<string, unknown> }): boolean => {
      const title = String(r.properties?.hs_appointment_name || r.properties?.hs_meeting_title || '');
      if (/^canceled[\s:]/i.test(title) || /^cancelled[\s:]/i.test(title)) return true;
      const outcome = String(r.properties?.hs_meeting_outcome || '').toLowerCase();
      if (outcome === 'canceled' || outcome === 'cancelled') return true;
      return false;
    };

    const results = allResults.filter((r) => !isCanceled(r));
    if (results.length === 0) return null;

    // Sort by when the appointment record itself was created. The most
    // recently booked meeting = the record with the newest createdAt.
    const getCreatedMs = (r: { createdAt?: string; properties: Record<string, unknown> }): number => {
      const raw = r.createdAt || r.properties?.createdate || r.properties?.hs_createdate;
      if (!raw) return 0;
      const s = String(raw);
      if (/^\d{13}$/.test(s)) return parseInt(s, 10);
      const d = new Date(s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    results.sort((a, b) => getCreatedMs(b) - getCreatedMs(a));
    return { ...results[0], source: objectType };
  };

  // Try appointments first, then meetings (legacy)
  return (
    (await tryObjectType('appointments')) ||
    (await tryObjectType('meetings'))
  );
}

async function getOwnerName(
  ownerId: string,
  token: string,
  trace: DebugEntry[]
): Promise<string | undefined> {
  const res = await hubspotFetch(
    `https://api.hubapi.com/crm/v3/owners/${encodeURIComponent(ownerId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
    trace,
    'get_owner'
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  const full = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return full || data.email || undefined;
}
