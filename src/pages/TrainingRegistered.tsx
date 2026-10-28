import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { LegalDisclaimer } from '../components/LegalDisclaimer';
import {
  WEBINAR_TITLE, WEBINAR_START_ISO, WEBINAR_DURATION_MIN, ASSET_PREFIX,
  CASE_STUDIES_VIDEOS, MORE_FREE_CONTENT_VIDEOS,
  formatDateCaption, buildGoogleCalendarUrl, downloadIcs,
  calcCountdown, type Countdown,
} from '../lib/freeLiveTraining';

/* ───── /trainingregistered — strict CF confirmation replica ──────
   Reached via a client-side navigate() from the /freelivetraining
   form on successful submit. The URL query carries ?email=… so a
   refresh keeps the page functional, but we never render raw PII
   back from the URL; the page itself doesn't need it to work.
──────────────────────────────────────────────────────────────────── */

export function TrainingRegistered() {
  const start = new Date(WEBINAR_START_ISO);
  const [countdown, setCountdown] = useState<Countdown>(() => calcCountdown(start));

  useEffect(() => {
    document.title = `You're In - ${WEBINAR_TITLE}`;
    trackEvent('trainingregistered_page_viewed');
    const id = window.setInterval(() => setCountdown(calcCountdown(start)), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(start);
  const dateFull = formatDateCaption(start);

  const confirmBg: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(35, 33, 33, 0.41) 0%, rgba(35, 33, 33, 0.41) 100%), url(${ASSET_PREFIX}/dark-bg.svg)`,
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
            <img src={`${ASSET_PREFIX}/feature-icon.png`} alt="" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
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
                    onClick={() => trackEvent('trainingregistered_calendar_added', { provider: 'google' })}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 font-black rounded-md uppercase tracking-wide transition-colors shadow-md cursor-pointer"
                    style={{ backgroundColor: '#F28000', color: '#FFFFFF', fontFamily: '"Montserrat", sans-serif', fontSize: 'clamp(14px, 1.4vw, 18px)' }}
                  >
                    <Calendar className="w-5 h-5" /> Add To My Calendar
                  </a>
                  <button
                    type="button"
                    onClick={() => { downloadIcs(start, WEBINAR_DURATION_MIN); trackEvent('trainingregistered_calendar_added', { provider: 'ics' }); }}
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
                  Calendar...' a second time by accident; the body is
                  about checking email — kept the body verbatim, fixed
                  the heading to what it was obviously meant to be.) */}
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
                    { title: 'Block out the full 90 minutes:', body: "Don't tell yourself you'll catch the replay. The women who show up live are the ones who walk away with a plan, and the bonuses I'll be giving away are only for live attendees." },
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
