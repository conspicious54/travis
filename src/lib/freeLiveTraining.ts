/* ───── /freelivetraining + /trainingregistered shared config ─────
   The two pages share the event instant, the title, and all date
   formatting so they can't drift apart. Change WEBINAR_START_ISO
   here once and both pages reflect the new time.
──────────────────────────────────────────────────────────────────── */

export const WEBINAR_TITLE = 'Turn Any Passion Into A Profitable Amazon Business';

// Specify the event in whatever timezone is most natural, as an ISO
// 8601 string with its UTC offset. Every visitor sees it converted
// to their own local timezone automatically.
//   Pacific  → "2026-05-22T10:00:00-07:00"
//   Eastern  → "2026-05-22T13:00:00-04:00"
//   UK (BST) → "2026-05-22T18:00:00+01:00"
//   UTC      → "2026-05-22T17:00:00Z"
// All four of the above describe the exact same instant.
export const WEBINAR_START_ISO = '2026-05-22T10:00:00-07:00';
export const WEBINAR_DURATION_MIN = 60;
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
