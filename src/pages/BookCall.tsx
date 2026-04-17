import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { identifyUser, trackBookingPageViewed, trackBookingCompleted } from '../lib/posthog';

/* ───── /bookacall — embedded HubSpot setter scheduler ─────────────
   Same flow as /book but for the setter team. Captures the booking
   payload in localStorage and redirects to /trainingnew/setter.
────────────────────────────────────────────────────────────────── */

const HUBSPOT_EMBED_URL = 'https://meetings-na2.hubspot.com/passionproduct/introduction?embed=true';
const STORAGE_KEY = 'pp_booking_data';
const MEETING_KEY = 'pp_meeting_data';
const REDIRECT_TO = '/trainingnew/setter';

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
  for (const field of ['firstname', 'lastname', 'phone', 'email']) {
    const val = params.get(field);
    if (val) forward.set(field, val);
  }
  if (forward.toString() === '') return HUBSPOT_EMBED_URL;
  return `${HUBSPOT_EMBED_URL}&${forward.toString()}`;
}

export function BookCall() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistTypeformAnswers();
    trackBookingPageViewed('setter');

    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
      identifyUser(email, {
        first_name: params.get('firstname') || undefined,
        last_name: params.get('lastname') || undefined,
        phone: params.get('phone') || undefined,
      });
    }

    const handleMessage = (event: MessageEvent) => {
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

      if (data.meetingBookSucceeded || data.eventName === 'meetingBookSucceeded') {
        const payload = data.meetingsPayload || data.payload || data;

        // eslint-disable-next-line no-console
        console.log('[HubSpot meetingBookSucceeded payload - setter]', payload);

        trackBookingCompleted('setter');

        // Setter is a PHONE CALL, not a video meeting. Only carry the
        // contact info forward. No start time, no join URL, no calendar
        // event. The setter page relies on phone-number contact saving,
        // not meeting details.
        const contact =
          payload?.bookingResponse?.postResponse?.contact ||
          payload?.bookingResponse?.contact ||
          payload?.contact ||
          {};

        const redirectParams = new URLSearchParams();
        if (contact.firstName) redirectParams.set('firstname', contact.firstName);
        if (contact.email) redirectParams.set('email', contact.email);

        const target = redirectParams.toString()
          ? `${REDIRECT_TO}?${redirectParams.toString()}`
          : REDIRECT_TO;

        setTimeout(() => {
          window.location.href = target;
        }, 800);
      }
    };

    window.addEventListener('message', handleMessage);

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
