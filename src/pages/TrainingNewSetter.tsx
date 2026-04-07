import React, { useState, useEffect } from 'react';
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
} from '../components/TrainingNewSections';
import { CheckCircle, Phone, UserPlus, Star, Shield } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';

/* ─────────────────── region & platform detection ─────────────────── */

type Region = 'us' | 'eu' | 'aunz';

const PHONE_NUMBERS: Record<Region, { display: string; raw: string; label: string }> = {
  us:   { display: '(830) 357-7613',    raw: '+18303577613',  label: 'USA / Canada' },
  eu:   { display: '+44 7853 306509',   raw: '+447853306509', label: 'UK / Europe' },
  aunz: { display: '+61 489 089 374',   raw: '+61489089374',  label: 'Australia / NZ' },
};

function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland') || tz.startsWith('Pacific/Chatham') || tz === 'NZ') {
      return 'aunz';
    }
    if (tz.startsWith('Europe/') || tz.startsWith('Atlantic/') || tz.startsWith('Africa/')) {
      return 'eu';
    }
  } catch {
    // fallback
  }
  return 'us';
}

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function generateVCard(phone: string): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Marziani;Travis;;;',
    'FN:Travis Marziani',
    `TEL;TYPE=CELL:${phone}`,
    'NOTE:Save this contact so you recognize the number when we call.',
    'END:VCARD',
  ].join('\n');
}

function downloadVCard(phone: string) {
  const vcf = generateVCard(phone);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Travis-Marziani.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───────────────────── setter-specific sections ──────────────────── */

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

function SetterConfirmationBanner() {
  const [region, setRegion] = useState<Region>('us');
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    setRegion(detectRegion());
    setPlatform(detectPlatform());
  }, []);

  const phone = PHONE_NUMBERS[region];
  const isMobile = platform === 'ios' || platform === 'android';

  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-7 md:pt-8 md:pb-9 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          You're In — Now Complete <span className="text-orange-600">Step 2</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto mb-5">
          Save <span className="font-bold text-gray-900">{phone.display}</span> as <span className="font-bold text-gray-900">"Travis Marziani"</span> so you pick up when we call.
        </p>

        {isMobile ? (
          <button
            onClick={() => downloadVCard(phone.raw)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            Tap to Save Contact
          </button>
        ) : null}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
          <span>Wrong region?</span>
          {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="text-orange-500 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
            >
              {PHONE_NUMBERS[r].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetterFinalCTA() {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          You've Already Taken the <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          Most people think about starting for months — or years. You actually took action. Be ready when we call.
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-md mx-auto mb-10">
          <Phone className="w-8 h-8 text-orange-400 mx-auto mb-3" />
          <p className="text-white font-bold mb-1">Don't Miss Our Call</p>
          <p className="text-slate-400 text-sm">Make sure you've saved our number so you pick up when we reach out.</p>
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

export function TrainingNewSetter() {
  const [p, setP] = useState<Personalization | null>(null);

  useEffect(() => {
    setP(getPersonalization());
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <StepProgressBar />
      <SetterConfirmationBanner />
      <ResearchVideo />
      <PersonalizedIntro p={p} />
      <WhatToExpect p={p} />
      <BreakoutVideos p={p} />
      <OpportunitySection />
      <TestimonialHighlights p={p} />
      <LowCapitalStrategies p={p} />
      <CreditCardQuiz p={p} />
      <ResourceSection />
      <SetterFinalCTA />
      <SharedFooter />
    </div>
  );
}
