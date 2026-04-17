import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { identifyUser, trackBookingPageViewed, trackBookingCompleted } from '../lib/posthog';

/* ───── /book — embedded HubSpot closer scheduler ─────────────────
   Embeds the HubSpot meeting scheduler in an iframe and listens
   for the postMessage event HubSpot fires when a meeting is booked.

   On booking success, stores the full meeting payload in localStorage
   then redirects to /trainingnew/closer which reads it and personalizes
   the calendar button.

   Also reads any Typeform answers from the URL on load and persists
   them so the closer page can use them too.
────────────────────────────────────────────────────────────────── */

const HUBSPOT_EMBED_URL = 'https://meetings-na2.hubspot.com/passionproduct/closer?embed=true';
const STORAGE_KEY = 'pp_booking_data';
const MEETING_KEY = 'pp_meeting_data';
const REDIRECT_TO = '/trainingnew/closer';

const TYPEFORM_FIELDS = [
  'firstname',
  'lastname',
  'phone',
  'email',
  'location',
  'reason',
  'tried',
  'travis',
  'value',
  'money',
];

function persistTypeformAnswers() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const data: Record<string, string> = {
    _captured_at: new Date().toISOString(),
  };
  for (const field of TYPEFORM_FIELDS) {
    const val = params.get(field);
    if (val) data[field] = val;
  }
  // Only write if we actually have something to write — avoids
  // wiping previously persisted data on a refresh
  if (Object.keys(data).length > 1) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* no-op */
    }
  }
}

function buildEmbedUrl(): string {
  if (typeof window === 'undefined') return HUBSPOT_EMBED_URL;
  const params = new URLSearchParams(window.location.search);
  const forward = new URLSearchParams();
  // Forward only the short identity fields to pre-fill HubSpot's form
  for (const field of ['firstname', 'lastname', 'phone', 'email']) {
    const val = params.get(field);
    if (val) forward.set(field, val);
  }
  if (forward.toString() === '') return HUBSPOT_EMBED_URL;
  return `${HUBSPOT_EMBED_URL}&${forward.toString()}`;
}

export function Book() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistTypeformAnswers();
    trackBookingPageViewed('closer');

    // Identify user if we have their email
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
      identifyUser(email, {
        first_name: params.get('firstname') || undefined,
        last_name: params.get('lastname') || undefined,
        phone: params.get('phone') || undefined,
      });
    }

    // Listen for HubSpot's meeting booked postMessage
    const handleMessage = (event: MessageEvent) => {
      // HubSpot meeting events come from hubspot.com / hsforms.com / meetings.hubspot.com
      const origin = event.origin || '';
      if (
        !origin.includes('hubspot.com') &&
        !origin.includes('hsforms.com') &&
        !origin.includes('hsforms.net')
      ) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // HubSpot fires events with meetingBookSucceeded
      if (data.meetingBookSucceeded || data.eventName === 'meetingBookSucceeded') {
        const payload = data.meetingsPayload || data.payload || data;

        // eslint-disable-next-line no-console
        console.log('[HubSpot meetingBookSucceeded payload]', payload);
        // eslint-disable-next-line no-console
        console.log('[HubSpot payload JSON]', JSON.stringify(payload, null, 2));

        trackBookingCompleted('closer');

        /* ───── Documented HubSpot meetingsPayload shape ─────────────
         *   meetingsPayload.bookingResponse.event.dateString    (meeting start, ISO w/ time)
         *   meetingsPayload.bookingResponse.event.duration      (ms)
         *   meetingsPayload.bookingResponse.postResponse.organizer.name
         *   meetingsPayload.bookingResponse.postResponse.contact.{firstName, email}
         *
         * The Zoom / video URL is the HubSpot meeting's "location"
         * property. HubSpot does not include it in the postMessage
         * payload — it's only on the server side (CRM engagement
         * record). So we can't get it via iframe. Workaround: the same
         * user will receive HubSpot's calendar invite email which has
         * the Zoom link in it. We link them to "check email" for that.
         */
        const bookingResponse = payload?.bookingResponse || {};
        const eventData = bookingResponse.event || {};
        const postResponse = bookingResponse.postResponse || {};
        const organizer = postResponse.organizer || bookingResponse.organizer || {};
        const contact = postResponse.contact || bookingResponse.contact || {};

        // dateString is an ISO timestamp like "2026-04-23T19:00:00.000Z"
        // OR just a bare "2026-04-23" in some versions. Only trust it
        // if it has a time component.
        const hasTime = (v: unknown): v is string =>
          typeof v === 'string' && v.includes('T') && (v.includes(':') || /[Z+-]\d{2}/.test(v));

        let startMs: number | null = null;
        let startIso = '';
        if (hasTime(eventData.dateString)) {
          const d = new Date(eventData.dateString);
          if (!isNaN(d.getTime())) {
            startMs = d.getTime();
            startIso = d.toISOString();
          }
        } else if (typeof eventData.dateString === 'number') {
          // Some versions use epoch ms
          const d = new Date(eventData.dateString);
          if (!isNaN(d.getTime())) {
            startMs = d.getTime();
            startIso = d.toISOString();
          }
        }

        const duration = Number(eventData.duration) || 30 * 60 * 1000;
        const endMs = startMs !== null ? startMs + duration : null;
        const endIso = endMs !== null ? new Date(endMs).toISOString() : '';

        // Meeting owner is organizer.name per HubSpot's documented shape
        const ownerName = (organizer.name as string | undefined) || '';

        // ───── Look for the Zoom / video URL aggressively ───────────
        // Per HubSpot forums the meeting location is supposed to be
        // server-side only, but we'll scan the postMessage payload
        // thoroughly just in case it IS there under a field we don't
        // know about. Log everything so we can diagnose on real bookings.
        const allStrings: Array<{ path: string; value: string }> = [];
        const walkStrings = (obj: unknown, path: string) => {
          if (obj === null || obj === undefined) return;
          if (typeof obj === 'string') {
            allStrings.push({ path, value: obj });
            return;
          }
          if (typeof obj === 'object') {
            for (const k of Object.keys(obj as Record<string, unknown>)) {
              walkStrings((obj as Record<string, unknown>)[k], path ? `${path}.${k}` : k);
            }
          }
        };
        walkStrings(payload, '');

        const VIDEO_HOSTS = /(zoom\.us|meet\.google\.com|teams\.(microsoft|live)\.com|gotomeeting\.com|gotomeet\.me|webex\.com|whereby\.com|meet\.jit\.si|hubspot\.com\/meetings)/i;
        const joinUrlCandidates = allStrings.filter(s => VIDEO_HOSTS.test(s.value));
        const locationFields = allStrings.filter(s => /location/i.test(s.path));

        // eslint-disable-next-line no-console
        console.log('[HubSpot join URL candidates]', joinUrlCandidates);
        // eslint-disable-next-line no-console
        console.log('[HubSpot location-ish fields]', locationFields);

        let joinUrl = joinUrlCandidates[0]?.value || '';
        if (joinUrl && !/^https?:\/\//i.test(joinUrl)) {
          joinUrl = `https://${joinUrl}`;
        }

        // Build the redirect URL. If we don't have a real start timestamp,
        // DON'T pass start/end — confirmation page shows generic fallback.
        const redirectParams = new URLSearchParams();
        if (startIso) redirectParams.set('start', startIso);
        if (endIso) redirectParams.set('end', endIso);
        if (eventData.title) redirectParams.set('title', eventData.title as string);
        if (joinUrl) redirectParams.set('join', joinUrl);
        if (contact.firstName) redirectParams.set('firstname', contact.firstName);
        if (contact.lastName) redirectParams.set('lastname', contact.lastName);
        if (contact.email) redirectParams.set('email', contact.email);
        if (ownerName) redirectParams.set('owner', ownerName);

        const target = redirectParams.toString()
          ? `${REDIRECT_TO}?${redirectParams.toString()}`
          : REDIRECT_TO;

        setTimeout(() => {
          window.location.href = target;
        }, 800);
      }
    };

    window.addEventListener('message', handleMessage);

    // Inject HubSpot's embed loader script (idempotent)
    const existing = document.querySelector(
      'script[src*="MeetingsEmbedCode.js"]'
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
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
            Congrats — You're In.<br />
            <span className="text-orange-600">Now Pick Your Time.</span>
          </h1>

          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            You're about to get on a call with Travis or one of his top coaches.
          </p>
        </div>

        {/* Embedded scheduler with framing */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <p className="text-xs md:text-sm font-bold text-gray-900">Pick a time below — spots fill up fast</p>
            </div>
            <div
              ref={containerRef}
              className="meetings-iframe-container"
              data-src={buildEmbedUrl()}
            />
          </div>
        </div>

        {/* Reassurance below the embed */}
        <div className="text-center mt-8 max-w-xl mx-auto">
          <p className="text-sm text-gray-500">
            After you book, you'll get a confirmation page with everything you need to prepare for your call — plus stories from real students who started exactly where you are.
          </p>
        </div>
      </div>
    </div>
  );
}
