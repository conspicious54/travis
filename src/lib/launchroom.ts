/* ───── Launch Room — types + pure math ──────────────────────────
   Shared between the Netlify functions (where the blob is written
   and read) and the React page (which displays the data and
   recomputes the launch date on each render so it visibly slips
   the longer the lead waits).

   Nothing here imports Netlify, React, or window — pure TypeScript
   so both sides can share it.
──────────────────────────────────────────────────────────────── */

import {
  SCORE_BANDS,
  LAUNCH_BASE_MONTHS,
  LAUNCH_UNDER_1K_PENALTY_MONTHS,
  LAUNCH_DEFAULT_MONTHS,
  START_OF_WEEK_DAY,
  SCORE_MAX_PER_DIMENSION,
  type ProductClarity,
  type CapitalBand,
  type TimingBand,
  type KnowledgeBand,
  type ExperienceBand,
} from './launchroom.config';

/* ───── Shape of the stored blob ─────────────────────────────── */

export type Tier = 'full' | 'partial' | 'starter';

export interface LaunchRoomAnswers {
  q4?: string;                   // where you're selling from (country / city raw)
  q5?: string;                   // why you're here (raw text / option id)
  q6?: ExperienceBand;           // where you're starting
  q7?: string;                   // timeline detail (free text)
  q8?: KnowledgeBand;            // how long following Travis
  q9?: ProductClarity;           // product clarity
  q10?: TimingBand;              // when you want to launch
  q11?: string;                  // how we'd support you (option id)
  q13?: CapitalBand;             // capital band
}

export interface LaunchRoomContact {
  name?: string;
  email?: string;
  phone?: string;
  firstName?: string;
}

export interface LaunchRoomScore {
  product:   number;
  capital:   number;
  timing:    number;
  knowledge: number;
  support:   number;
  total:     number;
  /** Three lowest dimensions, lowest first. Shown to the lead as
   *  "your 3 gaps, which your strategist will cover". */
  gaps: Array<'product' | 'capital' | 'timing' | 'knowledge' | 'support'>;
}

export interface LaunchRoomVisit {
  at: string;              // ISO
  scrollDepth?: number;    // 0..1
}

export interface LaunchRoomChecklist {
  step1?: boolean;
  step2?: boolean;
  step3?: boolean;
}

export type BookingStatus = 'booked' | 'applied' | 'dq';

export interface LaunchRoomRecord {
  id: string;              // nanoid, mirrors the URL slug
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  tier: Tier;
  answers: LaunchRoomAnswers;
  contact: LaunchRoomContact;
  checklist: LaunchRoomChecklist;
  commitment?: string;
  /** Mirrors HubSpot's booking_status; written server-side when
   *  the OnceHub webhook fires or when the 30-minute Zap resolves
   *  the lead's state. Drives the booking block on the page. */
  bookingStatus?: BookingStatus;
  bookingAt?: string;      // ISO, when they picked a slot
  visitCount: number;
  lastVisitAt?: string;
  /** Capped to last 50 visits so a bored lead can't balloon the
   *  blob. We only need enough history to detect "viewed 3x today"
   *  patterns that HubSpot cares about. */
  visitLog: LaunchRoomVisit[];
}

/* ───── Scoring ────────────────────────────────────────────── */

export function scoreLaunchReadiness(a: LaunchRoomAnswers): LaunchRoomScore {
  const product   = a.q9  ? SCORE_BANDS.product[a.q9]   ?? 0 : 0;
  const capital   = a.q13 ? SCORE_BANDS.capital[a.q13]  ?? 0 : 0;
  const timing    = a.q10 ? SCORE_BANDS.timing[a.q10]   ?? 0 : 0;

  const knowledgeBase = a.q8 ? SCORE_BANDS.knowledge[a.q8] ?? 0 : 0;
  const expBonus = (a.q6 === 'already_selling' || a.q6 === 'tried_business')
    ? SCORE_BANDS.knowledgeExperienceBonus
    : 0;
  const knowledge = Math.min(SCORE_MAX_PER_DIMENSION, knowledgeBase + expBonus);

  const support = SCORE_BANDS.support;

  const total = product + capital + timing + knowledge + support;

  const dims = [
    { k: 'product'   as const, v: product },
    { k: 'capital'   as const, v: capital },
    { k: 'timing'    as const, v: timing },
    { k: 'knowledge' as const, v: knowledge },
    { k: 'support'   as const, v: support },
  ];
  // Three lowest dimensions, lowest first. Stable among ties.
  const gaps = dims.sort((x, y) => x.v - y.v).slice(0, 3).map((d) => d.k);

  return { product, capital, timing, knowledge, support, total, gaps };
}

/* ───── Launch date ───────────────────────────────────────── */

/** Returns the Monday (or whatever START_OF_WEEK_DAY is) of the
 *  week containing `now`. Local-time by default — launch dates
 *  are read by humans, not systems, so we keep them calendar-day
 *  precise rather than UTC-strict. */
export function startOfWeek(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - START_OF_WEEK_DAY + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function computeLaunchDate(
  a: LaunchRoomAnswers,
  now: Date = new Date(),
): Date {
  const base = a.q9 ? LAUNCH_BASE_MONTHS[a.q9] : LAUNCH_DEFAULT_MONTHS;
  const penalty = a.q13 === 'under_1k' ? LAUNCH_UNDER_1K_PENALTY_MONTHS : 0;
  const months = base + penalty;

  const anchor = startOfWeek(now);
  const launch = new Date(anchor);
  launch.setMonth(launch.getMonth() + months);
  return launch;
}

export function formatLaunchDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ───── Tier derivation ──────────────────────────────────── */

/** A full tier needs the four scoring questions answered. Anything
 *  less (but with at least an email) is partial. No answers at
 *  all = starter. */
export function deriveTier(
  a: LaunchRoomAnswers,
  contact: LaunchRoomContact,
): Tier {
  const hasAnyAnswer = Boolean(a.q5 || a.q6 || a.q7 || a.q8 || a.q9 || a.q10 || a.q11 || a.q13);
  const hasScoringAnswers = Boolean(a.q9 && a.q13 && a.q10 && a.q8);
  if (hasScoringAnswers) return 'full';
  if (hasAnyAnswer) return 'partial';
  if (contact.email) return 'starter';
  return 'starter';
}

/* ───── Content block keying ───────────────────────────── */

/** Returns the content block key for a given section + answers.
 *  Each section tries `qN_<answer>` first, falls back to
 *  `qN_default`. The content map (launchroom.content.ts) owns
 *  the actual copy. */
export function blockKey(section: `q${number}`, answer: string | undefined): string {
  if (!answer) return `${section}_default`;
  return `${section}_${answer}`;
}
