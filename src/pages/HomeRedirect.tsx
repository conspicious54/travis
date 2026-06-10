import { useEffect } from 'react';
import { Rocket } from 'lucide-react';

/* ───── travisfba.com/ → start.travismarziani.com redirect ─────────
   travisfba.com used to be the funnel entry but the actual landing
   is now on start.travismarziani.com. This page shows a brief branded
   loading state then forwards the visitor, preserving any query
   string (UTMs, email tags, anything else) so attribution survives
   the hop.

   Uses window.location.replace so the back button doesn't trap the
   visitor in a redirect loop.
─────────────────────────────────────────────────────────────────── */

const DESTINATION = 'https://start.travismarziani.com';
const REDIRECT_DELAY_MS = 500;

export function HomeRedirect() {
  useEffect(() => {
    const target = new URL(DESTINATION);
    try {
      const incoming = new URLSearchParams(window.location.search);
      for (const [k, v] of incoming.entries()) {
        if (v) target.searchParams.set(k, v);
      }
    } catch {
      /* no-op */
    }
    const t = setTimeout(() => {
      window.location.replace(target.toString());
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

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

        <p className="text-slate-400 text-sm">Taking you to the training</p>

        {/* noscript fallback: meta refresh in case JS is disabled. The
            React component still works for ~99% of visitors. */}
        <noscript>
          <meta httpEquiv="refresh" content={`0;url=${DESTINATION}`} />
          <p className="text-slate-500 text-xs mt-4">
            JavaScript is required to redirect.{' '}
            <a className="text-orange-400 underline" href={DESTINATION}>Continue manually</a>
          </p>
        </noscript>
      </div>
    </div>
  );
}
