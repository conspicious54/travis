import { useEffect } from 'react';

/* ───── booking relay ──────────────────────────────────────────────
   Stores Typeform answers in localStorage and forwards the user to
   the HubSpot scheduler with only the short fields in the URL.

   Long-form answers (reason, tried, travis, value, money, etc.)
   never touch the URL — they live in localStorage until the closer
   page reads them after booking.
────────────────────────────────────────────────────────────────── */

const HUBSPOT_BOOKING_URL = 'https://meetings-na2.hubspot.com/passionproduct/closer';

// Fields that get forwarded to HubSpot in the URL (short, safe to pass)
const HUBSPOT_FORWARD_FIELDS = ['firstname', 'lastname', 'phone', 'email'];

// All fields we capture and store in localStorage for the closer page
const ALL_CAPTURED_FIELDS = [
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

const STORAGE_KEY = 'pp_booking_data';

export function BookingRelay() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Capture every field we care about into a single object
    const data: Record<string, string> = {
      _captured_at: new Date().toISOString(),
    };
    for (const field of ALL_CAPTURED_FIELDS) {
      const val = params.get(field);
      if (val) data[field] = val;
    }

    // Persist to localStorage so the closer page can read it after HubSpot
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      // localStorage may be unavailable in private browsing — fail silently
      console.error('Failed to write booking relay data', err);
    }

    // Build the HubSpot URL with only the short fields
    const forwardParams = new URLSearchParams();
    for (const field of HUBSPOT_FORWARD_FIELDS) {
      const val = params.get(field);
      if (val) forwardParams.set(field, val);
    }

    const target = forwardParams.toString()
      ? `${HUBSPOT_BOOKING_URL}?${forwardParams.toString()}`
      : HUBSPOT_BOOKING_URL;

    // Forward immediately
    window.location.replace(target);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-white font-medium">Loading your booking...</p>
      </div>
    </div>
  );
}
