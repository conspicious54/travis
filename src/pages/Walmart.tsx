import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

/* ──────────────────────────── types ──────────────────────────────── */

type SellingStatus = 'yes_walmart' | 'yes_amazon' | 'neither' | null;

/* TODO: Replace with your actual Make.com webhook URL that routes to Mailchimp */
const WALMART_WEBHOOK_URL = 'https://hook.us2.make.com/YOUR_WALMART_WEBHOOK_HERE';

/* Walmart brand colors */
const WM_BLUE = '#0071DC';
const WM_YELLOW = '#FFC220';

/* ──────────────────────────── page ───────────────────────────────── */

export function Walmart() {
  const [sellingStatus, setSellingStatus] = useState<SellingStatus>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const statusOptions: { value: SellingStatus; label: string }[] = [
    { value: 'yes_walmart', label: 'Yes, I already sell on Walmart' },
    { value: 'yes_amazon', label: 'No, but I sell on Amazon' },
    { value: 'neither', label: "I'm not selling on either platform right now" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !sellingStatus) return;

    setIsSubmitting(true);
    try {
      await fetch(WALMART_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          selling_status: sellingStatus,
          source: 'walmart_landing_page',
          timestamp: new Date().toISOString(),
        }),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#004F9A] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: WM_YELLOW }}>
            <CheckCircle className="w-8 h-8 text-[#004F9A]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">You're On the List</h1>
          <p className="text-blue-200 mb-6">
            We'll send you everything you need to know about selling on Walmart — keep an eye on your inbox.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left">
            <p className="text-sm font-semibold text-white mb-2">While you wait:</p>
            <ul className="text-sm text-blue-100 space-y-1.5">
              <li>Check out Travis's <a href="https://www.youtube.com/c/TravisMarziani" target="_blank" rel="noopener noreferrer" className="underline font-medium text-yellow-300">YouTube channel</a></li>
              <li>Try our free <a href="/productscorecard" className="underline font-medium text-yellow-300">Product Scorecard Tool</a></li>
              <li>Explore the <a href="/productestimator" className="underline font-medium text-yellow-300">Profit Estimator</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#004F9A] flex items-center justify-center px-4">
      <div className="max-w-lg w-full py-12">
        {/* Walmart spark + headline */}
        <div className="text-center mb-8">
          {/* Walmart-style spark icon */}
          <div className="flex items-center justify-center mb-5">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-lg">
              <path d="M24 4L26.5 18H31L24 24L17 18H21.5L24 4Z" fill={WM_YELLOW} />
              <path d="M24 44L21.5 30H17L24 24L31 30H26.5L24 44Z" fill={WM_YELLOW} />
              <path d="M4 24L18 21.5V17L24 24L18 31V26.5L4 24Z" fill={WM_YELLOW} />
              <path d="M44 24L30 26.5V31L24 24L30 17V21.5L44 24Z" fill={WM_YELLOW} />
              <path d="M8.2 8.2L19 17.5L16 15.5L24 24L15.5 16L17.5 19L8.2 8.2Z" fill={WM_YELLOW} />
              <path d="M39.8 39.8L29 30.5L32 32.5L24 24L32.5 32L30.5 29L39.8 39.8Z" fill={WM_YELLOW} />
              <path d="M8.2 39.8L17.5 29L15.5 32L24 24L16 32.5L19 30.5L8.2 39.8Z" fill={WM_YELLOW} />
              <path d="M39.8 8.2L30.5 19L32.5 16L24 24L32 15.5L29 17.5L39.8 8.2Z" fill={WM_YELLOW} />
            </svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            Get Help Selling<br />on Walmart
          </h1>
          <p className="text-blue-200 text-base md:text-lg max-w-md mx-auto">
            We're building something specifically for Walmart sellers. Drop your email and we'll send you everything first.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selling status question */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Are you already selling on Walmart?
              </label>
              <div className="space-y-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSellingStatus(opt.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      sellingStatus === opt.value
                        ? 'border-[#0071DC] bg-blue-50 text-[#004F9A] font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        sellingStatus === opt.value
                          ? 'border-[#0071DC]'
                          : 'border-gray-300'
                      }`}>
                        {sellingStatus === opt.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0071DC]" />
                        )}
                      </div>
                      <span className="text-sm">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email input — only shows after they pick a status */}
            {sellingStatus && (
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-[#0071DC] focus:ring-0 focus:outline-none text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {/* Submit */}
            {sellingStatus && (
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-3.5 px-6 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: WM_BLUE }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#005BB5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = WM_BLUE)}
              >
                {isSubmitting ? 'Submitting...' : 'Get Early Access'}
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-blue-300 mt-6">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
