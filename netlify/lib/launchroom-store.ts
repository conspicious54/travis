import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import {
  deriveTier,
  type LaunchRoomRecord,
  type LaunchRoomAnswers,
  type LaunchRoomContact,
  type LaunchRoomChecklist,
} from '../../src/lib/launchroom';

/* ───── Launch Room — shared store helpers ───────────────────────
   One module owns reads/writes against the Netlify Blobs stores
   so every function (launchroom-create, launchroom-get,
   launchroom-update, typeform-webhook, and future ones like
   the cron sweep) go through the same code path.

   Two stores:
     - launchrooms:          id -> LaunchRoomRecord (JSON)
     - launchrooms-index:    typeform response_id -> launchroom id

   The index exists so a partial Typeform submission can replay
   per-answer webhooks against the same room without creating
   duplicates.
──────────────────────────────────────────────────────────────── */

const VISIT_LOG_MAX = 50;
const COMMITMENT_MAX = 1000;

function stores() {
  return {
    rooms: getStore('launchrooms'),
    index: getStore('launchrooms-index'),
  };
}

export async function getById(id: string): Promise<LaunchRoomRecord | null> {
  const { rooms } = stores();
  return (await rooms.get(id, { type: 'json' })) as LaunchRoomRecord | null;
}

export async function getByResponseId(responseId: string): Promise<LaunchRoomRecord | null> {
  const { index } = stores();
  const id = (await index.get(responseId))?.toString();
  if (!id) return null;
  return getById(id);
}

/** Upsert a record keyed by Typeform response_id. If no existing
 *  record exists, mint a new id. If one exists, merge the incoming
 *  contact/answers on top. Returns the (new or merged) record. */
export async function upsertByResponseId(args: {
  responseId: string;
  contact?: LaunchRoomContact;
  answers?: LaunchRoomAnswers;
}): Promise<LaunchRoomRecord> {
  const { rooms, index } = stores();
  const contact = args.contact ?? {};
  const answers = args.answers ?? {};
  const now = new Date().toISOString();

  const existingId = (await index.get(args.responseId))?.toString();
  if (existingId) {
    const existing = (await rooms.get(existingId, { type: 'json' })) as LaunchRoomRecord | null;
    if (existing) {
      const nextContact = { ...existing.contact, ...contact };
      const nextAnswers = { ...existing.answers, ...answers };
      const merged: LaunchRoomRecord = {
        ...existing,
        contact: nextContact,
        answers: nextAnswers,
        tier: deriveTier(nextAnswers, nextContact),
        updatedAt: now,
      };
      await rooms.setJSON(existingId, merged);
      return merged;
    }
  }

  const id = randomBytes(18).toString('base64url');
  const record: LaunchRoomRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    tier: deriveTier(answers, contact),
    answers,
    contact,
    checklist: {},
    visitCount: 0,
    visitLog: [],
  };
  await rooms.setJSON(id, record);
  await index.set(args.responseId, id);
  return record;
}

/** Create a record without a response_id (direct API-driven mint). */
export async function createRecord(args: {
  contact?: LaunchRoomContact;
  answers?: LaunchRoomAnswers;
}): Promise<LaunchRoomRecord> {
  const { rooms } = stores();
  const now = new Date().toISOString();
  const id = randomBytes(18).toString('base64url');
  const contact = args.contact ?? {};
  const answers = args.answers ?? {};
  const record: LaunchRoomRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    tier: deriveTier(answers, contact),
    answers,
    contact,
    checklist: {},
    visitCount: 0,
    visitLog: [],
  };
  await rooms.setJSON(id, record);
  return record;
}

/** Log a visit and persist. Returns the updated record so the
 *  caller can hand the fresh copy to the page. */
export async function logVisit(id: string, scrollDepth?: number): Promise<LaunchRoomRecord | null> {
  const existing = await getById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const updated: LaunchRoomRecord = {
    ...existing,
    visitCount: existing.visitCount + 1,
    lastVisitAt: now,
    visitLog: [...existing.visitLog, { at: now, scrollDepth }].slice(-VISIT_LOG_MAX),
    updatedAt: now,
  };
  const { rooms } = stores();
  await rooms.setJSON(id, updated);
  return updated;
}

/** Patch checklist/commitment on an existing record. */
export async function applyPatch(args: {
  id: string;
  checklist?: LaunchRoomChecklist;
  commitment?: string;
}): Promise<LaunchRoomRecord | null> {
  const existing = await getById(args.id);
  if (!existing) return null;
  const updated: LaunchRoomRecord = {
    ...existing,
    checklist: { ...existing.checklist, ...(args.checklist ?? {}) },
    commitment:
      typeof args.commitment === 'string'
        ? args.commitment.slice(0, COMMITMENT_MAX)
        : existing.commitment,
    updatedAt: new Date().toISOString(),
  };
  const { rooms } = stores();
  await rooms.setJSON(args.id, updated);
  return updated;
}
