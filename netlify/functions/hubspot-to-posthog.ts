import { schedule } from '@netlify/functions';
import { createHash } from 'crypto';

/* ───── /.netlify/functions/hubspot-to-posthog ─────────────────────
   Scheduled job that forwards HubSpot deal-stage transitions to
   PostHog as custom events, so the website analytics can answer
   questions like "of people who clicked Confirm via Text, what %
   actually showed up?" and "of FAQ expanders, what % closed?".

   Runs every 5 minutes. Each run:
   1) searches each target deal stage for deals that entered that
      stage in the last LOOKBACK_MINUTES
   2) fetches the associated contact's email (PostHog distinct_id)
   3) POSTs one deterministic-UUID event per transition to the
      PostHog capture endpoint - dedupe is handled by PostHog's
      UUID ingest rule so replaying the same transition is a no-op

   Required env vars:
     HUBSPOT_TOKEN          - Private App token with
                              crm.objects.deals.read,
                              crm.objects.contacts.read
     POSTHOG_PROJECT_KEY    - the phc_... project token (safe to
                              embed server-side; it's already in the
                              frontend bundle)
──────────────────────────────────────────────────────────────────── */

const HUBSPOT_BASE = 'https://api.hubapi.com';
const POSTHOG_HOST = 'https://us.i.posthog.com';
const LOOKBACK_MINUTES = 10; // search window; must be > cron interval

/* Stage ID → PostHog event name.
   Source of truth: we pulled these via the HubSpot MCP. Stage IDs
   live in HubSpot under Settings → Objects → Deals → Pipelines.

   ─────────────────────────────────────────────────────────────────
   The "Closer Scorecards" report in HubSpot computes:

     Show %         = SUM(first_call_completed_count) / SUM(deal_count)
     Live Closed %  = SUM([Enrolled/Closed])          / SUM(first_call_completed_count)
     Booked Closed% = SUM([Enrolled/Closed])          / SUM(deal_count)

   Filtered to:
     - Pipeline = Inbound Scheduled Calls (1957399266)
     - First Call Meeting Date <= today (so future-dated calls don't
       artificially deflate the show rate)

   PostHog mapping (per Person, but events also carry deal_id so a
   strict deal-level COUNT(DISTINCT deal_id) breakdown works too):

     "deal_count" (booked)       = unique deals with closer_call_booked
     "first_call_completed_count"= unique deals with closer_call_showed
     "[Enrolled/Closed]"         = unique deals with closer_enrolled
                                    OR sale_closed (union)

   To match the report's filter in PostHog, scope insights to
   first_call_meeting_date <= now (it's on every closer event below).
   ───────────────────────────────────────────────────────────────── */
interface StageMap {
  pipelineId: string;
  pipelineLabel: string;
  stageId: string;
  stageLabel: string;
  eventName: string;
}

const STAGES: StageMap[] = [
  // Opt-Ins pipeline (setter / S2C flow)
  {
    pipelineId: '1949791940',
    pipelineLabel: 'Opt-Ins',
    stageId: '3094848228',
    stageLabel: 'S2C Call Scheduled',
    eventName: 'setter_call_scheduled',
  },
  {
    pipelineId: '1949791940',
    pipelineLabel: 'Opt-Ins',
    stageId: '3094848229',
    stageLabel: 'S2C Call Completed',
    eventName: 'setter_call_showed',
  },
  {
    pipelineId: '1949791940',
    pipelineLabel: 'Opt-Ins',
    stageId: '3094848230',
    stageLabel: 'Close Lost',
    eventName: 'setter_call_lost',
  },
  // Inbound Scheduled Calls pipeline (closer flow)
  // "Lead in" is the entry stage - this is the BOOKED denominator
  // for Closer Scorecards. Every deal in this pipeline starts here.
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023756',
    stageLabel: 'Lead in',
    eventName: 'closer_call_booked',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023757',
    stageLabel: 'First Call Completed',
    eventName: 'closer_call_showed',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023758',
    stageLabel: 'Demo Completed',
    eventName: 'closer_demo_completed',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023759',
    stageLabel: 'Follow up',
    eventName: 'closer_follow_up',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023760',
    stageLabel: 'Funding',
    eventName: 'closer_funding',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023761',
    stageLabel: 'Enrolled',
    eventName: 'closer_enrolled',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3097609927',
    stageLabel: 'Closed Won',
    eventName: 'sale_closed',
  },
  {
    pipelineId: '1957399266',
    pipelineLabel: 'Inbound Scheduled Calls',
    stageId: '3096023762',
    stageLabel: 'Closed Lost',
    eventName: 'closer_lost',
  },
];

interface DealResult {
  id: string;
  properties: Record<string, string | null | undefined>;
}

async function searchDealsEnteredStageDebug(
  token: string,
  stage: StageMap,
  cutoffIso: string
): Promise<{ deals: DealResult[]; status: number; total: number; errorBody?: string }> {
  const enteredProp = `hs_v2_date_entered_${stage.stageId}`;
  const properties = [
    'dealname',
    'dealstage',
    'pipeline',
    'amount',
    // first_call_meeting_date powers the Closer Scorecards
    // "First Call Meeting Date is before today" filter when we
    // reproduce the formulas in PostHog. Including on every
    // event so insights can filter consistently.
    'first_call_meeting_date',
    'first_call_meeting_date_and_time',
    'first_call_show_up',
    'first_call_completed_count',
    'completed_payment',
    'createdate',
    enteredProp,
    'hs_lastmodifieddate',
  ];
  const PAGE_LIMIT = 100;
  const MAX_PAGES = 50; // safety: 5000 deals per stage per run is plenty

  // Paginate through all matching deals so a long backfill window
  // doesn't silently cap at 100 per stage. HubSpot returns
  // paging.next.after as a string cursor.
  const allDeals: DealResult[] = [];
  let after: string | undefined;
  let total = 0;
  let lastStatus = 0;
  let lastErrorBody: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const body: Record<string, unknown> = {
      filterGroups: [
        {
          filters: [
            { propertyName: enteredProp, operator: 'GTE', value: cutoffIso },
            { propertyName: 'pipeline', operator: 'EQ', value: stage.pipelineId },
          ],
        },
      ],
      properties,
      sorts: [{ propertyName: enteredProp, direction: 'DESCENDING' }],
      limit: PAGE_LIMIT,
    };
    if (after) body.after = after;

    let res: Response;
    try {
      res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/deals/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      return { deals: allDeals, status: 0, total, errorBody: `fetch error: ${String(err)}` };
    }
    lastStatus = res.status;

    if (res.status === 429 || res.status >= 500) {
      // Retryable - back off and retry the same page. Small per-page
      // budget to stay well under HubSpot's 10/sec limit.
      await new Promise((r) => setTimeout(r, 1000));
      page--; // retry this page
      continue;
    }
    if (!res.ok) {
      try { lastErrorBody = await res.text(); } catch { /* no-op */ }
      console.warn(`[hs→ph] deal search failed for stage ${stage.stageLabel}: ${res.status} ${(lastErrorBody || '').slice(0, 200)}`);
      return { deals: allDeals, status: res.status, total, errorBody: lastErrorBody };
    }
    const data = (await res.json()) as {
      results?: DealResult[];
      total?: number;
      paging?: { next?: { after?: string } };
    };
    allDeals.push(...(data.results || []));
    total = data.total || 0;
    after = data.paging?.next?.after;
    if (!after) break;
    // Light throttle between pages
    await new Promise((r) => setTimeout(r, 150));
  }

  return { deals: allDeals, status: lastStatus || 200, total, errorBody: lastErrorBody };
}

async function searchDealsEnteredStage(
  token: string,
  stage: StageMap,
  cutoffIso: string
): Promise<DealResult[]> {
  const r = await searchDealsEnteredStageDebug(token, stage, cutoffIso);
  return r.deals;
}

/* Contact-level fields we pull alongside the email so we can stamp
   them onto PostHog Person records via `$set` on each event. Adding
   new fields here is a one-line change at the call site below. */
interface ContactInfo {
  email: string;
  typeform_score?: string;
}

const CONTACT_PROPS_TO_FETCH = ['email', 'typeform_score'] as const;

async function getAssociatedContactEmail(
  token: string,
  dealId: string
): Promise<string | null> {
  // Kept for back-compat; the batch path is preferred for backfills.
  const m = await batchResolveContacts([dealId], token);
  return m.get(dealId)?.email || null;
}

/** Resolve deal IDs → ContactInfo (email + extra HubSpot props we
 *  want as PostHog Person properties), in two batch calls with 429
 *  retry. Returns a Map keyed by deal id; missing entries = no
 *  associated contact, or contact had no email. */
async function batchResolveContacts(
  dealIds: string[],
  token: string
): Promise<Map<string, ContactInfo>> {
  const out = new Map<string, ContactInfo>();
  if (dealIds.length === 0) return out;

  // 1) Batch-read deal→contact associations (HubSpot caps at 100/req)
  const dealToContactId = new Map<string, string>();
  const allContactIds = new Set<string>();
  for (let i = 0; i < dealIds.length; i += 100) {
    const chunk = dealIds.slice(i, i + 100);
    const data = await hubspotFetchJson<{
      results?: Array<{ from: { id: string }; to: Array<{ toObjectId: string }> }>;
    }>(
      `${HUBSPOT_BASE}/crm/v4/associations/deals/contacts/batch/read`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: chunk.map((id) => ({ id })) }),
      }
    );
    for (const r of data?.results || []) {
      const cid = String(r.to?.[0]?.toObjectId || '');
      if (cid) {
        dealToContactId.set(String(r.from.id), cid);
        allContactIds.add(cid);
      }
    }
  }

  // 2) Batch-read contact properties (cap 100/req). We pull email
  //    plus typeform_score (and any other props in
  //    CONTACT_PROPS_TO_FETCH) so we can $set them on the PostHog
  //    Person record at event time.
  const contactIdToInfo = new Map<string, ContactInfo>();
  const contactIds = [...allContactIds];
  for (let i = 0; i < contactIds.length; i += 100) {
    const chunk = contactIds.slice(i, i + 100);
    const data = await hubspotFetchJson<{
      results?: Array<{ id: string; properties?: Record<string, string | null | undefined> }>;
    }>(`${HUBSPOT_BASE}/crm/v3/objects/contacts/batch/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: CONTACT_PROPS_TO_FETCH,
        inputs: chunk.map((id) => ({ id })),
      }),
    });
    for (const r of data?.results || []) {
      const email = r.properties?.email?.toLowerCase().trim();
      if (!email) continue;
      const score = r.properties?.typeform_score?.toString().trim();
      contactIdToInfo.set(r.id, {
        email,
        typeform_score: score ? score : undefined,
      });
    }
  }

  // 3) Combine
  for (const dealId of dealIds) {
    const cid = dealToContactId.get(dealId);
    if (!cid) continue;
    const info = contactIdToInfo.get(cid);
    if (info) out.set(dealId, info);
  }
  return out;
}

/** Fetch JSON with retry on 429 + 5xx. Returns null on persistent failure. */
async function hubspotFetchJson<T>(url: string, init: RequestInit): Promise<T | null> {
  const RETRY_DELAYS_MS = [0, 600, 1500, 3000];
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      console.warn(`[hs→ph] fetch error ${url}`, err);
      continue;
    }
    if (res.ok) {
      try {
        return (await res.json()) as T;
      } catch {
        return null;
      }
    }
    if (res.status === 429 || res.status >= 500) {
      console.warn(`[hs→ph] retryable ${res.status} on ${url}`);
      continue;
    }
    // Non-retryable error - log body and bail
    let body = '';
    try { body = (await res.text()).slice(0, 200); } catch { /* no-op */ }
    console.warn(`[hs→ph] non-retryable ${res.status} on ${url}: ${body}`);
    return null;
  }
  console.warn(`[hs→ph] exhausted retries on ${url}`);
  return null;
}

async function sendToPostHog(
  projectKey: string,
  email: string,
  eventName: string,
  timestamp: string,
  uuid: string,
  properties: Record<string, unknown>
) {
  const res = await fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: projectKey,
      event: eventName,
      distinct_id: email,
      timestamp,
      uuid,
      properties: {
        ...properties,
        $lib: 'hubspot-pipeline',
      },
    }),
  });
  if (!res.ok) {
    console.warn(
      `[hs→ph] posthog capture failed (${res.status}) for ${eventName} / ${email}`
    );
  }
}

function transitionUuid(dealId: string, stageId: string, enteredAtIso: string) {
  const hash = createHash('sha256')
    .update(`${dealId}|${stageId}|${enteredAtIso}`)
    .digest('hex');
  // Format into an RFC-4122-looking UUID so PostHog accepts it
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

export const handler = schedule('*/5 * * * *', async (event) => {
  const token = process.env.HUBSPOT_TOKEN;
  const projectKey = process.env.POSTHOG_PROJECT_KEY;
  if (!token || !projectKey) {
    console.error('[hs→ph] missing HUBSPOT_TOKEN or POSTHOG_PROJECT_KEY env var');
    return { statusCode: 500, body: 'missing env' };
  }

  // Allow ?minutes=10080 on manual invocations to backfill a longer
  // window. Scheduled runs (event is empty) use the default LOOKBACK.
  // PostHog dedupes on our deterministic UUID, so replays are no-ops.
  const overrideRaw = event?.queryStringParameters?.minutes;
  const overrideMinutes = overrideRaw ? parseInt(overrideRaw, 10) : NaN;
  const minutes =
    Number.isFinite(overrideMinutes) && overrideMinutes > 0 && overrideMinutes <= 43_200
      ? overrideMinutes
      : LOOKBACK_MINUTES;

  const cutoff = new Date(Date.now() - minutes * 60_000);
  const cutoffIso = cutoff.toISOString();
  const debug = event?.queryStringParameters?.debug === '1';

  let totalFired = 0;
  let totalSkipped = 0;
  const debugLog: Array<Record<string, unknown>> = [];

  // Stage searches run SERIALLY with a small inter-stage throttle.
  // Firing 11 parallel HubSpot searches reliably hit the per-second
  // rate limit (especially on long-window backfills where each
  // search paginates). Sequential with ~150ms gap stays well under
  // the 10/sec quota and the total wall-time is still fine (each
  // search returns fast for empty windows).
  const searchResults: Awaited<ReturnType<typeof searchDealsEnteredStageDebug>>[] = [];
  for (const s of STAGES) {
    searchResults.push(await searchDealsEnteredStageDebug(token, s, cutoffIso));
    await new Promise((r) => setTimeout(r, 150));
  }

  // Flatten into a single list of {stage, deal} tuples we can process
  // with bounded concurrency. Each tuple needs an associated-contact
  // lookup + a PostHog capture.
  type Work = { stage: StageMap; deal: DealResult; enteredAt: string };
  const work: Work[] = [];
  searchResults.forEach((result, i) => {
    const stage = STAGES[i];
    if (debug) {
      debugLog.push({
        stage: stage.stageLabel,
        stageId: stage.stageId,
        status: result.status,
        total: result.total,
        firstError: result.errorBody ? result.errorBody.slice(0, 200) : undefined,
        firstHit: result.deals[0]?.id,
      });
    }
    for (const deal of result.deals) {
      const enteredAt =
        deal.properties[`hs_v2_date_entered_${stage.stageId}`] ||
        deal.properties.hs_lastmodifieddate;
      if (enteredAt) work.push({ stage, deal, enteredAt: String(enteredAt) });
    }
  });

  // Resolve all contacts in two batch calls instead of 2N individual
  // fetches. HubSpot's batch endpoints cap at 100 IDs per request.
  // We pull email + typeform_score + any other CONTACT_PROPS_TO_FETCH
  // so we can $set them on the PostHog Person record on each event.
  const uniqueDealIds = [...new Set(work.map((w) => w.deal.id))];
  const dealToContact = await batchResolveContacts(uniqueDealIds, token);

  // Now fire PostHog captures with bounded concurrency. PostHog
  // ingest is fast and tolerates higher concurrency than HubSpot.
  const POSTHOG_CONCURRENCY = 20;
  for (let i = 0; i < work.length; i += POSTHOG_CONCURRENCY) {
    const batch = work.slice(i, i + POSTHOG_CONCURRENCY);
    await Promise.all(
      batch.map(async ({ stage, deal, enteredAt }) => {
        const contact = dealToContact.get(deal.id);
        if (!contact) {
          totalSkipped++;
          console.log(`[hs→ph] skip ${deal.id} (${stage.stageLabel}) - no email`);
          return;
        }
        const uuid = transitionUuid(deal.id, stage.stageId, enteredAt);
        const amountStr = deal.properties.amount;
        const amount =
          amountStr != null && amountStr !== '' ? Number(amountStr) : undefined;
        const p = deal.properties;
        const firstCallCompletedCountStr = p.first_call_completed_count;
        const firstCallCompletedCount =
          firstCallCompletedCountStr != null && firstCallCompletedCountStr !== ''
            ? Number(firstCallCompletedCountStr)
            : undefined;

        // PostHog $set: any keys here update the Person record on
        // every event ingest. typeform_score is the per-application
        // lead-quality signal from the /applynow form. Adding more
        // contact-level person properties means: append to
        // CONTACT_PROPS_TO_FETCH above, then add the key here.
        const personSet: Record<string, unknown> = {};
        if (contact.typeform_score) {
          personSet.typeform_score = contact.typeform_score;
          // Also store as a parsed number when possible so PostHog
          // can do >=/< filters and avg() math even though HubSpot
          // stores it as a string. NaN means non-numeric → skip.
          const asNum = Number(contact.typeform_score);
          if (!Number.isNaN(asNum)) {
            personSet.typeform_score_num = asNum;
          }
        }

        await sendToPostHog(projectKey, contact.email, stage.eventName, enteredAt, uuid, {
          deal_id: deal.id,
          deal_name: p.dealname || null,
          pipeline_id: stage.pipelineId,
          pipeline_label: stage.pipelineLabel,
          stage_id: stage.stageId,
          stage_label: stage.stageLabel,
          amount,
          // Properties below let PostHog reproduce the HubSpot
          // "Closer Scorecards" filter scope (first_call_meeting_date
          // before today) and surface raw HubSpot signals so any
          // future formula tweak is computable without code changes.
          first_call_meeting_date: p.first_call_meeting_date || null,
          first_call_meeting_date_and_time:
            p.first_call_meeting_date_and_time || null,
          first_call_show_up: p.first_call_show_up || null,
          first_call_completed_count: firstCallCompletedCount,
          completed_payment: p.completed_payment || null,
          createdate: p.createdate || null,
          hs_entered_at: enteredAt,
          // Person properties (PostHog $set keys update the Person)
          ...(Object.keys(personSet).length > 0 ? { $set: personSet } : {}),
        });
        totalFired++;
      })
    );
  }

  const summary = `fired=${totalFired} skipped=${totalSkipped} window=${minutes}m`;
  console.log(`[hs→ph] done: ${summary}`);
  if (debug) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, stages: debugLog }, null, 2),
    };
  }
  return { statusCode: 200, body: summary };
});
