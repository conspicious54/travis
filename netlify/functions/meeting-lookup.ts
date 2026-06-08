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
  // Webinar bookings come through OnceHub (writes a DEAL with linked
  // meeting); the legacy HubSpot-native scheduler at /book writes a
  // MEETING associated with the contact. When ?source=webinar we try
  // the OnceHub deal path first because EVERY webinar booking goes
  // that way, and the contact may also have stale legacy meetings
  // from past testing that would otherwise win the lookup.
  const sourceParam = (event.queryStringParameters?.source || '').trim().toLowerCase();
  const isWebinar = sourceParam === 'webinar';
  const trace: DebugEntry[] = [];

  if (!email || !email.includes('@')) {
    return json(200, { found: false, reason: 'email_missing' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { found: false, reason: 'token_not_set' });
  }

  try {
    const contact = await findContactId(email, token, trace);
    if (!contact) {
      return json(200, { found: false, reason: 'contact_not_found', email, ...(debug ? { trace } : {}) });
    }
    const contactId = contact.id;

    // Each path returns either a populated response or null when it
    // has nothing to offer. We chain them in whatever order the caller
    // wants based on ?source=.
    const tryOncehubDealPath = async () =>
      await resolveFromOncehubDeal(contactId, contact, token, trace, debug);
    const tryLegacyMeetingPath = async () =>
      await resolveFromContactMeeting(contactId, contact, token, trace, debug);

    const paths = isWebinar
      ? [tryOncehubDealPath, tryLegacyMeetingPath]
      : [tryLegacyMeetingPath, tryOncehubDealPath];

    for (const tryPath of paths) {
      const result = await tryPath();
      if (result) return json(200, result);
    }

    return json(200, {
      found: false,
      reason: 'no_meeting_found',
      contactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      ...(debug ? { trace } : {}),
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

/** OnceHub-deal-first resolver. The deal's hs_next_meeting_id points
    at the linked meeting record; fetch that for the Zoom URL. Returns
    null when no scheduling-pipeline deal exists for the contact. */
async function resolveFromOncehubDeal(
  contactId: string,
  contact: ContactData,
  token: string,
  trace: DebugEntry[],
  debug: boolean
): Promise<Record<string, unknown> | null> {
  const deal = await findRecentSchedulingDealForContact(contactId, token, trace);
  if (!deal) return null;

  const dp = deal.properties || {};
  const nextMeetingId = String(dp.hs_next_meeting_id || '').trim();

  let meetingProps: Record<string, unknown> = {};
  if (nextMeetingId) {
    meetingProps = await fetchMeetingById(nextMeetingId, token, trace);
  }

  const ownerId =
    ((dp.hubspot_owner_id as string | undefined) ||
      (meetingProps.hubspot_owner_id as string | undefined) ||
      undefined) as string | undefined;
  const ownerName = ownerId
    ? await getOwnerName(ownerId, token, trace).catch(() => undefined)
    : undefined;

  const dPick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = dp[k];
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return undefined;
  };
  const mPick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = meetingProps[k];
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return undefined;
  };

  const startIso = toIso(
    dPick('hs_next_meeting_start_time') ||
      mPick('hs_meeting_start_time', 'hs_appointment_start')
  );
  const endIso = toIso(mPick('hs_meeting_end_time', 'hs_appointment_end'));
  const title =
    mPick('hs_meeting_title', 'hs_appointment_name') ||
    dPick('hs_next_meeting_name');
  const joinUrl = mPick(
    'hs_meeting_location',
    'hs_meeting_external_url',
    'hs_videoconference_link',
    'hs_appointment_location'
  );

  if (!startIso && !joinUrl && !ownerName && !nextMeetingId) {
    return null; // deal existed but had no useful data - let next path try
  }

  return {
    found: true,
    source: 'oncehub_deal',
    dealId: deal.id,
    appointmentId: nextMeetingId || undefined,
    contactId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    startIso,
    endIso,
    title,
    joinUrl,
    ownerId,
    ownerName,
    leadSource: dPick('lead_source'),
    ...(debug ? { rawDealProperties: dp, rawMeetingProperties: meetingProps, trace } : {}),
  };
}

/** Legacy contact-meeting resolver. HubSpot-native scheduler bookings
    create a meeting associated directly with the contact. Returns null
    when no meeting/appointment is associated. */
async function resolveFromContactMeeting(
  contactId: string,
  contact: ContactData,
  token: string,
  trace: DebugEntry[],
  debug: boolean
): Promise<Record<string, unknown> | null> {
  const found = await findLatestAppointmentForContact(contactId, token, trace);
  if (!found) return null;

  const ownerId = found.properties?.hubspot_owner_id as string | undefined;
  const ownerName = ownerId
    ? await getOwnerName(ownerId, token, trace).catch(() => undefined)
    : undefined;

  const p = found.properties || {};
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = p[k];
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return undefined;
  };

  return {
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
  };
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
  // Properties to request - HubSpot ignores ones that don't exist
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

    // Batch read - returns properties for all associated records
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

/** OnceHub fallback path: OnceHub's HubSpot integration writes DEALS
    (in the Inbound Scheduled Calls pipeline), not Meeting engagement
    records. When no meeting/appointment is found, look for the most
    recent deal in that pipeline associated with the contact, and use
    its owner as the meeting organizer. The booking time itself comes
    from the OnceHub postMessage via URL params on the confirmation
    page, not from this lookup. */
async function findRecentSchedulingDealForContact(
  contactId: string,
  token: string,
  trace: DebugEntry[]
): Promise<{ id: string; properties: Record<string, unknown> } | null> {
  const INBOUND_SCHEDULED_CALLS_PIPELINE = '1957399266';

  const assocUrl = `https://api.hubapi.com/crm/v4/objects/contacts/${contactId}/associations/deals?limit=100`;
  const assocRes = await hubspotFetch(
    assocUrl,
    { headers: { Authorization: `Bearer ${token}` } },
    trace,
    'assoc_deals'
  );
  if (!assocRes.ok) return null;
  const assocData = await assocRes.json();
  const ids: string[] = (assocData?.results || [])
    .map((r: { toObjectId?: string | number; id?: string | number }) => String(r.toObjectId ?? r.id ?? ''))
    .filter(Boolean);
  if (ids.length === 0) return null;

  const batchUrl = `https://api.hubapi.com/crm/v3/objects/deals/batch/read`;
  const batchRes = await hubspotFetch(
    batchUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: [
          'dealname',
          'dealstage',
          'pipeline',
          'hubspot_owner_id',
          'createdate',
          'hs_createdate',
          // OnceHub-populated next-meeting pointers (the deal's
          // "scheduled meeting" rollup fields). hs_next_meeting_id
          // is the actual meeting record we need to fetch for the
          // Zoom URL.
          'hs_next_meeting_id',
          'hs_next_meeting_name',
          'hs_next_meeting_start_time',
          'lead_source',
        ],
        inputs: ids.map((id) => ({ id })),
      }),
    },
    trace,
    'batch_deals'
  );
  if (!batchRes.ok) return null;
  const batchData = await batchRes.json();
  const allResults = (batchData?.results || []) as Array<{
    id: string;
    properties: Record<string, unknown>;
    createdAt?: string;
  }>;
  if (allResults.length === 0) return null;

  const inPipeline = allResults.filter(
    (r) => String(r.properties?.pipeline || '') === INBOUND_SCHEDULED_CALLS_PIPELINE
  );
  if (inPipeline.length === 0) return null;

  const getCreatedMs = (r: { createdAt?: string; properties: Record<string, unknown> }): number => {
    const raw = r.createdAt || r.properties?.createdate || r.properties?.hs_createdate;
    if (!raw) return 0;
    const s = String(raw);
    if (/^\d{13}$/.test(s)) return parseInt(s, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };
  inPipeline.sort((a, b) => getCreatedMs(b) - getCreatedMs(a));
  return inPipeline[0];
}

/** Fetch a single meeting record by ID. Used by the OnceHub-deal path
    to resolve the meeting that the deal's hs_next_meeting_id points
    at - the meeting itself has the Zoom URL and end time. Returns
    properties object (possibly empty on failure - caller falls back). */
async function fetchMeetingById(
  meetingId: string,
  token: string,
  trace: DebugEntry[]
): Promise<Record<string, unknown>> {
  const properties = [
    'hs_meeting_title',
    'hs_meeting_start_time',
    'hs_meeting_end_time',
    'hs_meeting_location',
    'hs_meeting_external_url',
    'hs_videoconference_link',
    'hs_meeting_body',
    'hs_meeting_outcome',
    'hubspot_owner_id',
  ].join(',');
  const url = `https://api.hubapi.com/crm/v3/objects/meetings/${encodeURIComponent(meetingId)}?properties=${properties}`;
  const res = await hubspotFetch(
    url,
    { headers: { Authorization: `Bearer ${token}` } },
    trace,
    'fetch_meeting_by_id'
  );
  if (!res.ok) return {};
  try {
    const data = await res.json();
    return (data?.properties as Record<string, unknown>) || {};
  } catch {
    return {};
  }
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
