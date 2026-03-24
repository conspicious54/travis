import React from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { FeaturedLogos } from '../components/FeaturedLogos';
import {
  ResearchVideo,
  BreakoutVideos,
  OpportunitySection,
  TestimonialHighlights,
  ResourceSection,
  SharedFooter,
} from '../components/TrainingNewSections';
import { CheckCircle, Calendar, Clock, Star, Shield } from 'lucide-react';

/* ───────────────────── closer-specific sections ──────────────────── */

function CloserConfirmationBanner() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-10 text-center">
        <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <CheckCircle className="w-3.5 h-3.5" />
          Step 1 of 2 — Complete
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          Your Strategy Call is Booked!
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-6">
          Make sure it's on your calendar — then complete Step 2 below before your call.
        </p>

        {/* Calendar add buttons */}
        <div className="inline-block bg-white border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-sm mb-5">
          <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-4">Add your call to your calendar:</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Amazon+Strategy+Call+with+Passion+Product&details=Your+personalized+Amazon+FBA+strategy+session.+Join+link+will+be+in+your+confirmation+email."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M18 2H6a4 4 0 00-4 4v12a4 4 0 004 4h12a4 4 0 004-4V6a4 4 0 00-4-4z" fill="#fff" stroke="#D1D5DB" strokeWidth="1"/>
                <path d="M8.5 14.2l2.1-2.1 2.1 2.1 2.1-2.1 2.1 2.1" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="6" y="6" width="4" height="4" rx="0.5" fill="#EA4335"/>
                <rect x="14" y="6" width="4" height="4" rx="0.5" fill="#FBBC04"/>
                <rect x="6" y="14" width="4" height="4" rx="0.5" fill="#34A853"/>
                <rect x="14" y="14" width="4" height="4" rx="0.5" fill="#4285F4"/>
              </svg>
              Google Calendar
            </a>

            <a
              href="https://outlook.live.com/calendar/0/deeplink/compose?subject=Amazon+Strategy+Call+with+Passion+Product&body=Your+personalized+Amazon+FBA+strategy+session."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
                <path d="M2 8l10 6 10-6" stroke="#fff" strokeWidth="1.5"/>
              </svg>
              Outlook
            </a>

            {/* TODO: Replace with actual HubSpot meeting link */}
            <a
              href="https://meetings.hubspot.com/passion-product/strategy-call"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#FF7A59"/>
                <path d="M14 9.5a2 2 0 11-4 0 2 2 0 014 0z" fill="#fff"/>
                <path d="M8 15.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              HubSpot Calendar
            </a>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Now complete Step 2 below before your call
        </div>
      </div>
    </div>
  );
}

function CloserFinalCTA() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          You've Already Taken the Hardest Step
        </h2>
        <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
          Most people think about starting an Amazon business for months — or years. You actually booked the call. Now show up, and let's build your plan together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Amazon+Strategy+Call+with+Passion+Product&details=Your+personalized+Amazon+FBA+strategy+session."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Add to Calendar
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100 text-sm">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-300" /> 14,000+ students taught</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-300" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-200" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function TrainingNewCloser() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeaderLight />
      <CloserConfirmationBanner />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <FeaturedLogos theme="light" />
      <CloserFinalCTA />
      <SharedFooter />
    </div>
  );
}
