import React, { useState } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { Link } from 'react-router-dom';
import { userDataService } from '../services/userDataService';

export function OptIn() {
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !acceptedTerms) return;

    setIsSubmitting(true);
    try {
      await userDataService.updateQuestionnaireData({ phone });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error saving phone number:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <HeaderLight />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600">Your phone number has been successfully registered. You will receive SMS updates about our Amazon FBA program.</p>
          <p className="text-gray-500 mt-4">Text HELP for help. Text STOP to cancel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <HeaderLight />
      
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">SMS Program Enrollment</h1>
          <p className="text-gray-600 mb-8 text-center">Sign up to receive important updates about the Passion Product Formula Amazon FBA program</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                required
                placeholder="(555) 555-5555"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">U.S. mobile numbers only</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I agree to receive recurring automated text messages from Passion Product Formula about the Amazon FBA program. I understand that:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Message frequency varies (up to 5 msgs/week)</li>
                        <li>Msg & data rates may apply</li>
                        <li>Consent is not required for purchase</li>
                        <li>I can text STOP to 12345 to opt-out at any time</li>
                        <li>I can text HELP to 12345 for help</li>
                      </ul>
                      By checking this box, I certify that I am over 18 and agree to the{' '}
                      <Link to="/terms" className="text-blue-500 hover:text-blue-600 font-medium">
                        Terms and Conditions
                      </Link>
                      {' '}and consent to receive automated marketing messages.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!phone || !acceptedTerms || isSubmitting}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Sign Up for SMS Updates'}
            </button>

            <div className="text-sm text-gray-500 space-y-2">
              <p>
                Supported carriers: AT&T, T-Mobile, Verizon, Sprint, and most other major carriers
              </p>
              <p>
                For support: Text HELP to 12345 or email support@passionproduct.com
              </p>
              <p>
                To opt-out: Reply STOP to any message
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}