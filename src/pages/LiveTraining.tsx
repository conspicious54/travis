import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, Star, ArrowRight, BookmarkPlus, ChevronDown, Sparkles, Bell, Phone, Youtube, Video, AlertTriangle, Wifi, MonitorSmartphone } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCountry, type CountryInfo } from '../lib/detectCountry';

/* ───── /live-training - webinar opt-in ───────────────────────────
   Single page with two form variants:
   - Default: full form (email + phone + intent)
   - ?member=1 or ?from=email: shortened form (email + intent only)
   After submit, the page swaps to a confirmation state with the
   webinar details + add-to-calendar buttons.

   Webinar details are constants at the top - update before each run.
──────────────────────────────────────────────────────────────────── */

/* ─── Webinar config - UPDATE THESE BEFORE GOING LIVE ───────────── */
const WEBINAR_TITLE = 'How to Find and Launch Your First Passion Product';
// ISO 8601 with timezone. Used for the Date object, ICS file, and
// Google Calendar link. Pick the actual datetime when you set the date.
const WEBINAR_START_ISO = '2026-05-22T13:00:00-04:00'; // Wed May 22 2026, 1:00 PM EDT
const WEBINAR_DURATION_MIN = 60;
const WEBINAR_JOIN_URL = 'https://www.youtube.com/watch?v=2Wx_YWBCiHo';
const WEBINAR_DESCRIPTION =
  "Travis Marziani's live training: how he picks winning products, the launch playbook he uses, and how to avoid the most common mistakes new sellers make.";
/* ─────────────────────────────────────────────────────────────── */

const STAGE_OPTIONS = [
  { value: 'not_started', label: "I haven't started yet - still learning" },
  { value: 'have_idea', label: 'I have a product idea, planning next steps' },
  { value: 'launching', label: 'I am actively working on launching my first product' },
  { value: 'scaling', label: "I've already launched and want to grow / scale" },
  { value: 'exploring', label: 'Just exploring, not sure yet' },
];

function isListMember(): boolean {
  if (typeof window === 'undefined') return false;
  const p = new URLSearchParams(window.location.search);
  return p.get('member') === '1' || p.get('from') === 'email';
}

function emailFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return (new URLSearchParams(window.location.search).get('email') || '').trim();
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

export function LiveTraining() {
  const start = new Date(WEBINAR_START_ISO);
  const isMember = isListMember();
  const [email, setEmail] = useState(emailFromUrl());
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [country, setCountry] = useState<CountryInfo | null>(null);

  useEffect(() => {
    document.title = `Live Training - ${WEBINAR_TITLE}`;
    trackEvent('live_training_page_viewed', {
      is_member: isMember,
      email_prefilled: !!emailFromUrl(),
    });
    // Detect country in the background - classifies into target /
    // non_target buckets that Zapier routes (AC vs Mailchimp).
    getCountry().then((info) => {
      setCountry(info);
      trackEvent('live_training_country_detected', {
        country_code: info.code || 'unknown',
        country_name: info.name || 'unknown',
        audience: info.audience,
        source: info.source,
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isMember && !phone.trim()) {
      setError('Please enter a phone number so we can text you a reminder.');
      return;
    }
    if (!stage) {
      setError('Please pick the option that best describes where you are.');
      return;
    }

    setSubmitting(true);
    // Make sure we have country resolved before submit. If still
    // in-flight, await it; if it never resolves we ship without it.
    const countryInfo = country ?? (await getCountry().catch(() => null));
    const audience = countryInfo?.audience ?? 'non_target';
    identifyUser(cleanEmail, {
      live_training_stage: stage,
      country_code: countryInfo?.code,
      country_name: countryInfo?.name,
      audience,
    });
    trackEvent('live_training_registered', {
      stage,
      is_member: isMember,
      has_phone: !!phone.trim(),
      country_code: countryInfo?.code || 'unknown',
      country_name: countryInfo?.name || 'unknown',
      audience,
    });

    try {
      const res = await fetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: phone.trim() || undefined,
          stage,
          is_member: isMember,
          country_code: countryInfo?.code || '',
          country_name: countryInfo?.name || '',
          audience,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        // Don't block the user - registration succeeded client-side
        // even if the CRM hiccup'd. Log it.
        trackEvent('live_training_register_warning', { reason: data?.reason || 'unknown' });
      }
    } catch (err) {
      trackEvent('live_training_register_warning', { reason: 'network_error' });
    }

    setSubmitting(false);
    setRegistered(true);
  };

  /* ────── confirmation state ────── */
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white text-gray-900">
        <div className="max-w-2xl mx-auto px-5 pt-12 md:pt-16 pb-16">
          {/* Hero */}
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
              an hour before we go live. Until then - read every step on this page so you don't miss it.
            </p>
          </div>

          {/* When */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-2">
              Live training
            </p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4">
              {WEBINAR_TITLE}
            </h2>
            <div className="flex items-start gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-gray-900 font-bold">{formatHumanDate(start)}</p>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-gray-900 font-bold">
                {formatHumanTime(start)}{' '}
                <span className="text-gray-500 font-normal">({WEBINAR_DURATION_MIN} min)</span>
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-800 leading-snug">
                <span className="font-bold">This is LIVE</span> - there's no replay. If you miss it, you miss it.
              </p>
            </div>
          </div>

          {/* Add to calendar - THE primary action */}
          <section className="bg-white border-2 border-orange-300 rounded-2xl p-6 md:p-7 shadow-lg shadow-orange-100/50 mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-2">
              Add it to your calendar right now
            </h3>
            <p className="text-sm text-gray-600 leading-snug mb-5">
              Calendar alerts are the #1 reason people actually show up. The invite includes reminders at <span className="font-semibold text-gray-700">1 day, 1 hour, and 15 minutes</span> before.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={buildGoogleCalendarUrl(start, WEBINAR_DURATION_MIN)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('live_training_calendar_added', { provider: 'google' })}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Google Calendar
              </a>
              <button
                onClick={() => {
                  downloadIcs(start, WEBINAR_DURATION_MIN);
                  trackEvent('live_training_calendar_added', { provider: 'ics' });
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Apple / Outlook (.ics)
              </button>
            </div>
          </section>

          {/* Watch live + reminders */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-3">
              Where you'll watch
            </h3>
            <a
              href={WEBINAR_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('live_training_youtube_link_clicked', { context: 'confirmation' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 rounded-lg text-sm font-semibold transition-colors mb-3 break-all"
            >
              <Youtube className="w-4 h-4 shrink-0" />
              <span className="truncate">{WEBINAR_JOIN_URL}</span>
            </a>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-bold">Open it now and hit the bell icon</span> - YouTube will ping you the moment Travis goes live.
              {phone.trim()
                ? ` We'll also text ${phone.trim()} an hour before.`
                : " We'll also email you an hour before."}
            </p>
          </section>

          {/* How to show up - consolidated checklist */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-4">
              How to show up ready
            </h3>
            <ul className="space-y-3 text-sm md:text-base text-gray-800 leading-relaxed">
              <li className="flex items-start gap-3">
                <MonitorSmartphone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Use a <span className="font-semibold">desktop or laptop</span> if you can - easier to follow along and take notes.</span>
              </li>
              <li className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Be on a <span className="font-semibold">stable internet connection</span> - YouTube live can buffer on cellular.</span>
              </li>
              <li className="flex items-start gap-3">
                <Video className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Have a <span className="font-semibold">notepad ready</span> - Travis moves fast and the actionable stuff comes early.</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Block the <span className="font-semibold">full hour</span> on your calendar - no half-attention, no multitasking.</span>
              </li>
            </ul>
          </section>

          {/* Bookmark - small note */}
          <p className="text-xs text-gray-500 text-center leading-relaxed mb-10 flex items-center justify-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-gray-400" />
            Bookmark this page (
            <span className="font-mono font-semibold text-gray-700">Ctrl/Cmd + D</span>
            ) so you can come back when it's time.
          </p>

          {/* Bottom CTA - ready ASAP */}
          <section className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 rounded-3xl p-7 md:p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
            <div className="relative">
              <p className="text-orange-300 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] mb-3">
                Don't want to wait until the live training?
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-3">
                Ready to take action <span className="text-orange-400">right now?</span>
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-md mx-auto">
                If you already know you're serious about building your Amazon brand, you can book a call with my team to discuss working together - no need to wait for the webinar.
              </p>
              <a
                href="https://start.travismarziani.com/?utm_source=live_training&utm_medium=webinar_confirmation"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('live_training_book_call_clicked')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-lg shadow-orange-500/30 cursor-pointer"
              >
                Book a call with my team
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-slate-500 text-xs mt-4">
                Personalized 1-on-1 strategy call · no pressure, no obligation
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ────── form state ────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white text-gray-900">
      <div className="max-w-xl mx-auto px-5 pt-8 md:pt-12 pb-16">
        <header className="text-center mb-6 md:mb-7">
          {/* Pulsing LIVE badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-red-700 mb-4">
            <span className="relative inline-flex items-center justify-center w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
              <span className="relative inline-block w-2 h-2 rounded-full bg-red-600"></span>
            </span>
            Free live training with Travis
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.05] mb-3">
            {WEBINAR_TITLE}
          </h1>
          <p className="text-sm md:text-base text-gray-700 leading-snug mb-1">
            One hour. Live. No replay.
          </p>
          <p className="text-sm text-gray-500">
            {formatHumanDate(start)} · {formatHumanTime(start)}
          </p>
        </header>

        {/* FORM - primary action, sits right under the header */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="you@email.com"
            />
          </div>

          {/* Phone - only for non-list members */}
          {!isMember && (
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-1.5">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="+1 (555) 123-4567"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                We'll text you a reminder before we go live.
              </p>
            </div>
          )}

          {/* Stage dropdown */}
          <div>
            <label htmlFor="stage" className="block text-sm font-bold text-gray-900 mb-1.5">
              Where are you in your Amazon FBA journey?
            </label>
            <div className="relative">
              <select
                id="stage"
                required
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
              >
                <option value="" disabled>Select one…</option>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-black rounded-xl text-base md:text-lg transition-colors shadow-md cursor-pointer"
          >
            {submitting ? 'Saving your spot…' : 'Save my spot - it\'s free'}
            {!submitting && <ArrowRight className="w-5 h-5" />}
          </button>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            We'll send the join link to your inbox an hour before we go live.
          </p>
        </form>

        {/* What you'll walk away with - reinforcement after the form */}
        <div className="mt-10">
          <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-4 text-center">
            What you'll walk away with
          </p>
          <ul className="space-y-3 text-sm md:text-base text-gray-800 leading-relaxed">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                The exact framework Travis uses today to find products that hit{' '}
                <span className="font-bold text-gray-900">$100K+ in their first year</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                Why the "Amazon is saturated" story is{' '}
                <span className="font-bold text-gray-900">wrong</span> - and where the real opportunity is in 2026
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                The launch playbook Travis used on his last 5 product launches -{' '}
                <span className="font-bold text-gray-900">every one recouped its cost in month one</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                <span className="font-bold text-gray-900">Live Q&amp;A</span> - bring your hardest question, Travis answers live
              </span>
            </li>
          </ul>
        </div>

        {/* Travis byline */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            <span className="font-bold text-gray-900">Travis Marziani</span> has helped{' '}
            <span className="font-bold text-orange-600">14,000+ students</span> launch their Amazon brands. This is the same playbook he uses today.
          </p>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-xs md:text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-orange-500" /> 14,000+ students taught</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 100% free</span>
          <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-red-500" /> Live - no replay</span>
        </div>
      </div>
    </div>
  );
}
