import React, { useState, useEffect } from 'react';
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
import { CheckCircle, Phone, Star, Shield } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';
import { identifyUser, setPersonProperties, trackConfirmationPageViewed, trackContactSaved, trackEvent } from '../lib/posthog';

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

function SetterConfirmationBanner({
  firstName,
  onSaved,
}: {
  firstName: string;
  onSaved: () => void;
}) {
  const [region, setRegion] = useState<Region>('us');
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRegion(detectRegion());
    setPlatform(detectPlatform());
  }, []);

  const phone = PHONE_NUMBERS[region];
  const isMobile = platform === 'ios' || platform === 'android';

  const handleSave = () => {
    downloadVCard(phone.raw);
    trackContactSaved(region, platform);
    setSaved(true);
    onSaved();
  };

  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 md:pt-8 md:pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider text-green-700 mb-4">
          <CheckCircle className="w-3 h-3" />
          You're in
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.05] mb-2">
          {firstName ? `We'll be in touch, ${firstName}.` : "We'll be in touch."}
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-6">
          We'll be calling you from <span className="font-bold text-gray-900">{phone.display}</span>. Save it as <span className="font-bold text-gray-900">"Travis Marziani"</span> so you know it's us.
        </p>

        {isMobile ? (
          saved ? (
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-300 rounded-xl px-5 py-3 text-green-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                Saved. You're all set.
              </div>
              <a
                href={`sms:${phone.raw}?&body=${encodeURIComponent(`YES, confirming my call${firstName ? ` - ${firstName}` : ''}`)}`}
                onClick={() => trackEvent('setter_confirm_text_clicked', { region })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Text "YES" to Confirm
              </a>
              <p className="text-xs text-gray-400">
                Opens your messages. Tap send. Done.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition-colors shadow-md text-base cursor-pointer"
              >
                <Phone className="w-5 h-5" />
                Save Travis to Contacts
              </button>
              <p className="text-xs text-gray-400">
                Takes 10 seconds. So you pick up when we call.
              </p>
            </div>
          )
        ) : (
          <div className="bg-white border border-orange-200 rounded-xl px-5 py-4 text-left max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-2">On your phone:</p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Open Contacts</li>
              <li>Add <span className="font-mono font-bold">{phone.display}</span></li>
              <li>Save as <span className="font-bold">"Travis Marziani"</span></li>
              <li>Text <span className="font-bold">"YES"</span> to confirm your call</li>
            </ol>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-5">
          <span>Wrong region?</span>
          {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map((r, i) => (
            <span key={r}>
              {i > 0 && <span className="text-gray-300">/</span>}{' '}
              <button
                onClick={() => setRegion(r)}
                className="text-orange-500 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
              >
                {PHONE_NUMBERS[r].label}
              </button>
            </span>
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
          Most people think about starting for months. Or years. You actually took action. Be ready when we call.
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
  const [contactSaved, setContactSaved] = useState(false);

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
    trackConfirmationPageViewed('setter', {
      region: personalization.region,
      reason: personalization.reason,
      situation: personalization.situation,
      capital: personalization.capital,
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SetterConfirmationBanner firstName={p?.firstName || ''} onSaved={() => setContactSaved(true)} />
      <ResearchVideo />
      <NextStepsList
        microAskLabel="Save Travis to your contacts (above)"
        microAskDone={contactSaved}
      />
      <TestimonialHighlights p={p} />
      <MethodCheckIn />
      <LowCapitalStrategies p={p} />
      <CreditCardQuiz p={p} />
      <SetterFinalCTA />
      <SharedFooter />
      <ConfirmationExitPopup />
    </div>
  );
}
