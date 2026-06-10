import { useEffect } from 'react';
import { Rocket } from 'lucide-react';

/* ───── /moveforward → start.travismarziani.com/apply-now redirect ─
   Short URL meant to be sent in SMS / texts for the finance-text
   campaign. Forwards to the apply-now page on start.travismarziani.com
   with utm_source=financetext hard-coded so attribution is unambiguous.

   Any other incoming query params are preserved (in case the SMS
   eventually also passes email/phone or extra UTMs). utm_source is
   always forced to 'financetext' - the whole purpose of /moveforward
   is to tag this traffic with that source, so it overrides anything
   the visitor arrived with.

   Uses window.location.replace so the back button doesn't trap the
   visitor in a redirect loop.
─────────────────────────────────────────────────────────────────── */

const DESTINATION_BASE = 'https://start.travismarziani.com/apply-now';
const FORCED_UTM_SOURCE = 'financetext';
const REDIRECT_DELAY_MS = 500;

export function MoveForward() {
  useEffect(() => {
    const target = new URL(DESTINATION_BASE);
    try {
      const incoming = new URLSearchParams(window.location.search);
      for (const [k, v] of incoming.entries()) {
        if (v) target.searchParams.set(k, v);
      }
    } catch {
      /* no-op */
    }
    // Force the campaign source - the purpose of /moveforward is to
    // mark this traffic as financetext, so override anything else.
    target.searchParams.set('utm_source', FORCED_UTM_SOURCE);

    const t = setTimeout(() => {
      window.location.replace(target.toString());
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const noscriptHref = `${DESTINATION_BASE}?utm_source=${FORCED_UTM_SOURCE}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />

      <div className="max-w-md w-full relative z-10 text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
            <Rocket className="w-8 h-8 text-orange-400 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white via-orange-50 to-orange-100 bg-clip-text text-transparent">
          Loading...
        </h1>

        <p className="text-slate-400 text-sm">Taking you to your application</p>

        <noscript>
          <meta httpEquiv="refresh" content={`0;url=${noscriptHref}`} />
          <p className="text-slate-500 text-xs mt-4">
            JavaScript is required to redirect.{' '}
            <a className="text-orange-400 underline" href={noscriptHref}>Continue manually</a>
          </p>
        </noscript>
      </div>
    </div>
  );
}
