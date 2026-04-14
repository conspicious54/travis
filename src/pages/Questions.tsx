import { useEffect } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { trackEvent } from '../lib/posthog';

/* ───── /questions ────────────────────────────────────────────────
   Dedicated page with the 6 breakout objection videos. Linked from
   the "I have questions" button on the confirmation pages.
──────────────────────────────────────────────────────────────────── */

const BREAKOUTS = [
  {
    headline: "But isn't Amazon too saturated at this point?",
    embed: 'https://videos.sproutvideo.com/embed/dc9adbb31513e1c056/9a833984ebbbd62f',
  },
  {
    headline: "But what if I don't have a lot of money to start?",
    embed: 'https://videos.sproutvideo.com/embed/8c9adbb31511eec506/80d1f8e8fb8fd47b',
  },
  {
    headline: "What if I'm already working full-time?",
    embed: 'https://videos.sproutvideo.com/embed/8c9adbb31510e7cd06/6d5e29c2559707a4',
  },
  {
    headline: "I don't even have a product idea yet. Is that okay?",
    embed: 'https://videos.sproutvideo.com/embed/8c9adbb3181ee2cb06/c87808d62d097bd1',
  },
  {
    headline: "How do I know I can actually trust this?",
    embed: 'https://videos.sproutvideo.com/embed/ee9adbb31513e7c164/0e0d27cd2ae31e59',
  },
  {
    headline: "What if I pick the wrong product and lose my money?",
    embed: 'https://videos.sproutvideo.com/embed/aa9adbb3181ee0c020/edb75f1300af4b4d',
  },
];

export function Questions() {
  useEffect(() => {
    trackEvent('questions_page_viewed');
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/trainingnew/closer';
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar with back button */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-orange-600 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Common Questions
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-700 mb-5">
            <HelpCircle className="w-3.5 h-3.5" />
            Your Questions, Answered
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.05] mb-3">
            Pick the question that's <br className="hidden md:block" />
            <span className="text-orange-600">on your mind.</span>
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            Each video is short and gets straight to the point. Watch the ones that apply to you.
          </p>
        </div>
      </div>

      {/* Questions grid */}
      <div className="bg-white py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BREAKOUTS.map((b, i) => (
              <div
                key={i}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all"
              >
                <div className="aspect-video bg-gray-900">
                  <iframe
                    src={b.embed}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    title={b.headline}
                  />
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg p-5 group-hover:text-orange-700 transition-colors">
                  {b.headline}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Back CTA */}
      <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Got what you needed?
          </h2>
          <p className="text-slate-300 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Head back and finish preparing for your call.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Take me back
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-950 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
