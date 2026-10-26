import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Package, DollarSign, AlertTriangle, Zap } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { LegalDisclaimer } from '../components/LegalDisclaimer';
import { SCALERS_LOGO_URL } from '../lib/scalers';

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
          <img src={SCALERS_LOGO_URL} alt="FBA Scalers" className="h-10 w-auto" loading="eager" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-10 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-5">
            Here's The Honest Truth
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
            Reselling other people's products has a ceiling. You've probably already felt it.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Wholesale, retail arbitrage, and online arbitrage can pay the bills. We know people doing all three. But every one of them runs into the same wall: you're building someone else's brand, competing on price, and one supplier change away from starting over. If that sounds familiar, keep reading. There's a better move.
          </p>
        </div>

        {/* Why arbitrage caps out */}
        <div className="mt-12">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-center mb-6">
            Why reselling always hits a ceiling
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No moat</h3>
              <p className="text-sm text-slate-600 leading-snug">
                Anyone can source the same product. The second someone undercuts you, the Buy Box is gone.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Thin margins get thinner</h3>
              <p className="text-sm text-slate-600 leading-snug">
                As more sellers pile onto the same ASINs, prices race down and your take-home gets squeezed.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Nothing to sell at the end</h3>
              <p className="text-sm text-slate-600 leading-snug">
                You can't sell a sourcing account. A real brand is an asset. Reselling is a job.
              </p>
            </div>
          </div>
        </div>

        {/* What owning your own product unlocks */}
        <div className="mt-14">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-center mb-6">
            What owning your own product unlocks
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Set your own price</h3>
              <p className="text-sm text-slate-700 leading-snug">
                It's your listing, your brand, your Buy Box. No one else owns it. You decide what it's worth.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Build a real moat</h3>
              <p className="text-sm text-slate-700 leading-snug">
                Reviews, brand recognition, trademark, and a differentiated product that competitors can't just copy and crush.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Scale by catalog, not by hustle</h3>
              <p className="text-sm text-slate-700 leading-snug">
                Add a second product, then a third. A brand compounds. A sourcing run doesn't.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Own a real asset</h3>
              <p className="text-sm text-slate-700 leading-snug">
                A branded Amazon business can be sold. People buy them every week. You can't sell your sourcing contacts.
              </p>
            </div>
          </div>
        </div>

        {/* The pitch block */}
        <div className="mt-14 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-7 md:p-10 text-white text-center shadow-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5">
            <Zap className="w-3.5 h-3.5" /> Free Training
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.1]">
            You already know how to sell on Amazon. Now put that experience behind your own product.
          </h2>
          <p className="mt-4 text-base md:text-lg text-orange-50 max-w-xl mx-auto leading-relaxed">
            You've got something most people don't: real experience inside Seller Central. Our free training walks through exactly how we help experienced sellers pivot to launching their own branded product, step by step.
          </p>
          <Link
            to={nextstepHref}
            onClick={onPivotClick}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base md:text-lg font-black text-orange-700 shadow-lg transition hover:bg-orange-50 hover:scale-[1.02]"
          >
            Watch the free training <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-orange-100/90">
            Nothing to buy. Just the method, straight through.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 italic">
          Results not typical. Individual outcomes depend on effort, product, and market.
        </p>

        <LegalDisclaimer />
      </main>
    </div>
  );
}
