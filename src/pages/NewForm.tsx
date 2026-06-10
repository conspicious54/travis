import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Flame, Lock } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { getCountry, type CountryInfo } from '../lib/detectCountry';

/* ───── /newform - webinar opt-in form ────────────────────────────
   Conversion-optimized rebuild of the original ClickFunnels opt-in:
   - Promise-first headline (the outcome the visitor wants), with
     the $140B credibility stat demoted to a small proof line under
     the eyebrow chip
   - 3 fields instead of 4 (single full-name field, split on submit)
   - What-you-get bullets next to the CTA so the form reads as a
     value trade, not data entry
   - Reassurance + lock icon under the button

   Wiring is unchanged from the prior version: identifyUser() +
   POST to /.netlify/functions/register-webinar with stage
   'newform_optin', then forward identity in the URL to /training.
────────────────────────────────────────────────────────────────── */

/* ─── Config - tune as needed ──────────────────────────────────── */
const REDIRECT_TO = '/training';
const COUNTDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const COUNTDOWN_STORAGE_KEY = 'pp_newform_countdown_started_at';
const STAGE_TAG = 'newform_optin';
/* ──────────────────────────────────────────────────────────────── */

const COUNTRY_DIAL: Array<{ code: string; dial: string; flag: string; name: string }> = [
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
];

function getCountdownDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + COUNTDOWN_MS;
  try {
    const raw = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (raw) {
      const startedAt = parseInt(raw, 10);
      if (!Number.isNaN(startedAt)) {
        const deadline = startedAt + COUNTDOWN_MS;
        if (deadline > Date.now()) return deadline;
      }
    }
  } catch { /* no-op */ }
  const fresh = Date.now();
  try { localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(fresh)); } catch { /* no-op */ }
  return fresh + COUNTDOWN_MS;
}

function formatCountdown(deadline: number): { h: string; m: string; s: string } {
  const remaining = Math.max(0, deadline - Date.now());
  const totalSec = Math.floor(remaining / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return { h, m, s };
}

// Split a single full-name field into first + last. "Mary Jane Smith"
// keeps "Mary" as first and "Jane Smith" as last so compound surnames
// stay intact. Single-token names go entirely into firstname.
function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(' ');
  return {
    first: parts[0] || '',
    last:  parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
}

function initialFromUrl(): { name: string; email: string; phone: string } {
  if (typeof window === 'undefined') return { name: '', email: '', phone: '' };
  const id = getCleanIdentity(new URLSearchParams(window.location.search));
  const name = [id.firstname, id.lastname].filter(Boolean).join(' ').trim();
  return {
    name,
    email: id.email || '',
    phone: id.phone || '',
  };
}

export function NewForm() {
  const seed = useMemo(initialFromUrl, []);
  const [name, setName]     = useState(seed.name);
  const [email, setEmail]   = useState(seed.email);
  const [phone, setPhone]   = useState(seed.phone);
  const [dialCountry, setDialCountry] = useState<string>('US');
  const [error, setError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry] = useState<CountryInfo | null>(null);
  const [deadline] = useState<number>(() => getCountdownDeadline());
  const [, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    document.title = 'Free Training - How to Hit $100K on Amazon in 2026';
    trackEvent('newform_page_viewed', {
      email_prefilled: !!seed.email,
      phone_prefilled: !!seed.phone,
      name_prefilled:  !!seed.name,
    });
    getCountry().then((info) => {
      setCountry(info);
      if (info.code && COUNTRY_DIAL.some(c => c.code === info.code)) {
        setDialCountry(info.code);
      }
      trackEvent('newform_country_detected', {
        country_code: info.code || 'unknown',
        country_name: info.name || 'unknown',
        audience: info.audience,
        source: info.source,
      });
    });
  }, [seed.email, seed.phone, seed.name]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ttl = formatCountdown(deadline);
  const dialEntry = COUNTRY_DIAL.find(c => c.code === dialCountry) || COUNTRY_DIAL[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { first, last } = splitName(name);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!first) { setError('Please enter your name.'); return; }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPhone) {
      setError('Please enter your phone so we can text you the training link.');
      return;
    }

    setSubmitting(true);

    const fullPhone = cleanPhone.startsWith('+')
      ? cleanPhone
      : `${dialEntry.dial} ${cleanPhone}`;

    const countryInfo = country ?? (await getCountry().catch(() => null));
    const audience = countryInfo?.audience ?? 'non_target';

    identifyUser(cleanEmail, {
      first_name: first,
      last_name: last,
      phone: fullPhone,
      country_code: countryInfo?.code,
      country_name: countryInfo?.name,
      audience,
      newform_dial_country: dialCountry,
    });
    trackEvent('newform_submitted', {
      audience,
      country_code: countryInfo?.code || 'unknown',
      country_name: countryInfo?.name || 'unknown',
      dial_country: dialCountry,
    });

    try {
      const res = await fetch('/.netlify/functions/register-webinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: fullPhone,
          stage: STAGE_TAG,
          country_code: countryInfo?.code || '',
          country_name: countryInfo?.name || '',
          audience,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.ok) {
        trackEvent('newform_register_warning', { reason: data?.reason || 'unknown' });
      }
    } catch {
      trackEvent('newform_register_warning', { reason: 'network_error' });
    }

    const fwd = new URLSearchParams();
    fwd.set('email', cleanEmail);
    if (first)    fwd.set('firstname', first);
    if (last)     fwd.set('lastname',  last);
    if (fullPhone) fwd.set('phone',    fullPhone);
    window.location.href = `${REDIRECT_TO}?${fwd.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white text-gray-900">
      {/* Minimal header - just the flame mark, centered. No wordmark. */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-full blur-md" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-10 md:pt-14 pb-16">
        {/* Eyebrow chip */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            Free Live Training
          </div>
        </div>

        {/* Hero - promise-first */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.02] mb-5">
            How First-Time Amazon Sellers Are{' '}
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              Hitting $100K in 2026
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 leading-snug max-w-2xl mx-auto">
            The exact step-by-step process Travis uses to help students launch profitable products on Amazon - even if you've never sold online before.
          </p>

          {/* Credibility stat - demoted from headline */}
          <p className="mt-5 text-sm text-gray-500 max-w-xl mx-auto">
            Last year, first-time Amazon sellers earned over <span className="font-semibold text-gray-700">$140 billion</span>. Here's how to claim your share.
          </p>
        </div>

        {/* Form card with what-you-get sidebar on desktop */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-5">
              {/* What you get - left rail on desktop, top on mobile */}
              <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 md:p-7">
                <div className="text-[11px] font-bold uppercase tracking-wider text-orange-300 mb-3">What you'll get</div>
                <ul className="space-y-3.5">
                  {[
                    { title: 'The full 60-min training', detail: 'Live, with real product breakdowns' },
                    { title: 'Free product research bonuses', detail: 'Worksheets + Travis\'s product scorecard' },
                    { title: 'Live Q&A access', detail: 'Ask Travis directly in the chat' },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold leading-tight">{item.title}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{item.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="md:col-span-3 p-6 md:p-7 space-y-3.5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    autoFocus
                    required
                    placeholder="First and last"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Country dial code"
                      value={dialCountry}
                      onChange={(e) => setDialCountry(e.target.value)}
                      className="appearance-none pl-3 pr-7 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    >
                      {COUNTRY_DIAL.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">For the join link + reminder text 5 min before we start.</p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-base md:text-lg font-black tracking-wide py-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Reserving Your Spot...' : 'Reserve My Free Spot'}
                  {!submitting && <ArrowRight className="w-5 h-5" />}
                </button>

                {/* Reassurance directly under the CTA */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <Lock className="w-3.5 h-3.5" />
                  100% free. No credit card. Unsubscribe anytime.
                </div>

                {/* SMS consent - legally required, kept verbatim */}
                <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                  By submitting this form, you agree to receive SMS messages from Passion Product, including
                  appointment reminders and notifications. Message frequency varies. Message and data rates may apply.
                  Reply OUT to unsubscribe. Reply HELP for help. Consent is not a condition of purchase.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Countdown - smaller, secondary */}
        <div className="text-center mt-10">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Bonus training expires in</p>
          <div className="inline-flex items-center gap-2 md:gap-3">
            {[
              { v: ttl.h, label: 'hrs' },
              { v: ttl.m, label: 'min' },
              { v: ttl.s, label: 'sec' },
            ].map((unit, i) => (
              <React.Fragment key={unit.label}>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xl md:text-2xl font-black tabular-nums shadow-md">
                    {unit.v}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-gray-500 tracking-widest uppercase">{unit.label}</div>
                </div>
                {i < 2 && <div className="text-xl text-gray-300 font-black -mt-4">:</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">
              Copyright © {new Date().getFullYear()} Passion Product LLC |{' '}
              <Link to="/privacypolicy" className="text-slate-300 hover:text-white underline">Privacy Policy</Link> |{' '}
              <Link to="/termsofservice" className="text-slate-300 hover:text-white underline">Terms of Service</Link> |{' '}
              <span className="text-slate-300">Earnings Disclaimer</span>
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
            This website operates independently and is not affiliated with YouTube, Google, or Facebook. We are not
            endorsed by or connected to YouTube, Google Inc., or Facebook Inc. in any capacity. FACEBOOK is a registered
            trademark of Facebook, Inc. YOUTUBE is a registered trademark of Google Inc.
          </p>

          <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
            In the spirit of full disclosure, we present an optional opportunity at the conclusion for those interested
            in receiving hands-on assistance with implementing these digital advertising methods and techniques. Is
            participation mandatory? Not at all. Will you gain valuable knowledge and actionable insights regardless of
            whether you choose to work with us directly? Absolutely. Many participants will complete this workshop, apply
            the strategies independently, and achieve significant success. Others will recognize the potential and decide
            that collaborative guidance is the fastest path to their desired outcomes. The choice is entirely yours, though
            we encourage you to join the complimentary workshop, apply what you learn, and share your feedback with us!
          </p>

          <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
            By clicking Register Now, you agree to allow Passion Product and our authorized partners to reach out to you
            with relevant marketing communications. This consent is optional and not required for any purchase.
          </p>

          <p className="text-xs text-slate-400 leading-relaxed text-center">
            <span className="font-bold">IMPORTANT NOTICE:</span> The revenue figures and outcomes referenced in this
            workshop represent our personal achievements and, in certain instances, the results obtained by current or
            former clients. Please note that these outcomes are not standard or guaranteed. We do not suggest that you
            will replicate these results (or achieve any specific outcome). Most individuals who consume educational
            webinar content see minimal to no results. These examples serve illustrative purposes only. Your success will
            differ and depends on numerous variables including your experience, dedication, and effort level. All business
            ventures involve risk and require substantial, ongoing commitment and action. If you cannot accept this reality,
            please do not register for this workshop.
          </p>
        </div>
      </footer>
    </div>
  );
}
