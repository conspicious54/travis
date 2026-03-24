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

/* ───────────────────── generic confirmation sections ─────────────── */

function ConfirmationBanner() {
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
          Add it to your calendar — then complete Step 2 below before your call.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Amazon+Strategy+Call+with+Passion+Product&details=Your+personalized+Amazon+FBA+strategy+session.+Join+link+will+be+in+your+confirmation+email."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Add to Google Calendar
          </a>
          <a
            href="https://outlook.live.com/calendar/0/deeplink/compose?subject=Amazon+Strategy+Call+with+Passion+Product&body=Your+personalized+Amazon+FBA+strategy+session."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Add to Outlook
          </a>
        </div>

        <div className="inline-flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Now complete Step 2 below before your call
        </div>
      </div>
    </div>
  );
}

function FinalCTA() {
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

export function TrainingNew() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeaderLight />
      <ConfirmationBanner />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <FeaturedLogos theme="light" />
      <FinalCTA />
      <SharedFooter />
    </div>
  );
}
