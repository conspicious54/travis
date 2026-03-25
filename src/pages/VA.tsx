import React, { useState } from 'react';
import { CheckCircle, Users, Clock, Zap, Target, ArrowRight, BookOpen, MessageSquare, ClipboardList, Shield } from 'lucide-react';

/* ──────────────────────── mailchimp ──────────────────────────────── */

const MC_U = '390599db9e3bac1fdce322d15';
const MC_ID = 'e97b6c6353';
const MC_DC = 'us7';

function subscribeToMailchimp(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const callbackName = 'mc_va_' + Date.now();

    const params = new URLSearchParams({
      u: MC_U,
      id: MC_ID,
      f_id: '0001cee1f0',
      c: callbackName,
      EMAIL: email,
      ENTRYSR: 'VA Landing Page',
      tags: 'VA',
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

/* ──────────────────────── components ─────────────────────────────── */

function Hero({ onScrollToSignup }: { onScrollToSignup: () => void }) {
  return (
    <div className="bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-gray-950" />
      <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 mb-6">
          <Clock className="w-3.5 h-3.5" />
          6-Week Intensive Program
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[1.1]">
          Stop Doing Everything<br /><span className="text-indigo-400">Yourself</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Learn how to hire, train, and manage a virtual assistant who actually gets things done — so you can focus on growing your business instead of running it.
        </p>
        <button
          onClick={onScrollToSignup}
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg text-base cursor-pointer"
        >
          Get the Free VA Guide
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <div className="bg-white py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          You Didn't Start a Business to Be Busy 60 Hours a Week
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
          You're answering emails, updating spreadsheets, scheduling posts, handling customer service, managing inventory — and somehow the actual work that grows your business keeps getting pushed to "tomorrow."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { text: 'You know you need help but you don\'t know where to start' },
            { text: 'You\'ve tried hiring before and it was a disaster' },
            { text: 'You can\'t afford a full-time employee but you\'re drowning' },
          ].map((item, i) => (
            <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-5 text-center">
              <p className="text-sm text-red-900 font-medium">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="text-gray-700 text-center mt-8 font-medium">
          A great VA changes everything. The problem is most people don't know how to find one, train one, or manage one. That's what this program fixes.
        </p>
      </div>
    </div>
  );
}

function WhatYouLearn() {
  const weeks = [
    { week: 1, title: 'What to Delegate', desc: 'Identify the tasks eating your time. Build your delegation list — the things a VA should be doing tomorrow so you never touch them again.' },
    { week: 2, title: 'How to Hire the Right VA', desc: 'Where to find them, what to look for, how to screen, and the interview process that filters out the wrong people fast.' },
    { week: 3, title: 'Onboarding & Training', desc: 'Set your VA up to succeed from day one. SOPs, training videos, access management, and the first-week playbook.' },
    { week: 4, title: 'Communication & Management', desc: 'Daily check-ins, task management tools, feedback loops, and how to manage someone remotely without micromanaging.' },
    { week: 5, title: 'Systems & SOPs', desc: 'Build the systems that let your VA run without you. Templates, checklists, and repeatable processes for every task.' },
    { week: 6, title: 'Scaling Your Team', desc: 'When to hire your second VA, how to build a team, and the management structure that lets you step back completely.' },
  ];

  return (
    <div className="bg-gray-50 py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          6 Weeks to a Business That Runs Without You
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-12">
          Each week builds on the last. By the end, you'll have a trained VA, proven systems, and hours of your life back.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeks.map((w) => (
            <div key={w.week} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">{w.week}</span>
                <h3 className="font-bold text-gray-900">{w.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhatYouGet() {
  const items = [
    { icon: <BookOpen className="w-5 h-5" />, title: 'Complete VA Hiring Guide', desc: 'Step-by-step playbook for finding, vetting, and hiring a VA — including exactly where to look and what to pay.' },
    { icon: <ClipboardList className="w-5 h-5" />, title: 'Done-For-You SOP Templates', desc: 'Ready-to-use standard operating procedures your VA can follow from day one. Just customize and hand off.' },
    { icon: <MessageSquare className="w-5 h-5" />, title: 'Interview Scripts & Scorecards', desc: 'The exact questions to ask, what to listen for, and how to score candidates objectively.' },
    { icon: <Target className="w-5 h-5" />, title: 'Task Delegation Framework', desc: 'A system for identifying what to delegate, what to automate, and what only you should be doing.' },
    { icon: <Users className="w-5 h-5" />, title: 'Management & Communication Playbook', desc: 'Daily standup templates, weekly review frameworks, and the tools that make remote management effortless.' },
    { icon: <Zap className="w-5 h-5" />, title: 'Onboarding Checklist', desc: 'Everything your VA needs access to, learns, and completes in their first week — so they hit the ground running.' },
  ];

  return (
    <div className="bg-white py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          Everything You Need to Hire and Manage a VA
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-12">
          Templates, scripts, frameworks, and checklists — so you're not figuring this out from scratch.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhoItsFor() {
  return (
    <div className="bg-gray-50 py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-10">
          This Is For You If...
        </h2>

        <div className="space-y-3">
          {[
            'You\'re spending more time on admin work than actually growing your business',
            'You\'ve thought about hiring help but don\'t know where to start',
            'You\'ve hired a VA before and it didn\'t work out',
            'You run an Amazon, e-commerce, or online business and you\'re doing everything yourself',
            'You have a service business and you\'re buried in tasks that someone else could handle',
            'You want to get your time back without hiring a full-time employee',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignupSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await subscribeToMailchimp(email);
    } catch (error) {
      console.error('Mailchimp error:', error);
    }
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div id="signup" className="bg-indigo-600 py-14 md:py-20">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">You're In</h2>
          <p className="text-indigo-100">Check your inbox — we're sending you the VA Guide and details on the 6-week intensive.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="signup" className="bg-indigo-600 py-14 md:py-20">
      <div className="max-w-lg mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
          Get the Free VA Guide
        </h2>
        <p className="text-indigo-100 mb-8 max-w-md mx-auto">
          Enter your email and we'll send you the complete VA hiring guide — plus details on the 6-week intensive program.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 px-4 py-3.5 rounded-xl border-2 border-indigo-400 bg-white/10 text-white placeholder-indigo-200 focus:border-white focus:ring-0 focus:outline-none text-sm backdrop-blur-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="px-6 py-3.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isSubmitting ? 'Sending...' : 'Send Me the Guide'}
          </button>
        </form>

        <p className="text-indigo-200 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}

function FinalCTA({ onScrollToSignup }: { onScrollToSignup: () => void }) {
  return (
    <div className="bg-gray-950 py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
          Every Week You Wait Is Another Week Doing It All Yourself
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          The business owners who grow the fastest are the ones who learn to let go of the $10/hour tasks so they can focus on the $1,000/hour decisions.
        </p>
        <button
          onClick={onScrollToSignup}
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg text-base cursor-pointer"
        >
          Get the Free VA Guide
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-gray-950 border-t border-gray-800 py-6">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── main export ─────────────────────────── */

export function VA() {
  const scrollToSignup = () => {
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Hero onScrollToSignup={scrollToSignup} />
      <Problem />
      <WhatYouLearn />
      <WhatYouGet />
      <WhoItsFor />
      <SignupSection />
      <FinalCTA onScrollToSignup={scrollToSignup} />
      <Footer />
    </div>
  );
}
