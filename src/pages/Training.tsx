import React, { useEffect, useState } from 'react';
import {
  ResearchVideo,
  TestimonialHighlights,
  SharedFooter,
  LowCapitalStrategies,
  CreditCardQuiz,
  ConfirmationExitPopup,
  MethodCheckIn,
  NextStepsList,
} from '../components/TrainingNewSections';
import { CheckCircle, Star, Shield } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';
import { identifyUser, setPersonProperties, trackConfirmationPageViewed } from '../lib/posthog';
import { PrepChecklistProvider, usePrepChecklist } from '../context/PrepChecklistContext';

/* ───────────────── generic confirmation banner ────────────────────── */

function ConfirmationBanner({ firstName }: { firstName: string }) {
  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 md:pt-8 md:pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider text-green-700 mb-4">
          <CheckCircle className="w-3 h-3" />
          You're in
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.05] mb-2">
          {firstName ? `You're all set, ${firstName}.` : "You're all set."}
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Check your email for the calendar invite and join link.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────── final CTA ──────────────────────────────── */

function FinalCTA({ firstName }: { firstName: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {firstName ? `${firstName}, you've taken the ` : "You've Already Taken the "}
          <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          Most people think about starting for months. Or years. You actually took action. Show up ready and let's build your plan together.
        </p>

        {/* Email check-in callout */}
        <div className="bg-white/5 backdrop-blur-sm border border-orange-400/40 rounded-2xl p-5 md:p-6 max-w-xl mx-auto mb-10 text-left">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-300 text-lg">📩</span>
            </div>
            <div className="flex-1">
              <p className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-1">
                Check your email
              </p>
              <p className="text-white font-bold text-base md:text-lg leading-snug mb-2">
                Look for an email titled <span className="text-orange-300">"I need to tell you something before your call"</span>
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                It has important info for your call. Open it, read it, and you'll be ready to go.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-orange-400" /> 14,000+ students taught</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function Training() {
  const [p, setP] = useState<Personalization | null>(null);

  useEffect(() => {
    const personalization = getPersonalization();
    setP(personalization);

    if (personalization.email) {
      identifyUser(personalization.email, {
        first_name: personalization.firstName,
        last_name: personalization.lastName,
      });
    }
    setPersonProperties({
      region: personalization.region,
      reason: personalization.reason,
      situation: personalization.situation,
      travis_history: personalization.travisHistory,
      valued_feature: personalization.valuedFeature,
      capital: personalization.capital,
    });
    trackConfirmationPageViewed('generic', {
      region: personalization.region,
      reason: personalization.reason,
      situation: personalization.situation,
      capital: personalization.capital,
    });
  }, []);

  return (
    <PrepChecklistProvider>
      <AutoMarkMicroAsk />
      <div className="min-h-screen bg-white text-gray-900">
        <ConfirmationBanner firstName={p?.firstName || ''} />
        <ResearchVideo />
        <NextStepsList
          microAskLabel="Check your email for the calendar invite"
        />
        <TestimonialHighlights p={p} />
        <MethodCheckIn />
        <LowCapitalStrategies p={p} />
        <CreditCardQuiz p={p} />
        <FinalCTA firstName={p?.firstName || ''} />
        <SharedFooter />
        <ConfirmationExitPopup />
      </div>
    </PrepChecklistProvider>
  );
}

// Generic /training doesn't have a confirm button, so auto-mark micro-ask done
function AutoMarkMicroAsk() {
  const { markDone } = usePrepChecklist();
  useEffect(() => {
    markDone('microAsk');
  }, [markDone]);
  return null;
}
