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
  ConfirmationFAQ,
} from '../components/TrainingNewSections';
import { CheckCircle, Phone, Star, Shield, MessageSquare, MessageCircle } from 'lucide-react';
import { getPersonalization, type Personalization } from '../lib/personalization';
import {
  identifyUser,
  setPersonProperties,
  trackConfirmationPageViewed,
  trackContactSaved,
  trackEvent,
} from '../lib/posthog';
import { PrepChecklistProvider, usePrepChecklist } from '../context/PrepChecklistContext';
import {
  useScrollDepth,
  useDwellHeartbeat,
  usePhoneCopyTracking,
  useConfirmAppSwitch,
  useSproutvideoTracking,
} from '../lib/confirmationTracking';
import { markConfirmClicked } from '../lib/confirmFlow';

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
  const { markDone } = usePrepChecklist();

  useEffect(() => {
    setRegion(detectRegion());
    setPlatform(detectPlatform());
  }, []);

  const phone = PHONE_NUMBERS[region];
  const isMobile = platform === 'ios' || platform === 'android';

  // Setter flow has no booked meeting yet, so we can't know the coach.
  // Default to Jesse — he's the baseline assignee when nothing else resolves.
  const coachFirstName = 'Jesse';

  usePhoneCopyTracking(phone.display, 'setter', region);
  const armAppSwitch = useConfirmAppSwitch('setter');

  const handleSave = () => {
    downloadVCard(phone.raw);
    trackContactSaved(region, platform);
    setSaved(true);
    onSaved();
  };

  const handleConfirmText = () => {
    trackEvent('setter_confirm_text_clicked', {
      region,
      platform,
      coach_first_name: coachFirstName,
    });
    setPersonProperties({
      coach_first_name: coachFirstName,
      confirmed_via: 'sms',
      last_platform: platform,
    });
    armAppSwitch('sms', coachFirstName);
    markConfirmClicked();
    markDone('microAsk');
  };

  const handleConfirmWhatsapp = () => {
    trackEvent('setter_confirm_whatsapp_clicked', {
      region,
      platform,
      coach_first_name: coachFirstName,
    });
    setPersonProperties({
      coach_first_name: coachFirstName,
      confirmed_via: 'whatsapp',
      last_platform: platform,
    });
    armAppSwitch('whatsapp', coachFirstName);
    markConfirmClicked();
    markDone('microAsk');
  };

  const handleRegionOverride = (r: Region) => {
    setRegion(r);
    trackEvent('wrong_region_clicked', { faq_location: 'setter', from: region, to: r });
  };

  const smsBody = encodeURIComponent(`Hi Coach ${coachFirstName}, YES, confirming my call${firstName ? ` - ${firstName}` : ''}`);
  const whatsappNumber = phone.raw.replace(/[^\d]/g, '');

  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-10 md:pt-14 md:pb-14 text-center">
        {/* Checkmark badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 border-2 border-green-300 mb-6">
          <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600" strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1] mb-4">
          {firstName ? `You're In, ${firstName}.` : "You're In."}
        </h1>

        <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto mb-3 leading-snug">
          We'll be calling you from{' '}
          <span className="font-bold text-gray-900">{phone.display}</span>.
        </p>
        <p className="text-sm md:text-base text-gray-500 mb-10">
          Save it as <span className="font-bold text-gray-700">"Travis Marziani"</span> so you know it's us when we call.
        </p>

        {/* Micro-ask: confirm via text or WhatsApp */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
          <p className="text-base md:text-lg font-bold text-gray-900 mb-4 max-w-lg mx-auto">
            To confirm you'll be available for the call, tap one of the buttons below and hit send:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-lg mx-auto">
            <a
              href={`sms:${phone.raw}?&body=${smsBody}`}
              onClick={handleConfirmText}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Confirm via Text
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${smsBody}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleConfirmWhatsapp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm md:text-base transition-colors shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm via WhatsApp
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Takes 10 seconds.{' '}
            <span className="text-gray-500">
              Wrong region?{' '}
              {(Object.keys(PHONE_NUMBERS) as Region[]).filter(r => r !== region).map((r, i) => (
                <span key={r}>
                  {i > 0 && <span className="text-gray-300">/</span>}{' '}
                  <button
                    onClick={() => handleRegionOverride(r)}
                    className="text-orange-500 hover:text-orange-700 underline underline-offset-2 cursor-pointer"
                  >
                    {PHONE_NUMBERS[r].label}
                  </button>
                </span>
              ))}
            </span>
          </p>
        </div>

        {/* Transition */}
        <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.15em] mt-10 mb-5">
          Then do these two things before your call ↓
        </p>

        {/* Secondary micro-ask: save contact (mobile only) */}
        {isMobile && (
          <div>
            {saved ? (
              <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-300 rounded-xl px-5 py-3 text-green-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                Travis saved to your contacts.
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm md:text-base cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Save Travis to Contacts
              </button>
            )}
          </div>
        )}
        {!isMobile && (
          <div className="bg-white border border-orange-200 rounded-xl px-5 py-4 text-left max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-2">On your phone:</p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Open Contacts</li>
              <li>Add <span className="font-mono font-bold">{phone.display}</span></li>
              <li>Save as <span className="font-bold">"Travis Marziani"</span></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function SetterFinalCTA({ firstName }: { firstName: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {firstName ? `${firstName}, you've taken the ` : "You've Already Taken the "}
          <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          Most people think about starting for months. Or years. You actually took action. Be ready when we call.
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

export function TrainingNewSetter() {
  const [p, setP] = useState<Personalization | null>(null);
  const [popupRegion, setPopupRegion] = useState<Region>('us');

  useScrollDepth('setter');
  useDwellHeartbeat('setter');
  useSproutvideoTracking('setter');

  useEffect(() => {
    setPopupRegion(detectRegion());

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

  const popupCoach = 'Jesse';
  const popupSmsBody = encodeURIComponent(
    `Hi Coach ${popupCoach}, YES, confirming my call${p?.firstName ? ` - ${p.firstName}` : ''}`
  );

  return (
    <PrepChecklistProvider>
      <div className="min-h-screen bg-white text-gray-900">
        <SetterConfirmationBanner firstName={p?.firstName || ''} onSaved={() => {}} />
        <ResearchVideo />
        <NextStepsList microAskLabel="Confirm via Text or WhatsApp (above)" />
        <TestimonialHighlights p={p} />
        <MethodCheckIn />
        <LowCapitalStrategies p={p} />
        <CreditCardQuiz p={p} />
        <SetterFinalCTA firstName={p?.firstName || ''} />
        <ConfirmationFAQ p={p} location="setter" />
        <SharedFooter />
        <ConfirmationExitPopup
          location="setter"
          coachFirstName={popupCoach}
          phoneRaw={PHONE_NUMBERS[popupRegion].raw}
          smsBody={popupSmsBody}
        />
      </div>
    </PrepChecklistProvider>
  );
}
