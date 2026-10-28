/* ───── /freelivetraining + /trainingregistered shared config ─────
   The two pages share the event instant, the title, and all date
   formatting so they can't drift apart. Change WEBINAR_START_ISO
   here once and both pages reflect the new time.
──────────────────────────────────────────────────────────────────── */

export const WEBINAR_TITLE = 'Turn Any Passion Into A Profitable Amazon Business';
export const WEBINAR_DURATION_MIN = 60;

/* ───── Session schedule ─────────────────────────────────────────
   Upcoming sessions as ISO 8601 strings in whatever timezone is
   most natural to you. Keep them in ascending order. Every visitor
   sees the time converted to their own local timezone automatically.

   The page displays the FIRST session whose end time (start +
   WEBINAR_DURATION_MIN) is still in the future, so a visitor who
   opens the page while a session is live still sees that one,
   not the next one. Once it ends, the page rolls to the next
   date on the next load.

   Timezone cheat sheet (US Pacific):
     PT during DST  (Mar-Nov):  "-07:00"  (PDT)
     PT standard   (Nov-Mar):   "-08:00"  (PST)
   DST ends in the US on the first Sunday of November, so Nov 2+
   is PST.
──────────────────────────────────────────────────────────────────── */
export const WEBINAR_SCHEDULE: readonly string[] = [
  '2026-11-02T15:30:00-08:00', // Monday,   Nov 2 2026, 3:30 PM PT
  '2026-11-05T15:30:00-08:00', // Thursday, Nov 5 2026, 3:30 PM PT
];

export function getNextWebinarStartIso(): string {
  const now = Date.now();
  const cushion = WEBINAR_DURATION_MIN * 60_000;
  const future = WEBINAR_SCHEDULE.find(
    (iso) => new Date(iso).getTime() + cushion > now,
  );
  return future ?? WEBINAR_SCHEDULE[WEBINAR_SCHEDULE.length - 1];
}

export const WEBINAR_START_ISO = getNextWebinarStartIso();
export const WEBINAR_JOIN_URL = 'https://www.youtube.com/watch?v=2Wx_YWBCiHo';
export const WEBINAR_DESCRIPTION =
  "Travis Marziani's live training: how he picks winning products, the launch playbook he uses, and how to avoid the most common mistakes new sellers make.";

export const ASSET_PREFIX = '/freelivetraining';

/* ───── Student result videos (used on the opt-in social proof) ─── */
export interface StudentResult { name: string; line: string; videoId: string; }
export const STUDENT_RESULTS: readonly StudentResult[] = [
  { name: 'Andrew',  line: 'Hit $330,000 in his first 12 months on Amazon',                                         videoId: 'IRb5EpPGnRU' },
  { name: 'Michael', line: 'Restated on Amazon with our method and crossed six figures in sales in 12 months.',     videoId: 'Vw9OrGVTGoI' },
  { name: 'Jenny',   line: 'Mom-owned brand that hit six figures in year one.',                                     videoId: 'u0uTL3662Ic' },
  { name: 'Alyssa',  line: 'Six figures in under a year as a first-time seller.',                                   videoId: 'TE9uGqS0tt0' },
];

/* ───── Confirmation page videos (lifted from the CF
         training-registered page HTML, in order) ──────────────────── */
export const CASE_STUDIES_VIDEOS: readonly string[] = [
  '2X10mIm5eXc', '9GSDrJRv2CE', 'SH24ylGlT8k', 'ix6rLsCJqeQ',
];
export const MORE_FREE_CONTENT_VIDEOS: readonly string[] = [
  'PM_CyzriPmY', 'Av7BW288eaI', 'exhbkCYzmKI',
];

/* ───── Date formatters ─────────────────────────────────────────── */

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// "FRIDAY MAY 22ND @1PM EDT" — uppercase banner, viewer-local
export function formatTopBanner(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric',
    timeZoneName: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const hour = (get('hour') + get('dayPeriod')).replace(/\s/g, '');
  return `${get('weekday').toUpperCase()} ${get('month').toUpperCase()} ${ordinal(Number(get('day')))} @${hour.toUpperCase()} ${get('timeZoneName')}`;
}

// "Friday, May 22nd // 1pm EDT (your local time)" — viewer-local caption
export function formatDateCaption(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const minute = get('minute');
  const timeStr = (minute === '00'
    ? get('hour') + get('dayPeriod')
    : get('hour') + ':' + minute + get('dayPeriod')
  ).replace(/\s/g, '').toLowerCase();
  return `${get('weekday')}, ${get('month')} ${ordinal(Number(get('day')))} // ${timeStr} ${get('timeZoneName')} (your local time)`;
}

export function formatHumanDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

/* ───── Google Calendar + .ics ──────────────────────────────────── */

export function buildGoogleCalendarUrl(start: Date, durationMin: number): string {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: WEBINAR_TITLE,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [WEBINAR_DESCRIPTION, WEBINAR_JOIN_URL ? `Join: ${WEBINAR_JOIN_URL}` : ''].filter(Boolean).join('\n\n'),
    location: WEBINAR_JOIN_URL || 'Online - link will be emailed before the training',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Outlook.com / Outlook on the web deep-link. Takes ISO datetimes
// directly (Microsoft prefers these) and opens the "new event" view
// with the fields prefilled.
export function buildOutlookLiveUrl(start: Date, durationMin: number): string {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const params = new URLSearchParams({
    path: '/calendar/0/action/compose',
    rru: 'addevent',
    subject: WEBINAR_TITLE,
    body: [WEBINAR_DESCRIPTION, WEBINAR_JOIN_URL ? `Join: ${WEBINAR_JOIN_URL}` : ''].filter(Boolean).join('\n\n'),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: WEBINAR_JOIN_URL || 'Online',
    allday: 'false',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/* ───── Email → calendar provider detection ──────────────────────
   Returns which provider to send the person to based on the domain
   of their email address. 'unknown' means we should show the full
   dropdown (Gmail / Apple / Outlook.com / .ics) instead.
──────────────────────────────────────────────────────────────────── */
export type CalProvider = 'google' | 'outlook' | 'apple' | 'unknown';

export function detectCalProvider(email: string | null | undefined): CalProvider {
  if (!email) return 'unknown';
  const m = email.toLowerCase().trim().match(/@([^@\s]+)$/);
  if (!m) return 'unknown';
  const domain = m[1];
  if (/^(gmail\.com|googlemail\.com)$/.test(domain)) return 'google';
  if (
    /^(outlook|hotmail|live|msn)\./.test(domain) ||
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'live.com' ||
    domain === 'msn.com' ||
    domain === 'office.com' ||
    domain.endsWith('.onmicrosoft.com')
  ) return 'outlook';
  if (/^(icloud\.com|me\.com|mac\.com)$/.test(domain)) return 'apple';
  return 'unknown';
}

export function buildIcs(start: Date, durationMin: number): string {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `webinar-${Date.now()}@passionproduct.com`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Passion Product//Webinar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${WEBINAR_TITLE.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${WEBINAR_DESCRIPTION.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`,
    `LOCATION:${(WEBINAR_JOIN_URL || 'Online - link will be emailed before the training').replace(/,/g, '\\,')}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Live training in 1 day', 'TRIGGER:-P1D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Live training in 1 hour', 'TRIGGER:-PT1H', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Live training starting now', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadIcs(start: Date, durationMin: number) {
  const ics = buildIcs(start, durationMin);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'passion-product-live-training.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───── Countdown ───────────────────────────────────────────────── */

export interface Countdown { d: number; h: number; m: number; s: number; past: boolean; }
export function calcCountdown(target: Date): Countdown {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    past: false,
  };
}
