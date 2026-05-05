import React, { useEffect, useState } from 'react';
import { Mail, ExternalLink, AlertCircle, GraduationCap, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { SharedFooter } from '../components/TrainingNewSections';
import { trackEvent } from '../lib/posthog';

/* ───── /migration ────────────────────────────────────────────────
   Holding page for the passionproductformula.com → travismarziani.com
   migration. Three audiences are routed differently here:

   1. Former Passion Product members — told to find the migration
      email we already sent. Countdown gives the actual expiration.
   2. Prospects who never bought — sent to star.travismarziani.com.
   3. Passion Product Fast Track students — emailed access manually.

   Eventually this page goes away and passionproductformula.com 301s
   straight to travismarziani.com. Until then we need to soak up the
   "where did my course go?" emails.
──────────────────────────────────────────────────────────────────── */

// Absolute deadline: the migration access email expires at end of
// day on May 12, 2026 (Eastern). Hard-coded so every visitor sees
// the same countdown regardless of when they load the page.
const MIGRATION_DEADLINE_ISO = '2026-05-12T23:59:59-04:00';
const MIGRATION_EMAIL_SUBJECT = '[Action Required] Update to Your Passion Product Account';

const STAR_URL =
  'https://star.travismarziani.com/?utm_source=passionproductformula&utm_medium=migration&utm_campaign=ppf_sunset';
const SUPPORT_EMAIL = 'travis@passionproduct.com';

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  const seconds = Math.floor((diff / 1_000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white font-mono font-black text-3xl md:text-5xl rounded-xl px-3 md:px-5 py-3 md:py-4 min-w-[64px] md:min-w-[88px] text-center tabular-nums shadow-lg">
        {padded}
      </div>
      <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">
        {label}
      </div>
    </div>
  );
}

export function Migration() {
  const target = new Date(MIGRATION_DEADLINE_ISO).getTime();
  const c = useCountdown(target);

  useEffect(() => {
    trackEvent('migration_page_viewed');
  }, []);

  const handleStarClick = () => {
    trackEvent('migration_star_clicked');
  };

  const handleSupportClick = () => {
    trackEvent('migration_support_email_clicked');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <div className="bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-white border-b border-orange-100/60">
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-700 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            We've Migrated
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-4">
            passionproductformula.com is{' '}
            <span className="text-orange-600">moving.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-snug">
            Find the option below that matches you and follow the steps.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-10">
        {/* Section 1: Former Passion Product member */}
        <section className="bg-white border-2 border-orange-200 rounded-2xl p-6 md:p-9 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 w-12 h-12 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-600" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-1">
                Option 1
              </p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                I'm a former Passion Product member.
              </h2>
            </div>
          </div>

          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-5">
            Check your email inbox (and spam) for the subject line below. It has the steps for
            accessing the new platform.
          </p>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 md:px-5 py-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Look for this exact subject line:
            </p>
            <p className="font-bold text-gray-900 text-base md:text-lg leading-snug break-words">
              {MIGRATION_EMAIL_SUBJECT}
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-red-600" />
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-red-700">
                {c.expired ? 'Migration window closed' : 'Time left to migrate'}
              </p>
            </div>
            {c.expired ? (
              <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                The migration window has closed. If you still need access, email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  onClick={handleSupportClick}
                  className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                and we'll help you out.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <CountdownCell value={c.days} label="Days" />
                  <span className="text-2xl md:text-4xl font-black text-gray-400 mb-5">:</span>
                  <CountdownCell value={c.hours} label="Hours" />
                  <span className="text-2xl md:text-4xl font-black text-gray-400 mb-5">:</span>
                  <CountdownCell value={c.minutes} label="Minutes" />
                  <span className="text-2xl md:text-4xl font-black text-gray-400 mb-5">:</span>
                  <CountdownCell value={c.seconds} label="Seconds" />
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-4 text-center leading-relaxed">
                  The migration email was sent at the start of April. Access expires{' '}
                  <span className="font-bold text-gray-900">May 12, 2026</span>.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Prospect — not a student */}
        <section className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-9 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-600" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-[0.15em] mb-1">
                Option 2
              </p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                I'm not a student — I want to learn about working with Travis.
              </h2>
            </div>
          </div>

          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">
            Head over to Travis's main site to see what the team is doing right now and how to
            get started.
          </p>

          <a
            href={STAR_URL}
            onClick={handleStarClick}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
          >
            Visit travismarziani.com
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* Section 3: Fast Track student */}
        <section className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-9 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-600" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-[0.15em] mb-1">
                Option 3
              </p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                I'm a Passion Product Fast Track student.
              </h2>
            </div>
          </div>

          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">
            Send Travis an email and he'll grant you access to the new platform directly.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Fast Track migration access')}&body=${encodeURIComponent("Hi Travis,\n\nI'm a Passion Product Fast Track student and need access to the new platform.\n\nThanks!")}`}
            onClick={handleSupportClick}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email {SUPPORT_EMAIL}
          </a>
        </section>

        {/* Footer note */}
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
          <AlertCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <p>
            Still stuck? Email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              onClick={handleSupportClick}
              className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            and we'll point you in the right direction.
          </p>
        </div>
      </div>

      <SharedFooter />
    </div>
  );
}
