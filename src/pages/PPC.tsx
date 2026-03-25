import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

/* ──────────────────────── mailchimp ──────────────────────────────── */

const MC_U = '390599db9e3bac1fdce322d15';
const MC_ID = 'e97b6c6353';
const MC_DC = 'us7';

function subscribeToMailchimp(email: string, tag: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const callbackName = 'mc_cb_' + Date.now();

    const params = new URLSearchParams({
      u: MC_U,
      id: MC_ID,
      f_id: '0001cee1f0',
      c: callbackName,
      EMAIL: email,
      ENTRYSR: 'PPC Course Landing Page',
      tags: tag,
    });

    const url = `https://${MC_DC}.api.mailchimp.com/subscribe/post-json?${params.toString()}`;

    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.head.removeChild(script);
      if (data.result === 'success' || (data.msg && data.msg.includes('already subscribed'))) {
        resolve();
      } else {
        reject(new Error(data.msg || 'Subscription failed'));
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.head.removeChild(script);
      reject(new Error('Failed to reach Mailchimp'));
    };
    document.head.appendChild(script);
  });
}

/* ──────────────────────── page ───────────────────────────────────── */

export function PPC() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await subscribeToMailchimp(email, 'PPC');
    } catch (error) {
      console.error('Mailchimp error:', error);
    }
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">You're On the List</h1>
          <p className="text-gray-600">
            We'll send you everything you need to know about the Amazon PPC Course — keep an eye on your inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full py-12">
        <div className="text-center mb-8">
          <img
            src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png"
            alt="Passion Product"
            className="h-10 mx-auto mb-6"
          />
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            In-Depth Amazon<br />PPC Course
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Learn the exact PPC strategies top sellers use to rank fast, scale profitably, and turn ad spend into real revenue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Enter your email address"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Get the PPC Training'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
