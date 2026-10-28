import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar, CheckCircle, ArrowRight, BookmarkPlus,
  Youtube, Video, AlertTriangle, Wifi, MonitorSmartphone, Clock,
} from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { getCountry, type CountryInfo } from '../lib/detectCountry';
import { COUNTRY_DIAL, DEFAULT_DIAL, findDialByCountryCode, composePhone, type DialCountry } from '../lib/dialCountries';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /freelivetraining — strict ClickFunnels port ─────────────
   Word-for-word, section-for-section replica of the CF webinar
   opt-in Travis is moving off. Submits through the shared
   /register-webinar bridge, same as /live-training.
──────────────────────────────────────────────────────────────────── */

const WEBINAR_TITLE = 'Turn Any Passion Into A Profitable Amazon Business';
// Specify the event in whatever timezone is most natural, as an ISO
// 8601 string with its UTC offset. Every visitor on the page will see
// this converted to their own local timezone automatically.
//   Pacific  → "2026-05-22T10:00:00-07:00"
//   Eastern  → "2026-05-22T13:00:00-04:00"
//   UK (BST) → "2026-05-22T18:00:00+01:00"
//   UTC      → "2026-05-22T17:00:00Z"
// All four of the above describe the exact same instant.
const WEBINAR_START_ISO = '2026-05-22T10:00:00-07:00';
const WEBINAR_DURATION_MIN = 60;
const WEBINAR_JOIN_URL = 'https://www.youtube.com/watch?v=2Wx_YWBCiHo';
const WEBINAR_DESCRIPTION =
  "Travis Marziani's live training: how he picks winning products, the launch playbook he uses, and how to avoid the most common mistakes new sellers make.";

const ASSET = '/freelivetraining';

// Student result YouTube IDs lifted verbatim from the CF HTML.
const STUDENT_RESULTS: Array<{ name: string; line: string; videoId: string }> = [
  { name: 'Andrew',  line: 'Hit $330,000 in his first 12 months on Amazon',                                        videoId: 'IRb5EpPGnRU' },
  { name: 'Michael', line: 'Restated on Amazon with our method and crossed six figures in sales in 12 months.',    videoId: 'Vw9OrGVTGoI' },
  { name: 'Jenny',   line: 'Mom-owned brand that hit six figures in year one.',                                    videoId: 'u0uTL3662Ic' },
  { name: 'Alyssa',  line: 'Six figures in under a year as a first-time seller.',                                  videoId: 'TE9uGqS0tt0' },
];

// Confirmation-page sidebar videos. Pre-filled with the four student
// result IDs we lifted from the CF HTML; swap for the real CF
// confirmation-page video IDs when you have them.
const CASE_STUDIES_VIDEOS: readonly string[] = [
  'IRb5EpPGnRU', 'Vw9OrGVTGoI', 'u0uTL3662Ic', 'TE9uGqS0tt0',
];
const MORE_FREE_CONTENT_VIDEOS: readonly string[] = [
  // TODO: replace with the real "More Free Content" video IDs
  // from the CF confirmation page.
  'IRb5EpPGnRU', 'Vw9OrGVTGoI', 'u0uTL3662Ic',
];

interface Countdown { d: number; h: number; m: number; s: number; past: boolean; }
function calcCountdown(target: Date): Countdown {
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

function emailFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return getCleanIdentity(new URLSearchParams(window.location.search)).email || '';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatHumanDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function formatHumanTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

// Browser Intl defaults to the visitor's local timezone when no
// `timeZone` is passed, so these two formatters auto-convert the
// shared WEBINAR_START_ISO instant for whoever is viewing.

// "FRIDAY MAY 22ND @1PM EDT" — uppercase banner, viewer-local
function formatTopBanner(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric',
    timeZoneName: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const hour = (get('hour') + get('dayPeriod')).replace(/\s/g, '');
  return `${get('weekday').toUpperCase()} ${get('month').toUpperCase()} ${ordinal(Number(get('day')))} @${hour.toUpperCase()} ${get('timeZoneName')}`;
}

// "Friday, May 22nd // 1pm EDT (your local time)" — viewer-local caption
function formatDateCaption(d: Date): string {
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

function buildGoogleCalendarUrl(start: Date, durationMin: number): string {
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

function buildIcs(start: Date, durationMin: number): string {
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

function downloadIcs(start: Date, durationMin: number) {
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

function splitName(full: string): { firstname: string; lastname: string } {
  const trimmed = full.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { firstname: '', lastname: '' };
  const parts = trimmed.split(' ');
  if (parts.length === 1) return { firstname: parts[0], lastname: '' };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

export function FreeLiveTraining() {
  const start = new Date(WEBINAR_START_ISO);
  const topFormRef = useRef<HTMLDivElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(emailFromUrl());
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [country, setCountry] = useState<CountryInfo | null>(null);
  const [dialCountry, setDialCountry] = useState<DialCountry>(DEFAULT_DIAL);
  const [dialTouched, setDialTouched] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>(() => calcCountdown(start));

  // Tick the countdown once per second only while the confirmation
  // state is on screen; before registration it's wasted work.
  useEffect(() => {
    if (!registered) return;
    setCountdown(calcCountdown(start));
    const id = window.setInterval(() => setCountdown(calcCountdown(start)), 1000);
    return () => window.clearInterval(id);
  }, [registered, start]);

  useEffect(() => {
    document.title = `Free Live Training - ${WEBINAR_TITLE}`;
    trackEvent('freelivetraining_page_viewed', { email_prefilled: !!emailFromUrl() });
    getCountry().then((info) => {
      setCountry(info);
      // Auto-match the dial code to the detected country unless the
      // visitor has already picked one themselves.
      setDialCountry((cur) => (dialTouched ? cur : findDialByCountryCode(info.code)));
      trackEvent('freelivetraining_country_detected', {
        country_code: info.code || 'unknown',
        country_name: info.name || 'unknown',
        audience: info.audience,
        source: info.source,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToForm = (ctx: string) => {
    trackEvent('freelivetraining_cta_clicked', { context: ctx });
    topFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const inputs = topFormRef.current?.querySelectorAll<HTMLInputElement>('input');
      if (!inputs) return;
      for (const i of Array.from(inputs)) {
        if (!i.value) { i.focus(); break; }
      }
    }, 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const { firstname, lastname } = splitName(fullName);
    if (!firstname) { setError('Please enter your name.'); return; }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.'); return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number so we can text you a reminder.'); return;
    }

    setSubmitting(true);
    const countryInfo = country ?? (await getCountry().catch(() => null));
    const audience = countryInfo?.audience ?? 'non_target';
    identifyUser(cleanEmail, {
      firstname, lastname,
      country_code: countryInfo?.code,
      country_name: countryInfo?.name,
      audience,
      source_page: 'freelivetraining',
    });
    trackEvent('freelivetraining_registered', {
      has_phone: !!phone.trim(),
      country_code: countryInfo?.code || 'unknown',
      country_name: countryInfo?.name || 'unknown',
      audience,
    });

    try {
      const composedPhone = composePhone(phone, dialCountry.dial);
      const res = await fetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: composedPhone || undefined,
          firstname,
          lastname,
          dial_country: dialCountry.code,
          dial_code: dialCountry.dial,
          dial_touched: dialTouched,
          country_code: countryInfo?.code || '',
          country_name: countryInfo?.name || '',
          audience,
          page_path: typeof window !== 'undefined'
            ? window.location.pathname + window.location.search : '/freelivetraining',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        trackEvent('freelivetraining_register_warning', { reason: data?.reason || 'unknown' });
      }
    } catch {
      trackEvent('freelivetraining_register_warning', { reason: 'network_error' });
    }

    setSubmitting(false);
    setRegistered(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ───────────── confirmation state — strict CF replica ───────────── */
  if (registered) {
    // Weekday for the "Here's What To Do Before <Day>" heading and
    // the Zoom-prep intro. Auto-matches the viewer's local timezone.
    const eventWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(start);
    const dateFull = formatDateCaption(start); // "Friday, May 22nd // 1pm EDT (your local time)"
    const confirmBg: React.CSSProperties = {
      backgroundImage: `linear-gradient(rgba(35, 33, 33, 0.41) 0%, rgba(35, 33, 33, 0.41) 100%), url(${ASSET}/dark-bg.svg)`,
      backgroundColor: '#1a0f08',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: '#1a0f08', color: '#FFFFFF', fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif' }}
      >
        <section className="px-4 pt-8 md:pt-10 pb-12 md:pb-16" style={confirmBg}>
          <div className="w-full max-w-6xl mx-auto">
            {/* Flame logo */}
            <div className="flex justify-center mb-5">
              <img src={`${ASSET}/feature-icon.png`} alt="" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
            </div>

            {/* Congrats headline */}
            <h1
              className="text-center font-black tracking-tight leading-[1.08] mb-6"
              style={{ color: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(28px, 4.4vw, 54px)' }}
            >
              CONGRATULATIONS! YOU'RE IN!
            </h1>

            {/* Scheduled-for callout */}
            <div
              className="mx-auto max-w-2xl rounded-md px-5 py-4 md:px-6 md:py-5 text-center mb-7 md:mb-9"
              style={{ border: '1px solid #F28000', backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              <p className="text-white font-semibold italic flex items-center justify-center gap-2 flex-wrap" style={{ fontSize: 'clamp(16px, 1.6vw, 20px)' }}>
                <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                <span>Your Live Training Is Scheduled For:</span>
              </p>
              <p className="text-white font-bold italic mt-1" style={{ fontSize: 'clamp(16px, 1.6vw, 20px)' }}>
                {dateFull}
              </p>
            </div>

            {/* Countdown */}
            <div className="mx-auto max-w-3xl grid grid-cols-4 gap-3 md:gap-5 mb-10 md:mb-14">
              {[
                { v: countdown.d, label: 'Days' },
                { v: countdown.h, label: 'Hours' },
                { v: countdown.m, label: 'Minutes' },
                { v: countdown.s, label: 'Seconds' },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="rounded-md py-4 md:py-5 text-center"
                  style={{ border: '1px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.25)' }}
                >
                  <p
                    className="font-black text-white leading-none tabular-nums"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(28px, 4vw, 54px)' }}
                  >
                    {cell.label === 'Days' ? cell.v : String(cell.v).padStart(2, '0')}
                  </p>
                  <p className="text-white/70 mt-1 md:mt-2" style={{ fontSize: 'clamp(12px, 1.1vw, 14px)' }}>
                    {cell.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Section heading */}
            <h2
              className="font-black tracking-tight leading-[1.1] mb-3"
              style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(26px, 3.4vw, 42px)' }}
            >
              <span className="text-white">Here's What To Do </span>
              <span style={{ color: '#F28000' }}>Before {eventWeekday}</span>
            </h2>
            <hr className="border-0 h-[2px] mb-8 md:mb-10 max-w-lg" style={{ backgroundColor: '#F28000' }} />

            {/* Two-column layout */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Left — actionables */}
              <div className="lg:col-span-8 space-y-10 md:space-y-12">
                {/* Add to Calendar */}
                <section>
                  <h3
                    className="font-black text-white mb-5"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(22px, 2.6vw, 32px)' }}
                  >
                    Add To Your Calendar…
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                    <a
                      href={buildGoogleCalendarUrl(start, WEBINAR_DURATION_MIN)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => trackEvent('freelivetraining_calendar_added', { provider: 'google' })}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 font-black rounded-md uppercase tracking-wide transition-colors shadow-md cursor-pointer"
                      style={{ backgroundColor: '#F28000', color: '#FFFFFF', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(14px, 1.4vw, 18px)' }}
                    >
                      <Calendar className="w-5 h-5" /> Add To My Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => { downloadIcs(start, WEBINAR_DURATION_MIN); trackEvent('freelivetraining_calendar_added', { provider: 'ics' }); }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 font-bold rounded-md uppercase tracking-wide transition-colors cursor-pointer border"
                      style={{ borderColor: '#F28000', color: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(14px, 1.4vw, 18px)' }}
                    >
                      Apple / Outlook (.ics)
                    </button>
                  </div>
                  <p className="text-white/80 mt-3" style={{ fontSize: 'clamp(14px, 1.3vw, 17px)' }}>
                    {dateFull}
                  </p>
                  <p className="text-white/90 mt-2" style={{ fontSize: 'clamp(14px, 1.3vw, 17px)' }}>
                    Click it now &amp; set a reminder so you don't miss when we go live.
                  </p>
                </section>

                {/* Check Your Email (CF had this titled 'Add To Your
                    Calendar...' a second time, but the body is about
                    checking email — kept the body verbatim, fixed the
                    heading to what it was obviously meant to be.) */}
                <section>
                  <h3
                    className="font-black text-white mb-4"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(22px, 2.6vw, 32px)' }}
                  >
                    Check Your Email…
                  </h3>
                  <p className="text-white/90 leading-relaxed max-w-2xl" style={{ fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
                    That's where I'll be sending all the details about the event. Make sure to check your spam or promotions folder if you don't see my email in your primary inbox.
                  </p>
                </section>

                {/* Be Prepared On Zoom */}
                <section>
                  <h3
                    className="font-black text-white mb-3"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(22px, 2.6vw, 32px)' }}
                  >
                    Be Prepared On Zoom…
                  </h3>
                  <p className="text-white/90 leading-relaxed max-w-2xl mb-5" style={{ fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
                    This upcoming live workshop will be held on Zoom, so a couple things to know before {eventWeekday} night:
                  </p>
                  <ul className="space-y-5 max-w-2xl">
                    {[
                      { title: 'Watch from a laptop, desktop, or tablet for the best experience:', body: "I'll be sharing my screen, walking through specific examples, and dropping resources in the chat. Trying to follow along on your phone is going to make it a lot harder to see everything and take notes." },
                      { title: 'Download the Zoom app ahead of time if you can:', body: `It's free, takes about 60 seconds, and makes joining the workshop seamless. If you'd rather not download anything, no worries. When you click the link I send you ${eventWeekday}, you'll see an option that says "Join from your browser" — that works too. Just know the app version tends to run smoother, especially if your internet isn't perfect.` },
                      { title: 'Block out the full 90 minutes:', body: "Don't tell yourself you'll catch the replay. The people who show up live are the ones who walk away with a plan, and the bonuses I'll be giving away are only for live attendees." },
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/90 leading-relaxed" style={{ fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5" style={{ color: '#F28000' }} />
                        <span>
                          <span className="font-bold text-white">{bullet.title}</span>{' '}
                          {bullet.body}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right — sidebar */}
              <aside className="lg:col-span-4 space-y-8">
                {CASE_STUDIES_VIDEOS.length > 0 && (
                  <div className="rounded-md p-4 md:p-5" style={{ border: '1px solid #F28000' }}>
                    <div
                      className="rounded-md -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-5 py-3 text-center font-black uppercase tracking-wide text-white"
                      style={{ backgroundColor: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(14px, 1.3vw, 17px)' }}
                    >
                      Case Studies
                    </div>
                    <div className="space-y-4">
                      {CASE_STUDIES_VIDEOS.map((id, i) => (
                        <div key={`cs-${i}`} className="relative w-full rounded-md overflow-hidden shadow-lg shadow-black/50" style={{ aspectRatio: '16 / 9' }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`}
                            title={`Case study ${i + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="absolute inset-0 w-full h-full border-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {MORE_FREE_CONTENT_VIDEOS.length > 0 && (
                  <div className="rounded-md p-4 md:p-5" style={{ border: '1px solid #F28000' }}>
                    <div
                      className="rounded-md -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-5 py-3 text-center font-black uppercase tracking-wide text-white"
                      style={{ backgroundColor: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(14px, 1.3vw, 17px)' }}
                    >
                      More Free Content
                    </div>
                    <div className="space-y-4">
                      {MORE_FREE_CONTENT_VIDEOS.map((id, i) => (
                        <div key={`mfc-${i}`} className="relative w-full rounded-md overflow-hidden shadow-lg shadow-black/50" style={{ aspectRatio: '16 / 9' }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`}
                            title={`Free content ${i + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="absolute inset-0 w-full h-full border-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>

        <div style={{ backgroundColor: '#1a0f08' }} className="pt-2">
          <LegalDisclaimer />
        </div>
      </div>
    );
  }

  /* ───────────── OPT-IN STATE — strict CF replica ───────────── */
  const topBanner = formatTopBanner(start);
  const dateCaption = formatDateCaption(start);

  // CF's actual recipe (lifted from the raw CF HTML):
  //   linear-gradient(rgba(35,33,33,0.41) 0%, rgba(35,33,33,0.41) 100%),
  //   url(dark-bg.svg),
  //   rgba(255,255,255,0)
  // The SVG is a deep-black-to-burnt-orange gradient with subtle
  // angular shapes; the 41% warm-gray overlay darkens it just
  // enough to keep headline contrast without hiding the pattern.
  const darkSectionBg: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(35, 33, 33, 0.41) 0%, rgba(35, 33, 33, 0.41) 100%), url(${ASSET}/dark-bg.svg)`,
    backgroundColor: '#1a0f08',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif' }}>
      {/* ═══════════ TOP BAR + HERO ═══════════
         Must sit above the fold on standard desktop viewports.
         All sizing is tuned so the full banner → avatar → headline
         → subhead → form → CTA → date caption fits in ~820px of
         vertical content. On taller monitors flex centers it
         vertically; on shorter ones min-h-screen still fills the
         viewport and the content won't blow past the fold. */}
      <section
        ref={topFormRef}
        className="px-4 pt-4 md:pt-6 pb-6 md:pb-8"
        style={darkSectionBg}
      >
        <div className="w-full max-w-5xl mx-auto">
          {/* Top banner strip */}
          <div className="text-center mb-5 md:mb-6 pb-4 border-b-2" style={{ borderColor: '#F28000' }}>
            <p
              className="font-black uppercase tracking-wide leading-tight"
              style={{ color: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(18px, 2.8vw, 30px)' }}
            >
              FREE LIVE MASTERCLASS
            </p>
            <p
              className="font-black uppercase tracking-wide leading-tight mt-1"
              style={{ color: '#F28000', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(18px, 2.8vw, 30px)' }}
            >
              STARTS: {topBanner}
            </p>
          </div>

          {/* Avatar — the source image IS the orange circle crop. */}
          <div className="flex justify-center mb-5 md:mb-6">
            <img
              src={`${ASSET}/hero.png`}
              alt=""
              style={{ width: 'clamp(140px, 20vh, 220px)', height: 'auto' }}
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Headline — nowrap so 'Profitable Amazon Business'
              never breaks onto two lines; the container is wide
              enough (max-w-5xl) to hold it at the clamp ceiling. */}
          <h1
            className="text-center font-black tracking-tight leading-[1.08] mb-5"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            <span className="block whitespace-nowrap text-white" style={{ fontSize: 'clamp(28px, 5vw, 60px)' }}>
              Turn Any Passion Into A
            </span>
            <span className="block whitespace-nowrap mt-1" style={{ color: '#F28000', fontSize: 'clamp(28px, 5vw, 60px)' }}>
              Profitable Amazon Business
            </span>
          </h1>

          {/* Subhead */}
          <p
            className="text-center leading-snug text-white font-medium mb-6 md:mb-7 max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(20px, 2.4vw, 32px)' }}
          >
            Learn The Exact Amazon Selling Method I've Used To Help Regular People With No Experience Hit Their First $100,000 In Sales
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 max-w-xl mx-auto">
            <input
              type="text" required autoComplete="name" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-5 py-3.5 bg-white rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}
              placeholder="Enter Your Name Here..."
            />
            <input
              type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-white rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}
              placeholder="Enter Your Email Here..."
            />
            <div className="relative flex items-stretch bg-white rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setDialOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={dialOpen}
                className="shrink-0 flex items-center gap-1.5 pl-4 pr-3 py-3.5 bg-white border-r border-gray-200 text-gray-800 hover:bg-gray-50 cursor-pointer font-medium"
              >
                <span className="text-xl leading-none" aria-hidden>{dialCountry.flag}</span>
                <span className="tabular-nums text-sm text-gray-700">{dialCountry.dial}</span>
                <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dialOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              <input
                type="tel" required autoComplete="tel" inputMode="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 min-w-0 px-3 py-3.5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none"
                style={{ fontSize: 'clamp(16px, 1.5vw, 20px)' }}
                placeholder="Enter Your Phone Number Here..."
              />

              {dialOpen && (
                <>
                  {/* Click-outside overlay */}
                  <button
                    type="button"
                    aria-label="Close country selector"
                    onClick={() => setDialOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <ul
                    role="listbox"
                    className="absolute z-40 top-full left-0 mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-left"
                  >
                    {COUNTRY_DIAL.map((c) => {
                      const selected = c.code === dialCountry.code;
                      return (
                        <li key={c.code}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setDialCountry(c);
                              setDialTouched(true);
                              setDialOpen(false);
                              trackEvent('freelivetraining_dial_country_changed', {
                                from: dialCountry.code,
                                to: c.code,
                              });
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-orange-50 cursor-pointer ${selected ? 'bg-orange-50 font-semibold' : ''}`}
                          >
                            <span className="text-lg leading-none shrink-0">{c.flag}</span>
                            <span className="flex-1 min-w-0 truncate text-gray-900">{c.name}</span>
                            <span className="tabular-nums text-gray-500 shrink-0">{c.dial}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-md px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 font-black rounded-md uppercase tracking-wide transition-colors shadow-md cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: '#F28000', color: '#FFFFFF', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(20px, 2.4vw, 30px)' }}
            >
              {submitting ? 'SAVING YOUR SPOT…' : <>SAVE MY FREE SPOT <span aria-hidden>»</span></>}
            </button>

            <p
              className="text-center text-white mt-3 flex items-center justify-center gap-2"
              style={{ fontSize: 'clamp(14px, 1.3vw, 17px)' }}
            >
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>{dateCaption}</span>
            </p>
          </form>
        </div>
      </section>

      {/* ═══════════ 3 PILLARS ═══════════ */}
      <section className="px-5 py-14 md:py-20" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-black tracking-tight leading-[1.15] mb-10 md:mb-12 text-3xl md:text-5xl" style={{ fontFamily: '"Montserrat", sans-serif' }}>
            <span className="text-white">Selling On Amazon Is The </span>
            <span style={{ color: '#F28000' }}>Only Online Business</span>
            <span className="text-white"> You Can Start That Has All 3…</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { title: 'Built-In Traffic', body: 'Millions of buyers already shopping every day' },
              { title: 'Built-In Trust',   body: 'Over 200 million existing Prime members' },
              { title: 'DFY Logistics',    body: 'Amazon handles storage, shipping, and returns for you' },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-md p-6 md:p-8 text-center"
                style={{ backgroundColor: '#111111', border: '1px solid #F28000' }}
              >
                <img
                  src={`${ASSET}/feature-icon.png`}
                  alt=""
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 object-contain"
                  loading="lazy"
                />
                <h3 className="text-xl md:text-2xl font-black text-white mb-3" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                  {p.title}
                </h3>
                <p className="text-base md:text-lg leading-snug font-semibold" style={{ color: '#F28000' }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="px-5 py-14 md:py-20" style={darkSectionBg}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-base md:text-lg text-white/90 italic mb-3">
            And that's probably why…
          </p>
          <h2 className="text-center font-black tracking-tight leading-[1.15] mb-10 md:mb-12 text-3xl md:text-5xl text-white" style={{ fontFamily: '"Montserrat", sans-serif' }}>
            Amazon Creates More Millionaires Than Any Other Online Business…
          </h2>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { stat: '60%',   label: 'OF ALL AMAZON SALES COME FROM INDEPENDENT SELLERS', src: 'Amazon Annual Report, 2025' },
              { stat: '$375K', label: 'AVERAGE ANNUAL SALES PER US SELLER',                src: 'Amazon Seller Report, 2025' },
              { stat: '75K+',  label: 'SELLERS SURPASSED $1 MILLION IN SALES',             src: 'Amazon Seller Report, 2025' },
            ].map((s) => (
              <div
                key={s.stat}
                className="rounded-md p-6 md:p-8 text-center"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #F28000' }}
              >
                <p className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-4" style={{ color: '#F28000', fontFamily: '"Montserrat", sans-serif' }}>
                  {s.stat}
                </p>
                <p className="text-xs md:text-sm text-white font-bold uppercase tracking-[0.08em] leading-snug mb-3">
                  {s.label}
                </p>
                <p className="text-[11px] md:text-xs text-white/50 italic">
                  {s.src}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 md:mt-12">
            <button
              onClick={() => scrollToForm('stats')}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-black rounded-md text-base md:text-xl uppercase tracking-wide transition-colors shadow-md cursor-pointer"
              style={{ backgroundColor: '#F28000', color: '#FFFFFF', fontFamily: '"Montserrat", sans-serif' }}
            >
              LEARN HOW TO START SELLING <span aria-hidden>»</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF ═══════════ */}
      <section
        className="px-5 py-14 md:py-20"
        style={{ background: 'linear-gradient(180deg, #3A1F08 0%, #1F0F03 100%)' }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center font-black tracking-tight leading-[1.15] mb-3 text-3xl md:text-5xl" style={{ fontFamily: '"Montserrat", sans-serif' }}>
            <span className="text-white">Real Students. </span>
            <span style={{ color: '#F28000' }}>Real Results.</span>
          </h2>
          <p className="text-center text-base md:text-lg text-white/90 leading-snug mb-10 md:mb-12 max-w-xl mx-auto">
            14,000+ students have seen this system. Here's a breakdown of where some landed.
          </p>

          <div className="space-y-8 md:space-y-10">
            {STUDENT_RESULTS.map((s) => (
              <div key={s.name}>
                <div className="relative w-full rounded-md overflow-hidden shadow-xl shadow-black/50" style={{ aspectRatio: '16 / 9' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${s.videoId}?modestbranding=1&rel=0`}
                    title={`${s.name} - student result`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <p className="mt-4 text-base md:text-lg leading-snug text-white">
                  <span className="font-black" style={{ color: '#F28000' }}>{s.name} - </span>
                  {s.line}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => scrollToForm('social_proof')}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 font-black rounded-md text-base md:text-xl uppercase tracking-wide transition-colors shadow-md cursor-pointer"
              style={{ backgroundColor: '#F28000', color: '#FFFFFF', fontFamily: '"Montserrat", sans-serif' }}
            >
              WATCH THE FREE LIVE TRAINING <span aria-hidden>»</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ LEGAL ═══════════ */}
      <div style={{ backgroundColor: '#0A0A0A' }} className="pt-2">
        <LegalDisclaimer />
      </div>
    </div>
  );
}
