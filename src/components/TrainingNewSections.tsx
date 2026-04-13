import React, { useState, useRef, useEffect } from 'react';
import { Play, Video, ChevronDown, ChevronUp, ExternalLink, BookOpen, Wrench, TrendingUp, ArrowRight, DollarSign, Briefcase, Target, Clock, Shield, Lightbulb, AlertTriangle, Quote, Zap, Sparkles, Heart, Compass, Award, Users, CheckCircle } from 'lucide-react';
import type { Personalization, Reason, Situation, ValuedFeature, Capital, TravisHistory, Region } from '../lib/personalization';
import { trackTestimonialsExpanded, trackCreditQuizStarted, trackCreditQuizCompleted, trackCreditCardApplyClicked } from '../lib/posthog';

/* ───────────────────────────── helpers ───────────────────────────── */

export function LazyVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsLoaded(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
      {isLoaded ? (
        <video
          className="w-full h-full object-cover"
          poster={poster}
          controls
          preload="none"
          playsInline
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-7 h-7 text-gray-900 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

export function YouTubeLazyEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsLoaded(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
      {showIframe ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : isLoaded ? (
        <button
          onClick={() => setShowIframe(true)}
          className="absolute inset-0 w-full h-full group cursor-pointer"
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 group-hover:bg-red-500 transition-colors flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 md:w-9 md:h-9 text-white ml-1" />
            </div>
          </div>
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <Play className="w-10 h-10 text-gray-500" />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── shared sections ────────────────────────── */

/* ───────────── personalized "we hear you" intro ──────────────────── */

const REASON_COPY: Record<Reason, { eyebrow: string; headline: string; body: string; icon: React.ReactNode }> = {
  asset: {
    eyebrow: 'You Want a Real Asset',
    headline: "Building something that pays you whether you're working or not",
    body: "You don't want another job. You want an asset. An Amazon brand keeps generating sales while you sleep, travel, and spend time with family. That's exactly what you're about to map out on your call.",
    icon: <Award className="w-5 h-5" />,
  },
  freedom: {
    eyebrow: 'You Want Your Time Back',
    headline: 'Built so you never have to ask permission again',
    body: "The 9-to-5 isn't the goal. Freedom is. The path out is real, and it's been walked by thousands of people who started exactly where you are. Tired of the schedule, tired of the commute, tired of the cap on what they could earn. On your call, we'll build the path that gets you out.",
    icon: <Heart className="w-5 h-5" />,
  },
  exploring: {
    eyebrow: "You're Doing Your Research",
    headline: "Smart. Most people skip this part and regret it.",
    body: "Looking before you leap is the right move. The video above walks you through exactly what we do, who it's for, and why it works. By the time you're on the call, you'll know if this is the right path for you.",
    icon: <Compass className="w-5 h-5" />,
  },
  unknown: {
    eyebrow: 'You Took the First Step',
    headline: "Most people don't even get this far",
    body: "Booking the call puts you in a tiny minority of people who actually take action. Watch the video above before your call so you show up ready, and we can spend the time on what matters most for you.",
    icon: <Sparkles className="w-5 h-5" />,
  },
};

const SITUATION_NOTE: Record<Situation, string | null> = {
  never_started: "Since this is your first business, the call will focus on the structure and accountability you need to do this right from day one.",
  tried_failed: "Since you've tried entrepreneurship before, the call will focus on what was missing the first time. The actual roadmap.",
  amazon_stuck: "Since you're already on Amazon and stuck, the call will focus on the specific lever that's holding you back and how to break through.",
  researching: "Since you're still evaluating your options, the call will give you a clear, honest read on whether Amazon FBA is the right fit for you.",
  unknown: null,
};

const CAPITAL_NOTE: Record<Capital, string | null> = {
  have: "Since you have capital ready, we'll focus on getting you launched fast.",
  access: "Since you can access capital when you need it, we'll map out the smart way to deploy it.",
  save: "Since you're still building up your capital, we'll cover the strategies for launching on Amazon with less than $1,000. See the section below.",
  none: "Since launch capital is tight, we'll cover the strategies for launching on Amazon with less than $1,000. See the section below.",
  unknown: null,
};

const TRAVIS_GREETING: Record<TravisHistory, string | null> = {
  over_year: "Welcome, longtime follower. You've been around for a while, so you already know how this works.",
  months: "You've been following Travis for a few months now. This is the same approach you've been hearing about.",
  recent: "Glad you found Travis recently. You're going to learn a lot before this call.",
  never: "If you're new to Travis's work, the video below is the best place to start. It covers everything in 5 minutes.",
  unknown: null,
};

export function PersonalizedIntro({ p }: { p: Personalization | null }) {
  if (!p) return null;

  const reasonCopy = REASON_COPY[p.reason] || REASON_COPY.unknown;
  const situationNote = SITUATION_NOTE[p.situation];
  const capitalNote = CAPITAL_NOTE[p.capital];
  const travisGreeting = TRAVIS_GREETING[p.travisHistory];

  // If we have literally no useful data, render nothing
  const hasAnything =
    p.reason !== 'unknown' ||
    p.situation !== 'unknown' ||
    p.capital !== 'unknown' ||
    p.travisHistory !== 'unknown';
  if (!hasAnything) return null;

  return (
    <div className="bg-white border-b border-orange-100/60">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50/40 border border-orange-200/60 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md">
              {reasonCopy.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-orange-700 text-xs font-bold uppercase tracking-[0.12em] mb-1">
                {reasonCopy.eyebrow}
              </p>
              <h3 className="text-lg md:text-2xl font-black text-gray-900 leading-tight mb-2">
                {p.firstName ? `${p.firstName}, ` : ''}{reasonCopy.headline}
              </h3>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                {reasonCopy.body}
              </p>

              {(situationNote || capitalNote || travisGreeting) && (
                <div className="mt-4 pt-4 border-t border-orange-200/60 space-y-2">
                  {situationNote && (
                    <p className="text-xs md:text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">→</span>
                      <span>{situationNote}</span>
                    </p>
                  )}
                  {capitalNote && (
                    <p className="text-xs md:text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">→</span>
                      <span>{capitalNote}</span>
                    </p>
                  )}
                  {travisGreeting && (
                    <p className="text-xs md:text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">→</span>
                      <span>{travisGreeting}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── what to expect on the call (personalized) ─────────── */

const VALUE_COPY: Record<ValuedFeature, { title: string; body: string }> = {
  group_calls: {
    title: 'Weekly group coaching is a core part of working with us',
    body: "On your call, we'll show you exactly how the group calls work, what gets discussed, and why people say it's the thing that keeps them moving forward.",
  },
  one_on_one: {
    title: '1-on-1 strategy calls are how people get unstuck fastest',
    body: "On your call, we'll show you how the personalized 1-on-1 sessions work and the kinds of breakthroughs that come from them.",
  },
  curriculum: {
    title: 'A structured roadmap is the spine of how we work together',
    body: "On your call, we'll walk you through the roadmap. Every step, in order, with worksheets. So you know exactly what you'd be working on each week.",
  },
  community: {
    title: 'The community keeps people moving when motivation dips',
    body: "On your call, we'll show you what the community looks like, who's in it, and how accountability with people who get it changes the game.",
  },
  unknown: {
    title: "Here's what we'll cover on your call",
    body: "We'll walk through your goals, what's been getting in your way, and exactly what the next step looks like for you.",
  },
};

export function WhatToExpect({ p }: { p: Personalization | null }) {
  if (!p || p.valuedFeature === 'unknown') return null;
  const copy = VALUE_COPY[p.valuedFeature];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
      <div className="bg-gray-900 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-orange-400 text-xs font-bold uppercase tracking-[0.12em] mb-1">What to Expect on Your Call</p>
            <h3 className="text-lg md:text-xl font-bold mb-2">{copy.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{copy.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResearchVideo() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-10 md:pt-10 md:pb-12">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-red-700">
          <Play className="w-3 h-3" />
          Required before your call
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-orange-400/20 rounded-3xl blur-xl" />
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video ring-1 ring-gray-200">
          <iframe
            src="https://videos.sproutvideo.com/embed/5a9adbb3181fe6cfd0/12f186a3bf77fb51"
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Watch this before your call"
          />
        </div>
      </div>

      {/* Scroll-down indicator */}
      <div className="text-center mt-10 md:mt-12">
        <p className="text-sm md:text-base text-gray-600 font-medium mb-3">
          Have questions? Keep scrolling. <span className="text-orange-600 font-bold">We've answered them below.</span>
        </p>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 animate-bounce">
          <ChevronDown className="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </div>
  );
}

export function BreakoutVideos({ p }: { p?: Personalization | null }) {
  const breakouts = [
    {
      key: 'saturated',
      headline: "But isn't Amazon too saturated at this point?",
      embed: 'https://videos.sproutvideo.com/embed/dc9adbb31513e1c056/9a833984ebbbd62f',
    },
    {
      key: 'capital',
      headline: "But what if I don't have a lot of money to start?",
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb31511eec506/80d1f8e8fb8fd47b',
    },
    {
      key: 'time',
      headline: "What if I'm already working full-time?",
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb31510e7cd06/6d5e29c2559707a4',
    },
    {
      key: 'idea',
      headline: "I don't even have a product idea yet. Is that okay?",
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb3181ee2cb06/c87808d62d097bd1',
    },
    {
      key: 'trust',
      headline: "How do I know I can actually trust this?",
      embed: 'https://videos.sproutvideo.com/embed/ee9adbb31513e7c164/0e0d27cd2ae31e59',
    },
    {
      key: 'wrong',
      headline: "What if I pick the wrong product and lose my money?",
      embed: 'https://videos.sproutvideo.com/embed/aa9adbb3181ee0c020/edb75f1300af4b4d',
    },
  ];

  // Reorder so the most relevant breakout for this person comes first
  if (p) {
    const priority: string[] = [];
    if (p.capital === 'none' || p.capital === 'save') priority.push('capital');
    if (p.situation === 'never_started') priority.push('idea');
    if (p.situation === 'tried_failed') priority.push('trust', 'wrong');
    if (p.situation === 'amazon_stuck') priority.push('wrong', 'saturated');
    if (p.situation === 'researching') priority.push('saturated', 'trust');
    if (p.travisHistory === 'never') priority.push('trust');
    // Move priority items to the front, preserving relative order
    breakouts.sort((a, b) => {
      const ai = priority.indexOf(a.key);
      const bi = priority.indexOf(b.key);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  const personalEyebrow = p && p.firstName
    ? `${p.firstName}, watch the ones that apply to you`
    : 'Common Questions';

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            {personalEyebrow}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Every Question You Have, <span className="text-orange-600">Answered</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {breakouts.map((b, i) => (
            <div key={i} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all">
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
              <h3 className="font-bold text-gray-900 text-base md:text-lg p-5 group-hover:text-orange-700 transition-colors">{b.headline}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OpportunitySection() {
  return (
    <div className="bg-gradient-to-b from-white via-orange-50/30 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">Why Now Matters</span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-[1.1]">
            The Window Is Wide Open <span className="text-orange-600">Right Now</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            While most people get scared off by headlines, the data tells a different story.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Fewer Sellers Entering the Market</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tariffs and uncertainty have scared away a wave of potential sellers. That means less competition for those who actually start. The tariff impact? About 2–3% on total costs. The competition reduction? Significantly more than that.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Niche Branding Is Just Getting Started</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Generic products are saturated, and they should be. But customer expectations have shifted. People want products tailored to them. That shift has created thousands of new niches that didn't exist five years ago. Those niches are waiting to be claimed.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Travis Proved It Again This Year</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Travis launched 5 products this past year across completely different niches. Every single one recouped its investment in the first month. Carnivore Electrolytes crossed $1M and was sold for nearly $1M. Not theory. Proof.
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
            <span className="font-semibold">The people who make the most money are the ones who take action first.</span> Not the ones who wait until everyone else has already proven it works and there's less opportunity left. Every month spent in analysis paralysis is a month of real money left on the table.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialHighlights({ p }: { p?: Personalization | null }) {
  const [showAll, setShowAll] = useState(false);

  const youtubeTestimonials = [
    { id: '9GSDrJRv2CE', name: 'AJ Rantz', revenue: '$1M', time: '3 years' },
    { id: '2X10mIm5eXc', name: 'Brent', revenue: '$293K', time: '12 months' },
    { id: 'SH24ylGlT8k', name: 'Calvin', revenue: '$400K', time: '12 months' },
    { id: 'R-NmmLoh2jo', name: 'Mina', revenue: '$242K', time: '12 months' },
    { id: 'ZRKOfZ1dhMQ', name: 'Juliana', revenue: '$101K', time: '12 months' },
    { id: 'Sg3Vg6C3E-4', name: 'Mindy', revenue: '$2M', time: '5 years' },
    { id: 'u0uTL3662Ic', name: 'Jenny', revenue: '$244K', time: '12 months' },
    { id: 'TE9uGqS0tt0', name: 'Alyssa', revenue: '$126K', time: '8 months' },
    { id: 'Vw9OrGVTGoI', name: 'Michael', revenue: '$310K', time: '12 months' },
    { id: 'ZXJQ0Djz7-k', name: 'Drew', revenue: '$50K', time: '8 months' },
    { id: '-z12BPgI1Wk', name: 'Silvia', revenue: '$2.3M', time: '7 years' },
    { id: 'Xg-ELT32Hvs', name: 'Armand Ferranti', revenue: '$2.7M', time: '4 years' },
    { id: 'sO9ne4DVaR4', name: 'Cheryl Rigdon', revenue: '$5M', time: '11 years' },
    { id: 'gpkaZsTgePo', name: 'Lisa Curtis', revenue: '$1.6M', time: '8 years' },
    { id: '-OA9kOOLCj0', name: 'Bradley Rice', revenue: '$3.6M', time: '8 years' },
    { id: 'z7e05PDZ8ao', name: 'Brett, Jared & Oscar', revenue: '$1.4M', time: '12 months' },
    { id: 'plUMdd5W5Fo', name: 'Ori Zohar', revenue: '$1.4M', time: '5 years' },
    { id: 'ujMaZSEOFKM', name: 'Hrag Kalebijan', revenue: '$159K', time: '4 years' },
    { id: 'eJiiN-dkRcI', name: 'James', revenue: '$28K', time: '13 months' },
    { id: 'RniagkArQ2Q', name: 'Kammel', revenue: '$14K', time: '9 months' },
    { id: 'oiqdgmZYnDU', name: 'Travis Marziani', revenue: '$300K', time: '3 months' },
    { id: 'r9Ra5KJEpiU', name: 'Eman', revenue: '$2.6M', time: '7 years' },
    { id: 'Wi2sK5GjvFk', name: 'Brian', revenue: '$6.2K', time: '11 months' },
    { id: 'gWGMmZqLr1w', name: 'Sydney', revenue: '$173K', time: '2 years' },
    { id: '2eIf8HkISnM', name: 'Ryan', revenue: '$3M', time: '3 years' },
    { id: 'ApGQl9mNqrM', name: 'Jeff', revenue: '$15.4K', time: '6 months' },
    { id: 'm-R0PWcaL0o', name: 'Cynthia', revenue: '$24.5K', time: '11 months' },
    { id: 'sWabSSwVsXg', name: 'Rafael', revenue: '$238K', time: '6 months' },
    { id: 'SvWcnRlXQqQ', name: 'Kammel', revenue: '$913', time: '11 months' },
    { id: 'faZRpz7roPI', name: 'Connor', revenue: '$20K', time: '9 months' },
    { id: 'k7XMP5U1DCk', name: 'Steven Pope', revenue: '$90.9K', time: '12 months' },
    { id: 'xhic32ZsIsk', name: 'Usmani', revenue: '$93.4K', time: '7 months' },
    { id: 'vM2lRASP0YI', name: 'Daryl & Amanda', revenue: '$46.5K', time: '6 months' },
    { id: 'IDgGFwK1H1o', name: 'Elena T. & Elena B.', revenue: '$318K', time: '3 years' },
    { id: 'mmKSnvLMLQY', name: 'Joseph', revenue: '$50K', time: '6 months' },
    { id: 'psC5efZpdIM', name: 'Dr. Killian Stingle', revenue: '$140K', time: '10 months' },
    { id: 'qOknVztF9c8', name: 'Dakota', revenue: '$14M', time: '4–5 years' },
    { id: 'ix6rLsCJqeQ', name: 'Rhett', revenue: '$20M', time: '7 years' },
    { id: 'E8HQu4glbEY', name: 'Gary', revenue: '$100K', time: '12 months' },
    { id: 'TK6Qgd_UmRo', name: 'Troy', revenue: '$260K', time: '2 years' },
    { id: 'Hzl9b8trydU', name: 'Taylor', revenue: '$19K', time: '3 months' },
    { id: 'A3mW5yzush0', name: 'Anna', revenue: '$1.5M', time: '3 years' },
    { id: 'UC-bOKUK3jk', name: 'Edgar', revenue: '$15M', time: '5 years' },
    { id: 'HQxeNn2S9m8', name: 'Jeremy', revenue: '$100K', time: '6 months' },
    { id: 'b_qIEC8Wnhw', name: 'Fred', revenue: '$10K', time: '6 months' },
    { id: 'uJxgKMbOdLE', name: 'Travis Marziani', revenue: '$5M', time: '10 years' },
    { id: '5UPi4XZIdZA', name: 'Michael', revenue: '$180K', time: '5 years' },
    { id: 'HX2LoqSdHJA', name: 'Ariana', revenue: '$100K', time: '3 years' },
    { id: 'pdm1mQWHRWE', name: 'Travis & Willem', revenue: '$7.8K', time: '1 month' },
    { id: '0FQHEwSVjQw', name: 'Michael', revenue: '$20M', time: '5 years' },
    { id: 'EP--rNIg--I', name: 'Kalina', revenue: '$500K', time: '6 years' },
    { id: '8mZNPOi-Rq8', name: 'Scott', revenue: '$400M', time: '10 years' },
    { id: '5EBJIqKslKg', name: 'Andrew', revenue: '$54K', time: '12 months' },
    { id: 'TOTLViQC_AY', name: 'Justin & Karyna', revenue: '$1.6K', time: '1 month' },
    { id: 'rNt5LtAgbKA', name: 'AJ Rantz', revenue: '$500K', time: '1 year' },
    { id: 'IRb5EpPGnRU', name: 'Andrew', revenue: '$330K', time: '12 months' },
    { id: 'AQam5rsO7I8', name: 'JP', revenue: '$10M', time: '14 years' },
    { id: 'rqatb8mOlF8', name: 'Logan & Leanne', revenue: 'Failure', time: '3 months' },
    { id: '4apONZaT8G8', name: 'AJ Rantz', revenue: '$147K', time: '3 months' },
    { id: 'z2YIae_QeWo', name: 'Brandy', revenue: '$20K', time: '1 month' },
    { id: 'YLGlmna7IWU', name: 'Travis', revenue: '$7K', time: '1 month' },
    { id: 'otw5gvZ2P-Q', name: 'Ariana', revenue: '$78K', time: '2 years' },
    { id: 'QrqojLYcguc', name: 'Travis', revenue: '$80K', time: '12 months' },
    { id: 'PdkQ6An2l5w', name: 'Travis', revenue: '$3M', time: '8 years' },
    { id: '7jyiqoK7YwQ', name: 'AJ Rantz', revenue: '$54K', time: '1 month' },
  ];

  // For low/no-capital users, lead with stories that started small
  const SMALL_START_NAMES = ['Mina', 'AJ Rantz', 'Calvin', 'Brandy', 'Travis & Willem', 'Justin & Karyna', 'Connor', 'Cynthia', 'Kammel', 'Fred', 'Jeff'];
  const ordered = [...youtubeTestimonials];
  if (p && (p.capital === 'none' || p.capital === 'save')) {
    ordered.sort((a, b) => {
      const ai = SMALL_START_NAMES.indexOf(a.name);
      const bi = SMALL_START_NAMES.indexOf(b.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  const visible = showAll ? ordered : ordered.slice(0, 6);

  // Personalized intro line for testimonials
  let testimonialSubhead = `${ordered.length} real student stories. Watch any of them.`;
  if (p) {
    if (p.situation === 'amazon_stuck') {
      testimonialSubhead = `Watch how these students broke through the same plateau you're hitting.`;
    } else if (p.situation === 'never_started') {
      testimonialSubhead = `Watch students who, like you, had never started a business before.`;
    }
  }

  return (
    <div className="bg-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            Real Students. Real Results.
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-[1.1]">
            People Just Like You<br className="md:hidden" /> Who <span className="text-orange-600">Took Action</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
            {testimonialSubhead}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((v, i) => (
            <div key={v.id + '-' + i} className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all">
              <YouTubeLazyEmbed videoId={v.id} title={`${v.name} testimonial`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-gray-900 text-sm">{v.name}</span>
                  <span className={`font-black text-sm ${v.revenue === 'Failure' ? 'text-red-500' : 'text-orange-600'}`}>{v.revenue}</span>
                </div>
                <p className="text-xs text-gray-500">in {v.time}</p>
              </div>
            </div>
          ))}
        </div>

        {!showAll && (
          <div className="text-center mt-10">
            <button
              onClick={() => { setShowAll(true); trackTestimonialsExpanded(ordered.length); }}
              className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg"
            >
              Show All {ordered.length} Student Stories →
            </button>
          </div>
        )}

        {showAll && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Individual results vary. Past performance doesn't guarantee future results.
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── low-capital strategies section ─────────────────────
   Only renders for visitors who said they need time to save or have
   no launch capital. Shows three concrete strategies for launching
   on Amazon with less than $1,000.
──────────────────────────────────────────────────────────────────── */

export function LowCapitalStrategies({ p }: { p?: Personalization | null }) {
  if (!p || (p.capital !== 'none' && p.capital !== 'save')) return null;

  return (
    <div className="bg-gradient-to-b from-white via-orange-50/40 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            Built For Where You Are
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-[1.1]">
            How to Launch on Amazon With <br className="md:hidden" />
            <span className="text-orange-600">Less Than $1,000</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            You don't need a fat bank account to start. You need the right strategy. Here are three real ways people launch on Amazon when capital is tight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Strategy 1 — Kickstarter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4 font-black text-lg">
              1
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-2 leading-tight">Use Kickstarter to Fund It</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Real customers paying real money for your product <em>before</em> you manufacture a single unit. You validate the demand and raise the launch capital at the same time. No risk, no out-of-pocket inventory.
            </p>
            <p className="text-xs text-gray-500 italic">
              On your call, we'll walk you through how to set up a Kickstarter campaign that actually funds.
            </p>
          </div>

          {/* Strategy 2 — Cheap product launch */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4 font-black text-lg">
              2
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-2 leading-tight">Launch a Low-Cost Product</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Not every product needs a huge inventory order. There are entire categories where you can launch profitably for under $1,000. Travis encourages this. It's far less risky and lets you prove the model before scaling up.
            </p>
            <p className="text-xs text-gray-500 italic">
              On your call, we'll help you identify the right kind of product to start with.
            </p>
          </div>

          {/* Strategy 3 — Financing */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4 font-black text-lg">
              3
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-2 leading-tight">Use the Power of Financing</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The richest people in the world use financing to fund their businesses. Every skyscraper you walk past was financed, not paid for outright. That's how rich people buy leverage. A 0% APR business credit card for 18 months is one of the easiest ways to get started.
            </p>
            <p className="text-xs text-gray-500 italic">
              On your call, we'll discuss the financing strategies that actually make sense.
            </p>
          </div>
        </div>

        <div className="mt-10 bg-gray-900 text-white rounded-2xl p-6 md:p-8 text-center max-w-3xl mx-auto">
          <p className="text-base md:text-lg font-bold mb-2">
            Tight on capital? It's actually an advantage.
          </p>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            People with limited budgets are forced to be smarter, more disciplined, and more creative. The ones who figure it out almost always outperform people who just throw money at the problem.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────── credit card quiz (US, low capital only) ────────────
   A 2-question quiz that recommends a credit card based on credit
   score. NOTHING is saved — purely client-side, for the visitor's
   personal reference. Only renders for US visitors with limited
   launch capital.
──────────────────────────────────────────────────────────────────── */

type CreditTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

interface CardRecommendation {
  name: string;
  tagline: string;
  apr: string;
  fee: string;
  highlights: string[];
  applyUrl: string;
  bestFor: string;
}

const CARD_BY_TIER: Record<CreditTier, CardRecommendation> = {
  tier1: {
    name: 'Wells Fargo Reflect Card',
    tagline: '21 months 0% APR. The gold standard for funding a launch.',
    apr: '0% APR for 21 months on purchases and balance transfers',
    fee: '$0 annual fee',
    highlights: [
      '21 months of 0% APR. Nearly 2 years to fund and pay down.',
      'Average approved limit around $10,831',
      'No annual fee. Keeps it open after the intro period.',
      'Use it to fund inventory, manufacturing, marketing, and tools',
    ],
    applyUrl: 'https://creditcards.wellsfargo.com/reflect-visa-credit-card/',
    bestFor: '670+ credit (Good to Excellent)',
  },
  tier2: {
    name: 'Capital One QuicksilverOne',
    tagline: 'The realistic best card for fair credit',
    apr: 'No 0% intro period, but the best card you can realistically get at this tier',
    fee: '$39 annual fee',
    highlights: [
      '1.5% unlimited cash back on every purchase',
      'Designed specifically for fair credit',
      'Automatic credit line consideration in as little as 6 months',
      'Check pre-approval without a hard pull',
    ],
    applyUrl: 'https://www.capitalone.com/credit-cards/quicksilverone/',
    bestFor: '600–670 credit (Fair)',
  },
  tier3: {
    name: 'Capital One Quicksilver Secured',
    tagline: 'Build credit fast and graduate to unsecured',
    apr: 'No 0% intro. Focus is on building credit.',
    fee: '$0 annual fee',
    highlights: [
      '1.5% cash back on every purchase',
      '$200 minimum refundable deposit to start',
      'Credit limits from $1,000 to $3,000 based on creditworthiness',
      'Reports to all three bureaus. Graduate to unsecured over time.',
    ],
    applyUrl: 'https://www.capitalone.com/credit-cards/quicksilver-secured/',
    bestFor: '500–600 credit (Bad)',
  },
  tier4: {
    name: 'Capital One Platinum Secured',
    tagline: 'No credit score required. Start here.',
    apr: 'No 0% intro. Focus is on establishing credit.',
    fee: '$0 annual fee',
    highlights: [
      'No credit score required to apply. Just income and debt info.',
      'Deposit as low as $49 for at least a $200 starting line',
      'Automatic credit line review in as little as 6 months. No extra deposit needed.',
      'Reports to all three bureaus. Graduate to unsecured over time.',
    ],
    applyUrl: 'https://www.capitalone.com/credit-cards/platinum-secured/',
    bestFor: 'Below 500 (Very Bad / No Credit)',
  },
};

export function CreditCardQuiz({ p }: { p?: Personalization | null }) {
  const [hasCards, setHasCards] = useState<'yes' | 'no' | null>(null);
  const [tier, setTier] = useState<CreditTier | null>(null);
  const [started, setStarted] = useState(false);

  // Only render for US visitors with limited capital
  if (!p) return null;
  const isLowCapital = p.capital === 'none' || p.capital === 'save';
  const isUS = p.region === 'usa';
  if (!isLowCapital || !isUS) return null;

  const recommendation = tier ? CARD_BY_TIER[tier] : null;

  return (
    <div className="bg-gradient-to-b from-orange-50/40 via-white to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            Funding Strategy
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-[1.1]">
            One of the Best Tools You Can Get?<br />
            <span className="text-orange-600">A Business Credit Card.</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-3">
            Hear us out. There's <span className="font-bold text-gray-900">bad debt</span>, and there's <span className="font-bold text-gray-900">good debt</span>.
          </p>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Bad debt is borrowing to buy things that lose value. Good debt is borrowing to build something that <em>generates</em> value. If you're using a 0% APR card to fund a business that can make you $100,000 a year, that's good debt. It's exactly how the wealthiest people fund everything they build.
          </p>
        </div>

        {!started && (
          <div className="bg-gray-900 text-white rounded-2xl p-7 md:p-10 text-center max-w-2xl mx-auto shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-400 mb-2">Free Quick Quiz</p>
            <h3 className="text-xl md:text-3xl font-black mb-3 leading-tight">
              See Which Card You Could Qualify For
            </h3>
            <p className="text-sm md:text-base text-slate-300 mb-6 max-w-md mx-auto">
              Two quick questions. We'll match you with the best card based on your situation, including options with up to <span className="font-bold text-white">21 months of 0% APR</span>.
            </p>
            <button
              onClick={() => { setStarted(true); trackCreditQuizStarted(); }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/30 cursor-pointer text-sm"
            >
              Start the Quiz →
            </button>
            <p className="text-xs text-slate-500 mt-5">
              We don't save any of your answers. This is purely for your personal reference.
            </p>
          </div>
        )}

        {started && !recommendation && (
          <div className="bg-white border border-gray-200 rounded-2xl p-7 md:p-10 shadow-xl max-w-2xl mx-auto">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 text-center">
              <p className="text-xs text-orange-800 font-medium">
                🔒 Nothing you answer is saved. This is for your personal reference only.
              </p>
            </div>

            {/* Question 1 */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Question 1 of 2</p>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                Do you currently have any credit cards?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHasCards('yes')}
                  className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                    hasCards === 'yes'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setHasCards('no')}
                  className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                    hasCards === 'no'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Question 2 */}
            {hasCards && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Question 2 of 2</p>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  What's your approximate credit score?
                </h3>
                <div className="space-y-2">
                  {([
                    { tier: 'tier1' as CreditTier, label: 'Above 670', sub: 'Good to Excellent' },
                    { tier: 'tier2' as CreditTier, label: 'Between 600 and 670', sub: 'Fair' },
                    { tier: 'tier3' as CreditTier, label: 'Between 500 and 600', sub: 'Bad' },
                    { tier: 'tier4' as CreditTier, label: 'Below 500', sub: 'Very Bad / No Credit' },
                  ]).map((opt) => (
                    <button
                      key={opt.tier}
                      onClick={() => { setTier(opt.tier); trackCreditQuizCompleted(opt.tier, CARD_BY_TIER[opt.tier].name); }}
                      className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-sm group-hover:text-orange-700">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.sub}</p>
                        </div>
                        <span className="text-orange-500 font-bold text-lg">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {recommendation && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl p-7 md:p-9 shadow-2xl">
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-100 mb-2">Your Best Match</p>
                <h3 className="text-2xl md:text-3xl font-black leading-tight mb-1">{recommendation.name}</h3>
                <p className="text-orange-100 text-sm">{recommendation.tagline}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                    <p className="text-white font-medium">{recommendation.apr}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                    <p className="text-white font-medium">{recommendation.fee}</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {recommendation.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-50">
                    <span className="text-white mt-0.5">→</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <a
                href={recommendation.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCreditCardApplyClicked(recommendation.name, tier!)}
                className="block w-full text-center px-6 py-4 bg-white text-orange-700 font-black rounded-xl hover:bg-orange-50 transition-colors shadow-lg cursor-pointer text-sm md:text-base"
              >
                Apply for {recommendation.name} →
              </a>

              <p className="text-center text-xs text-orange-100 mt-3">
                Best for: {recommendation.bestFor}
              </p>
            </div>

            <div className="text-center mt-5">
              <button
                onClick={() => {
                  setTier(null);
                  setHasCards(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer"
              >
                Take the quiz again
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto">
              These are general recommendations, not financial advice. Approval depends on the lender. We don't track or save your answers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ResourceSection() {
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  const categories = [
    {
      icon: <Wrench className="w-5 h-5" />,
      title: 'Free Amazon Seller Tools',
      description: 'Start researching products and calculating profits before your call',
      resources: [
        { name: 'Amazon FBA Revenue Calculator', desc: 'Calculate fees, margins, and profit per unit for any product', link: 'https://sellercentral.amazon.com/hz/fba/profitabilitycalculator/index' },
        { name: 'Helium 10 Free Tier', desc: 'Product research, keyword tracking, and listing optimization (limited free access)', link: 'https://www.helium10.com' },
        { name: 'Jungle Scout Estimator', desc: 'Free Chrome extension to estimate monthly sales for any Amazon listing', link: 'https://www.junglescout.com/estimator/' },
        { name: 'Our Product Scorecard Tool', desc: 'Rate any product idea across 16 key factors. Built by Passion Product.', link: '/productscorecard' },
        { name: 'Our Profit Estimator', desc: 'Estimate your monthly revenue based on search volume and rank position', link: '/productestimator' },
      ],
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: 'Recommended Videos from Travis',
      description: 'Watch these to get a head start on the concepts we\'ll discuss on your call',
      resources: [
        { name: 'How to Find Your First Product (Full Walkthrough)', desc: 'The complete product research process from start to finish', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'Amazon FBA for Beginners: Everything You Need to Know', desc: 'A beginner-friendly overview of the entire Amazon FBA process', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'How I Built a $1M Amazon Brand', desc: 'Travis\'s personal story and the method behind it', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'Free 12-Hour Amazon Masterclass', desc: 'Our complete free training. Everything from product research to launch.', link: '/freecourse' },
      ],
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Beginner Checklist: What You\'ll Need',
      description: 'A quick overview so you feel prepared, not overwhelmed',
      resources: [
        { name: 'Amazon Seller Account', desc: 'Professional plan is $39.99/mo. You can sign up anytime, no rush before your call.', link: 'https://sell.amazon.com' },
        { name: 'A Product Idea (or the willingness to find one)', desc: 'We\'ll help you with this. Most students don\'t have one when they start.' },
        { name: '$1,000–$2,500 in Startup Capital', desc: 'For your first product order, packaging, and initial marketing. Less than most people think.' },
        { name: '5–10 Hours Per Week', desc: 'That\'s all it takes to build your business alongside a full-time job' },
        { name: 'Canva (Free)', desc: 'Create product images, listing graphics, and brand assets', link: 'https://www.canva.com' },
      ],
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: 'Software & Tools Our Students Use',
      description: 'The toolkit behind our most successful Amazon businesses',
      resources: [
        { name: 'Helium 10', desc: 'All-in-one Amazon seller toolkit. Product research, keyword tracking, listing optimization.', link: 'https://www.helium10.com' },
        { name: 'Canva', desc: 'Design product images, A+ Content, and brand assets. Free plan available.', link: 'https://www.canva.com' },
        { name: 'Alibaba', desc: 'Find manufacturers and suppliers for your product. Where most students source.', link: 'https://www.alibaba.com' },
        { name: 'Photoshop / Lightroom', desc: 'Professional product photography editing. Optional, Canva works great too.' },
        { name: 'Google Sheets / Excel', desc: 'Track inventory, costs, and profit margins. We provide templates when you work with us.' },
      ],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">Optional Bonus</span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-[1.1]">
            Get a Head Start <span className="text-orange-600">Before Your Call</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Tools and resources our most successful students use. No homework, just a head start.
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((cat, i) => {
            const isOpen = openCategory === i;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenCategory(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left cursor-pointer"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0">
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">{cat.title}</h3>
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 md:px-6 pb-6 pt-0">
                    <div className="space-y-3">
                      {cat.resources.map((r, j) => (
                        <div key={j} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            {r.link ? (
                              <a
                                href={r.link}
                                target={r.link.startsWith('/') ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                {r.name}
                                {!r.link.startsWith('/') && <ExternalLink className="w-3 h-3" />}
                              </a>
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{r.name}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────── exit intent popup for confirmation pages ───────────
   Triggers when the user's mouse leaves the viewport toward the top
   (desktop) or when they switch tabs / press back (mobile via
   visibilitychange). Only fires once per session.
──────────────────────────────────────────────────────────────────── */

export function ConfirmationExitPopup() {
  const [show, setShow] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const STORAGE_FLAG = 'pp_exit_popup_shown';

    // Don't show again if already shown this session
    if (sessionStorage.getItem(STORAGE_FLAG)) return;

    const trigger = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      sessionStorage.setItem(STORAGE_FLAG, '1');
      setShow(true);
    };

    // Desktop: mouse leaves toward top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) trigger();
    };

    // Mobile: tab switch or back button
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') trigger();
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 md:p-9 text-center">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <img
          src="https://media.giphy.com/media/l1KVaj5UcbHwrBMqI/giphy.gif"
          alt="Wait, come back!"
          className="w-40 h-auto mx-auto mb-4 rounded-xl"
        />

        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 leading-tight">
          Wait. Did you watch the video?
        </h3>

        <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
          The people who show up to their call prepared get way more out of it. The video at the top of this page covers everything you need to know about the Passion Product method, how it works, and what to expect.
        </p>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Take a few minutes with it. You'll walk into your call knowing exactly what questions to ask, and you'll be able to make a clear decision without second-guessing yourself.
        </p>

        <button
          onClick={() => {
            setShow(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm shadow-md"
        >
          Take me back to the video
        </button>

        <button
          onClick={() => setShow(false)}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          I've already watched it
        </button>
      </div>
    </div>
  );
}

export function SharedFooter() {
  return (
    <div className="bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <img
          src="https://passionproduct.com/wp-content/uploads/2024/10/Passion-Product-only-logo-1-768x432.png"
          alt="Passion Product"
          className="h-10 mx-auto mb-4"
        />
        <p className="text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Passion Product. All rights reserved.
        </p>
      </div>
    </div>
  );
}
