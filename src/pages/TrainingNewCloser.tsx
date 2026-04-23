import React, { useEffect, useState } from 'react';
import {
  ResearchVideo,
  TestimonialHighlights,
  SharedFooter,
  LowCapitalStrategies,
  CreditCardQuiz,
  ConfirmationExitPopup,
  MethodCheckIn,
  MeetYourCoach,
  NextStepsList,
  ConfirmationFAQ,
} from '../components/TrainingNewSections';
import { CheckCircle, Calendar, Phone, Star, Shield, ChevronDown, MessageSquare, MessageCircle } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';
import {
  identifyUser,
  setPersonProperties,
  trackConfirmationPageViewed,
  trackCalendarAdded,
  trackEvent,
} from '../lib/posthog';
import { detectRegion, PHONE_NUMBERS, type Region } from '../lib/regionPhone';
import { getCloserPhone } from '../lib/closerPhones';
import { PrepChecklistProvider, usePrepChecklist } from '../context/PrepChecklistContext';
import {
  useScrollDepth,
  useDwellHeartbeat,
  usePhoneCopyTracking,
  useConfirmAppSwitch,
  useSproutvideoTracking,
} from '../lib/confirmationTracking';

/* ───────────────────── closer-specific sections ──────────────────── */

function StepProgressBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booked</span>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold ring-4 ring-orange-100">
              2
            </div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Prepare</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── HubSpot meeting parsing + ICS generation ──────────────────── */

interface MeetingInfo {
  start: Date;
  end: Date;
  title: string;
  joinUrl: string;
  organizer: string;
  firstName: string;
  lastName: string;
  email: string;
  /** true if we couldn't verify the start time (partial hydration) */
  startUnknown?: boolean;
}

function parseDate(val: string | null): Date | null {
  if (!val) return null;
  if (/^\d+$/.test(val)) {
    const num = parseInt(val, 10);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/* Meeting info comes from URL params set by /book AFTER HubSpot's
   postMessage fires. That redirect is our only trusted source of truth.

   We refuse a bare date string like "2026-04-23" — JavaScript parses
   that as midnight UTC which displays wrong in local time. Only a full
   ISO timestamp (with a T and a time component) is acceptable. */
function parseMeetingInfo(): MeetingInfo | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);

  const rawStart = p.get('start');
  if (!rawStart || !isFullTimestamp(rawStart)) {
    // eslint-disable-next-line no-console
    console.log('[confirmation] Rejected meeting time. start param =', rawStart, '— not a full timestamp. Showing generic fallback.');
    return null;
  }

  const start = parseDate(rawStart);
  if (!start) return null;

  const rawEnd = p.get('end');
  const end =
    rawEnd && isFullTimestamp(rawEnd)
      ? parseDate(rawEnd) || new Date(start.getTime() + 30 * 60 * 1000)
      : new Date(start.getTime() + 30 * 60 * 1000);

  return {
    start,
    end,
    title: p.get('title') || 'Amazon Strategy Call with Passion Product',
    joinUrl: p.get('join') || '',
    organizer: p.get('owner') || p.get('organizer') || 'Passion Product Team',
    firstName: p.get('firstname') || p.get('first_name') || p.get('firstName') || '',
    lastName: p.get('lastname') || p.get('last_name') || p.get('lastName') || '',
    email: p.get('email') || '',
  };
}

function isFullTimestamp(v: string): boolean {
  if (!v) return false;
  // Must have "T" AND either ":" for time or a Z/timezone offset
  return v.includes('T') && (v.includes(':') || /[Z+-]\d{2}/.test(v));
}

function getEmailFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('email') || p.get('Email') || '';
}

/* Ask the HubSpot-backed lookup function for anything missing — most
   importantly the Zoom join URL, but also confirmed start/end time
   and owner name if they weren't in the URL. URL params always win
   over the lookup so we never overwrite verified data. */
interface LookupResponse {
  found?: boolean;
  startIso?: string;
  endIso?: string;
  title?: string;
  joinUrl?: string;
  ownerName?: string;
  firstName?: string;
  lastName?: string;
}

async function hydrateFromHubSpot(
  email: string,
  urlMeeting: MeetingInfo | null
): Promise<MeetingInfo | null> {
  // Short retry loop — HubSpot sometimes indexes a new appointment a
  // couple of seconds after the booking completes.
  const attemptDelaysMs = [0, 2000, 5000];

  for (const delay of attemptDelaysMs) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    let data: LookupResponse | null = null;
    try {
      const res = await fetch(
        `/.netlify/functions/meeting-lookup?email=${encodeURIComponent(email)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) continue;
      data = (await res.json()) as LookupResponse;
      // eslint-disable-next-line no-console
      console.log('[confirmation] hubspot lookup response', data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[confirmation] hubspot lookup error', err);
      continue;
    }

    if (!data?.found) continue;

    // Merge: URL params win for every field they already have a value
    // for. Lookup only supplies what's missing.
    const start =
      urlMeeting?.start ||
      (data.startIso ? parseDate(data.startIso) : null);

    // If we got a joinUrl or ownerName but no start time, still return
    // a partial MeetingInfo using "now" as a placeholder so the banner
    // can render the Zoom button. The banner uses startUnknown flag to
    // avoid displaying a fake time.
    if (!start && !data.joinUrl && !data.ownerName) {
      continue; // nothing useful — try next retry
    }

    const safeStart = start || new Date();
    const end =
      urlMeeting?.end ||
      (data.endIso ? parseDate(data.endIso) : null) ||
      new Date(safeStart.getTime() + 30 * 60 * 1000);

    const merged: MeetingInfo = {
      start: safeStart,
      end,
      title: urlMeeting?.title || data.title || 'Amazon Strategy Call with Passion Product',
      joinUrl: urlMeeting?.joinUrl || data.joinUrl || '',
      organizer: urlMeeting?.organizer || data.ownerName || 'Passion Product Team',
      firstName: urlMeeting?.firstName || data.firstName || '',
      lastName: urlMeeting?.lastName || data.lastName || '',
      email: urlMeeting?.email || email,
      startUnknown: !start,
    };
    return merged;
  }
  return null;
}

/* localStorage data persisted by the booking-relay page before HubSpot */
interface BookingRelayData {
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  location?: string;
  reason?: string;
  tried?: string;
  travis?: string;
  value?: string;
  money?: string;
  _captured_at?: string;
}

function getRelayData(): BookingRelayData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('pp_booking_data');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/* Meeting time display is DISABLED until we verify HubSpot's actual
   payload shape. Showing a wrong time is worse than showing no time.

   To turn back on:
   1. Do a test booking on /book with DevTools Console open
   2. Copy the object logged as "[HubSpot meetingBookSucceeded payload]"
   3. Map those real fields into the parser below
   4. Re-enable by returning the parsed MeetingInfo

   Until then, we always return null so the banner falls back to the
   generic "Check your email for the calendar invite" message. */
function getMeetingFromStorage(): MeetingInfo | null {
  // Wipe any stale meeting data on every confirmation page load so old
  // bookings can never leak into the UI.
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('pp_meeting_data');
    } catch {
      /* no-op */
    }
  }
  return null;
}

function getFirstName(): string {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return (
    p.get('first_name') ||
    p.get('firstName') ||
    p.get('firstname') ||
    getRelayData().firstname ||
    ''
  );
}

function formatForICS(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escape text for RFC 5545 ICS property values
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildICS(m: MeetingInfo): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@passionproduct.com`;
  const now = formatForICS(new Date());

  const descriptionParts = [
    'Your personalized Amazon FBA strategy session with the Passion Product team.',
    '',
    m.joinUrl ? `Join link: ${m.joinUrl}` : '',
    '',
    'Come ready with your goals, budget, and any questions about your Amazon journey.',
  ].filter(Boolean);
  const description = escapeIcsText(descriptionParts.join('\n'));

  const location = m.joinUrl || 'Video Call';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Passion Product//Strategy Call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatForICS(m.start)}`,
    `DTEND:${formatForICS(m.end)}`,
    `SUMMARY:${escapeIcsText(m.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcsText(location)}`,
    // URL property makes many calendar apps render the join link as a clickable button
    m.joinUrl ? `URL:${m.joinUrl}` : '',
    `ORGANIZER;CN=${escapeIcsText(m.organizer)}:MAILTO:team@passionproduct.com`,
    m.email ? `ATTENDEE;CN=${escapeIcsText(`${m.firstName} ${m.lastName}`.trim())};RSVP=TRUE:MAILTO:${m.email}` : '',
    'STATUS:CONFIRMED',
    // Multiple reminder alarms — calendar apps honor these automatically
    // Google Calendar's URL params don't support reminders, but an ICS
    // file with VALARM blocks does. Apple Calendar, Outlook, and Google
    // (when importing an ICS) all respect these triggers.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Strategy call in 1 day',
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Strategy call in 1 hour',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Strategy call in 15 minutes',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Strategy call starting now',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

function downloadICS(m: MeetingInfo) {
  const ics = buildICS(m);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'passion-product-strategy-call.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───── calendar provider URL builders ──────────────────────────── */

function formatForGoogle(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildGoogleUrl(m: MeetingInfo): string {
  const description = [
    'Your personalized Amazon FBA strategy session with the Passion Product team.',
    '',
    m.joinUrl ? `Join link: ${m.joinUrl}` : '',
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: m.title,
    dates: `${formatForGoogle(m.start)}/${formatForGoogle(m.end)}`,
    details: description,
    location: m.joinUrl || 'Video Call',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookWebUrl(m: MeetingInfo): string {
  const description = [
    'Your personalized Amazon FBA strategy session with the Passion Product team.',
    m.joinUrl ? `Join link: ${m.joinUrl}` : '',
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: m.title,
    body: description,
    startdt: m.start.toISOString(),
    enddt: m.end.toISOString(),
    location: m.joinUrl || 'Video Call',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildYahooUrl(m: MeetingInfo): string {
  const params = new URLSearchParams({
    v: '60',
    title: m.title,
    st: formatForGoogle(m.start),
    et: formatForGoogle(m.end),
    desc: m.joinUrl ? `Join link: ${m.joinUrl}` : '',
    in_loc: m.joinUrl || 'Video Call',
  });
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/* ───── CalendarButton dropdown component ──────────────────────── */

function CalendarButton({ meeting, variant = 'primary' }: { meeting: MeetingInfo; variant?: 'primary' | 'cta' }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [isOpen]);

  const buttonClasses = variant === 'cta'
    ? 'inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/30 cursor-pointer text-sm'
    : 'inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm cursor-pointer';

  const options = [
    { label: 'Google Calendar', action: () => window.open(buildGoogleUrl(meeting), '_blank', 'noopener,noreferrer') },
    { label: 'Apple Calendar', action: () => downloadICS(meeting) },
    { label: 'Outlook (Web)', action: () => window.open(buildOutlookWebUrl(meeting), '_blank', 'noopener,noreferrer') },
    { label: 'Outlook (Desktop)', action: () => downloadICS(meeting) },
    { label: 'Yahoo Calendar', action: () => window.open(buildYahooUrl(meeting), '_blank', 'noopener,noreferrer') },
    { label: 'Other (.ics file)', action: () => downloadICS(meeting) },
  ];

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <Calendar className="w-4 h-4" />
        Add to My Calendar
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                opt.action();
                trackCalendarAdded(opt.label);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 font-medium hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatHumanDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHumanTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function CloserConfirmationBanner({ meeting, firstName }: { meeting: MeetingInfo | null; firstName: string }) {
  const [region, setRegion] = useState<Region>('us');
  const { markDone } = usePrepChecklist();

  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  // Look up the specific Kixie line for this meeting's owner and the
  // visitor's region. Falls back to the default regional number if the
  // owner isn't mapped or has no number for this region.
  const phone = getCloserPhone(meeting?.organizer, region);
  const whatsappNumber = phone.raw.replace(/[^\d]/g, '');

  // Build a confirmation message body that includes the exact booked
  // time (if we have a verified meeting time) and the person's full
  // name. Falls back to a simple message when those aren't available.
  const fullName = [
    meeting?.firstName || firstName,
    meeting?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Resolve the booked coach's first name so the confirmation text opens
  // with "Hi Coach <Name>" — lets the coach auto-identify who's texting.
  // Falls back to Jesse when HubSpot hasn't returned an owner or the
  // owner is still the generic "Passion Product Team" placeholder.
  const coachFirstName = (() => {
    const organizer = meeting?.organizer?.trim();
    if (!organizer || organizer === 'Passion Product Team') return 'Jesse';
    return organizer.split(/\s+/)[0] || 'Jesse';
  })();

  const confirmationBody = (() => {
    const hasRealTime = meeting && !meeting.startUnknown;
    const namePart = fullName ? ` - ${fullName}` : '';
    if (hasRealTime) {
      const when = `${formatHumanDate(meeting.start)} at ${formatHumanTime(meeting.start)}`;
      return `Hi Coach ${coachFirstName}, YES, I'm confirming my call on ${when}${namePart}`;
    }
    return `Hi Coach ${coachFirstName}, YES, I'm confirming my call${namePart}`;
  })();

  const smsBody = encodeURIComponent(confirmationBody);
  const whatsappBody = encodeURIComponent(confirmationBody);

  usePhoneCopyTracking(phone.display, 'closer', region);
  const armAppSwitch = useConfirmAppSwitch('closer');

  const handleConfirmText = () => {
    trackEvent('closer_confirm_text_clicked', {
      region,
      owner: meeting?.organizer || null,
      coach_first_name: coachFirstName,
      phone: phone.raw,
    });
    setPersonProperties({
      coach_first_name: coachFirstName,
      coach_full_name: meeting?.organizer || null,
      confirmed_via: 'sms',
    });
    armAppSwitch('sms', coachFirstName);
    markDone('microAsk');
  };

  const handleConfirmWhatsapp = () => {
    trackEvent('closer_confirm_whatsapp_clicked', {
      region,
      owner: meeting?.organizer || null,
      coach_first_name: coachFirstName,
      phone: phone.raw,
    });
    setPersonProperties({
      coach_first_name: coachFirstName,
      coach_full_name: meeting?.organizer || null,
      confirmed_via: 'whatsapp',
    });
    armAppSwitch('whatsapp', coachFirstName);
    markDone('microAsk');
  };

  const handleRegionOverride = (r: Region) => {
    setRegion(r);
    trackEvent('wrong_region_clicked', { faq_location: 'closer', from: region, to: r });
  };

  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-10 md:pt-14 md:pb-14 text-center">
        {/* Checkmark badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 border-2 border-green-300 mb-6">
          <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600" strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1] mb-4">
          {firstName ? `You're Booked, ${firstName}.` : "You're Booked."}
        </h1>

        <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto mb-3 leading-snug">
          {meeting ? (
            <>
              Your strategy call
              {meeting.organizer && meeting.organizer !== 'Passion Product Team' ? (
                <> with <span className="font-bold text-gray-900">{meeting.organizer}</span></>
              ) : null}
              {' '}is on{' '}
              <span className="font-bold text-gray-900">{formatHumanDate(meeting.start)}</span>
              {' at '}
              <span className="font-bold text-gray-900">{formatHumanTime(meeting.start)}</span>.
            </>
          ) : (
            'Your strategy call with Travis or one of his top coaches is scheduled.'
          )}
        </p>
        <p className="text-sm md:text-base text-gray-500 mb-10">
          Check your email for the calendar invite. It has your exact date, time, and Zoom link.
        </p>

        {/* Micro-ask: confirm via text or WhatsApp */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
          <p className="text-base md:text-lg font-bold text-gray-900 mb-4 max-w-lg mx-auto">
            To confirm you'll attend, tap one of the buttons below and hit send:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-lg mx-auto">
            <a
              href={`sms:${phone.raw}?&body=${smsBody}`}
              onClick={handleConfirmText}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Confirm via Text
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappBody}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleConfirmWhatsapp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm via WhatsApp
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Takes 10 seconds.{' '}
            <span className="text-gray-500">
              Wrong region?{' '}
              {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map((r, i) => (
                <span key={r}>
                  {i > 0 && <span className="text-gray-300">/</span>}{' '}
                  <button
                    onClick={() => handleRegionOverride(r)}
                    className="text-orange-500 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
                  >
                    {PHONE_NUMBERS[r].label}
                  </button>
                </span>
              ))}
            </span>
          </p>
        </div>

        {/* Transition to next section */}
        <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.15em] mt-10">
          Then do these two things before your call ↓
        </p>

        {/* Calendar add below — secondary micro-ask */}
        {meeting && (
          <div className="mt-5">
            <CalendarButton meeting={meeting} variant="primary" />
          </div>
        )}
      </div>
    </div>
  );
}

function CloserFinalCTA({ meeting, firstName }: { meeting: MeetingInfo | null; firstName: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {firstName ? `${firstName}, you've taken the ` : "You've Already Taken the "}
          <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          You booked the call. Now show up ready, and let's build your plan together.
        </p>

        {/* Email check-in callout */}
        <div className="bg-white/5 backdrop-blur-sm border border-orange-400/40 rounded-2xl p-5 md:p-6 max-w-xl mx-auto mb-10 text-left">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-300 text-lg">📩</span>
            </div>
            <div className="flex-1">
              <p className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-1">
                Check your email
              </p>
              <p className="text-white font-bold text-base md:text-lg leading-snug mb-2">
                Look for an email titled <span className="text-orange-300">"I need to tell you something before your call"</span>
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                It has important info for your call. Open it, read it, and you'll be ready to go.
              </p>
            </div>
          </div>
        </div>

        {meeting && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <CalendarButton meeting={meeting} variant="cta" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-orange-400" /> 14,000+ students taught</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function TrainingNewCloser() {
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [firstName, setFirstName] = useState('');
  const [p, setP] = useState<Personalization | null>(null);

  useScrollDepth('closer');
  useDwellHeartbeat('closer');
  useSproutvideoTracking('closer');

  useEffect(() => {
    const urlMeeting = parseMeetingInfo();
    setMeeting(urlMeeting);

    const personalization = getPersonalization();
    setP(personalization);
    setFirstName(personalization.firstName || urlMeeting?.firstName || getFirstName());

    // Fill in ANY missing fields (start time, Zoom URL, owner) from
    // HubSpot via the meeting-lookup Netlify function. URL params are
    // the source of truth; we only call the API for what's missing.
    const email = urlMeeting?.email || personalization.email || getEmailFromUrl();
    if (email) {
      hydrateFromHubSpot(email, urlMeeting).then((hydrated) => {
        if (hydrated) setMeeting(hydrated);
      });
    }

    // PostHog: identify + track
    if (personalization.email) {
      identifyUser(personalization.email, {
        first_name: personalization.firstName,
        last_name: personalization.lastName,
      });
    }
    setPersonProperties({
      region: personalization.region,
      reason: personalization.reason,
      situation: personalization.situation,
      travis_history: personalization.travisHistory,
      valued_feature: personalization.valuedFeature,
      capital: personalization.capital,
    });
    trackConfirmationPageViewed('closer', {
      region: personalization.region,
      reason: personalization.reason,
      situation: personalization.situation,
      capital: personalization.capital,
      has_meeting: !!urlMeeting,
    });
  }, []);

  return (
    <PrepChecklistProvider>
      <div className="min-h-screen bg-white text-gray-900">
        <CloserConfirmationBanner meeting={meeting} firstName={firstName} />
        <ResearchVideo />
        <NextStepsList microAskLabel="Confirm via Text or WhatsApp (above)" />
        <TestimonialHighlights p={p} />
        <MethodCheckIn />
        <MeetYourCoach ownerName={meeting?.organizer} />
        <LowCapitalStrategies p={p} />
        <CreditCardQuiz p={p} />
        <CloserFinalCTA meeting={meeting} firstName={firstName} />
        <ConfirmationFAQ p={p} location="closer" />
        <SharedFooter />
        <ConfirmationExitPopup />
      </div>
    </PrepChecklistProvider>
  );
}
