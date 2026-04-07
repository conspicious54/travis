import React, { useEffect, useState } from 'react';
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

function StepProgressBar() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booked</span>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold ring-4 ring-orange-100">
              2
            </div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Prepare</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── HubSpot meeting time parsing ────────────────────────────────
   HubSpot's meetings tool passes params on redirect. We support several
   common variants so this works regardless of HubSpot's flow:
   - meetingStartTime / meetingEndTime (epoch ms)
   - start_time / end_time (epoch ms or ISO)
   - start / end (ISO)
   You can also pass it manually as ?start=2026-04-10T15:00:00Z
─────────────────────────────────────────────────────────────────────── */

function parseMeetingTime(): { start: Date; end: Date } | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);

  const startRaw =
    p.get('meetingStartTime') ||
    p.get('start_time') ||
    p.get('startTime') ||
    p.get('start');
  const endRaw =
    p.get('meetingEndTime') ||
    p.get('end_time') ||
    p.get('endTime') ||
    p.get('end');

  if (!startRaw) return null;

  const parseDate = (val: string): Date | null => {
    // Try epoch ms first
    if (/^\d+$/.test(val)) {
      const num = parseInt(val, 10);
      // If < 10^12 it's probably seconds, not ms
      const ms = num < 1e12 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    // Try ISO
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseDate(startRaw);
  if (!start) return null;
  const end = endRaw ? parseDate(endRaw) : new Date(start.getTime() + 30 * 60 * 1000);
  if (!end) return null;

  return { start, end };
}

function formatForCalendarUrl(d: Date): string {
  // YYYYMMDDTHHmmssZ
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatHumanDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHumanTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function CloserConfirmationBanner() {
  const [meeting, setMeeting] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    setMeeting(parseMeetingTime());
  }, []);

  const eventTitle = 'Amazon Strategy Call with Passion Product';
  const eventDetails = 'Your personalized Amazon FBA strategy session. Join link is in your confirmation email.';

  // Build calendar URLs — use meeting time if available, otherwise generic
  const googleUrl = meeting
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatForCalendarUrl(meeting.start)}/${formatForCalendarUrl(meeting.end)}&details=${encodeURIComponent(eventDetails)}`
    : `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDetails)}`;

  const outlookUrl = meeting
    ? `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(eventDetails)}&startdt=${meeting.start.toISOString()}&enddt=${meeting.end.toISOString()}`
    : `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(eventDetails)}`;

  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-7 md:pt-8 md:pb-9 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          Your Call is Booked — Now Complete <span className="text-orange-600">Step 2</span>
        </h1>

        {meeting ? (
          <div className="inline-flex flex-col items-center gap-1 bg-white border border-orange-200 rounded-xl px-5 py-3 shadow-sm mt-3 mb-5">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm md:text-base">
              <Calendar className="w-4 h-4 text-orange-600" />
              {formatHumanDate(meeting.start)}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-xs md:text-sm">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              {formatHumanTime(meeting.start)}
            </div>
          </div>
        ) : (
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto mb-5">
            Add the call to your calendar so you don't miss it.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 transition-all shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            Add to Google Calendar
          </a>
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 transition-all shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            Add to Outlook
          </a>
        </div>
      </div>
    </div>
  );
}

function CloserFinalCTA() {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          You've Already Taken the <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          You booked the call. Now show up ready, and let's build your plan together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Amazon+Strategy+Call+with+Passion+Product&details=Your+personalized+Amazon+FBA+strategy+session."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-orange-400" /> 14,000+ students taught</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function TrainingNewCloser() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <StepProgressBar />
      <CloserConfirmationBanner />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <CloserFinalCTA />
      <SharedFooter />
    </div>
  );
}
