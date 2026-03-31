import { useEffect, useState } from 'react';
import { Rocket, DollarSign } from 'lucide-react';

type RouterState = 'loading' | 'dq-question' | 'redirecting';

const GROUP_A_URL = "https://start.travismarziani.com/nextstep";
const GROUP_B_URL = "https://start.travismarziani.com/passion-product-fasttrack";
const DQ_YES_URL = "https://thepassionproductformula.com/waitlist";

const EUROPE_COUNTRIES = [
  "AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR",
  "DE","GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC",
  "ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE",
  "CH","UA","GB","VA"
];

const ALLOWED_COUNTRIES = ["US","CA","AU","NZ", ...EUROPE_COUNTRIES];

function doRedirect(url: string) {
  const queryString = window.location.search;
  window.location.replace(url + queryString);
}

/* ─────────────────────── loading screen ──────────────────────────── */

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="max-w-md w-full relative z-10">
      <div className="text-center mb-8">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
            <Rocket className="w-8 h-8 text-orange-400 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white via-orange-50 to-orange-100 bg-clip-text text-transparent">
          Your training resources are loading...
        </h1>

        <p className="text-slate-400 text-sm">
          Preparing your personalized experience
        </p>
      </div>

      <div className="relative w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/50">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-orange-500/50"
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── DQ capital question ─────────────────────────── */

function CapitalQuestion() {
  return (
    <div className="max-w-md w-full relative z-10">
      <div className="text-center mb-8">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500/10 to-amber-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
            <DollarSign className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Quick Question Before We Continue
        </h1>

        <p className="text-lg text-white font-medium mb-2">
          Do you have at least $500 USD to invest in launching on Amazon?
        </p>

        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
          Our approach to building an Amazon business varies depending on your starting capital. This helps us point you to the right resources.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => doRedirect(DQ_YES_URL)}
            className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
          >
            Yes, I Have $500+
          </button>
          <button
            onClick={() => doRedirect(GROUP_B_URL)}
            className="px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium rounded-xl transition-all border border-slate-700/50 cursor-pointer text-sm"
          >
            No, Not Right Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── main export ──────────────────────────────── */

export function Router() {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<RouterState>('loading');

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 150);

    const redirect = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        const country = data.country;

        if (ALLOWED_COUNTRIES.includes(country)) {
          doRedirect(GROUP_A_URL);
        } else {
          // DQ country — ask the capital question first
          setState('dq-question');
        }
      } catch (error) {
        doRedirect(GROUP_A_URL);
      }
    };

    redirect();

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent"></div>

      <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-orange-300/30 rounded-full animate-pulse delay-100"></div>
      <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-orange-400/20 rounded-full animate-pulse delay-200"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500/30 rounded-full animate-pulse delay-300"></div>

      {state === 'loading' && <LoadingScreen progress={progress} />}
      {state === 'dq-question' && <CapitalQuestion />}
    </div>
  );
}
