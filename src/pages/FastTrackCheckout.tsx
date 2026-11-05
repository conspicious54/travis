import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ArrowDown, ChevronRight } from 'lucide-react';
import { identifyUser, trackEvent } from '../lib/posthog';
import { persistUtmsFromUrl, readAttribution } from '../lib/syncUtm';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /fast-track — Fast Track checkout page ─────────────────────
   1:1 layout rebuild of the ClickFunnels Fast Track checkout: top
   "Limited Spots Available" bar, orange headline, Wistia VSL,
   2-column body (Contact + Billing stepper on the left; course +
   bonus stack on the right), totals, then "Why starting Amazon
   sellers chose us..." lead-in to testimonials.

   Payment integration note:
     The Step-1 "Claim your $97 bootcamp" button captures contact
     info to PostHog + the attribution envelope, then hands the
     visitor off to the Fast Track checkout URL (set below). When
     you wire a native Stripe / payment-processor flow into this
     repo, swap CHECKOUT_REDIRECT_URL for an in-page Step-2 billing
     UI and submit to that processor from here.
───────────────────────────────────────────────────────────────── */

// Where to send the visitor to collect payment. Leaving this pointed
// at the existing hosted ClickFunnels Fast Track order page so the
// page is live-ready; swap for a Stripe / in-app billing flow when
// ready.
const CHECKOUT_REDIRECT_URL = 'https://start.travismarziani.com/passion-product-fasttrack';

// Wistia media id supplied in the design brief.
const WISTIA_MEDIA_ID = 'taxkq7e3yk';

const PRICE_LABEL = '$97';
const TOTAL_VALUE_LABEL = '$3,997';

function WistiaEmbed({ mediaId }: { mediaId: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-900 shadow-2xl" style={{ paddingTop: '56.25%' }}>
      <iframe
        src={`https://fast.wistia.net/embed/iframe/${mediaId}?seo=true&videoFoam=true`}
        title="Fast Track overview"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

interface ContactForm {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

const EMPTY_CONTACT: ContactForm = { firstname: '', lastname: '', email: '', phone: '' };

function readSeedFromUrl(): ContactForm {
  if (typeof window === 'undefined') return EMPTY_CONTACT;
  const p = new URLSearchParams(window.location.search);
  return {
    firstname: p.get('first_name') || p.get('firstname') || '',
    lastname:  p.get('last_name')  || p.get('lastname')  || '',
    email:     p.get('email') || '',
    phone:     p.get('phone') || '',
  };
}

export function FastTrackCheckout() {
  const seed = useMemo(readSeedFromUrl, []);
  const [form, setForm] = useState<ContactForm>(seed);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Fast Track — Use Amazon to Make Your First $1,000';
    persistUtmsFromUrl();
    trackEvent('fasttrack_checkout_viewed', {
      has_email_in_url: !!seed.email,
    });
  }, [seed.email]);

  const bonuses = [
    { n: 1, title: 'Checklist Bonus',           value: '$197', body: 'A complete step-by-step checklist so you can move through the Amazon FBA process faster.' },
    { n: 2, title: 'Product Research Bonus',    value: '$97',  body: 'How to find higher-demand product opportunities with no prior research experience, in a fraction of the time.' },
    { n: 3, title: 'Mystery Gift',              value: '$197', body: 'One extra bonus unlocked after checkout, hand-picked for new Fast Track members.' },
  ];

  const includedModules = [
    { title: 'Mastering Your Mindset',           body: 'Business and mindset foundations for the Amazon marketplace.' },
    { title: 'Blueprint To Build A Foundation',  body: 'Set up your business, bookkeeping, and finances so what you build is on solid ground.' },
    { title: 'How To Spot Profitable Opportunities', body: 'Find higher-demand, lower-competition products using our search module.' },
    { title: 'How To Source Like A Pro',         body: 'Vet suppliers and negotiate better deals to protect your margins from day one.' },
    { title: 'How To Optimize For Conversions',  body: 'Build listings that stand out on Amazon and convert the traffic you earn.' },
    { title: 'Key Steps To Launch On Autopilot', body: 'Use the Launch module to drive initial sales and compound into momentum.' },
  ];

  const canProceed = form.firstname.trim().length > 0
    && form.lastname.trim().length > 0
    && form.email.includes('@')
    && form.phone.trim().length >= 7;

  function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (!canProceed) {
      setError('Please fill in every field so we can send your receipt + bonuses.');
      return;
    }
    setSubmitting(true);

    const email = form.email.trim().toLowerCase();
    try {
      identifyUser(email, {
        first_name: form.firstname.trim(),
        last_name:  form.lastname.trim(),
        phone:      form.phone.trim(),
      });
    } catch { /* no-op */ }

    const attr = readAttribution();
    trackEvent('fasttrack_claim_clicked', {
      email,
      utm_source:   attr.utm_source   || null,
      utm_campaign: attr.utm_campaign || null,
      utm_medium:   attr.utm_medium   || null,
      gclid:        attr.gclid        || null,
      fbclid:       attr.fbclid       || null,
    });

    // Hand off to the current Fast Track order page with identity
    // + UTMs appended so attribution survives the hop.
    const url = new URL(CHECKOUT_REDIRECT_URL);
    url.searchParams.set('first_name', form.firstname.trim());
    url.searchParams.set('last_name',  form.lastname.trim());
    url.searchParams.set('email',      email);
    url.searchParams.set('phone',      form.phone.trim());
    for (const [k, v] of Object.entries(attr)) {
      if (v) url.searchParams.set(k, String(v));
    }
    window.location.href = url.toString();
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top urgency bar */}
      <div className="bg-emerald-500 text-white text-center text-sm md:text-base font-bold py-3 tracking-wide">
        Limited Spots Available
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-10 pb-20">
        {/* Hero */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-[28px] md:text-[48px] font-black leading-[1.05] tracking-tight text-[#F28000]">
            Use Amazon to Make Your First $1,000 From Home
          </h1>
          <p className="mt-3 text-base md:text-lg font-bold text-gray-900">
            Learn the exact strategy I used (with no prior experience).
          </p>
        </div>

        {/* VSL */}
        <div className="max-w-4xl mx-auto mb-10 md:mb-14">
          <WistiaEmbed mediaId={WISTIA_MEDIA_ID} />
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
          {/* LEFT: Checkout card */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
              <p className="text-center text-red-600 font-black italic text-lg md:text-xl mb-1">
                LIMITED TIME OFFER
              </p>
              <h2 className="text-center text-xl md:text-2xl font-bold text-gray-900 mb-5">
                Get FULL Access Today For <br /><span className="font-black">ONLY {PRICE_LABEL}</span>
              </h2>

              {/* Stepper */}
              <div className="grid grid-cols-2 gap-2 mb-4 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2 border-b-2 border-orange-500 pb-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Contact Info</p>
                    <p className="text-[11px] text-gray-500">Your contact information</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-2 opacity-60">
                  <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center">2</span>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Billing Info</p>
                    <p className="text-[11px] text-gray-500">Your billing information</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleClaim} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={form.firstname}
                    onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                    autoComplete="given-name"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={form.lastname}
                    onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                    autoComplete="family-name"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                  autoComplete="email"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                  autoComplete="tel"
                  required
                />

                {error ? (
                  <p className="text-red-600 text-xs font-medium">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-lg shadow-md shadow-green-500/25 transition-colors"
                >
                  <span className="flex items-center justify-center gap-2 text-base md:text-lg">
                    <ChevronRight className="w-5 h-5" />
                    Claim your {PRICE_LABEL} bootcamp
                  </span>
                  <span className="block text-[11px] font-medium opacity-90 mt-0.5">
                    &amp; Unlock your 3 bonuses
                  </span>
                </button>

                <p className="text-center text-[11px] text-gray-500 mt-2">
                  We Never Share Your Information With Anyone
                </p>
              </form>

              {/* Payment logos (simple text row; swap for brand images when uploaded) */}
              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap text-[11px] font-bold text-gray-600 tracking-widest">
                <span className="px-2.5 py-1 border border-gray-300 rounded bg-white">VISA</span>
                <span className="px-2.5 py-1 border border-gray-300 rounded bg-white">MASTERCARD</span>
                <span className="px-2.5 py-1 border border-gray-300 rounded bg-white">DISCOVER</span>
                <span className="px-2.5 py-1 border border-gray-300 rounded bg-white">AMEX</span>
              </div>
              <p className="text-center text-[11px] text-gray-500 mt-3 italic">
                Product purchase is complete upon receiving instant access
              </p>
            </div>
          </div>

          {/* RIGHT: Enrollment + bonus stack */}
          <div className="lg:col-span-3">
            <p className="text-center text-base md:text-lg font-bold text-gray-900 mb-2">
              Enroll today and get INSTANT access to...
            </p>
            <p className="text-center text-sm md:text-base font-bold text-emerald-600 mb-5">
              NEW 2026 Amazon Course ({TOTAL_VALUE_LABEL} value) now includes:
            </p>

            <ul className="space-y-3 mb-8">
              {includedModules.map((m) => (
                <li key={m.title} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                    <span className="font-bold text-gray-900">{m.title}:</span>{' '}
                    {m.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-center text-base md:text-lg font-bold text-gray-900 mb-4">
              Order now and you'll receive:
            </p>

            <div className="space-y-4">
              {bonuses.map((b) => (
                <div key={b.n} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="inline-block bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm mb-2">
                        BONUS {b.n}
                      </span>
                      <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">
                        {b.title}
                      </h3>
                    </div>
                    <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-wider">
                      {b.value} value
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center border-t border-gray-200 pt-6">
              <p className="text-lg md:text-xl font-bold text-gray-900">
                TOTAL VALUE: <span className="font-black">{TOTAL_VALUE_LABEL}</span>
              </p>
              <p className="text-xl md:text-2xl font-black text-red-600 mt-1">
                Only {PRICE_LABEL} today
              </p>
            </div>
          </div>
        </div>

        {/* Lead-in to testimonial section */}
        <div className="mt-14 md:mt-16">
          <a
            href="#testimonials"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="w-full max-w-3xl mx-auto flex bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-base md:text-xl font-black tracking-tight py-4 md:py-5 px-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl items-center justify-center gap-3"
          >
            <ArrowDown className="w-5 h-5 flex-shrink-0" />
            <span>Why starting Amazon sellers chose us...</span>
          </a>

          <p id="testimonials" className="text-center text-gray-600 italic text-sm md:text-base mt-7 mb-6 max-w-2xl mx-auto">
            These are just a handful of the hundreds of success stories created through the Passion Product blueprint.
          </p>

          {/* Testimonial strip — two Wistia placeholders matching the
              layout rhythm from the screenshot. Swap mediaIds for the
              specific Fast Track testimonial videos when picked. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {['9GSDrJRv2CE', 'Vw9OrGVTGoI'].map((ytId) => (
              <div key={ytId} className="relative overflow-hidden rounded-xl bg-slate-900 shadow-xl" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={`Student testimonial ${ytId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <LegalDisclaimer />
    </div>
  );
}
