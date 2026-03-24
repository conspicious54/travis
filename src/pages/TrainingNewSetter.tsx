import React, { useState, useEffect } from 'react';
import {
  ResearchVideo,
  BreakoutVideos,
  OpportunitySection,
  TestimonialHighlights,
  ResourceSection,
  SharedFooter,
} from '../components/TrainingNewSections';
import { CheckCircle, Phone, UserPlus, Star, Shield } from 'lucide-react';

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
    'FN:Travis Marziani',
    'ORG:Passion Product',
    `TEL;TYPE=WORK,VOICE:${phone}`,
    'NOTE:Your Passion Product strategy call. Save this contact so you recognize the number when we call.',
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
    <div className="bg-gradient-to-b from-green-50 to-white border-b border-green-100">
      <div className="max-w-4xl mx-auto px-4 py-5 md:py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            You're In — Now Complete Step 2
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Save <span className="font-bold text-gray-900">{phone.display}</span> as <span className="font-bold text-gray-900">"Travis Marziani"</span> in your phone
          {' — '}
          {isMobile ? (
            <button
              onClick={() => downloadVCard(phone.raw)}
              className="text-blue-600 font-semibold underline underline-offset-2 cursor-pointer"
            >
              tap here to save
            </button>
          ) : (
            <span>so you pick up when we call</span>
          )}
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>Wrong region?</span>
          {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="text-blue-500 hover:text-blue-700 underline underline-offset-2 cursor-pointer"
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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          You've Already Taken the Hardest Step
        </h2>
        <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
          Most people think about starting an Amazon business for months — or years. You actually took action. When we call, be ready — we'll build your plan together.
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mb-8">
          <Phone className="w-8 h-8 text-white mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Don't miss our call</p>
          <p className="text-blue-200 text-sm">Make sure you've saved our number so you pick up when we reach out.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100 text-sm">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-300" /> 14,000+ students taught</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-300" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-200" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function TrainingNewSetter() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SetterConfirmationBanner />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <SetterFinalCTA />
      <SharedFooter />
    </div>
  );
}
