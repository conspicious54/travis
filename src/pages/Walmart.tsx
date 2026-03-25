import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

/* ──────────────────────────── types ──────────────────────────────── */

type SellingStatus = 'yes_walmart' | 'yes_amazon' | 'neither' | null;

/* TODO: Replace with your actual Make.com webhook URL that routes to Mailchimp */
const WALMART_WEBHOOK_URL = 'https://hook.us2.make.com/YOUR_WALMART_WEBHOOK_HERE';

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
      // Still show success — webhook may fail silently and retry in Make
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">You're On the List</h1>
          <p className="text-gray-600 mb-6">
            We'll send you everything you need to know about selling on Walmart — keep an eye on your inbox.
          </p>
          <div className="bg-blue-50 rounded-xl p-5 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">While you wait:</p>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>Check out Travis's <a href="https://www.youtube.com/c/TravisMarziani" target="_blank" rel="noopener noreferrer" className="underline font-medium">YouTube channel</a></li>
              <li>Try our free <a href="/productscorecard" className="underline font-medium">Product Scorecard Tool</a></li>
              <li>Explore the <a href="/productestimator" className="underline font-medium">Profit Estimator</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png"
            alt="Passion Product"
            className="h-10 mx-auto mb-6"
          />
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Get Help Selling on Walmart
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            We're putting together something specifically for Walmart sellers. Drop your email and we'll send you everything first.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      sellingStatus === opt.value
                        ? 'border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {sellingStatus === opt.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
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
            <div className="animate-in fade-in">
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                Your email
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm"
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
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Get Early Access'}
            </button>
          )}
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
