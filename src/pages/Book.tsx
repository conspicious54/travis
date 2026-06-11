import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { identifyUser, trackBookingPageViewed, trackBookingCompleted, trackEvent } from '../lib/posthog';
import { syncContactTimezone } from '../lib/syncTimezone';
import { persistUtmsFromUrl, syncContactUtms } from '../lib/syncUtm';
import { getCleanParam, getCleanIdentity } from '../lib/urlParams';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /book - embedded OnceHub closer scheduler ─────────────────
   The closer scheduler now runs on OnceHub (calendar BKC-Q45L7MVX52)
   instead of HubSpot's native meetings iframe - the closer team
   wanted OnceHub's scheduling UX + routing logic.

   Mirrors WebinarBook.tsx's identity/UTM/timezone/personalization
   wiring. On booking success the OnceHub payload's identity wins
   over URL/localStorage (visitor may have typed a different email
   into the booking form than they arrived with) and we redirect
   to /trainingnew/closer with the meeting details for the
   confirmation page to hydrate from.
────────────────────────────────────────────────────────────────── */

const ONCEHUB_CALENDAR_ID = 'BKC-Q45L7MVX52';
const STORAGE_KEY = 'pp_booking_data';
const REDIRECT_TO = '/trainingnew/closer';

function persistTypeformAnswers() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const data: Record<string, string> = {
    _captured_at: new Date().toISOString(),
  };
  // Identity fields use the canonical alias lookup - if URL has
  // ?email=_____&utm_email=real@x.com we want "real@x.com" stored
  // under the canonical "email" key.
  const id = getCleanIdentity(params);
  if (id.firstname) data.firstname = id.firstname;
  if (id.lastname)  data.lastname  = id.lastname;
  if (id.phone)     data.phone     = id.phone;
  if (id.email)     data.email     = id.email;
  // Non-identity Typeform answer fields - just placeholder-filter.
  for (const field of ['location', 'reason', 'tried', 'travis', 'value', 'money']) {
    const val = getCleanParam(params, field);
    if (val) data[field] = val;
  }
  if (Object.keys(data).length > 1) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* no-op */
    }
  }
}

/* OnceHub fires events as type: "oncehub.booking_calendar.<action>".
   Match broadly on any booking-related success terminology. */
function isOncehubBookingConfirmed(data: unknown): boolean {
  if (!data) return false;
  let typeStr = '';
  if (typeof data === 'string') {
    typeStr = data.toLowerCase();
  } else if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    typeStr = [
      typeof d.type === 'string' ? d.type : '',
      typeof d.eventType === 'string' ? d.eventType : '',
      typeof d.eventName === 'string' ? d.eventName : '',
    ].join(' ').toLowerCase();
  }
  if (!typeStr.includes('booking')) return false;
  return (
    typeStr.includes('confirmed') ||
    typeStr.includes('succeeded') ||
    typeStr.includes('success') ||
    typeStr.includes('complete') ||
    typeStr.includes('scheduled')
  );
}

function getOncehubPrefill(): { name?: string; email?: string; phone?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const id = getCleanIdentity(params);
  const rawName = getCleanParam(params, 'name') || getCleanParam(params, 'fullname') || getCleanParam(params, 'full_name');
  const name =
    rawName ||
    [id.firstname, id.lastname].filter(Boolean).join(' ').trim() ||
    id.firstname ||
    undefined;
  return {
    name: name || undefined,
    email: id.email || undefined,
    phone: id.phone || undefined,
  };
}

export function Book() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistTypeformAnswers();
    persistUtmsFromUrl();
    trackBookingPageViewed('closer');

    const params = new URLSearchParams(window.location.search);
    const id = getCleanIdentity(params);
    if (id.email) {
      identifyUser(id.email, {
        first_name: id.firstname ?? undefined,
        last_name: id.lastname ?? undefined,
        phone: id.phone ?? undefined,
      });
    }

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (!origin.includes('oncehub.com') && !origin.includes('scheduleonce.com')) {
        return;
      }

      // Diagnostic - log every OnceHub postMessage to PostHog so we can
      // refine isOncehubBookingConfirmed if a new event shape appears.
      let preview = '';
      try {
        preview = typeof event.data === 'string' ? event.data.slice(0, 800) : JSON.stringify(event.data).slice(0, 800);
      } catch { /* no-op */ }
      trackEvent('oncehub_postmessage_received', {
        booking_type: 'closer',
        origin,
        preview,
      });

      if (!isOncehubBookingConfirmed(event.data)) return;

      // eslint-disable-next-line no-console
      console.log('[OnceHub booking confirmed - closer]', event.data);

      trackBookingCompleted('closer');

      const urlParams = new URLSearchParams(window.location.search);
      const urlId = getCleanIdentity(urlParams);
      const rawName = getCleanParam(urlParams, 'name') || getCleanParam(urlParams, 'fullname') || '';

      let storedFirst = '';
      let storedLast  = '';
      let storedPhone = '';
      let storedEmail = '';
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          storedFirst = parsed?.firstname || '';
          storedLast  = parsed?.lastname  || '';
          storedPhone = parsed?.phone     || '';
          storedEmail = parsed?.email     || '';
        }
      } catch { /* no-op */ }

      let firstname = urlId.firstname || storedFirst || '';
      let lastname  = urlId.lastname  || storedLast  || '';
      if (!firstname && rawName) {
        const parts = rawName.split(/\s+/).filter(Boolean);
        firstname = parts[0] || '';
        if (!lastname && parts.length > 1) lastname = parts.slice(1).join(' ');
      }
      const bookingEmail = urlId.email || storedEmail || '';
      const bookingPhone = urlId.phone || storedPhone || '';

      // Pull whatever meeting details OnceHub's postMessage carries.
      // Field names from actual OnceHub booking.scheduled payload:
      //   starting_time, ending_time, subject, host, customer_*, ...
      // NOT start_time / end_time / etc.
      const payload: Record<string, unknown> =
        (typeof event.data === 'object' && event.data !== null
          ? ((event.data as Record<string, unknown>).payload as Record<string, unknown> | undefined) || (event.data as Record<string, unknown>)
          : {}) || {};
      const pickStr = (...keys: string[]): string => {
        for (const k of keys) {
          const v = payload[k];
          if (typeof v === 'string' && v.trim()) return v.trim();
          if (typeof v === 'number') return String(v);
        }
        return '';
      };
      const pickNested = (path: string[]): string => {
        let cur: unknown = payload;
        for (const seg of path) {
          if (!cur || typeof cur !== 'object') return '';
          cur = (cur as Record<string, unknown>)[seg];
        }
        return typeof cur === 'string' && cur.trim() ? cur.trim() : '';
      };
      const meetingStart =
        pickStr('starting_time', 'start_time', 'startTime', 'start', 'scheduled_at', 'scheduledAt') ||
        pickNested(['booking', 'starting_time']) ||
        pickNested(['event', 'starting_time']);
      const meetingEnd =
        pickStr('ending_time', 'end_time', 'endTime', 'end') ||
        pickNested(['booking', 'ending_time']) ||
        pickNested(['event', 'ending_time']);
      const meetingTitle =
        pickStr('subject', 'title', 'name', 'event_name') ||
        pickNested(['booking', 'subject']);
      const ownerName =
        pickStr('host_name', 'owner_name', 'organizer_name', 'organizer') ||
        pickNested(['host', 'name']) ||
        pickNested(['owner', 'name']);
      // OnceHub uses `virtual_or_physical_location` for the join URL.
      const joinUrl =
        pickStr('virtual_or_physical_location', 'join_url', 'joinUrl', 'meeting_url', 'video_url', 'conference_url', 'location') ||
        pickNested(['conference', 'join_url']) ||
        pickNested(['conference_details', 'join_url']);

      // OnceHub payload identity WINS over URL/localStorage - the visitor
      // could have arrived with one email and typed a different one into
      // the booking form. The OnceHub email is what created the HubSpot
      // contact + deal, so it's what /trainingnew/closer needs to find
      // the right record.
      const payloadEmail = pickStr('customer_email', 'attendee_email', 'guest_email') || pickNested(['customer', 'email']);
      const payloadFirst = pickStr('customer_first_name', 'attendee_first_name') || pickNested(['customer', 'first_name']);
      const payloadLast  = pickStr('customer_last_name', 'attendee_last_name')   || pickNested(['customer', 'last_name']);
      const payloadName  = pickStr('customer_name', 'attendee_name')              || pickNested(['customer', 'name']);
      const payloadPhone = pickStr('customer_phone', 'attendee_phone', 'phone')   || pickNested(['customer', 'phone']);

      let splitFirst = '';
      let splitLast  = '';
      if (payloadName && !payloadFirst && !payloadLast) {
        const parts = payloadName.split(/\s+/).filter(Boolean);
        splitFirst = parts[0] || '';
        if (parts.length > 1) splitLast = parts.slice(1).join(' ');
      }
      const finalEmail = payloadEmail || bookingEmail;
      const finalFirst = payloadFirst || splitFirst || firstname;
      const finalLast  = payloadLast  || splitLast  || lastname;
      const finalPhone = payloadPhone || bookingPhone;

      // Identify with the OnceHub-confirmed email so trackBookingCompleted
      // and downstream events are attributed to the right Person.
      if (finalEmail) {
        identifyUser(finalEmail, {
          first_name: finalFirst || undefined,
          last_name:  finalLast  || undefined,
          phone:      finalPhone || undefined,
        });
      }

      syncContactTimezone(finalEmail, 'book_redirect');
      syncContactUtms(finalEmail, 'book_redirect');

      const redirectParams = new URLSearchParams();
      if (finalEmail)   redirectParams.set('email',     finalEmail);
      if (finalFirst)   redirectParams.set('firstname', finalFirst);
      if (finalLast)    redirectParams.set('lastname',  finalLast);
      if (finalPhone)   redirectParams.set('phone',     finalPhone);
      if (meetingStart) redirectParams.set('start',     meetingStart);
      if (meetingEnd)   redirectParams.set('end',       meetingEnd);
      if (meetingTitle) redirectParams.set('title',     meetingTitle);
      if (ownerName)    redirectParams.set('owner',     ownerName);
      if (joinUrl)      redirectParams.set('join',      joinUrl);

      const target = redirectParams.toString()
        ? `${REDIRECT_TO}?${redirectParams.toString()}`
        : REDIRECT_TO;

      setTimeout(() => {
        window.location.href = target;
      }, 800);
    };

    window.addEventListener('message', handleMessage);

    // OnceHub's cdn.oncehub.com/cal/embed.js loader creates the iframe
    // inside any div with data-oh-booking-calendar-id. Inject once.
    const existing = document.querySelector('script[src*="cdn.oncehub.com/cal/embed.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://cdn.oncehub.com/cal/embed.js';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    // After embed.js mounts the iframe, append name/email/phone query
    // params to its src so OnceHub's booking form is pre-filled.
    const prefill = getOncehubPrefill();
    const hasPrefill = !!(prefill.name || prefill.email || prefill.phone);
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    if (hasPrefill) {
      let attempts = 0;
      const tryAddPrefill = (): boolean => {
        const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
        if (!iframe || !iframe.src) return false;
        try {
          const url = new URL(iframe.src);
          let changed = false;
          const setIfAbsent = (key: string, value: string) => {
            if (!url.searchParams.has(key)) {
              url.searchParams.set(key, value);
              changed = true;
            }
          };
          if (prefill.name) {
            setIfAbsent('name', prefill.name);
            const parts = prefill.name.split(/\s+/).filter(Boolean);
            if (parts[0]) setIfAbsent('first_name', parts[0]);
            if (parts.length > 1) setIfAbsent('last_name', parts.slice(1).join(' '));
          }
          if (prefill.email) {
            setIfAbsent('email', prefill.email);
          }
          if (prefill.phone) {
            setIfAbsent('phone', prefill.phone);
            setIfAbsent('mobile', prefill.phone);
            setIfAbsent('mobile_phone', prefill.phone);
            setIfAbsent('phone_number', prefill.phone);
            setIfAbsent('cellphone', prefill.phone);
            const e164 = prefill.phone.replace(/[\s()-]/g, '');
            if (e164 !== prefill.phone) {
              url.searchParams.set('phone', e164);
              url.searchParams.set('mobile', e164);
              url.searchParams.set('mobile_phone', e164);
              changed = true;
            }
          }
          if (changed) iframe.src = url.toString();
        } catch { /* no-op */ }
        return true;
      };
      pollHandle = setInterval(() => {
        attempts++;
        if (tryAddPrefill() || attempts > 60) {
          if (pollHandle) clearInterval(pollHandle);
        }
      }, 100);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollHandle) clearInterval(pollHandle);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white">
      {/* Step bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold ring-4 ring-orange-100">
                1
              </div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Book Call</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                2
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prepare</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Qualified celebration */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-green-700 mb-5">
            <CheckCircle className="w-3.5 h-3.5" />
            You Qualified
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.05] mb-4">
            Congrats - You're In.<br />
            <span className="text-orange-600">Now Pick Your Time.</span>
          </h1>

          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            You're about to get on a call with Travis or one of his top coaches.
          </p>
        </div>

        {/* Embedded OnceHub scheduler with framing */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <p className="text-xs md:text-sm font-bold text-gray-900">Pick a time below - spots fill up fast</p>
            </div>
            <div
              ref={containerRef}
              data-oh-booking-calendar-id={ONCEHUB_CALENDAR_ID}
              style={{ minWidth: 320, height: 700 }}
            />
          </div>
        </div>

        {/* Reassurance below the embed */}
        <div className="text-center mt-8 max-w-xl mx-auto">
          <p className="text-sm text-gray-500">
            After you book, you'll get a confirmation page with everything you need to prepare for your call - plus stories from real students who started exactly where you are.
          </p>
        </div>
      </div>
      <LegalDisclaimer />
    </div>
  );
}
