import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { identifyUser, trackBookingPageViewed, trackBookingCompleted, trackEvent } from '../lib/posthog';
import { syncContactTimezone } from '../lib/syncTimezone';
import { persistUtmsFromUrl, syncContactUtms } from '../lib/syncUtm';
import { getCleanIdentity, getCleanParam } from '../lib/urlParams';

/* ───── /webinar/book - embedded OnceHub closer scheduler ─────────
   Webinar funnel equivalent of /book. Mirrors all the same identity,
   UTM, timezone, and personalization wiring - just swaps the HubSpot
   meeting iframe for OnceHub's BKC-PD5R78Y35W booking calendar.

   OnceHub fires postMessage events from cdn.oncehub.com when a
   booking is confirmed. The exact event shape isn't as well-doc'd as
   HubSpot's so we defensively match on multiple known patterns AND
   log every OnceHub message as a diagnostic event so we can refine
   detection if anything slips through.
────────────────────────────────────────────────────────────────── */

const ONCEHUB_CALENDAR_ID = 'BKC-PD5R78Y35W';
const STORAGE_KEY = 'pp_booking_data';
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
  const id = getCleanIdentity(params);
  if (id.firstname) data.firstname = id.firstname;
  if (id.lastname)  data.lastname  = id.lastname;
  if (id.phone)     data.phone     = id.phone;
  if (id.email)     data.email     = id.email;
  for (const field of TYPEFORM_FIELDS) {
    if (data[field]) continue;
    const val = params.get(field);
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

/* OnceHub fires events as type: "oncehub.booking_calendar.<action>",
   confirmed from diagnostic events. We've observed `loaded` and
   `time_slot_selected` so far. Booking confirmation will be a similar
   pattern. Match broadly on any booking-related success terminology. */
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

/* OnceHub URL prefill - the iframe URL accepts ?name=&email=&phone=
   query params. Build the prefill value set from getCleanIdentity
   (which handles all the URL-alias slots) PLUS a `name` alias since
   some upstream tools send a single full-name field. */
function getOncehubPrefill(): { name?: string; email?: string; phone?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  // getCleanIdentity covers email / firstname / lastname / phone across
  // all the alias slots and strips "_____" placeholders. Some upstream
  // tools (and the user's test URL) send a single full-name field via
  // `name`/`fullname`, so handle that explicitly as a fallback to
  // assembling firstname + lastname.
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

export function WebinarBook() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistTypeformAnswers();
    persistUtmsFromUrl();
    trackBookingPageViewed('webinar_closer');

    // Identify if email arrived via URL (Typeform redirect, AC email, etc.)
    const params = new URLSearchParams(window.location.search);
    const id = getCleanIdentity(params);
    if (id.email) {
      identifyUser(id.email, {
        first_name: id.firstname ?? undefined,
        last_name:  id.lastname  ?? undefined,
        phone:      id.phone     ?? undefined,
      });
    }

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (!origin.includes('oncehub.com') && !origin.includes('scheduleonce.com')) {
        return;
      }

      // Diagnostic: log every OnceHub postMessage to PostHog so we can
      // see what events actually fire and refine isOncehubBookingConfirmed
      // if a new event shape ever shows up.
      let preview = '';
      try {
        preview = typeof event.data === 'string' ? event.data.slice(0, 200) : JSON.stringify(event.data).slice(0, 200);
      } catch { /* no-op */ }
      trackEvent('oncehub_postmessage_received', {
        booking_type: 'webinar_closer',
        origin,
        preview,
      });

      if (!isOncehubBookingConfirmed(event.data)) return;

      // eslint-disable-next-line no-console
      console.log('[OnceHub booking confirmed - webinar closer]', event.data);

      trackBookingCompleted('webinar_closer');

      // OnceHub postMessage payloads don't reliably carry the booker's
      // email back to the parent window, so fall back to whatever we
      // captured at page load via getCleanIdentity (URL params / Garlic
      // from a prior CF page).
      const bookingEmail =
        getCleanIdentity(new URLSearchParams(window.location.search)).email ||
        (() => {
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              return parsed?.email || '';
            }
          } catch { /* no-op */ }
          return '';
        })() ||
        '';

      syncContactTimezone(bookingEmail, 'webinar_book_redirect');
      syncContactUtms(bookingEmail, 'webinar_book_redirect');

      const redirectParams = new URLSearchParams();
      if (bookingEmail) redirectParams.set('email', bookingEmail);
      // Tag the destination so the confirmation page knows this was a
      // webinar booking, in case it ever needs different copy/tracking.
      redirectParams.set('source', 'webinar');

      const target = redirectParams.toString()
        ? `${REDIRECT_TO}?${redirectParams.toString()}`
        : REDIRECT_TO;

      setTimeout(() => {
        window.location.href = target;
      }, 800);
    };

    window.addEventListener('message', handleMessage);

    // Restore the ORIGINAL embed script - the cdn.oncehub.com loader
    // is what creates the working iframe. Don't touch it.
    const existing = document.querySelector('script[src*="cdn.oncehub.com/cal/embed.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://cdn.oncehub.com/cal/embed.js';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    // After embed.js creates the iframe inside our container, append
    // OnceHub's name/email/phone prefill query params to the iframe's
    // own src. This is additive - we don't change the iframe URL itself,
    // just add query params that OnceHub's booking page reads.
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
          if (prefill.name  && !url.searchParams.has('name'))  { url.searchParams.set('name',  prefill.name);  changed = true; }
          if (prefill.email && !url.searchParams.has('email')) { url.searchParams.set('email', prefill.email); changed = true; }
          if (prefill.phone && !url.searchParams.has('phone')) { url.searchParams.set('phone', prefill.phone); changed = true; }
          if (changed) iframe.src = url.toString();
        } catch { /* no-op */ }
        return true;
      };
      // Poll briefly for the iframe to appear, then stop.
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
    </div>
  );
}
