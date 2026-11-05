import { useEffect } from 'react';
import { CheckCircle2, ArrowDown } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { persistUtmsFromUrl } from '../lib/syncUtm';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /fast-track — Fast Track checkout page ─────────────────────
   Layout rebuild of the ClickFunnels Fast Track order page in the
   site's design system: urgency bar, orange headline, Wistia VSL,
   2-column body (embedded Whop checkout on the left; course + bonus
   stack on the right), totals, then "Why starting Amazon sellers
   chose us..." lead-in to testimonials.

   Payment flow: Whop Elements checkout widget mounts into #checkout.
   The widget handles contact + billing + payment + success redirect
   on its own. The return-URL dance (?payment=…&status=…) is
   preserved verbatim from Whop's embed snippet so bank-redirect /
   financing methods (ClarityPay, Klarna, …) land back cleanly.
───────────────────────────────────────────────────────────────── */

const WHOP_SCRIPT_SRC = 'https://cdn.whop.com/elements/amber/elements.js';
const WHOP_PLAN       = 'plan_9LsQqvkI3Ln2Q';
const AFTER_PURCHASE  = 'https://whop.com/joined/biz_Y1y6ihD8NR7J4F/';

const WISTIA_MEDIA_ID    = 'taxkq7e3yk';
const PRICE_LABEL        = '$97';
const TOTAL_VALUE_LABEL  = '$3,997';

// Shape of the global the Whop script injects. Narrow to what we call.
declare global {
  interface Window {
    WhopElements?: () => {
      checkout: {
        create: (opts: {
          plan: string;
          returnUrl?: string;
          metadata?: Record<string, string>;
          appearance?: {
            theme?: { appearance?: 'light' | 'dark' };
            classes?: Record<string, Record<string, string>>;
          };
        }) => {
          create: (slot: string) => { mount: (selector: string) => void };
        };
      };
    };
  }
}

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

/* ───── Whop embed lifecycle ──────────────────────────────────────
   Runs once on mount. Handles three states:

     1. Return from an off-site payment method with status=succeeded
        → redirect to the Whop AFTER_PURCHASE URL with ids attached.
     2. Return with status=failed | canceled → show inline message,
        leave the checkout widget mounted so they can retry.
     3. First visit → load the Whop script (once per session), then
        mount the checkout widget into #checkout.

   Mirrors the vendor snippet verbatim so a Whop-side change to the
   snippet can be reapplied with a copy/paste. */
function initWhopCheckout(
  returnBox: HTMLElement,
): 'redirected' | 'succeeded_message' | 'failure_message' | 'mounted' | 'noop' {
  // Mirrors the IIFE in the vendor snippet.
  const RETURN = (() => {
    const here = new URL(location.href);
    const payment = here.searchParams.get('payment');
    const status  = here.searchParams.get('status');
    here.searchParams.delete('payment');
    here.searchParams.delete('status');
    here.hash = '';
    if (payment) {
      history.replaceState(history.state, '', here.pathname + here.search + location.hash);
    }
    const allowed = here.protocol === 'https:'
      || ['localhost', '127.0.0.1', '[::1]'].includes(here.hostname);
    return {
      url:     allowed ? here.href : null,
      payment: payment,
      status:  payment ? status : null,
    };
  })();

  const RETURN_DONE = RETURN.status === 'succeeded';
  if (RETURN_DONE && AFTER_PURCHASE) {
    const next = new URL(AFTER_PURCHASE);
    if (RETURN.payment) {
      next.searchParams.set('payment_id', RETURN.payment);
      next.searchParams.set('receipt_id', RETURN.payment);
    }
    next.searchParams.set('status', 'success');
    location.replace(next.href);
    return 'redirected';
  }
  if (RETURN_DONE) {
    document
      .querySelectorAll<HTMLElement>('label[data-whop-option], label[data-whop-bump]')
      .forEach((l) => (l.style.display = 'none'));
    returnBox.textContent = 'Your payment was approved. Check your email for your receipt and access.';
    returnBox.style.color = '#15803d';
    return 'succeeded_message';
  }
  if (RETURN.status === 'failed' || RETURN.status === 'canceled') {
    returnBox.textContent = 'Your payment wasn’t completed. Try again or choose another payment method.';
  }

  if (!window.WhopElements) return 'noop';
  const handle = window.WhopElements().checkout.create({
    plan: WHOP_PLAN,
    ...(RETURN.url ? { returnUrl: RETURN.url } : {}),
    metadata: { source: 'fast_track_landing' },
    appearance: {
      theme: { appearance: 'light' },
      classes: {
        'whop-CheckoutPayButton':      { backgroundColor: '#1bb148', borderColor: '#1bb148', color: '#ffffff' },
        'whop-CheckoutSeller':         { display: 'none' },
        'whop-CheckoutSellerLogo':     { display: 'none' },
        'whop-CheckoutDetailsToggle':  { display: 'none' },
        'whop-CheckoutPromoRow':       { display: 'none' },
        'whop-CheckoutPromoChip':      { display: 'none' },
        'whop-CheckoutPromoInput':     { display: 'none' },
        'whop-CheckoutPromoApply':     { display: 'none' },
        'whop-CheckoutPromoActions':   { display: 'none' },
        'whop-CheckoutPromoApplied':   { display: 'none' },
        'whop-CheckoutPromoDiscount':  { display: 'none' },
        'whop-CheckoutPromoPeriod':    { display: 'none' },
      },
    },
  });
  handle.create('checkout').mount('#checkout');
  return 'mounted';
}

export function FastTrackCheckout() {
  useEffect(() => {
    document.title = 'Fast Track — Use Amazon to Make Your First $1,000';
    persistUtmsFromUrl();
    trackEvent('fasttrack_checkout_viewed', {});

    const returnBox = document.getElementById('whop-return');
    if (!returnBox) return;

    // Load the Whop script once; retry init when it finishes loading.
    const existing = document.querySelector<HTMLScriptElement>('script[data-whop-elements]');
    if (window.WhopElements) {
      initWhopCheckout(returnBox);
      return;
    }
    if (existing) {
      existing.addEventListener('load', () => initWhopCheckout(returnBox), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = WHOP_SCRIPT_SRC;
    s.setAttribute('data-whop-elements', '');
    s.async = true;
    s.addEventListener('load', () => initWhopCheckout(returnBox), { once: true });
    document.head.appendChild(s);
  }, []);

  const includedModules = [
    { title: 'Mastering Your Mindset',           body: 'Business and mindset foundations for the Amazon marketplace.' },
    { title: 'Blueprint To Build A Foundation',  body: 'Set up your business, bookkeeping, and finances so what you build is on solid ground.' },
    { title: 'How To Spot Profitable Opportunities', body: 'Find higher-demand, lower-competition products using our search module.' },
    { title: 'How To Source Like A Pro',         body: 'Vet suppliers and negotiate better deals to protect your margins from day one.' },
    { title: 'How To Optimize For Conversions',  body: 'Build listings that stand out on Amazon and convert the traffic you earn.' },
    { title: 'Key Steps To Launch On Autopilot', body: 'Use the Launch module to drive initial sales and compound into momentum.' },
  ];

  const bonuses = [
    { n: 1, title: 'Checklist Bonus',        value: '$197', body: 'A complete step-by-step checklist so you can move through the Amazon FBA process faster.' },
    { n: 2, title: 'Product Research Bonus', value: '$97',  body: 'How to find higher-demand product opportunities with no prior research experience, in a fraction of the time.' },
    { n: 3, title: 'Mystery Gift',           value: '$197', body: 'One extra bonus unlocked after checkout, hand-picked for new Fast Track members.' },
  ];

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
          {/* LEFT: Whop embedded checkout */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm">
              <p className="text-center text-red-600 font-black italic text-lg md:text-xl mb-1">
                LIMITED TIME OFFER
              </p>
              <h2 className="text-center text-xl md:text-2xl font-bold text-gray-900 mb-5">
                Get FULL Access Today For <br />
                <span className="font-black">ONLY {PRICE_LABEL}</span>
              </h2>

              {/* Status line Whop writes into on return from an off-site
                  payment method. Rendered empty on first paint, Whop
                  fills it in with red / green text. */}
              <div
                id="whop-return"
                role="status"
                className="text-sm text-red-700 mb-2 min-h-[1rem]"
              />

              {/* Whop checkout mount point. React never writes children
                  here; the vendor script paints into it imperatively. */}
              <div id="checkout" />

              <p className="text-center text-[11px] text-gray-500 mt-4 italic">
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
