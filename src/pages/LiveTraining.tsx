import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, Star, ArrowRight, BookmarkPlus, ChevronDown, Sparkles, Bell, Phone, Youtube, Video, AlertTriangle, Wifi, MonitorSmartphone } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';

/* ───── /live-training — webinar opt-in ───────────────────────────
   Single page with two form variants:
   - Default: full form (email + phone + intent)
   - ?member=1 or ?from=email: shortened form (email + intent only)
   After submit, the page swaps to a confirmation state with the
   webinar details + add-to-calendar buttons.

   Webinar details are constants at the top — update before each run.
──────────────────────────────────────────────────────────────────── */

/* ─── Webinar config — UPDATE THESE BEFORE GOING LIVE ───────────── */
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
  { value: 'not_started', label: "I haven't started yet — still learning" },
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
    location: WEBINAR_JOIN_URL || 'Online — link will be emailed before the training',
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
    `LOCATION:${(WEBINAR_JOIN_URL || 'Online — link will be emailed before the training').replace(/,/g, '\\,')}`,
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

  useEffect(() => {
    document.title = `Live Training — ${WEBINAR_TITLE}`;
    trackEvent('live_training_page_viewed', {
      is_member: isMember,
      email_prefilled: !!emailFromUrl(),
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
    identifyUser(cleanEmail, { live_training_stage: stage });
    trackEvent('live_training_registered', {
      stage,
      is_member: isMember,
      has_phone: !!phone.trim(),
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        // Don't block the user — registration succeeded client-side
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
              an hour before we go live. Until then — read every step on this page so you don't miss it.
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
                <span className="font-bold">This is LIVE</span> — there's no replay. If you miss it, you miss it.
              </p>
            </div>
          </div>

          {/* Step 1: Add to calendar — biggest, most important action */}
          <section className="bg-white border-2 border-orange-300 rounded-2xl p-6 md:p-7 shadow-lg shadow-orange-100/50 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-sm">1</div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  Add it to your calendar
                </h3>
                <p className="text-sm text-gray-600 leading-snug mt-1">
                  Do this right now. Calendar alerts are the single biggest reason people actually show up.
                </p>
              </div>
            </div>
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
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              The calendar invite includes reminders at <span className="font-semibold text-gray-700">1 day, 1 hour, and 15 minutes</span> before the training. Don't skip this step.
            </p>
          </section>

          {/* Step 2: Notifications */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-sm">2</div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  Turn on notifications
                </h3>
                <p className="text-sm text-gray-600 leading-snug mt-1">
                  So nothing else gets in the way.
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm md:text-base text-gray-800 leading-relaxed">
              <li className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Calendar app:</span> make sure your phone's calendar notifications are enabled. iOS: Settings → Notifications → Calendar. Android: Settings → Apps → Calendar → Notifications.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">SMS reminder:</span>{' '}
                  {phone.trim()
                    ? `we'll text ${phone.trim()} an hour before we go live.`
                    : 'we will email you an hour before we go live.'}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Youtube className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">YouTube reminders:</span> the training streams here →{' '}
                  <a
                    href={WEBINAR_JOIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline underline-offset-2 font-semibold break-all"
                    onClick={() => trackEvent('live_training_youtube_link_clicked', { context: 'notifications' })}
                  >
                    YouTube live link
                  </a>
                  . Open it now, hit the bell icon, and YouTube will notify you the moment we go live.
                </div>
              </li>
            </ul>
          </section>

          {/* Step 3: What to expect */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-sm">3</div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  What to expect on the call
                </h3>
                <p className="text-sm text-gray-600 leading-snug mt-1">
                  60 minutes, no fluff. Here's the plan.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm md:text-base text-gray-800 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Travis walks through his exact framework for finding a winning product
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                The launch playbook he uses today — what's working in 2026
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                The most common mistakes new sellers make (and how to dodge them)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Live Q&amp;A — your questions answered in real time
              </li>
            </ul>
          </section>

          {/* Step 4: Show up ready */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-sm">4</div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                  Show up ready
                </h3>
                <p className="text-sm text-gray-600 leading-snug mt-1">
                  A few minutes of prep makes this 10× more valuable for you.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm md:text-base text-gray-800 leading-relaxed">
              <li className="flex items-start gap-2">
                <MonitorSmartphone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Use a desktop or laptop if you can — easier to follow along and take notes
              </li>
              <li className="flex items-start gap-2">
                <Wifi className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Be on a stable internet connection — YouTube live can buffer on cellular
              </li>
              <li className="flex items-start gap-2">
                <Video className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Have a notepad ready — Travis moves fast and the actionable stuff comes early
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                Block the full hour on your calendar — no half-attention, no multitasking
              </li>
            </ul>
          </section>

          {/* Step 5: Bookmark */}
          <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5 md:p-6 mb-10 flex items-start gap-3">
            <BookmarkPlus className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 mb-1">Bookmark this page</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Press{' '}
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-300 rounded px-1.5 py-0.5">
                  Ctrl/Cmd + D
                </span>{' '}
                so you can come back when it's time. We'll also email the join link about an hour before the training starts.
              </p>
            </div>
          </section>

          {/* Bottom CTA — ready ASAP */}
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
                If you already know you're serious about building your Amazon brand, you can book a call with my team to discuss working together — no need to wait for the webinar.
              </p>
              <a
                href="/book"
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
      <div className="max-w-xl mx-auto px-5 pt-12 md:pt-20 pb-16">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-700 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Free Live Training with Travis
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            {WEBINAR_TITLE}
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-snug mb-2">
            {formatHumanDate(start)} · {formatHumanTime(start)}
          </p>
          <p className="text-sm text-gray-500">Live and free. Save your spot below.</p>
        </header>

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

          {/* Phone — only for non-list members */}
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
            {submitting ? 'Saving your spot…' : 'Save my spot'}
            {!submitting && <ArrowRight className="w-5 h-5" />}
          </button>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Free training. We'll send the join link to your inbox.
          </p>
        </form>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-orange-500" /> 14,000+ students taught</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 100% free</span>
        </div>
      </div>
    </div>
  );
}
