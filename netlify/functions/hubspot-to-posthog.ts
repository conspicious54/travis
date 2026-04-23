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
      PostHog capture endpoint — dedupe is handled by PostHog's
      UUID ingest rule so replaying the same transition is a no-op

   Required env vars:
     HUBSPOT_TOKEN          — Private App token with
                              crm.objects.deals.read,
                              crm.objects.contacts.read
     POSTHOG_PROJECT_KEY    — the phc_... project token (safe to
                              embed server-side; it's already in the
                              frontend bundle)
──────────────────────────────────────────────────────────────────── */

const HUBSPOT_BASE = 'https://api.hubapi.com';
const POSTHOG_HOST = 'https://us.i.posthog.com';
const LOOKBACK_MINUTES = 10; // search window; must be > cron interval

/* Stage ID → PostHog event name.
   Source of truth: we pulled these via the HubSpot MCP on 2026-04-23.
   If a stage is renamed or its ID rotates, update here — stage IDs
   live in HubSpot under Settings → Objects → Deals → Pipelines. */
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

async function searchDealsEnteredStage(
  token: string,
  stage: StageMap,
  cutoffIso: string
): Promise<DealResult[]> {
  // The property that holds "when did this deal enter <stage>"
  const enteredProp = `hs_date_entered_${stage.stageId}`;
  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: enteredProp, operator: 'GTE', value: cutoffIso },
          { propertyName: 'pipeline', operator: 'EQ', value: stage.pipelineId },
        ],
      },
    ],
    properties: [
      'dealname',
      'dealstage',
      'pipeline',
      'amount',
      enteredProp,
      'hs_lastmodifieddate',
    ],
    sorts: [{ propertyName: enteredProp, direction: 'DESCENDING' }],
    limit: 100,
  };

  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/deals/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn(`[hs→ph] deal search failed for stage ${stage.stageLabel}: ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { results?: DealResult[] };
  return data.results || [];
}

async function getAssociatedContactEmail(
  token: string,
  dealId: string
): Promise<string | null> {
  // Get the association IDs, then batch-read the first contact's email
  const assocRes = await fetch(
    `${HUBSPOT_BASE}/crm/v4/objects/deals/${dealId}/associations/contacts`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!assocRes.ok) return null;
  const assocData = (await assocRes.json()) as {
    results?: { toObjectId: number }[];
  };
  const contactId = assocData.results?.[0]?.toObjectId;
  if (!contactId) return null;

  const contactRes = await fetch(
    `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}?properties=email`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!contactRes.ok) return null;
  const contactData = (await contactRes.json()) as {
    properties?: { email?: string };
  };
  return contactData.properties?.email?.toLowerCase() || null;
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

export const handler = schedule('*/5 * * * *', async () => {
  const token = process.env.HUBSPOT_TOKEN;
  const projectKey = process.env.POSTHOG_PROJECT_KEY;
  if (!token || !projectKey) {
    console.error('[hs→ph] missing HUBSPOT_TOKEN or POSTHOG_PROJECT_KEY env var');
    return { statusCode: 500, body: 'missing env' };
  }

  const cutoff = new Date(Date.now() - LOOKBACK_MINUTES * 60_000);
  const cutoffIso = cutoff.toISOString();

  let totalFired = 0;
  let totalSkipped = 0;

  for (const stage of STAGES) {
    const deals = await searchDealsEnteredStage(token, stage, cutoffIso);
    if (!deals.length) continue;

    for (const deal of deals) {
      const enteredAt =
        deal.properties[`hs_date_entered_${stage.stageId}`] ||
        deal.properties.hs_lastmodifieddate;
      if (!enteredAt) continue;

      const email = await getAssociatedContactEmail(token, deal.id);
      if (!email) {
        totalSkipped++;
        console.log(`[hs→ph] skip ${deal.id} (${stage.stageLabel}) — no email`);
        continue;
      }

      const uuid = transitionUuid(deal.id, stage.stageId, String(enteredAt));
      const amountStr = deal.properties.amount;
      const amount = amountStr != null && amountStr !== '' ? Number(amountStr) : undefined;

      await sendToPostHog(projectKey, email, stage.eventName, String(enteredAt), uuid, {
        deal_id: deal.id,
        deal_name: deal.properties.dealname || null,
        pipeline_id: stage.pipelineId,
        pipeline_label: stage.pipelineLabel,
        stage_id: stage.stageId,
        stage_label: stage.stageLabel,
        amount,
        hs_entered_at: enteredAt,
      });
      totalFired++;
    }
  }

  const summary = `fired=${totalFired} skipped=${totalSkipped} window=${LOOKBACK_MINUTES}m`;
  console.log(`[hs→ph] done: ${summary}`);
  return { statusCode: 200, body: summary };
});
