import React, { useEffect, useState } from 'react';
import { Mail, GraduationCap, ArrowRight, Sparkles, Search, Clock } from 'lucide-react';
import { SharedFooter } from '../components/TrainingNewSections';
import { trackEvent } from '../lib/posthog';

/* ───── /migration ────────────────────────────────────────────────
   Three-option routing page for the passionproductformula.com →
   travismarziani.com migration. Goal: someone landing here should
   instantly see which of three buckets they're in and what to do.

   1. Former Passion Product members — find the migration email,
      with a live countdown to the access deadline.
   2. Prospects who never bought — sent to start.travismarziani.com.
   3. Passion Product Fast Track students — emailed access manually.
──────────────────────────────────────────────────────────────────── */

const MIGRATION_DEADLINE_ISO = '2026-05-12T23:59:59-04:00';
const MIGRATION_EMAIL_SUBJECT = '[Action Required] Update to Your Passion Product Account';
const START_URL = 'http://start.travismarziani.com/?utm_source=ppfredirect';
const SUPPORT_EMAIL = 'travis@passionproduct.com';
const GMAIL_SEARCH_URL = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`subject:"${MIGRATION_EMAIL_SUBJECT}"`)}`;
const FAST_TRACK_MAILTO =
  `mailto:${SUPPORT_EMAIL}` +
  `?subject=${encodeURIComponent('Fast Track migration access')}` +
  `&body=${encodeURIComponent("Hi Travis,\n\nI'm a Passion Product Fast Track student and need access to the new platform.\n\nThanks!")}`;

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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function Migration() {
  const target = new Date(MIGRATION_DEADLINE_ISO).getTime();
  const c = useCountdown(target);

  useEffect(() => {
    trackEvent('migration_page_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white">
      {/* Hero — compact so the three options are above the fold */}
      <header className="text-center pt-12 md:pt-20 pb-8 md:pb-12 px-5">
        <p className="text-orange-600 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-3">
          We've migrated
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-4 max-w-3xl mx-auto">
          passionproductformula.com is{' '}
          <span className="text-orange-600">moving.</span>
        </h1>
        <p className="text-base md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
          Pick the option that's you. Takes 30 seconds.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch">

          {/* ─── Card 1: Former member (urgent / orange) ──────────── */}
          <div className="relative flex flex-col bg-white border-2 border-orange-300 rounded-3xl p-6 md:p-7 shadow-lg shadow-orange-100/50">
            <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              <Clock className="w-3 h-3" />
              Time-sensitive
            </div>

            <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mb-5">
              <Mail className="w-7 h-7 text-orange-600" strokeWidth={2.25} />
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-gray-900 mb-3">
              I'm a former Passion Product member.
            </h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Find the migration email in your inbox to get access to the new platform.
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-1">
                Subject line
              </p>
              <p className="font-bold text-gray-900 text-sm md:text-base leading-snug break-words">
                {MIGRATION_EMAIL_SUBJECT}
              </p>
            </div>

            {!c.expired ? (
              <div className="bg-gray-900 text-white rounded-xl px-4 py-3 mb-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-300 mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Expires May 12, 2026
                </div>
                <div className="font-mono font-black tabular-nums text-lg md:text-xl">
                  {pad(c.days)}d {pad(c.hours)}h {pad(c.minutes)}m {pad(c.seconds)}s
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mb-5 text-sm leading-relaxed">
                Migration window closed. Email{' '}
                <span className="font-bold">{SUPPORT_EMAIL}</span> for help.
              </div>
            )}

            <a
              href={GMAIL_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('migration_search_inbox_clicked')}
              className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search my Gmail for it
            </a>
          </div>

          {/* ─── Card 2: Prospect (blue) ──────────────────────────── */}
          <div className="flex flex-col bg-white border-2 border-blue-200 rounded-3xl p-6 md:p-7 shadow-lg shadow-blue-100/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-blue-600" strokeWidth={2.25} />
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-gray-900 mb-3">
              I'm new — I want to learn about working with Travis.
            </h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Head to Travis's main site to see what the team is doing now and how to get started.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-gray-700 leading-relaxed">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                You'll find
              </p>
              <p>Free training, the strategy call booking, and how the program works.</p>
            </div>

            <a
              href={START_URL}
              onClick={() => trackEvent('migration_start_clicked')}
              className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              Visit start.travismarziani.com
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* ─── Card 3: Fast Track (emerald) ─────────────────────── */}
          <div className="flex flex-col bg-white border-2 border-emerald-200 rounded-3xl p-6 md:p-7 shadow-lg shadow-emerald-100/40">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-5">
              <GraduationCap className="w-7 h-7 text-emerald-600" strokeWidth={2.25} />
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-gray-900 mb-3">
              I'm a Fast Track student.
            </h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              Email Travis directly and he'll grant you access to the new platform.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 text-sm text-gray-700 leading-relaxed">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Send to
              </p>
              <p className="font-bold text-gray-900 break-all">{SUPPORT_EMAIL}</p>
            </div>

            <a
              href={FAST_TRACK_MAILTO}
              onClick={() => trackEvent('migration_support_email_clicked')}
              className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Email Travis
            </a>
          </div>
        </div>

        {/* Catch-all */}
        <p className="text-center text-sm text-gray-500 mt-10 md:mt-12 leading-relaxed px-4">
          Not sure which one is you? Email{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            onClick={() => trackEvent('migration_support_email_clicked')}
            className="font-bold text-gray-700 hover:text-orange-600 underline underline-offset-2 cursor-pointer"
          >
            {SUPPORT_EMAIL}
          </a>{' '}
          and we'll point you in the right direction.
        </p>
      </main>

      <SharedFooter />
    </div>
  );
}
