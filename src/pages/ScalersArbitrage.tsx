import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Check } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /scalers/arbitrage — repositioning page for wholesale /
   retail arbitrage / online arbitrage sellers ───────────────────
   Shown when a Scalers applicant indicates their business model is
   wholesale, RA, or OA. Those models don't fit what Passion Product
   teaches (we help people launch their OWN branded product), so
   this page:

     1. Says that plainly, in a non-insulting way.
     2. Repositions the visitor around the private-label opportunity.
     3. Points them at the main funnel's VSL (/nextstep) if they
        want to learn how to launch their own product.

   Preserves any URL params so attribution survives the hop over to
   /nextstep.
──────────────────────────────────────────────────────────────────── */

const LOGO_URL = 'https://pub-674a5e7ceb48498e80824c18802d4a94.r2.dev/Passion%20Product%20Formula%20-%20ICON.png';

export function ScalersArbitrage() {
  // Keep attribution across the hop to /nextstep so UTMs and
  // identity on the Scalers side still land in PostHog / HubSpot
  // under the same person on the main-funnel VSL.
  const nextstepHref = useMemo(() => {
    if (typeof window === 'undefined') return '/nextstep';
    const qs = window.location.search || '';
    return qs ? `/nextstep${qs}` : '/nextstep';
  }, []);

  useEffect(() => {
    document.title = 'A Better Fit For You';
    trackEvent('scalers_arbitrage_viewed');
  }, []);

  const onPivotClick = () => {
    trackEvent('scalers_arbitrage_pivot_clicked', { destination: '/nextstep' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-center">
          <img src={LOGO_URL} alt="Passion Product" className="h-9 w-auto" loading="eager" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-10 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-5">
            Different Game
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
            Wholesale, retail arbitrage, and online arbitrage are not what we do here.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Those models can work. They just aren't what Passion Product teaches. If that's your lane right now, we'd be sending you down the wrong road.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-600">
                <X className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">What we don't help with</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Reselling other brands at wholesale</li>
              <li>Retail arbitrage (clearance aisle flips)</li>
              <li>Online arbitrage (sourcing from other sites)</li>
              <li>Dropshipping or print on demand</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700">
                <Check className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">What we actually do</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-800">
              <li>Help you launch your <strong>own branded product</strong></li>
              <li>Pick an idea you care about and that sells</li>
              <li>Build a listing that converts</li>
              <li>Run PPC that actually scales profitably</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 md:p-8 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Want to launch your own product on Amazon?
          </h2>
          <p className="mt-3 text-base md:text-lg text-orange-50 max-w-xl mx-auto">
            That's exactly what we teach. Watch the free training and see if the Passion Product method is a fit for where you want to take this.
          </p>
          <Link
            to={nextstepHref}
            onClick={onPivotClick}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-orange-700 shadow-lg transition hover:bg-orange-50"
          >
            Watch the free training <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <LegalDisclaimer />
      </main>
    </div>
  );
}
