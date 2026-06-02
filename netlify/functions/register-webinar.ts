import type { Handler, HandlerEvent } from '@netlify/functions';

/* ───── /.netlify/functions/register-webinar ──────────────────────
   POST { email, phone?, stage, source?, is_member? }
   → Upserts the contact in HubSpot, sets:
     - webinar_registered = true
     - webinar_launch_stage = <the dropdown answer>
     - webinar_registration_source = 'list' | 'cold' (or whatever
       the client passed)
     - phone (only if provided — list members may skip this field)

   Always returns HTTP 200 so a CRM hiccup doesn't block the user's
   confirmation page. Errors land in the function log and PostHog.

   Requires env var HUBSPOT_TOKEN with
     crm.objects.contacts.read + crm.objects.contacts.write
──────────────────────────────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const HUBSPOT_BASE = 'https://api.hubapi.com';

interface RegisterPayload {
  email?: string;
  phone?: string;
  stage?: string;
  source?: string;
  is_member?: boolean;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(200, { ok: false, reason: 'method_not_allowed' });
  }

  let body: RegisterPayload = {};
  try {
    body = event.body ? (JSON.parse(event.body) as RegisterPayload) : {};
  } catch {
    return json(200, { ok: false, reason: 'invalid_json' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return json(200, { ok: false, reason: 'email_missing' });
  }
  const stage = (body.stage || '').trim();
  if (!stage) {
    return json(200, { ok: false, reason: 'stage_missing' });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return json(200, { ok: false, reason: 'token_not_set' });
  }

  const properties: Record<string, string> = {
    webinar_registered: 'true',
    webinar_launch_stage: stage,
    webinar_registration_source: body.is_member ? 'list' : 'cold',
    webinar_registered_at: new Date().toISOString(),
  };
  const phone = (body.phone || '').trim();
  if (phone) properties.phone = phone;

  // Upsert: try update by email; if 404, create.
  const upsertUrl = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`;
  let res = await fetch(upsertUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (res.status === 404) {
    // Contact doesn't exist — create it with email + the same props
    res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { ...properties, email } }),
    });
  }

  if (!res.ok) {
    let bodyText = '';
    try { bodyText = (await res.text()).slice(0, 300); } catch { /* no-op */ }
    console.warn(`[register-webinar] HubSpot ${res.status} email=${email} body=${bodyText}`);
    return json(200, {
      ok: false,
      reason: 'hubspot_error',
      status: res.status,
      detail: bodyText,
    });
  }

  // Mirror to ActiveCampaign: sync the contact, then add to the
  // webinar-specific list so the email-broadcast team can hit them.
  // Env vars (set in Netlify):
  //   ACTIVECAMPAIGN_API_URL  e.g. https://passionproduct.api-us1.com
  //   ACTIVECAMPAIGN_API_KEY  the API token from AC Settings → Developer
  //   WEBINAR_AC_LIST_ID      numeric list ID for this webinar (from URL)
  const acResult = await addToActiveCampaignList(email, phone);

  console.log(
    `[register-webinar] ok email=${email} stage="${stage}" ` +
    `source=${properties.webinar_registration_source} ac_list_added=${acResult.ok} ac_reason=${acResult.reason || ''}`
  );
  return json(200, {
    ok: true,
    email,
    stage,
    activecampaign: acResult,
  });
};

async function addToActiveCampaignList(
  email: string,
  phone: string
): Promise<{ ok: boolean; status?: number; reason?: string; contactId?: string }> {
  const apiUrl = (process.env.ACTIVECAMPAIGN_API_URL || '').trim().replace(/\/$/, '');
  const apiKey = (process.env.ACTIVECAMPAIGN_API_KEY || '').trim();
  const listId = (process.env.WEBINAR_AC_LIST_ID || '').trim();
  if (!apiUrl || !apiKey) return { ok: false, reason: 'ac_not_configured' };
  if (!listId) return { ok: false, reason: 'ac_list_not_configured' };

  // 1) Upsert the contact in ActiveCampaign via /contact/sync
  let syncRes: Response;
  try {
    syncRes = await fetch(`${apiUrl}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          email,
          phone: phone || undefined,
        },
      }),
    });
  } catch (err) {
    console.warn('[register-webinar] AC sync fetch error', err);
    return { ok: false, reason: 'ac_sync_fetch_error' };
  }
  if (!syncRes.ok) {
    let body = '';
    try { body = (await syncRes.text()).slice(0, 200); } catch { /* no-op */ }
    console.warn(`[register-webinar] AC sync failed ${syncRes.status}: ${body}`);
    return { ok: false, status: syncRes.status, reason: `ac_sync_${syncRes.status}` };
  }
  let contactId = '';
  try {
    const data = (await syncRes.json()) as { contact?: { id?: string } };
    contactId = data.contact?.id || '';
  } catch { /* no-op */ }
  if (!contactId) return { ok: false, reason: 'ac_no_contact_id' };

  // 2) Add the contact to the list. status:1 = "subscribed/active".
  let listRes: Response;
  try {
    listRes = await fetch(`${apiUrl}/api/3/contactLists`, {
      method: 'POST',
      headers: {
        'Api-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactList: {
          list: Number(listId),
          contact: Number(contactId),
          status: 1,
        },
      }),
    });
  } catch (err) {
    console.warn('[register-webinar] AC list-add fetch error', err);
    return { ok: false, reason: 'ac_list_fetch_error', contactId };
  }
  if (!listRes.ok) {
    let body = '';
    try { body = (await listRes.text()).slice(0, 200); } catch { /* no-op */ }
    console.warn(`[register-webinar] AC list ${listId} add failed ${listRes.status}: ${body}`);
    return { ok: false, status: listRes.status, reason: `ac_list_${listRes.status}`, contactId };
  }

  return { ok: true, status: listRes.status, contactId };
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}
