import { useEffect, useRef } from 'react';

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
        try {
          const payload = data.meetingsPayload || data.payload || data;
          localStorage.setItem(MEETING_KEY, JSON.stringify({
            ...payload,
            _captured_at: new Date().toISOString(),
          }));
        } catch {
          /* no-op */
        }
        // Small delay so the user briefly sees HubSpot's success state
        setTimeout(() => {
          window.location.href = REDIRECT_TO;
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-8">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            Step 1 of 2
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-3">
            Book Your <span className="text-orange-600">Strategy Call</span>
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            Pick a time that works for you. We'll see you there.
          </p>
        </div>

        <div
          ref={containerRef}
          className="meetings-iframe-container bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          data-src={buildEmbedUrl()}
        />
      </div>
    </div>
  );
}
