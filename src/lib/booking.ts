/* ───── Shared booking helpers ───────────────────────────────────
   One place for the postMessage filtering, booking-id extraction,
   dedup, and the Enhanced-Conversions-friendly dataLayer push used
   by every booking page (BookCall, Book, and anything else that
   embeds OnceHub).

   WHY: Google Ads was reporting "Tag is missing user-provided
   data" because the Enhanced Conversions tag had nothing to read.
   This module hashes the booking email + phone client-side and
   pushes them in a stable shape GTM can wire straight into the
   Enhanced Conversions configuration. Also provides transaction-id
   dedup so refresh / reschedule / revisit doesn't double-count.
──────────────────────────────────────────────────────────────── */

import { pushDataLayer, trackEvent } from './posthog';

/* ─── Message authenticity ──────────────────────────────────── */

/** True when `origin` is a real OnceHub origin. Uses URL hostname
 *  parsing and an exact-or-subdomain match so a hostile origin
 *  like `https://oncehub.com.evil.com` or
 *  `https://evilsiteoncehub.com` cannot slip past a naive
 *  substring check. */
export function isAllowedOnceHubOrigin(origin: string | undefined | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    const h = url.hostname;
    return (
      h === 'oncehub.com' || h.endsWith('.oncehub.com') ||
      h === 'scheduleonce.com' || h.endsWith('.scheduleonce.com')
    );
  } catch {
    return false;
  }
}

/** True when the postMessage event genuinely came from the
 *  OnceHub iframe this component rendered. Ties message authority
 *  to the exact window we embedded, not just to any OnceHub
 *  origin — which would allow a cross-tab OnceHub page to forge
 *  a booking confirmation into our page. */
export function isFromOnceHubIframe(
  event: MessageEvent,
  container: HTMLElement | null,
): boolean {
  if (!container) return false;
  const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
  if (!iframe) return false;
  return event.source === iframe.contentWindow;
}

/* ─── Payload-shape detectors ───────────────────────────────── */

/** Pulls the OnceHub event-type string from whichever field holds
 *  it on this particular payload shape. OnceHub posts different
 *  envelopes depending on version/widget type. */
function readTypeString(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data.toLowerCase();
  if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    return [
      typeof d.type === 'string' ? d.type : '',
      typeof d.eventType === 'string' ? d.eventType : '',
      typeof d.eventName === 'string' ? d.eventName : '',
      typeof d.event === 'string' ? d.event : '',
    ]
      .join(' ')
      .toLowerCase();
  }
  return '';
}

/** True when this postMessage represents a FRESH booking we
 *  should count as a conversion. Explicitly excludes reschedules
 *  (which fire a "scheduled" variant but should not emit a second
 *  Google Ads conversion). */
export function isFreshBookingConfirmed(data: unknown): boolean {
  const t = readTypeString(data);
  if (!t.includes('booking')) return false;
  // Reschedule / cancel are NOT fresh bookings.
  if (t.includes('reschedul')) return false;
  if (t.includes('cancel')) return false;
  return (
    t.includes('confirmed') ||
    t.includes('succeeded') ||
    t.includes('success') ||
    t.includes('complete') ||
    t.includes('scheduled')
  );
}

export function isBookingRescheduled(data: unknown): boolean {
  const t = readTypeString(data);
  return t.includes('booking') && t.includes('reschedul');
}

/* ─── Booking ID extraction ─────────────────────────────────── */

type PayloadLike = Record<string, unknown> | null;

function unwrapPayload(data: unknown): PayloadLike {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const inner = d.payload;
  if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
  return d;
}

function pickString(obj: PayloadLike, keys: string[]): string {
  if (!obj) return '';
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function pickNested(obj: PayloadLike, path: string[]): string {
  let cur: unknown = obj;
  for (const seg of path) {
    if (!cur || typeof cur !== 'object') return '';
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === 'string' && cur.trim() ? cur.trim() : '';
}

/** Returns a stable identifier for this booking that we can hand
 *  Google Ads as `transaction_id` for dedup. Prefers OnceHub's own
 *  booking id; falls back to an opaque SHA-256 hash of normalized
 *  start-time + email so reschedules of the same slot still dedupe
 *  WITHOUT leaking any raw PII in the id itself. Returns '' only
 *  when we have nothing at all to key off. */
export async function extractBookingId(data: unknown): Promise<string> {
  const p = unwrapPayload(data);
  const direct =
    pickString(p, ['booking_id', 'bookingId', 'event_id', 'eventId', 'id', 'appointment_id', 'appointmentId', 'uuid']) ||
    pickNested(p, ['booking', 'id']) ||
    pickNested(p, ['appointment', 'id']) ||
    pickNested(p, ['event', 'id']);
  if (direct) return direct;

  const start =
    pickString(p, ['start_time', 'startTime', 'scheduled_at', 'scheduledAt', 'date', 'start']) ||
    pickNested(p, ['booking', 'start_time']) ||
    pickNested(p, ['appointment', 'start_time']);
  const email =
    pickString(p, ['customer_email', 'attendee_email', 'guest_email', 'email']) ||
    pickNested(p, ['customer', 'email']);
  if (!start && !email) return '';
  // Normalise before hashing so case / whitespace variants collapse
  // to the same id. Output is opaque: `oh-fb-<64 hex chars>`.
  const normalised = `${start.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
  const hash = await sha256Hex(normalised);
  if (!hash) return ''; // SubtleCrypto unavailable — safer to skip
                       // the conversion than emit a weak id.
  return `oh-fb-${hash}`;
}

export function extractAttendee(data: unknown): { email: string; phone: string; firstName: string } {
  const p = unwrapPayload(data);
  return {
    email:
      pickString(p, ['customer_email', 'attendee_email', 'guest_email', 'email']) ||
      pickNested(p, ['customer', 'email']) || '',
    phone:
      pickString(p, ['customer_phone', 'attendee_phone', 'phone']) ||
      pickNested(p, ['customer', 'phone']) || '',
    firstName:
      pickString(p, ['customer_first_name', 'attendee_first_name', 'first_name']) ||
      pickNested(p, ['customer', 'first_name']) || '',
  };
}

/* ─── Dedup (localStorage with in-memory fallback) ─────────── */

const DEDUP_KEY_PREFIX = 'pp_bc_fired:';
const DEDUP_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/** Private-mode / storage-blocked backstop so that even when
 *  localStorage throws, two postMessages within one page lifetime
 *  can't both fire the conversion. localStorage remains the
 *  cross-session memory; this is the within-session guarantee. */
const inMemoryFired: Set<string> = new Set();

export function hasFiredBookedCallConversion(bookingId: string): boolean {
  if (!bookingId) return false;
  if (inMemoryFired.has(bookingId)) return true;
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DEDUP_KEY_PREFIX + bookingId);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    if (Date.now() - ts > DEDUP_TTL_MS) return false;
    return true;
  } catch {
    return false;
  }
}

export function markBookedCallFired(bookingId: string): void {
  if (!bookingId) return;
  inMemoryFired.add(bookingId);
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEDUP_KEY_PREFIX + bookingId, String(Date.now()));
  } catch { /* no-op — in-memory set is the backstop */ }
}

/** Test-only reset. Does not touch localStorage. */
export function _resetInMemoryFiredForTest(): void {
  inMemoryFired.clear();
}

/* ─── SHA-256 helper for Enhanced Conversions ───────────────── */

async function sha256Hex(input: string): Promise<string> {
  const normalised = input.trim().toLowerCase();
  if (!normalised) return '';
  if (typeof crypto === 'undefined' || !crypto.subtle) return '';
  try {
    const bytes = new TextEncoder().encode(normalised);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

/** Normalises a phone to E.164-ish before hashing: strips every
 *  non-digit except a leading plus. Google's Enhanced Conversions
 *  spec expects E.164. Imperfect without a real libphonenumber,
 *  but better than hashing a free-form string. */
function normalisePhoneForHash(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return plus ? '+' + digits : digits;
}

/* ─── The one unified conversion emitter ────────────────────── */

export type BookingKind = 'setter' | 'closer';

export interface EmitBookedCallArgs {
  bookingType: BookingKind;
  bookingId: string;
  email: string;
  phone: string;
  leadScore?: number | null;
}

/** The single entry point every booking page uses to fire the
 *  Google Ads conversion. Idempotent per bookingId. Pushes a
 *  `booked_call` event into dataLayer with Enhanced Conversions
 *  user data hashed client-side; also fires the PostHog
 *  `booking_completed` event so our analytics stay consistent.
 *
 *  Returns true if this call actually fired, false if deduped. */
export async function emitBookedCallConversion(args: EmitBookedCallArgs): Promise<boolean> {
  if (!args.bookingId) return false;
  if (hasFiredBookedCallConversion(args.bookingId)) return false;

  const [sha256EmailAddress, sha256PhoneNumber] = await Promise.all([
    sha256Hex(args.email || ''),
    sha256Hex(normalisePhoneForHash(args.phone || '')),
  ]);

  // Mark BEFORE push so a racing second postMessage (same booking
  // id, same tab lifetime) can't slip through.
  markBookedCallFired(args.bookingId);

  // Google Ads Enhanced Conversions user data. The GTM operator
  // wires a Google Ads Conversion tag with:
  //   - transaction_id = {{DLV - booking_id}}      (dedup)
  //   - Enhanced Conversions = "Code" method, reading:
  //       sha256_email_address  = {{DLV - enhanced_conversion_data.sha256_email_address}}
  //       sha256_phone_number   = {{DLV - enhanced_conversion_data.sha256_phone_number}}
  const enhanced_conversion_data: Record<string, string> = {};
  if (sha256EmailAddress) enhanced_conversion_data.sha256_email_address = sha256EmailAddress;
  if (sha256PhoneNumber)  enhanced_conversion_data.sha256_phone_number  = sha256PhoneNumber;

  pushDataLayer('booked_call', {
    booking_id: args.bookingId,
    booking_type: args.bookingType,
    // Non-PII extras — safe to log, used by GTM for filtering.
    lead_score: args.leadScore ?? undefined,
    // One nested object so GTM reads the whole shape at once.
    enhanced_conversion_data,
  });

  // PostHog event — unchanged shape so existing insights continue
  // to work; booking_id is the only addition and is non-breaking.
  trackEvent('booking_completed', {
    booking_type: args.bookingType,
    booking_id: args.bookingId,
    lead_score: args.leadScore ?? undefined,
  });

  return true;
}
