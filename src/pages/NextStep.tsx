import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, CheckCircle2, Flame } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { getCleanIdentity } from '../lib/urlParams';

/* ───── /nextstep - VSL training page ──────────────────────────────
   Rebuild of the CF "next step" VSL page in the site's design
   system. Drops the wordmark header, keeps the page copy verbatim
   from the screenshot:
     - 'How I Used "The Passion Product Formula" to Create a
        7-Figure Amazon Business in Under 3 Months'
     - Vidalytics VSL embed
     - 'Your Amazon Resources Will Unlock In:' countdown
     - 'As seen on...' logo strip
     - 'Watch how this system changes lives...' orange CTA that
       scrolls to the testimonials section
     - 6 testimonial cards with Wistia video embeds + bullet
       takeaways, green 'YES! I'm Ready To Learn More' CTAs
       interspersed between them

   Identifies the visitor via getCleanIdentity (URL params from
   /newform / opt-in flow) so PostHog stitches the VSL pageview
   under the right Person.
─────────────────────────────────────────────────────────────────── */

/* ─── Config - tune as needed ──────────────────────────────────── */
const PRIMARY_CTA_DESTINATION = '/book';
const UNLOCK_DURATION_MS = 2 * 60 * 1000; // 2 mins, per the screenshot
const UNLOCK_STORAGE_KEY = 'pp_nextstep_unlock_started_at';
// Green CTAs behave conditionally: if the visitor has watched less
// than VIDEO_DEPTH_THRESHOLD_MS of the VSL, the click scrolls them
// back UP to the video instead of navigating away. Once they're
// past the threshold they're committed - send them to /book.
const VIDEO_DEPTH_THRESHOLD_MS = 5 * 60 * 1000; // 5 min
const VIDALYTICS_EMBED_ID = 'vidalytics_embed_F2Z6Y1CWfo1bLNCe';
const VIDALYTICS_EMBED_URL =
  'https://fast.vidalytics.com/embeds/IV7bqBJ_/F2Z6Y1CWfo1bLNCe/';
/* ──────────────────────────────────────────────────────────────── */

interface Testimonial {
  title: string;
  videoSide: 'left' | 'right';
  // Wistia media ID. null = placeholder (no embed yet). Swap in
  // the real ID and the iframe appears with no other code changes.
  wistiaMediaId: string | null;
  bullets: Array<{ html: string }>;
}

const TESTIMONIALS: Testimonial[] = [
  {
    title: 'Wanted To Spend Time With His 2 Kids...',
    videoSide: 'right',
    wistiaMediaId: 'b59ry1rcif',
    bullets: [
      { html: 'Wanted <strong>passive income</strong> to spend more time with kids' },
      { html: '<strong>After working with other programs, they chose to work with us</strong> because they felt we cared about their success and we offer tailored 1on1 help!' },
      { html: '<strong>Scaled from $2,000 to $5,000</strong> in less than 2 months in our program' },
      { html: 'Launched a product that helps kids and he was passionate about.' },
      { html: 'Wish they had not been <strong>afraid to ask for help.</strong>' },
      { html: 'If you have a high quality product and incredible offer, you can <strong>charge what it\'s worth</strong> and convert like crazy!' },
    ],
  },
  {
    title: '$100,000 In Less Than 12 Months...',
    videoSide: 'left',
    wistiaMediaId: 'frer1czlo4',
    bullets: [
      { html: '<strong>After getting pregnant she wanted passive income</strong> to provide for her family' },
      { html: '<strong>Wanted to work from home</strong> or anywhere in the world.' },
      { html: 'Achieved <strong>over $15,000 in her first 30 days</strong>' },
      { html: 'Learned how to optimize listings for maximum sales.' },
      { html: '<strong>After trying other methods for 15 years, she found us</strong> and our program helped her on all steps of the process' },
      { html: 'Finally believed that this business model could work the way we said, and is <strong>living the life they dreamed.</strong>' },
    ],
  },
  {
    title: 'Wanted To Quit His 9-5 Job...',
    videoSide: 'right',
    wistiaMediaId: 'zzus1p2wdz',
    bullets: [
      { html: '<strong>Achieved $4,000 in the last 30 days</strong> just selling on Amazon.' },
      { html: 'He launched a product <strong>he was passionate about</strong>' },
      { html: 'Not having a mentor <strong>delayed his launch by 6 months.</strong>' },
      { html: '<strong>Learnt to decrease advertising and other costs</strong> to increase profit' },
      { html: 'Having a unique product offering that allowed them to capitalize in a competitive market.' },
      { html: 'He <strong>increased price</strong> and his sales increased' },
    ],
  },
  {
    title: '1.8M In Sales On Amazon...',
    videoSide: 'left',
    wistiaMediaId: 'qnfz99q85n',
    bullets: [
      { html: '<strong>Wanted to quit his 9-5</strong> with a passive income business' },
      { html: '<strong>Started making $105,000/month</strong> with his first product' },
      { html: 'Hired a VA to <strong>free up his time and travel the world</strong>' },
      { html: 'Has made <strong>over 1.8M in sales on Amazon</strong>' },
      { html: 'Expanded his product line and now <strong>runs a consolidated brand</strong>' },
      { html: 'Take action, timing is definitely key' },
      { html: 'Find the right product offering and really optimize your listing' },
      { html: '<strong>Be accountable</strong>, make small steps, write down your tactics and objectives you want to hit and follow that!' },
    ],
  },
  {
    title: 'Made $250K Selling On Amazon...',
    videoSide: 'right',
    wistiaMediaId: 'f682mke8bh',
    bullets: [
      { html: 'Was passionate about helping other tennis players like him' },
      { html: '<strong>Achieved $40,000 in his first year</strong> of selling on Amazon!' },
      { html: 'Decided to launch more products and <strong>create a brand</strong>' },
      { html: '<strong>Didn\'t want to waste time.</strong>' },
      { html: 'Achieved <strong>over $16,000 in 60 days at 45% margins</strong>' },
      { html: '<strong>Troy was able to quit his 9-5 job</strong> and build a passive income business' },
    ],
  },
  {
    title: '$17,000+ In His First 30 Days Of Selling...',
    videoSide: 'left',
    wistiaMediaId: 's1wneoen7u',
    bullets: [
      { html: 'Didn\'t want to <strong>trade his time for money</strong> anymore' },
      { html: 'Achieved <strong>over $17,000 in his first 30 days</strong>' },
      { html: '<strong>$100,000 in total sales</strong> on their first 6 months.' },
      { html: '<strong>Hit $220,000 in sales</strong> his first year of selling on Amazon!' },
      { html: 'Followed our steps, which <strong>improved sales and profit!</strong>' },
      { html: 'Having the right mentors was key.' },
      { html: 'Focused on building a brand that has long term success' },
    ],
  },
];

// Composite "As seen on" logo strip (black & white, all logos baked
// into one image so we get pixel-perfect spacing without juggling
// 7 individual SVGs at different intrinsic sizes).
const LOGOS_IMG_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/Logos%20black%20and%20white%203.jpg';

function getUnlockDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + UNLOCK_DURATION_MS;
  try {
    const raw = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (raw) {
      const startedAt = parseInt(raw, 10);
      if (!Number.isNaN(startedAt)) {
        const deadline = startedAt + UNLOCK_DURATION_MS;
        if (deadline > Date.now()) return deadline;
      }
    }
  } catch { /* no-op */ }
  const fresh = Date.now();
  try { sessionStorage.setItem(UNLOCK_STORAGE_KEY, String(fresh)); } catch { /* no-op */ }
  return fresh + UNLOCK_DURATION_MS;
}

function formatMS(deadline: number): { m: string; s: string; remaining: number } {
  const remaining = Math.max(0, deadline - Date.now());
  const totalSec = Math.floor(remaining / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return { m, s, remaining };
}

/* ───── Vidalytics VSL embed - injects the loader script once
   and renders the target div with the matching ID. The loader
   self-initializes by looking up the div by ID. ───────────────── */
function VidalyticsEmbed() {
  useEffect(() => {
    if (document.getElementById('pp-vidalytics-loader')) return;
    const s = document.createElement('script');
    s.id = 'pp-vidalytics-loader';
    s.type = 'text/javascript';
    s.text = `(function (v, i, d, a, l, y, t, c, s) {
      y='_'+d.toLowerCase();c=d+'L';if(!v[d]){v[d]={};}if(!v[c]){v[c]={};}if(!v[y]){v[y]={};}
      var vl='Loader',vli=v[y][vl],vsl=v[c][vl + 'Script'],vlf=v[c][vl + 'Loaded'],ve='Embed';
      if (!vsl){vsl=function(u,cb){
        if(t){cb();return;}s=i.createElement("script");s.type="text/javascript";s.async=1;s.src=u;
        if(s.readyState){s.onreadystatechange=function(){if(s.readyState==="loaded"||s.readyState=="complete"){s.onreadystatechange=null;vlf=1;cb();}};}else{s.onload=function(){vlf=1;cb();};}
        i.getElementsByTagName("head")[0].appendChild(s);
      };}
      vsl(l+'loader.min.js',function(){if(!vli){var vlc=v[c][vl];vli=new vlc();}vli.loadScript(l+'player.min.js',function(){var vec=v[d][ve];t=new vec();t.run(a);});});
    })(window, document, 'Vidalytics', '${VIDALYTICS_EMBED_ID}', '${VIDALYTICS_EMBED_URL}');`;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      id={VIDALYTICS_EMBED_ID}
      style={{ width: '100%', position: 'relative', paddingTop: '56.25%' }}
    />
  );
}

/* ───── Wistia inline embed for testimonials ─────────────────────
   Iframe is the simplest cross-browser embed - allows fullscreen
   + autoplay (the user still has to click play, this just permits
   the gesture). 16:9 aspect ratio wrapper. ──────────────────── */
function WistiaEmbed({ mediaId }: { mediaId: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-900 shadow-xl" style={{ paddingTop: '56.25%' }}>
      <iframe
        src={`https://fast.wistia.net/embed/iframe/${mediaId}?seo=true&videoFoam=true`}
        title={`Testimonial video ${mediaId}`}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-sm font-medium" style={{ paddingTop: '56.25%' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        Video coming soon
      </div>
    </div>
  );
}

export function NextStep() {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  const [deadline] = useState<number>(() => getUnlockDeadline());
  const [, setNow] = useState<number>(() => Date.now());
  const [videoInteracted, setVideoInteracted] = useState(false);
  const [videoPlayedMs, setVideoPlayedMs] = useState(0);

  // identify from URL params (from /newform or other opt-in step)
  useEffect(() => {
    document.title = 'How I Used The Passion Product Formula - Free Training';
    const params = new URLSearchParams(window.location.search);
    const id = getCleanIdentity(params);
    if (id.email) {
      identifyUser(id.email, {
        first_name: id.firstname ?? undefined,
        last_name:  id.lastname  ?? undefined,
        phone:      id.phone     ?? undefined,
      });
    }
    trackEvent('nextstep_page_viewed', {
      email_in_url: !!id.email,
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Video play tracking. Vidalytics injects an HTMLMediaElement
     somewhere inside the container after its loader runs - watch
     for it with a MutationObserver and attach play/pause/ended
     listeners. While the media is playing, tick the accumulated
     time every second. If Vidalytics ever changes their internals
     and the media element never gets attached, the click handler
     on the video container is a fallback signal that at least
     stops the bouncing "Hit Play" prompt. */
  useEffect(() => {
    const container = videoRef.current;
    if (!container) return;

    let attachedEl: HTMLMediaElement | null = null;
    const onPlay = () => {
      playingRef.current = true;
      setVideoInteracted(true);
    };
    const onPause = () => { playingRef.current = false; };
    const onEnded = () => { playingRef.current = false; };

    const tryAttach = () => {
      if (attachedEl && document.contains(attachedEl)) return;
      const found = container.querySelector('video, audio') as HTMLMediaElement | null;
      if (!found || found === attachedEl) return;
      // detach from any prior element first
      if (attachedEl) {
        attachedEl.removeEventListener('play', onPlay);
        attachedEl.removeEventListener('pause', onPause);
        attachedEl.removeEventListener('ended', onEnded);
      }
      attachedEl = found;
      found.addEventListener('play', onPlay);
      found.addEventListener('pause', onPause);
      found.addEventListener('ended', onEnded);
      // if Vidalytics autoplays, capture immediately
      if (!found.paused) onPlay();
    };

    tryAttach();
    const observer = new MutationObserver(tryAttach);
    observer.observe(container, { childList: true, subtree: true });

    const tick = setInterval(() => {
      if (playingRef.current) {
        setVideoPlayedMs((prev) => prev + 1000);
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(tick);
      if (attachedEl) {
        attachedEl.removeEventListener('play', onPlay);
        attachedEl.removeEventListener('pause', onPause);
        attachedEl.removeEventListener('ended', onEnded);
      }
    };
  }, []);

  // re-derive on every render so the displayed time stays current
  // (now tick lives in state so this recomputes once per second)
  const live = formatMS(deadline);
  const unlocked = live.remaining <= 0;
  const videoDeepEnough = videoPlayedMs >= VIDEO_DEPTH_THRESHOLD_MS;

  const scrollToTestimonials = () => {
    trackEvent('nextstep_orange_cta_clicked');
    testimonialsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToVideo = () => {
    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVideoContainerClick = () => {
    // Fallback signal in case the underlying <video> element's play
    // event never fires (e.g. Vidalytics changes their player guts).
    // No-op if already interacted.
    if (!videoInteracted) setVideoInteracted(true);
  };

  /* Green CTA click handler. Two paths:
     - If the visitor has watched < VIDEO_DEPTH_THRESHOLD_MS of the
       VSL, intercept the navigation and scroll them back up to the
       video. They aren't ready yet.
     - If they've watched enough, let the <Link> navigation through. */
  const onCtaClick = (position: string, e: React.MouseEvent) => {
    trackEvent('nextstep_green_cta_clicked', {
      position,
      video_played_ms: videoPlayedMs,
      sent_to_book: videoDeepEnough,
    });
    if (!videoDeepEnough) {
      e.preventDefault();
      scrollToVideo();
    }
  };

  // Pre-build the CTA href, forwarding identity from the URL so the
  // booking page can keep the visitor identified.
  const ctaHref = useMemo(() => {
    if (typeof window === 'undefined') return PRIMARY_CTA_DESTINATION;
    const incoming = new URLSearchParams(window.location.search);
    const out = new URLSearchParams();
    for (const k of ['email', 'firstname', 'lastname', 'phone']) {
      const v = incoming.get(k);
      if (v) out.set(k, v);
    }
    return out.toString() ? `${PRIMARY_CTA_DESTINATION}?${out.toString()}` : PRIMARY_CTA_DESTINATION;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-white text-gray-900">
      {/* Page-scoped keyframes:
          - nextstep-bounce: subtle ~4px vertical nudge for the
            "Hit Play" prompt until the visitor interacts with the
            video. Smaller amplitude than Tailwind's animate-bounce
            so it reads as a hint, not a jump.
          - nextstep-unlock: the moment the timer hits 0 and the
            countdown widget swaps to the green CTA, a quick pop
            scale draws the eye to it. */}
      <style>{`
        @keyframes nextstep-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes nextstep-unlock {
          0%   { transform: scale(0.94); opacity: 0; }
          60%  { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
      <main className="max-w-5xl mx-auto px-5 pt-4 md:pt-6 pb-16">
        {/* Hero - compact stylized header */}
        <div className="text-center mb-3 md:mb-4">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Flame className="w-3 h-3" />
            Free Training
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-2 text-slate-900">
            How I Used <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">&ldquo;The Passion Product Formula&rdquo;</span> to Create a 7-Figure Amazon Business in Under 3 Months
          </h1>
          {/* Subtle bounce on the "Hit Play" prompt until the visitor
              starts the video. nextstep-bounce keyframe defined inline
              below the JSX - smaller amplitude than Tailwind's
              animate-bounce so it nudges rather than jumps. */}
          <p
            className={`text-sm md:text-base text-gray-600 flex items-center justify-center gap-2 ${videoInteracted ? '' : '[animation:nextstep-bounce_1.4s_ease-in-out_infinite]'}`}
          >
            <ArrowDown className="w-3.5 h-3.5 text-orange-600" />
            <span><span className="font-bold text-orange-600">"Hit Play"</span> To Watch The Free Training</span>
            <ArrowDown className="w-3.5 h-3.5 text-orange-600" />
          </p>
        </div>

        {/* VSL video */}
        <div ref={videoRef} className="relative max-w-4xl mx-auto" onClick={handleVideoContainerClick}>
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-black">
            <VidalyticsEmbed />
          </div>
        </div>

        {/* Sub-prompt under video */}
        <p className="text-center text-gray-600 text-sm md:text-base mt-4 mb-3">
          Curious how I guide Amazon sellers to success in record time?
        </p>

        {/* Resource-unlock countdown.
            While the timer is counting down, this is a small white
            card with the digits. The moment it hits 0 the entire
            widget transforms into a full green "YES! I'm Ready To
            Learn More" CTA button - same scroll-back-if-shallow
            logic as the post-testimonial green CTAs. */}
        <div className="max-w-md mx-auto mb-5">
          {unlocked ? (
            <Link
              to={ctaHref}
              onClick={(e) => onCtaClick('unlock_timer', e)}
              className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-black tracking-tight px-6 py-4 md:py-5 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 [animation:nextstep-unlock_500ms_ease-out]"
            >
              <div className="flex items-center justify-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-green-50/90 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Your Amazon Resources Are Unlocked
              </div>
              <div className="text-base md:text-xl">YES! I'm Ready To Learn More</div>
            </Link>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-4">
              <p className="text-center text-xs md:text-sm font-semibold text-gray-700 mb-2">
                Your Amazon Resources Will Unlock In:
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <div className="flex flex-col items-center">
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums leading-none">{live.m}</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Minutes</div>
                </div>
                <div className="text-2xl font-black text-gray-300 leading-none">:</div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums leading-none">{live.s}</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Seconds</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* As seen on */}
        <div className="text-center mb-5">
          <h2 className="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest mb-3">As seen on</h2>
          <img
            src={LOGOS_IMG_URL}
            alt="Featured on Helium 10, Jungle Scout, Amazon Ads, Prosper Show, HuffPost, Forbes, Medium"
            loading="lazy"
            className="max-w-full md:max-w-3xl mx-auto h-auto opacity-80"
          />
        </div>

        {/* Primary scroll-down CTA */}
        <button
          type="button"
          onClick={scrollToTestimonials}
          className="w-full max-w-3xl mx-auto flex bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-base md:text-xl font-black tracking-tight py-3 md:py-4 px-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 items-center justify-center gap-3"
        >
          <ArrowDown className="w-5 h-5 flex-shrink-0" />
          <span>Watch how this system changes lives...</span>
        </button>

        {/* Lead-in to testimonials */}
        <p className="text-center text-gray-600 italic text-sm md:text-base mt-7 mb-6 max-w-2xl mx-auto">
          These are just a handful of the hundreds of success stories created through the Passion Product blueprint.
        </p>

        {/* Testimonials section */}
        <div ref={testimonialsRef} className="space-y-7">
          {TESTIMONIALS.map((t, idx) => (
            <React.Fragment key={idx}>
              <TestimonialCard testimonial={t} />
              {/* Green "YES! I'm Ready To Learn More" CTA after every
                  ~2 testimonials, mirroring the CF page rhythm */}
              {(idx === 1 || idx === 2 || idx === 3 || idx === 5) && (
                <div className="flex justify-center pt-2">
                  <Link
                    to={ctaHref}
                    onClick={(e) => onCtaClick(`after_testimonial_${idx + 1}`, e)}
                    className="inline-block bg-green-500 hover:bg-green-600 text-white text-base md:text-lg font-black tracking-tight px-8 md:px-12 py-4 md:py-5 rounded-lg shadow-md shadow-green-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    YES! I'm Ready To Learn More
                  </Link>
                </div>
              )}
            </React.Fragment>
          ))}
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
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            <span className="font-bold">IMPORTANT NOTICE:</span> The revenue figures and outcomes referenced represent
            our personal achievements and, in certain instances, the results obtained by current or former clients.
            These outcomes are not standard or guaranteed. Most individuals who consume educational webinar content see
            minimal to no results. Your success will differ and depends on numerous variables including your experience,
            dedication, and effort level.
          </p>
        </div>
      </footer>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { title, videoSide, wistiaMediaId, bullets } = testimonial;
  const videoCol = (
    <div className="md:w-1/2 w-full">
      {wistiaMediaId ? <WistiaEmbed mediaId={wistiaMediaId} /> : <VideoPlaceholder />}
    </div>
  );
  const contentCol = (
    <div className="md:w-1/2 w-full">
      <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight underline decoration-2 underline-offset-4 mb-5">
        {title}
      </h3>
      <ul className="space-y-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <ArrowDown className="w-3 h-3 text-white" style={{ transform: 'rotate(-90deg)' }} />
              </div>
            </div>
            <p
              className="text-gray-700 leading-snug text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: b.html }}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 md:p-7">
      <div className={`flex flex-col md:flex-row gap-6 md:gap-8 ${videoSide === 'right' ? '' : 'md:flex-row-reverse'}`}>
        {contentCol}
        {videoCol}
      </div>
    </div>
  );
}
