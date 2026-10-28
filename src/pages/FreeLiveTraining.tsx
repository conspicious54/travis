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
const WEBINAR_START_ISO = '2026-05-22T13:00:00-04:00';
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

// "MONDAY AUGUST 24TH @4PM PT" (uppercase, hour in PT)
function formatTopBanner(d: Date): string {
  const ptParts = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).formatToParts(d);
  const get = (t: string) => ptParts.find((p) => p.type === t)?.value || '';
  return `${get('weekday').toUpperCase()} ${get('month').toUpperCase()} ${ordinal(Number(get('day')))} @${(get('hour') + get('dayPeriod')).toUpperCase()} PT`;
}

// "Monday, August 24th // 7pm EST (4pm PST)"
function formatDateCaption(d: Date): string {
  const et = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric',
    timeZone: 'America/New_York',
  }).formatToParts(d);
  const pt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', timeZone: 'America/Los_Angeles',
  }).formatToParts(d);
  const g = (parts: Intl.DateTimeFormatPart[], t: string) =>
    parts.find((p) => p.type === t)?.value || '';
  const weekday = g(et, 'weekday');
  const month = g(et, 'month');
  const day = ordinal(Number(g(et, 'day')));
  const etHour = (g(et, 'hour') + g(et, 'dayPeriod')).toLowerCase();
  const ptHour = (g(pt, 'hour') + g(pt, 'dayPeriod')).toLowerCase();
  return `${weekday}, ${month} ${day} // ${etHour} EST (${ptHour} PST)`;
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

  /* ───────────── confirmation state ───────────── */
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white text-gray-900">
        <div className="max-w-2xl mx-auto px-5 pt-12 md:pt-16 pb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 border-2 border-green-300 mb-5">
              <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-3">
              You're registered.
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-snug max-w-lg mx-auto">
              We'll send the join link to{' '}
              <span className="font-bold text-gray-900 break-all">{email.trim().toLowerCase()}</span>{' '}
              an hour before we go live.
            </p>
          </div>
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-2">Free live masterclass</p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4">{WEBINAR_TITLE}</h2>
            <div className="flex items-start gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-gray-900 font-bold">{formatHumanDate(start)}</p>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-gray-900 font-bold">{formatHumanTime(start)} <span className="text-gray-500 font-normal">({WEBINAR_DURATION_MIN} min)</span></p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-800 leading-snug"><span className="font-bold">This is LIVE</span> - there's no replay. If you miss it, you miss it.</p>
            </div>
          </div>
          <section className="bg-white border-2 border-orange-300 rounded-2xl p-6 md:p-7 shadow-lg shadow-orange-100/50 mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-2">Add it to your calendar right now</h3>
            <p className="text-sm text-gray-600 leading-snug mb-5">Calendar alerts are the #1 reason people actually show up. The invite includes reminders at <span className="font-semibold text-gray-700">1 day, 1 hour, and 15 minutes</span> before.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={buildGoogleCalendarUrl(start, WEBINAR_DURATION_MIN)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('freelivetraining_calendar_added', { provider: 'google' })} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer">
                <Calendar className="w-4 h-4" /> Google Calendar
              </a>
              <button onClick={() => { downloadIcs(start, WEBINAR_DURATION_MIN); trackEvent('freelivetraining_calendar_added', { provider: 'ics' }); }} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer">
                <Calendar className="w-4 h-4" /> Apple / Outlook (.ics)
              </button>
            </div>
          </section>
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-3">Where you'll watch</h3>
            <a href={WEBINAR_JOIN_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('freelivetraining_youtube_link_clicked', { context: 'confirmation' })} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 rounded-lg text-sm font-semibold transition-colors mb-3 break-all">
              <Youtube className="w-4 h-4 shrink-0" /><span className="truncate">{WEBINAR_JOIN_URL}</span>
            </a>
            <p className="text-sm text-gray-700 leading-relaxed"><span className="font-bold">Open it now and hit the bell icon</span> - YouTube will ping you the moment Travis goes live.{phone.trim() ? ` We'll also text ${phone.trim()} an hour before.` : " We'll also email you an hour before."}</p>
          </section>
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-4">How to show up ready</h3>
            <ul className="space-y-3 text-sm md:text-base text-gray-800 leading-relaxed">
              <li className="flex items-start gap-3"><MonitorSmartphone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" /><span>Use a <span className="font-semibold">desktop or laptop</span> if you can - easier to follow along and take notes.</span></li>
              <li className="flex items-start gap-3"><Wifi className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" /><span>Be on a <span className="font-semibold">stable internet connection</span> - YouTube live can buffer on cellular.</span></li>
              <li className="flex items-start gap-3"><Video className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" /><span>Have a <span className="font-semibold">notepad ready</span> - Travis moves fast and the actionable stuff comes early.</span></li>
              <li className="flex items-start gap-3"><Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" /><span>Block the <span className="font-semibold">full hour</span> on your calendar - no half-attention, no multitasking.</span></li>
            </ul>
          </section>
          <p className="text-xs text-gray-500 text-center leading-relaxed mb-10 flex items-center justify-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-gray-400" />
            Bookmark this page (<span className="font-mono font-semibold text-gray-700">Ctrl/Cmd + D</span>) so you can come back when it's time.
          </p>
        </div>
        <LegalDisclaimer />
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
