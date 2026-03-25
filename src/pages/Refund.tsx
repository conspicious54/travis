import React, { useState } from 'react';
import { Shield, Lock, Calendar, ChevronDown } from 'lucide-react';

/* ─────────────────────────── refund page ─────────────────────────── */

export function Refund() {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToNonDisparagement, setAgreedToNonDisparagement] = useState(false);
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundDetail, setRefundDetail] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allChecked = agreedToTerms && agreedToNonDisparagement && confirmUnderstand;
  const formComplete = allChecked && refundReason && fullName && email;

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComplete) return;
    setIsSubmitting(true);

    try {
      // TODO: Wire to your refund processing webhook
      await fetch('https://hook.us2.make.com/67dsntvx5ikpa21o25wl05wc8v4tv1vf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'refund_request',
          full_name: fullName,
          email,
          reason: refundReason,
          detail: refundDetail,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error submitting refund:', error);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Refund Request Received</h1>
          <p className="text-gray-600 text-sm">
            Your refund request has been submitted. Our team will process it and you'll receive a confirmation email within 5–7 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png"
            alt="Passion Product"
            className="h-10 mx-auto mb-8"
          />
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">
            We're Sad to See You Go
          </h1>
        </div>

        {/* Main copy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <p className="text-gray-700 leading-relaxed mb-4">
            We strive for the Passion Product Formula to be the #1 resource &amp; tool for entrepreneurs looking to sell on Amazon.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            People including <span className="font-bold">Brent</span>, <span className="font-bold">AJ</span>, &amp; <span className="font-bold">many others</span> have gone from working day jobs to growing 7-figure Amazon businesses. That being said, we understand that selling on Amazon is not for everyone &amp; oftentimes getting started can seem daunting. It's a lot of hard work to start an Amazon business &amp; as much as we can guide you through it, it's up to you to take the steps to make it happen. That's why we offer our <em>30-day, unconditional money-back guarantee</em>.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Before you go, we do want to give you the offer to <span className="font-bold">speak with an Amazon Expert from our team</span>. Sometimes that's just what our sellers need to get over the hump &amp; get started on their path towards growing a 7-figure business. It's totally optional, but the offer's there for you to take. We hope to see you back with us, but otherwise, we wish you well.
          </p>
          <p className="text-gray-700 font-medium">
            – The Passion Product Team
          </p>
        </div>

        {/* CTA: Talk to expert (the "save" path) */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 mb-6 text-center">
          <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Before You Decide — Talk to an Expert</h2>
          <p className="text-gray-600 text-sm mb-5 max-w-md mx-auto">
            A free, no-pressure call with someone on our team who can help you work through whatever's holding you back. Most people who take this call end up glad they did.
          </p>
          <a
            href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2z4p_0DhGP2JGZp5g"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
          >
            <Calendar className="w-4 h-4" />
            Meet With an Amazon Expert
          </a>
        </div>

        {/* Refund path — collapsed by default for friction */}
        {!showRefundForm ? (
          <div className="text-center">
            <button
              onClick={() => setShowRefundForm(true)}
              className="text-gray-400 text-sm underline underline-offset-2 hover:text-gray-500 cursor-pointer"
            >
              No thanks, I'd like to request a refund
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Refund Request</h2>

              <form onSubmit={handleRefundSubmit} className="space-y-6">

                {/* Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="refundEmail" className="block text-sm font-semibold text-gray-900 mb-1.5">Email Address Used at Purchase</label>
                  <input
                    type="email"
                    id="refundEmail"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Reason dropdown */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-semibold text-gray-900 mb-1.5">Reason for Refund</label>
                  <div className="relative">
                    <select
                      id="reason"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm appearance-none cursor-pointer"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    >
                      <option value="">Select a reason...</option>
                      <option value="cant_afford">I can't afford it right now</option>
                      <option value="no_time">I don't have enough time</option>
                      <option value="not_what_expected">It wasn't what I expected</option>
                      <option value="too_complicated">It feels too complicated</option>
                      <option value="found_alternative">I found another solution</option>
                      <option value="personal_reasons">Personal reasons</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Detail textarea */}
                <div>
                  <label htmlFor="detail" className="block text-sm font-semibold text-gray-900 mb-1.5">Please tell us more <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    id="detail"
                    rows={3}
                    placeholder="Is there anything we could have done differently?"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:outline-none text-sm resize-none"
                    value={refundDetail}
                    onChange={(e) => setRefundDetail(e.target.value)}
                  />
                </div>

                {/* Agreement checkboxes — all 3 required */}
                <div className="space-y-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Required Acknowledgments</p>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      I've read and agree with the <a href="/terms" target="_blank" className="text-blue-600 underline">Terms of Service</a>.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToNonDisparagement}
                      onChange={(e) => setAgreedToNonDisparagement(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      I agree to the Non-Disparagement &amp; Disclosure Clause — to not discuss, slander, or talk about the contents of PPF in a way that could damage or disclose the contents of the program or business.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmUnderstand}
                      onChange={(e) => setConfirmUnderstand(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      I understand that once my refund is processed, I will <span className="font-bold">no longer have access</span> to any Passion Product LLC services and will not be granted access to purchase them again in the future.
                    </span>
                  </label>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    Once the "Request Refund" button is pressed, you will no longer be granted access to purchase Passion Product LLC services. This action cannot be undone.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!formComplete || isSubmitting}
                  className="w-full py-3 px-6 bg-gray-300 text-gray-500 font-medium rounded-xl text-sm transition-colors disabled:cursor-not-allowed enabled:bg-red-600 enabled:text-white enabled:hover:bg-red-700 enabled:cursor-pointer"
                >
                  {isSubmitting ? 'Processing...' : 'Request Refund'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 mt-10 mb-6">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Shield className="w-4 h-4" />
            <span>30-Day Money Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Lock className="w-4 h-4" />
            <span>Secure Refund</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
