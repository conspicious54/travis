/* ───── Shared variant components ────────────────────────────────
   Small UI blocks used by one or more cycle-1 experiment variants.
   Each one accepts a `location` prop so its click/view events can
   be attributed to setter vs closer, and reads nothing visitor-
   specific (that comes from the page passing props in).

   Keep this file small - any variant that lives in only one place
   should stay inline in that page component instead. ──────────── */

import { useEffect } from 'react';
import { Calendar, ArrowDown, TrendingUp, Users } from 'lucide-react';
import { trackEvent } from '../lib/posthog';

/* "Over 40% of our students launch with less than $2k" chip. Shown
   below the first video (not above the confirm block) with a button
   that scrolls down to the student-examples section. Used by both
   low-capital experiments (setter + closer). */
export function LowCapitalLaunchStatChip({
  location,
  anchorId = 'typical-student-results',
}: {
  location: 'setter' | 'closer';
  anchorId?: string;
}) {
  useEffect(() => {
    trackEvent('low_capital_stat_chip_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    trackEvent('low_capital_stat_chip_clicked', { location });
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-6 mb-2">
      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 p-4 md:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base text-gray-900 font-bold leading-snug">
              Over 40% of our students launch their first product with less than $2,000.
            </p>
            <p className="text-xs md:text-sm text-gray-600 leading-snug mt-1">
              See exactly how they did it.
            </p>
            <button
              type="button"
              onClick={handleClick}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              See student examples
              <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* "This call is a mutual-fit check, not a pitch" micro-copy.
   One-line reassurance meant to render immediately above the
   confirm CTA for high-capital visitors. */
export function MutualFitMicroCopy({
  location,
}: {
  location: 'setter' | 'closer';
}) {
  useEffect(() => {
    trackEvent('mutual_fit_microcopy_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="max-w-lg mx-auto text-xs md:text-sm text-gray-500 italic mb-3 leading-snug">
      This call is a mutual-fit check, not a pitch. If we're not a fit, we'll tell you.
    </p>
  );
}

/* Social proof chip with Amazon Ads Verified Partner badge. Renders
   above the confirm CTA on the setter page for new (never/recent)
   visitors. Only keep this live if we actually hold Amazon Ads
   Partner Network status - the claim text is on the page. */
export function AmazonAdsSocialProofChip({
  location,
}: {
  location: 'setter' | 'closer';
}) {
  useEffect(() => {
    trackEvent('amazon_ads_proof_chip_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-lg mx-auto mb-4 flex items-center justify-center gap-2 flex-wrap text-xs md:text-sm">
      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-semibold">
        <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
        14,000+ students taught
      </span>
      <span className="inline-flex items-center gap-2 bg-[#232F3E] text-white pl-2 pr-3 py-1.5 rounded-full font-semibold">
        <img
          src="https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/AmazonAds.png"
          alt="Amazon Ads"
          className="h-4 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
          loading="lazy"
        />
        Verified Partner
      </span>
    </div>
  );
}

/* "Add to calendar" button, closer page × familiarity:known
   variant. One-click intent capture - sometimes the person who
   booked but is wavering clicks this and visibly commits, lifting
   confirm follow-through. We generate the Google-Calendar URL
   from the already-known meeting start time. */
export function AddToCalendarButton({
  startISO,
  title,
  description,
  location,
}: {
  startISO: string;
  title: string;
  description: string;
  location: 'setter' | 'closer';
}) {
  const handleClick = () => {
    trackEvent('add_to_calendar_clicked', { location });
    const start = new Date(startISO);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h default
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(description)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    trackEvent('add_to_calendar_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition-colors cursor-pointer mb-3"
    >
      <Calendar className="w-4 h-4" />
      Add to Google Calendar
    </button>
  );
}

/* Expectation-setting block for setter × familiarity:known. These
   visitors have been following Travis for months+. The pre-call
   waiting window is often where they drop off. One line telling
   them exactly what happens next reduces anxiety and should lift
   confirm follow-through. */
export function Within24hExpectationBlock({
  location,
}: {
  location: 'setter' | 'closer';
}) {
  useEffect(() => {
    trackEvent('within_24h_block_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-lg mx-auto mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm md:text-base text-gray-800 leading-snug text-center">
        <span className="font-bold text-blue-800">We'll text you within 24 hours</span>{' '}
        to lock in your call time with your coach.
      </p>
    </div>
  );
}

/* Android fallback: a "Having trouble? Tap to call us" link next to
   the main SMS button, Android-only. Android's sms:// pre-fill is
   historically flaky across OEMs - the tel: escape hatch gives
   visitors whose compose window broke a way through. */
export function AndroidCallFallback({
  phoneRaw,
  location,
}: {
  phoneRaw: string;
  location: 'setter' | 'closer';
}) {
  const handleClick = () => {
    trackEvent('android_call_fallback_clicked', { location });
  };
  useEffect(() => {
    trackEvent('android_call_fallback_shown', { location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <a
      href={`tel:${phoneRaw}`}
      onClick={handleClick}
      className="mt-2 inline-flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
    >
      Messages app didn't open? Tap to call us instead.
    </a>
  );
}
