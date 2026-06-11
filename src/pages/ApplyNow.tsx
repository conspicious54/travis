import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';
import { ExitIntentPopup } from '../components/ExitIntentPopup';

/* ───── /applynow - Typeform application page ─────────────────────
   The page green CTAs on /nextstep land on. Rebuild of the CF
   "apply now" page in the site's design system:
     - Green "Step 1 Of 2: Apply Now For Your 1-On-1 Amazon
       Strategy Call" banner
     - Inline Typeform embed (the 1m30s self-assessment)
     - "As seen on..." trust strip (same composite logo image as
       /nextstep)
     - Green "Click to Apply" CTAs that scroll back to the form
     - "Who is Travis Marziani?" bio + group photo
     - "A note from Travis" letter + speaker photo

   The Typeform is embedded inline via Typeform's official script
   tag (//embed.typeform.com/next/embed.js) which auto-mounts on
   any element with data-tf-live="{form-id}".
─────────────────────────────────────────────────────────────────── */

/* ─── Config - tune as needed ──────────────────────────────────── */
// TODO: replace with the real Typeform live form id (the part after
// /to/ in the form URL, e.g. "abCdEfGh"). Until set the embed slot
// just shows the "waiting on form id" placeholder.
const TYPEFORM_LIVE_ID = '';
const TYPEFORM_HEIGHT_PX = 520;

// Images. Replace with the real R2-hosted asset URLs when ready -
// the layout has reserved slots in the right places already.
const GROUP_PHOTO_URL  = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/team-group.jpg';
const TRAVIS_STAGE_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/travis-stage.jpg';
const LOGOS_IMG_URL    = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/Logos%20black%20and%20white%203.jpg';
/* ──────────────────────────────────────────────────────────────── */

export function ApplyNow() {
  const formRef = useRef<HTMLDivElement>(null);

  // Identify visitor from URL params (forwarded from /nextstep)
  useEffect(() => {
    document.title = 'Apply Now - Passion Product 1-on-1 Amazon Strategy Call';
    const params = new URLSearchParams(window.location.search);
    const id = getCleanIdentity(params);
    if (id.email) {
      identifyUser(id.email, {
        first_name: id.firstname ?? undefined,
        last_name:  id.lastname  ?? undefined,
        phone:      id.phone     ?? undefined,
      });
    }
    trackEvent('applynow_page_viewed', { email_in_url: !!id.email });
  }, []);

  // Inject Typeform's embed script once. The script auto-mounts on
  // any [data-tf-live] element it finds in the DOM.
  useEffect(() => {
    if (!TYPEFORM_LIVE_ID) return;
    if (document.getElementById('pp-typeform-embed-loader')) return;
    const s = document.createElement('script');
    s.id = 'pp-typeform-embed-loader';
    s.src = '//embed.typeform.com/next/embed.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const scrollToForm = () => {
    trackEvent('applynow_cta_clicked');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Pre-build Typeform hidden-field params from URL identity so the
  // form arrives pre-filled. Typeform reads hidden fields via the
  // ?email=&firstname=... query string on the form embed URL, but
  // for the data-tf-live embed they come through as data-tf-hidden.
  // We pass identity to BOTH the embed div (hidden fields) and to
  // PostHog identify so the application call is attributed.
  const hiddenFields = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const incoming = new URLSearchParams(window.location.search);
    const parts: string[] = [];
    for (const k of ['email', 'firstname', 'lastname', 'phone']) {
      const v = incoming.get(k);
      if (v) parts.push(`${k}=${encodeURIComponent(v)}`);
    }
    return parts.join(',');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Minimal header - flame mark only */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-full blur-md" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Step banner */}
      <div className="bg-green-500 text-white">
        <div className="max-w-4xl mx-auto px-5 py-3 text-center">
          <p className="text-base md:text-xl font-bold tracking-tight">
            Step 1 Of 2: Apply Now For Your 1-On-1 Amazon Strategy Call
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 pt-4 pb-14">
        <p className="text-center text-base md:text-lg italic text-gray-700 mb-7">
          Complete This Quick Application to See How We Can Support Your Goals
        </p>

        {/* Typeform inline embed */}
        <div ref={formRef} className="max-w-2xl mx-auto">
          <div className="text-center mb-3">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              The Passion Product Strategy Session
            </h2>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              Take This Self Assessment To See If You're A Fit
            </p>
          </div>

          {TYPEFORM_LIVE_ID ? (
            <div
              data-tf-live={TYPEFORM_LIVE_ID}
              data-tf-hidden={hiddenFields}
              style={{ height: TYPEFORM_HEIGHT_PX }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            />
          ) : (
            <div
              style={{ height: TYPEFORM_HEIGHT_PX }}
              className="bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-center px-6"
            >
              <div className="max-w-sm">
                <div className="text-sm font-bold text-gray-700 mb-1">Typeform embed slot</div>
                <p className="text-xs text-gray-500">
                  Drop the Typeform live form id into{' '}
                  <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-700">TYPEFORM_LIVE_ID</code>{' '}
                  at the top of <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-700">ApplyNow.tsx</code> and the assessment renders here.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm text-gray-500 mt-3">
            <Clock className="w-3.5 h-3.5" />
            Takes 1 minute 30 seconds
          </div>
        </div>

        <p className="text-center text-xs italic text-gray-500 mt-8">
          *By submitting this application you agree to our{' '}
          <Link to="/termsofservice" className="underline hover:text-gray-700">terms of service</Link>
        </p>

        {/* As seen on */}
        <div className="text-center mt-12 mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">As seen on...</h3>
          <img
            src={LOGOS_IMG_URL}
            alt="Featured on Helium 10, Jungle Scout, Amazon Ads, Prosper Show, HuffPost, Forbes, Medium"
            loading="lazy"
            className="max-w-full md:max-w-3xl mx-auto h-auto opacity-90"
          />
        </div>

        {/* First Click-to-Apply CTA (scrolls back to form) */}
        <div className="flex justify-center mt-6 mb-14">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex bg-green-500 hover:bg-green-600 text-white text-lg md:text-xl font-black tracking-tight px-12 md:px-16 py-4 md:py-5 rounded-lg shadow-md shadow-green-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 items-center"
          >
            Click to Apply
          </button>
        </div>

        {/* Who is Travis Marziani - bio + group photo */}
        <section className="grid md:grid-cols-2 gap-7 md:gap-10 items-start mb-14">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center md:text-left mb-5">
              Who is Travis Marziani?
            </h2>
            <div className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
              <p>
                It's no secret, the online world is overflowing with promises, and it's easy to feel skeptical. I'm not here
                to convince you with empty words or push something that isn't right for you. My intention is simple: if what
                I do can genuinely help, I'll show you how.
              </p>
              <p>
                For years, I lived the "expected" life: earn a degree, find a stable job, work hard, and wait for
                promotions. On paper, it was "safe". In reality, I was trading my time and energy to build someone else's
                vision, week after week, year after year.
              </p>
              <p>
                One day, I decided that wasn't enough. 10 years ago I quit my job and created something that gave me the
                freedom to work on my own terms. Selling on Amazon opened the door to that lifestyle, the ability to choose
                when and where I work, while building something that's truly mine.
              </p>
              <p>
                Now, I help others do the same. If you've ever felt you were meant for more than just clocking in and out,
                we might be able to create that "more" together.
              </p>
            </div>
          </div>
          <div className="md:pt-2">
            <img
              src={GROUP_PHOTO_URL}
              alt="Travis with the Passion Product team and students"
              loading="lazy"
              className="w-full rounded-xl shadow-md border border-gray-100 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </section>

        {/* A note from Travis - speaker photo + letter */}
        <section className="grid md:grid-cols-2 gap-7 md:gap-10 items-start mb-12">
          <div className="md:pt-2 md:order-1 order-2">
            <img
              src={TRAVIS_STAGE_URL}
              alt="Travis speaking at Passion Product Live"
              loading="lazy"
              className="w-full rounded-xl shadow-md border border-gray-100 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="md:order-2 order-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center md:text-left mb-5">
              A note from Travis
            </h2>
            <div className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
              <p>
                Hey there! So here's the deal, whatever path you're thinking about taking, you've gotta go all in.
                Half-hearted efforts? They're basically guaranteed to flop. You need that fire in your belly, that thing
                that makes you jump out of bed even when your alarm clock becomes your worst enemy.
              </p>
              <p>
                The real magic happens when you find your "why" - that driving force that keeps you moving forward when
                everything feels impossible. That's your secret weapon right there.
              </p>
              <p>
                Look, you can spend forever analyzing every little detail, or you can start taking action and actually see
                results. Some people get stuck in research mode while others are out there making things happen. The choice
                is totally yours.
              </p>
              <p>
                So what's it gonna be? Are you going to keep spinning your wheels, endlessly planning and overthinking? Or
                are you ready to roll up your sleeves and actually start making moves? The opportunities are right there -
                someone's going to grab them.
              </p>
              <p className="font-semibold text-slate-900">-Travis</p>
            </div>
          </div>
        </section>

        {/* Final Click-to-Apply CTA */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex bg-green-500 hover:bg-green-600 text-white text-lg md:text-xl font-black tracking-tight px-12 md:px-16 py-4 md:py-5 rounded-lg shadow-md shadow-green-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 items-center"
          >
            Click to Apply
          </button>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-4xl mx-auto px-5 py-8 text-center">
          <p className="text-sm text-slate-400">
            Copyright © {new Date().getFullYear()} Passion Product LLC |{' '}
            <Link to="/privacypolicy" className="text-slate-300 hover:text-white underline">Privacy Policy</Link> |{' '}
            <Link to="/termsofservice" className="text-slate-300 hover:text-white underline">Terms of Service</Link>
          </p>
        </div>
      </footer>

      <ExitIntentPopup theme="light" />
    </div>
  );
}
