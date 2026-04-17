import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/meeting-lookup ────────────────────────
   Given a contact email, look up the most recent Appointment in
   HubSpot (via Private App token) and return the booking details.

   URL:  /.netlify/functions/meeting-lookup?email=someone@example.com
   Requires env var: HUBSPOT_TOKEN (the Private App access token)

   The confirmation page uses this ONLY for fields that didn't come
   through the URL query params — primarily the Zoom join URL and
   the confirmed start/end times.
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };
  }

  const email = (event.queryStringParameters?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'email query param required' }),
    };
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'HUBSPOT_TOKEN env var not set' }),
    };
  }

  try {
    // 1. Find the contact by email
    const contactId = await findContactId(email, token);
    if (!contactId) {
      return ok({ found: false, reason: 'contact_not_found' });
    }

    // 2. Find the most recent appointment associated with that contact
    const appointment = await findLatestAppointmentForContact(contactId, token);
    if (!appointment) {
      return ok({ found: false, reason: 'no_appointment_found', contactId });
    }

    // 3. Fetch the owner name if we have an owner id
    let ownerName: string | undefined;
    const ownerId = appointment.properties?.hubspot_owner_id as string | undefined;
    if (ownerId) {
      ownerName = await getOwnerName(ownerId, token).catch(() => undefined);
    }

    // Map the messy HubSpot property names to clean names. Appointment
    // objects may use hs_appointment_* or hs_meeting_* depending on the
    // portal config, so we look for both.
    const p = appointment.properties || {};
    const pick = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = p[k];
        if (v !== undefined && v !== null && v !== '') return String(v);
      }
      return undefined;
    };

    const result = {
      found: true,
      appointmentId: appointment.id,
      contactId,
      startIso: pick('hs_appointment_start', 'hs_meeting_start_time'),
      endIso: pick('hs_appointment_end', 'hs_meeting_end_time'),
      title: pick('hs_appointment_name', 'hs_meeting_title'),
      joinUrl: pick(
        'hs_appointment_location',
        'hs_meeting_location',
        'hs_meeting_external_url',
        'hs_videoconference_link'
      ),
      ownerId,
      ownerName,
      // For debugging: return every property we got so we can see what
      // HubSpot actually sends and adjust field mappings.
      rawProperties: p,
    };

    return ok(result);
  } catch (err) {
    console.error('[meeting-lookup]', err);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'lookup failed', detail: String(err) }),
    };
  }
};

function ok(body: unknown) {
  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function findContactId(email: string, token: string): Promise<string | null> {
  // GET /crm/v3/objects/contacts/{email}?idProperty=email
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`contact lookup failed: ${res.status}`);
  const data = await res.json();
  return data.id || null;
}

async function findLatestAppointmentForContact(
  contactId: string,
  token: string
): Promise<{ id: string; properties: Record<string, unknown> } | null> {
  // Use the search endpoint to find appointments associated with this
  // contact, sorted by createdate desc, limit 1.
  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'associations.contact',
            operator: 'EQ',
            value: contactId,
          },
        ],
      },
    ],
    sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
    // Request every property we might need. The API silently ignores
    // properties that don't exist on this portal.
    properties: [
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
      'hubspot_owner_id',
      'createdate',
    ],
    limit: 1,
  };

  const tryEndpoint = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.results?.[0] || null;
  };

  // Try appointments first (newer), fall back to meetings (legacy)
  return (
    (await tryEndpoint('https://api.hubapi.com/crm/v3/objects/appointments/search')) ||
    (await tryEndpoint('https://api.hubapi.com/crm/v3/objects/meetings/search'))
  );
}

async function getOwnerName(ownerId: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/owners/${encodeURIComponent(ownerId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  const full = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  return full || data.email || undefined;
}
