import React, { useState, useEffect, useMemo } from 'react';
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
import { CheckCircle, Phone, UserPlus, Clock, Search, BookOpen, Star, Calendar, Shield } from 'lucide-react';

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

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function generateVCard(phone: string): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Passion Product Team',
    'ORG:Passion Product',
    `TEL;TYPE=WORK,VOICE:${phone}`,
    'NOTE:Your Passion Product strategy call setter. Save this contact so you recognize the number when we call.',
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
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    setRegion(detectRegion());
    setPlatform(detectPlatform());
  }, []);

  const phone = PHONE_NUMBERS[region];

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          You're In — We'll Be Calling You Soon!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-6">
          A member of our team will reach out to schedule your personalized strategy session. Here's the number we'll be calling from:
        </p>

        {/* Phone number display */}
        <div className="inline-block bg-white border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Phone className="w-6 h-6 text-green-600" />
            <span className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">{phone.display}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Calling from: {phone.label}
          </p>

          {/* Add to contacts button */}
          <button
            onClick={() => downloadVCard(phone.raw)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-md cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            {platform === 'ios'
              ? 'Save to iPhone Contacts'
              : platform === 'android'
                ? 'Save to Android Contacts'
                : 'Save to Contacts'}
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Save this number so you recognize us when we call
          </p>
        </div>

        {/* Region selector — in case auto-detection is wrong */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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

        <div className="mt-6 inline-flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Check your email for additional details from our team
        </div>
      </div>
    </div>
  );
}

function SetterNextSteps() {
  const steps = [
    { num: 1, icon: <Phone className="w-5 h-5" />, title: 'Save our number to your contacts', desc: 'So you recognize us when we call — don\'t let it go to voicemail' },
    { num: 2, icon: <Search className="w-5 h-5" />, title: 'Do your research — we\'ll help', desc: 'Watch the video below to learn about us and whether this is the right fit' },
    { num: 3, icon: <BookOpen className="w-5 h-5" />, title: 'Get your specific questions answered', desc: 'Explore the breakout videos that match your situation' },
    { num: 4, icon: <Star className="w-5 h-5" />, title: 'Be ready when we call', desc: 'The more prepared you are, the more value you\'ll get from the conversation' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">
        Here's What Happens Next
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <div key={s.num} className="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">{s.num}</span>
              <span className="text-blue-600">{s.icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500">{s.desc}</p>
          </div>
        ))}
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
          <p className="text-blue-200 text-sm">Make sure you've saved our number to your contacts so you pick up when we reach out.</p>
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
      <SetterNextSteps />
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
