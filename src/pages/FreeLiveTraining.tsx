import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar, Clock, CheckCircle, ArrowRight, BookmarkPlus,
  Phone, Youtube, Video, AlertTriangle, Wifi, MonitorSmartphone,
  Users, ShieldCheck, Package, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { getCountry, type CountryInfo } from '../lib/detectCountry';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /freelivetraining — long-form sales-letter opt-in ────────
   Replicates the ClickFunnels webinar opt-in Travis is moving off:
   hero form, three-pillar value prop, Amazon ecosystem stats, and
   student results. Submits through the same /register-webinar
   Zapier bridge as /live-training so there's one list and one
   downstream automation.

   Flip SHOW_STUDENT_RESULTS to false to hide the student results
   section (removes all student revenue figures).
──────────────────────────────────────────────────────────────────── */

const WEBINAR_TITLE = 'Turn Any Passion Into A Profitable Amazon Business';
const WEBINAR_START_ISO = '2026-05-22T13:00:00-04:00'; // Wed May 22 2026, 1:00 PM EDT
const WEBINAR_DURATION_MIN = 60;
const WEBINAR_JOIN_URL = 'https://www.youtube.com/watch?v=2Wx_YWBCiHo';
const WEBINAR_DESCRIPTION =
  "Travis Marziani's live training: how he picks winning products, the launch playbook he uses, and how to avoid the most common mistakes new sellers make.";

// Toggle the student results block. The ClickFunnels source carries
// specific revenue claims per student — set to false to remove them.
const SHOW_STUDENT_RESULTS = true;

function emailFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return getCleanIdentity(new URLSearchParams(window.location.search)).email || '';
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
function formatShortDate(d: Date): string {
  const date = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} @ ${time}`;
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

  useEffect(() => {
    document.title = `Free Live Training - ${WEBINAR_TITLE}`;
    trackEvent('freelivetraining_page_viewed', {
      email_prefilled: !!emailFromUrl(),
    });
    getCountry().then((info) => {
      setCountry(info);
      trackEvent('freelivetraining_country_detected', {
        country_code: info.code || 'unknown',
        country_name: info.name || 'unknown',
        audience: info.audience,
        source: info.source,
      });
    });
  }, []);

  const scrollToForm = (ctx: string) => {
    trackEvent('freelivetraining_cta_clicked', { context: ctx });
    topFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus the first empty input after the scroll settles so the
    // user lands on something keyboard-ready, not just a scroll jump.
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
      const res = await fetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: phone.trim() || undefined,
          firstname,
          lastname,
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
    // Jump to the top so the confirmation state is in view.
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
            <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-2">
              Live masterclass
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
                onClick={() => trackEvent('freelivetraining_calendar_added', { provider: 'google' })}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Google Calendar
              </a>
              <button
                onClick={() => {
                  downloadIcs(start, WEBINAR_DURATION_MIN);
                  trackEvent('freelivetraining_calendar_added', { provider: 'ics' });
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Apple / Outlook (.ics)
              </button>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm mb-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight mb-3">
              Where you'll watch
            </h3>
            <a
              href={WEBINAR_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('freelivetraining_youtube_link_clicked', { context: 'confirmation' })}
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

          <p className="text-xs text-gray-500 text-center leading-relaxed mb-10 flex items-center justify-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-gray-400" />
            Bookmark this page (
            <span className="font-mono font-semibold text-gray-700">Ctrl/Cmd + D</span>
            ) so you can come back when it's time.
          </p>

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
                href="https://start.travismarziani.com/?utm_source=freelivetraining&utm_medium=webinar_confirmation"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('freelivetraining_book_call_clicked')}
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
        <LegalDisclaimer />
      </div>
    );
  }

  /* ───────────── form state (long-form sales letter) ───────────── */
  const livePill = (
    <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-red-700 mb-4">
      <span className="relative inline-flex items-center justify-center w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
        <span className="relative inline-block w-2 h-2 rounded-full bg-red-600"></span>
      </span>
      Free live masterclass
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white text-gray-900">
      {/* ───── HERO + FORM ───── */}
      <section ref={topFormRef} className="pt-10 md:pt-14 pb-10 px-5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8 md:gap-10 items-start">
          {/* Copy */}
          <div className="md:col-span-3">
            {livePill}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.03] mb-4">
              Turn Any Passion Into A{' '}
              <span className="text-orange-600">Profitable Amazon Business</span>
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-snug mb-5">
              Learn the exact Amazon selling method Travis uses to help regular people with no experience launch their first product and hit their first <span className="font-bold text-gray-900">$100,000 in sales</span>.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-6">
              <span className="flex items-center gap-2 font-semibold">
                <Calendar className="w-4 h-4 text-orange-600" />
                {formatShortDate(start)}
              </span>
              <span className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-orange-600" />
                {WEBINAR_DURATION_MIN} min, live
              </span>
            </div>
            <ul className="space-y-2.5 text-sm md:text-base text-gray-800">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>How Travis picks products that keep selling after launch week</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Why "Amazon is saturated" is wrong, and where the opportunity actually is</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>Live Q&amp;A at the end, bring your hardest question</span>
              </li>
            </ul>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="md:col-span-2 bg-white border-2 border-orange-200 rounded-2xl p-6 md:p-7 shadow-xl shadow-orange-100/40 space-y-4">
            <div className="text-center -mt-1 mb-1">
              <p className="text-orange-600 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">Let's get you signed up</p>
              <p className="text-xs text-gray-500">Takes 20 seconds. It's free.</p>
            </div>
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-gray-900 mb-1">Name</label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-900 mb-1">Email</label>
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
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-gray-900 mb-1">Phone</label>
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
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> We'll text you a reminder before we go live.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-black rounded-xl text-sm md:text-base uppercase tracking-wide transition-colors shadow-md cursor-pointer"
            >
              {submitting ? 'Saving your spot…' : 'Claim your free spot'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Join link emailed an hour before. No replay.
            </p>
          </form>
        </div>
      </section>

      {/* ───── 3 PILLARS ───── */}
      <section className="px-5 py-14 md:py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-3">The only business that has all three</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] max-w-3xl mx-auto">
              Selling on Amazon is the <span className="text-orange-600">only online business</span> you can start that has all 3…
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Built-In Traffic',
                body: 'Millions of active buyers already shopping every day, no need to run cold traffic to a landing page nobody has heard of.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: 'Built-In Trust',
                body: 'Over 200 million Prime members already trust Amazon with their credit card, so they trust your product by extension.',
              },
              {
                icon: <Package className="w-6 h-6" />,
                title: 'Done-For-You Logistics',
                body: 'Amazon handles storage, shipping, returns and customer service, so you focus on the product and the marketing.',
              },
            ].map((p) => (
              <div key={p.title} className="bg-gradient-to-b from-orange-50 to-white border border-orange-100 rounded-2xl p-6 md:p-7 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-600 text-white mb-4 shadow-md shadow-orange-200">
                  {p.icon}
                </div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm md:text-base text-gray-700 leading-snug">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => scrollToForm('pillars')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm md:text-base uppercase tracking-wide transition-colors shadow-md cursor-pointer"
            >
              Save my free spot
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ───── STATS ───── */}
      <section className="px-5 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-3">And that's probably why…</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] max-w-3xl mx-auto">
              Amazon is creating more <span className="text-orange-600">everyday millionaires</span> than any other online business…
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                stat: '60%',
                label: 'of all Amazon sales come from independent sellers',
                src: 'Amazon Annual Report, 2025',
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                stat: '$375K',
                label: 'average annual sales per US seller on Amazon',
                src: 'Amazon Seller Report, 2025',
                icon: <Trophy className="w-5 h-5" />,
              },
              {
                stat: '75K+',
                label: 'sellers surpassed $1 million in sales',
                src: 'Amazon Seller Report, 2025',
                icon: <Zap className="w-5 h-5" />,
              },
            ].map((s) => (
              <div key={s.stat} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
                <div className="flex items-center gap-2 text-orange-600 mb-3">{s.icon}<span className="text-[11px] font-bold uppercase tracking-[0.18em]">Stat</span></div>
                <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2">{s.stat}</p>
                <p className="text-sm md:text-base text-gray-800 leading-snug mb-3">{s.label}</p>
                <p className="text-[11px] text-gray-500 italic">Source: {s.src}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => scrollToForm('stats')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm md:text-base uppercase tracking-wide transition-colors shadow-md cursor-pointer"
            >
              Learn how to start selling
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ───── SOCIAL PROOF ───── */}
      {SHOW_STUDENT_RESULTS && (
        <section className="px-5 py-14 md:py-20 bg-gradient-to-b from-white to-orange-50/60 border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-3">14,000+ students</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">
                Real students. <span className="text-orange-600">Real results.</span>
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-3 max-w-xl mx-auto">A few of the students who've worked through this exact method.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
              {[
                { name: 'Andrew', line: 'Reached $330,000 in his first 12 months on Amazon' },
                { name: 'Michael', line: 'Restarted on Amazon with this method and crossed six figures in 12 months' },
                { name: 'Jenny', line: 'Mom-owned brand that reached six figures in year one' },
                { name: 'Alyssa', line: 'Reached six figures in under a year as a first-time seller' },
              ].map((t) => (
                <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-black text-orange-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{t.name}</p>
                    <p className="text-sm md:text-base text-gray-700 leading-snug">{t.line}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button
                onClick={() => scrollToForm('social_proof')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-sm md:text-base uppercase tracking-wide transition-colors shadow-md cursor-pointer"
              >
                Watch the free live training
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-gray-500 mt-3 max-w-md mx-auto">
                Individual results shown aren't typical, require work and aren't guaranteed. See full disclaimer below.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ───── BOTTOM CTA ───── */}
      <section className="px-5 py-14 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          {livePill}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            Save your free spot before it fills up
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-snug mb-6 max-w-xl mx-auto">
            <span className="font-bold text-gray-900">{formatShortDate(start)}.</span> One hour, live. No replay.
          </p>
          <button
            onClick={() => scrollToForm('bottom_cta')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-base md:text-lg uppercase tracking-wide transition-colors shadow-lg shadow-orange-200 cursor-pointer"
          >
            Claim your free spot
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-500 mt-4">100% free · Live Q&amp;A · No replay</p>
        </div>
      </section>

      <LegalDisclaimer />
    </div>
  );
}
