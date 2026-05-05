import React, { useEffect, useState } from 'react';
import { Mail, GraduationCap, ArrowRight, BookOpen } from 'lucide-react';
import { SharedFooter } from '../components/TrainingNewSections';
import { trackEvent } from '../lib/posthog';

/* ───── /migration ────────────────────────────────────────────────
   Holding page for the passionproductformula.com → travismarziani.com
   migration. Three audiences are routed differently here:

   1. Former Passion Product members — find the migration email,
      with a countdown to the access deadline.
   2. Prospects who never bought — sent to start.travismarziani.com.
   3. Passion Product Fast Track students — emailed access manually.

   Eventually this page goes away and passionproductformula.com 301s
   straight to travismarziani.com. Until then we need to soak up the
   "where did my course go?" emails.
──────────────────────────────────────────────────────────────────── */

const MIGRATION_DEADLINE_ISO = '2026-05-12T23:59:59-04:00';
const MIGRATION_EMAIL_SUBJECT = '[Action Required] Update to Your Passion Product Account';
const START_URL = 'http://start.travismarziani.com/?utm_source=ppfredirect';
const SUPPORT_EMAIL = 'travis@passionproduct.com';

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    expired: diff === 0,
  };
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl md:text-5xl font-black tabular-nums text-gray-900">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-gray-500 mt-1">
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

  const handleStartClick = () => trackEvent('migration_start_clicked');
  const handleSupportClick = () => trackEvent('migration_support_email_clicked');

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-5 pt-16 md:pt-24 pb-16 md:pb-24">
        {/* Hero */}
        <header className="mb-14 md:mb-16">
          <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            We've migrated
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4">
            passionproductformula.com is moving.
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Find the option below that matches you.
          </p>
        </header>

        {/* Option 1 — Former member */}
        <section className="border-t border-gray-200 pt-10 md:pt-12 mb-12 md:mb-14">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
              Former Passion Product member
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4">
            Check your email for the migration link.
          </h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-5">
            Search your inbox (and spam) for the subject line below. It has the steps for accessing
            the new platform.
          </p>

          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Subject line
            </p>
            <p className="font-bold text-gray-900 leading-snug break-words">
              {MIGRATION_EMAIL_SUBJECT}
            </p>
          </div>

          {c.expired ? (
            <p className="text-gray-700 text-base leading-relaxed">
              The migration window has closed. Email{' '}
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
            <div>
              <div className="flex items-end justify-start gap-5 md:gap-7 mb-3">
                <CountdownCell value={c.days} label="Days" />
                <CountdownCell value={c.hours} label="Hours" />
                <CountdownCell value={c.minutes} label="Minutes" />
                <CountdownCell value={c.seconds} label="Seconds" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Access expires <span className="font-semibold text-gray-700">May 12, 2026</span>.
              </p>
            </div>
          )}
        </section>

        {/* Option 2 — Not a student */}
        <section className="border-t border-gray-200 pt-10 md:pt-12 mb-12 md:mb-14">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
              Not a student
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4">
            Looking to learn about working with Travis?
          </h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">
            Head to Travis's main site to see what the team is doing right now and how to get
            started.
          </p>
          <a
            href={START_URL}
            onClick={handleStartClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors cursor-pointer"
          >
            Visit start.travismarziani.com
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* Option 3 — Fast Track */}
        <section className="border-t border-gray-200 pt-10 md:pt-12">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
              Fast Track student
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4">
            Email Travis directly for access.
          </h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">
            Send a note to{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Fast Track migration access')}&body=${encodeURIComponent("Hi Travis,\n\nI'm a Passion Product Fast Track student and need access to the new platform.\n\nThanks!")}`}
              onClick={handleSupportClick}
              className="font-bold text-gray-900 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            and he'll grant you access to the new platform directly.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Fast Track migration access')}&body=${encodeURIComponent("Hi Travis,\n\nI'm a Passion Product Fast Track student and need access to the new platform.\n\nThanks!")}`}
            onClick={handleSupportClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm md:text-base transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email {SUPPORT_EMAIL}
          </a>
        </section>
      </div>

      <SharedFooter />
    </div>
  );
}
