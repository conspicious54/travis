import React, { useState, useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { FeaturedLogos } from '../components/FeaturedLogos';
import {
  ResearchVideo,
  BreakoutVideos,
  OpportunitySection,
  TestimonialHighlights,
  ResourceSection,
  SharedFooter,
} from '../components/TrainingNewSections';
import { CheckCircle, Phone, UserPlus, Clock, Star, Shield } from 'lucide-react';

/* ─────────────────── region & platform detection ─────────────────── */

type Region = 'us' | 'eu' | 'aunz';

const PHONE_NUMBERS: Record<Region, { display: string; raw: string; label: string }> = {
  us:   { display: '+1 (XXX) XXX-XXXX', raw: '+1XXXXXXXXXX',  label: 'United States' },
  eu:   { display: '+44 XXXX XXXXXX',   raw: '+44XXXXXXXXXX', label: 'Europe / UK' },
  aunz: { display: '+61 XXX XXX XXX',   raw: '+61XXXXXXXXX',  label: 'Australia / NZ' },
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
    'FN:Passion Product Team',
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
  a.download = 'Passion-Product-Team.vcf';
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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 text-center">
        <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <CheckCircle className="w-3.5 h-3.5" />
          Step 1 of 2 — Complete
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          You're In — We'll Be Calling You Soon
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-6">
          A member of our team will call you from the number below. Save it so you don't miss us.
        </p>

        {/* Phone number card */}
        <div className="inline-block bg-white border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-sm mb-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Phone className="w-6 h-6 text-green-600" />
            <span className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">{phone.display}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Calling from: {phone.label}
          </p>

          {isMobile ? (
            /* Mobile: show download button */
            <button
              onClick={() => downloadVCard(phone.raw)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-md cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              {platform === 'ios' ? 'Save to iPhone Contacts' : 'Save to Android Contacts'}
            </button>
          ) : (
            /* Desktop: show simple instructions */
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
              <p className="text-sm font-medium text-gray-900 mb-2">Save this number to your phone:</p>
              <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                <li>Open the Contacts app on your phone</li>
                <li>Tap the <span className="font-medium">+</span> button to add a new contact</li>
                <li>Enter <span className="font-mono font-medium text-gray-900">{phone.display}</span></li>
                <li>Save as <span className="font-medium">"Passion Product Team"</span></li>
              </ol>
            </div>
          )}
        </div>

        {/* Region selector */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
          <span>Not in {phone.label}?</span>
          <div className="flex gap-1">
            {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className="text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
              >
                {PHONE_NUMBERS[r].label}
              </button>
            ))}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Now complete Step 2 below before your call
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
      <HeaderLight />
      <SetterConfirmationBanner />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <FeaturedLogos theme="light" />
      <SetterFinalCTA />
      <SharedFooter />
    </div>
  );
}
