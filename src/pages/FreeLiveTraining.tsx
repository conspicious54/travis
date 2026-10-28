import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { getCountry, type CountryInfo } from '../lib/detectCountry';
import { COUNTRY_DIAL, DEFAULT_DIAL, findDialByCountryCode, composePhone, type DialCountry } from '../lib/dialCountries';
import { LegalDisclaimer } from '../components/LegalDisclaimer';
import {
  WEBINAR_TITLE, WEBINAR_START_ISO, ASSET_PREFIX as ASSET,
  STUDENT_RESULTS,
  formatTopBanner, formatDateCaption,
} from '../lib/freeLiveTraining';

/* ───── /freelivetraining — strict ClickFunnels port ─────────────
   Word-for-word, section-for-section replica of the CF webinar
   opt-in Travis is moving off. Submits through the shared
   /register-webinar bridge, same as /live-training.
──────────────────────────────────────────────────────────────────── */

// Constants, formatters, and calendar helpers are all in
// src/lib/freeLiveTraining.ts so this page and /trainingregistered
// stay in lockstep. Change WEBINAR_START_ISO there, not here.

function emailFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return getCleanIdentity(new URLSearchParams(window.location.search)).email || '';
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
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(emailFromUrl());
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    // Jump to the dedicated /trainingregistered page so the
    // confirmation state has its own URL (shareable, refreshable,
    // bookmarkable, and friendly to downstream pixels).
    navigate(`/trainingregistered?email=${encodeURIComponent(cleanEmail)}`);
  };


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
