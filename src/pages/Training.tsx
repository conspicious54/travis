import React, { useEffect, useState } from 'react';
import {
  ResearchVideo,
  BreakoutVideos,
  OpportunitySection,
  TestimonialHighlights,
  ResourceSection,
  SharedFooter,
  PersonalizedIntro,
  WhatToExpect,
  LowCapitalStrategies,
  CreditCardQuiz,
  ConfirmationExitPopup,
} from '../components/TrainingNewSections';
import { CheckCircle, Star, Shield } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';
import { identifyUser, setPersonProperties, trackConfirmationPageViewed } from '../lib/posthog';

/* ───────────────── shared step progress bar ───────────────────────── */

function StepProgressBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booked</span>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold ring-4 ring-orange-100">
              2
            </div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Prepare</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── generic confirmation banner ────────────────────── */

function ConfirmationBanner() {
  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-7 md:pt-8 md:pb-9 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          You're In. Now Complete <span className="text-orange-600">Step 2</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
          Watch the video below and explore the resources before your call. The more prepared you are, the more value you'll get.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────── final CTA ──────────────────────────────── */

function FinalCTA() {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          You've Already Taken the <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Most people think about starting for months. Or years. You actually took action. Show up ready, and let's build your plan together.
        </p>

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
    <div className="min-h-screen bg-white text-gray-900">
      <StepProgressBar />
      <ConfirmationBanner />
      <ResearchVideo />
      <PersonalizedIntro p={p} />
      <WhatToExpect p={p} />
      <BreakoutVideos p={p} />
      <OpportunitySection />
      <TestimonialHighlights p={p} />
      <LowCapitalStrategies p={p} />
      <CreditCardQuiz p={p} />
      <ResourceSection />
      <FinalCTA />
      <SharedFooter />
      <ConfirmationExitPopup />
    </div>
  );
}
