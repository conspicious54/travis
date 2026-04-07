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

/* ───── HubSpot meeting parsing + ICS generation ──────────────────── */

interface MeetingInfo {
  start: Date;
  end: Date;
  title: string;
  joinUrl: string;
  organizer: string;
  firstName: string;
  lastName: string;
  email: string;
}

function parseDate(val: string | null): Date | null {
  if (!val) return null;
  if (/^\d+$/.test(val)) {
    const num = parseInt(val, 10);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseMeetingInfo(): MeetingInfo | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);

  const start =
    parseDate(p.get('start')) ||
    parseDate(p.get('startTime')) ||
    parseDate(p.get('start_time')) ||
    parseDate(p.get('meetingStartTime'));

  if (!start) return null;

  const end =
    parseDate(p.get('end')) ||
    parseDate(p.get('endTime')) ||
    parseDate(p.get('end_time')) ||
    parseDate(p.get('meetingEndTime')) ||
    new Date(start.getTime() + 30 * 60 * 1000);

  return {
    start,
    end,
    title: p.get('title') || 'Amazon Strategy Call with Passion Product',
    joinUrl: p.get('join') || p.get('joinUrl') || p.get('conferenceUrl') || '',
    organizer: p.get('organizer') || p.get('organizerName') || 'Passion Product Team',
    firstName: p.get('first_name') || p.get('firstName') || '',
    lastName: p.get('last_name') || p.get('lastName') || '',
    email: p.get('email') || '',
  };
}

function getFirstName(): string {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('first_name') || p.get('firstName') || '';
}

function formatForICS(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildICS(m: MeetingInfo): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@passionproduct.com`;
  const now = formatForICS(new Date());
  const description = [
    'Your personalized Amazon FBA strategy session with the Passion Product team.',
    '',
    m.joinUrl ? `Join link: ${m.joinUrl}` : '',
    '',
    'Come ready with your goals, budget, and any questions about your Amazon journey.',
  ].filter(Boolean).join('\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Passion Product//Strategy Call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatForICS(m.start)}`,
    `DTEND:${formatForICS(m.end)}`,
    `SUMMARY:${m.title}`,
    `DESCRIPTION:${description}`,
    m.joinUrl ? `LOCATION:${m.joinUrl}` : 'LOCATION:Video Call',
    `ORGANIZER;CN=${m.organizer}:MAILTO:team@passionproduct.com`,
    m.email ? `ATTENDEE;CN=${m.firstName} ${m.lastName};RSVP=TRUE:MAILTO:${m.email}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Strategy call with Passion Product in 15 minutes',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

function downloadICS(m: MeetingInfo) {
  const ics = buildICS(m);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'passion-product-strategy-call.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

function CloserConfirmationBanner({ meeting, firstName }: { meeting: MeetingInfo | null; firstName: string }) {
  return (
    <div className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white border-b border-orange-100/60">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-7 md:pt-8 md:pb-9 text-center">
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          {firstName ? `${firstName}, You're Booked` : "Your Call is Booked"} — Now Complete <span className="text-orange-600">Step 2</span>
        </h1>

        {meeting ? (
          <>
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

            <div>
              <button
                onClick={() => downloadICS(meeting)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Add to My Calendar
              </button>
              <p className="text-xs text-gray-400 mt-2">Works with Google, Outlook, Apple Calendar, and more</p>
            </div>
          </>
        ) : (
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
            Check your email for the calendar invite and join link.
          </p>
        )}
      </div>
    </div>
  );
}

function CloserFinalCTA({ meeting, firstName }: { meeting: MeetingInfo | null; firstName: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {firstName ? `${firstName}, you've taken the ` : "You've Already Taken the "}
          <span className="text-orange-400">Hardest Step</span>
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
          You booked the call. Now show up ready, and let's build your plan together.
        </p>

        {meeting && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => downloadICS(meeting)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
            >
              <Calendar className="w-4 h-4" />
              Add to My Calendar
            </button>
          </div>
        )}

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
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const m = parseMeetingInfo();
    setMeeting(m);
    setFirstName(m?.firstName || getFirstName());
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <StepProgressBar />
      <CloserConfirmationBanner meeting={meeting} firstName={firstName} />
      <ResearchVideo />
      <BreakoutVideos />
      <OpportunitySection />
      <TestimonialHighlights />
      <ResourceSection />
      <CloserFinalCTA meeting={meeting} firstName={firstName} />
      <SharedFooter />
    </div>
  );
}
