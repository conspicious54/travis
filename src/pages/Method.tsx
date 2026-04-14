import { useEffect } from 'react';
import {
  Search,
  CheckCircle,
  Sparkles,
  Store,
  Rocket,
  Users,
  Star,
  Sun,
  Heart,
  X,
  Check,
  ArrowRight,
  Music,
} from 'lucide-react';
import { trackEvent } from '../lib/posthog';

/* ───── design system ─────────────────────────────────────────────
   Warm, playful "passion playbook" theme:
   - Cream + warm orange + mustard + teal accents
   - Mix of chunky serif display and friendly bold sans
   - Hand-drawn vibes: dashed lines, rotated stickers, circles
   - Numbered step journey
──────────────────────────────────────────────────────────────────── */

const DISPLAY = "font-['Fraunces','Georgia','serif']";
const HAND = "font-['Caveat','Kalam','cursive']";

/* ──────────────────────────── page ──────────────────────────────── */

export function Method() {
  useEffect(() => {
    trackEvent('method_page_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf6ec] text-stone-900 selection:bg-orange-300 selection:text-stone-900 overflow-hidden">
      <Hero />
      <WhatsDifferent />
      <Comparison />
      <TheJourney />
      <Flywheel />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─────────────────────────── hero ───────────────────────────────── */

function Hero() {
  return (
    <div className="relative bg-[#fdf6ec] overflow-hidden">
      {/* Decorative dots */}
      <Dot className="top-20 left-10 bg-orange-400" />
      <Dot className="top-32 right-20 bg-teal-500" size="lg" />
      <Dot className="bottom-10 left-20 bg-yellow-400" />
      <Dot className="bottom-32 right-10 bg-orange-500" size="lg" />
      <Squiggle className="top-40 right-1/4" />
      <Squiggle className="bottom-20 left-1/3" />

      <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-200/60 border-2 border-dashed border-orange-500/60 rounded-full px-5 py-2 mb-6 rotate-[-2deg]">
          <Heart className="w-4 h-4 text-orange-700" fill="currentColor" />
          <span className={`${HAND} text-lg text-orange-800`}>The Passion Product Playbook</span>
        </div>

        <h1 className={`${DISPLAY} text-5xl md:text-8xl font-black leading-[0.95] tracking-tight mb-6`}>
          How We <em className="text-orange-600 not-italic relative">
            Actually
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 8 Q 50 2 100 6 T 198 8" stroke="#ea580c" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </em><br />
          Sell on Amazon
        </h1>

        <p className="text-lg md:text-2xl text-stone-700 max-w-2xl mx-auto leading-relaxed">
          The Passion Product Method. An honest, step-by-step way to build an Amazon brand that makes real money, without fighting a race to the bottom.
        </p>

        <div className={`${HAND} text-2xl md:text-3xl text-stone-600 mt-8 rotate-[-1deg]`}>
          ↓ Here's how it works ↓
        </div>
      </div>
    </div>
  );
}

function Dot({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return <div className={`absolute rounded-full ${s} ${className}`} aria-hidden="true" />;
}

function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute ${className}`} width="60" height="12" viewBox="0 0 60 12" aria-hidden="true">
      <path d="M2 6 Q 10 2, 18 6 T 34 6 T 50 6 T 58 6" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/* ─────────────────────── what's different ───────────────────────── */

function WhatsDifferent() {
  return (
    <div className="bg-stone-900 text-[#fdf6ec] py-16 md:py-24 relative">
      {/* Top torn edge */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-[radial-gradient(circle_at_10px_100%,transparent_6px,#fdf6ec_6px)] bg-[length:20px_12px]" />

      <div className="max-w-4xl mx-auto px-4 text-center relative">
        <p className={`${HAND} text-2xl md:text-3xl text-orange-300 mb-3 rotate-[-1deg] inline-block`}>
          The big idea
        </p>
        <h2 className={`${DISPLAY} text-4xl md:text-7xl font-black leading-[1] tracking-tight mb-6`}>
          Don't compete on price.<br />
          <span className="text-orange-400">Build something people love.</span>
        </h2>
        <p className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
          Most Amazon sellers fight over the same tired products, shaving pennies to win. That's a losing game. The Passion Product Method is the opposite. You build a premium, branded product for a specific group of people, and win without ever touching the price war.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────── comparison ─────────────────────────────── */

function Comparison() {
  const methods = [
    {
      name: 'Traditional Private Label',
      tagline: 'Cheap knockoffs racing to zero',
      bg: 'bg-red-50',
      border: 'border-red-300',
      accent: 'text-red-700',
      icon: <X className="w-5 h-5" />,
      points: [
        'Pick the cheapest generic product on Alibaba',
        'Slap a logo on it',
        'Fight 50 other sellers for pennies',
        'Chinese sellers undercut you. You lose.',
      ],
      verdict: 'A race to the bottom.',
    },
    {
      name: 'Wholesale / Arbitrage',
      tagline: 'Reselling other people\'s stuff',
      bg: 'bg-stone-50',
      border: 'border-stone-300',
      accent: 'text-stone-600',
      icon: <X className="w-5 h-5" />,
      points: [
        'Buy other brands wholesale, resell them',
        'No brand of your own, no asset',
        'Tiny margins, constant restocking',
        'You don\'t own anything you can sell later',
      ],
      verdict: 'A part-time job, not a business.',
    },
    {
      name: 'The Passion Product Method',
      tagline: 'Build a real brand for real people',
      bg: 'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50',
      border: 'border-orange-400',
      accent: 'text-orange-800',
      icon: <Check className="w-5 h-5" />,
      featured: true,
      points: [
        'Find a specific audience and build FOR them',
        'Premium brand with real design and story',
        'Almost no direct competition',
        'Own an asset you can scale or sell',
      ],
      verdict: 'A real business you actually love.',
    },
  ];

  return (
    <div className="bg-[#fdf6ec] py-16 md:py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-14">
          <p className={`${HAND} text-2xl md:text-3xl text-orange-600 mb-2 rotate-[2deg] inline-block`}>
            Three ways to sell on Amazon
          </p>
          <h2 className={`${DISPLAY} text-4xl md:text-6xl font-black leading-[1] tracking-tight`}>
            Only one of them<br />
            <span className="italic">actually</span> works.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {methods.map((m, i) => (
            <div
              key={i}
              className={`relative ${m.bg} border-2 ${m.border} rounded-2xl p-6 md:p-7 ${m.featured ? 'md:scale-[1.03] shadow-xl' : 'shadow-sm'}`}
            >
              {m.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full rotate-[-3deg] shadow-md">
                  ← what we teach
                </div>
              )}

              <div className={`inline-flex items-center gap-2 ${m.accent} mb-3`}>
                {m.icon}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {m.featured ? 'The winner' : 'Hard pass'}
                </span>
              </div>

              <h3 className={`${DISPLAY} text-2xl font-black leading-tight mb-1`}>{m.name}</h3>
              <p className={`${HAND} text-lg mb-5 ${m.accent} italic`}>{m.tagline}</p>

              <ul className="space-y-2.5 mb-6">
                {m.points.map((p, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-relaxed text-stone-700">
                    <span className={m.accent}>&bull;</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <p className={`${DISPLAY} text-lg font-bold italic ${m.accent} border-t border-current/20 pt-3`}>
                {m.verdict}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── the journey (8 steps) ──────────────────── */

interface Step {
  num: number;
  title: string;
  body: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function TheJourney() {
  const steps: Step[] = [
    {
      num: 1,
      title: 'Find an idea people are already searching for',
      body: "You don't invent demand. You find it. We teach you how to use real Amazon data to spot things thousands of people type in every month but can't find a good version of.",
      icon: <Search className="w-6 h-6" />,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
    },
    {
      num: 2,
      title: 'Make sure the competition is weak',
      body: "Demand is half the equation. The other half is: is anyone actually doing it well? If the top listings have bad photos, generic branding, or thin reviews, that's your opening.",
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
    },
    {
      num: 3,
      title: 'Build a premium branded product',
      body: "Don't try to be cheapest. Be better. A specific brand, for specific people. Better design, better packaging, better story. You compete on premium, not price.",
      icon: <Sparkles className="w-6 h-6" />,
      color: 'text-teal-700',
      bg: 'bg-teal-100',
    },
    {
      num: 4,
      title: 'List it in a market of its own',
      body: "When your branding is tight and your niche is specific, you're not really competing anymore. You're the only version of what you made. That's the goal.",
      icon: <Store className="w-6 h-6" />,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
    },
    {
      num: 5,
      title: 'Build momentum BEFORE you launch',
      body: "Amazon is a momentum game. The sellers who win are the ones who hit the market hot. We pre-launch on social, build a waitlist, and get people excited before day one.",
      icon: <Rocket className="w-6 h-6" />,
      color: 'text-red-700',
      bg: 'bg-red-100',
    },
    {
      num: 6,
      title: 'Launch with a community behind you',
      body: "Day one reviews and early sales tell Amazon your product is worth ranking. Our students help each other with the first wave. You don't do this alone.",
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-700',
      bg: 'bg-purple-100',
    },
    {
      num: 7,
      title: 'Get real reviews rolling',
      body: "Reviews are the currency of Amazon. Once they compound, your rank sticks, your conversion climbs, and the whole thing starts paying for itself.",
      icon: <Star className="w-6 h-6" />,
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
    },
    {
      num: 8,
      title: 'Run a business in a few hours a week',
      body: "When the fundamentals are right, Amazon handles fulfillment, the listing converts on autopilot, and you manage it in spare hours. That's the whole point.",
      icon: <Sun className="w-6 h-6" />,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="bg-[#fdf6ec] py-16 md:py-24 relative">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className={`${HAND} text-2xl md:text-3xl text-orange-600 mb-2 rotate-[-1deg] inline-block`}>
            The 8-step journey
          </p>
          <h2 className={`${DISPLAY} text-4xl md:text-6xl font-black leading-[1] tracking-tight mb-4`}>
            From Zero to<br /><span className="text-orange-600">Real Brand</span>
          </h2>
          <p className="text-stone-600 text-base md:text-lg max-w-xl mx-auto">
            Eight steps. No shortcuts, no tricks. Just the sequence that actually works.
          </p>
        </div>

        <div className="relative">
          {/* Vertical dashed line */}
          <div className="absolute left-6 md:left-8 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-orange-400/50" aria-hidden="true" />

          <div className="space-y-8 md:space-y-10">
            {steps.map((s) => (
              <div key={s.num} className="relative flex gap-5 md:gap-7">
                <div className={`relative shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full ${s.bg} ${s.color} flex items-center justify-center border-4 border-[#fdf6ec] shadow-md`}>
                  {s.icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 bg-stone-900 text-[#fdf6ec] rounded-full flex items-center justify-center text-xs font-black">
                    {s.num}
                  </div>
                </div>

                <div className="flex-1 pt-1 md:pt-2">
                  <h3 className={`${DISPLAY} text-xl md:text-3xl font-black leading-tight mb-2`}>{s.title}</h3>
                  <p className="text-stone-700 text-sm md:text-base leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Finish flag */}
          <div className="relative flex gap-5 md:gap-7 mt-10">
            <div className="shrink-0 w-12 md:w-16 flex items-center justify-center">
              <div className={`${HAND} text-3xl md:text-4xl text-orange-600 rotate-[-6deg]`}>🎉</div>
            </div>
            <div className="flex-1 pt-2">
              <p className={`${HAND} text-2xl md:text-3xl text-orange-700 rotate-[-1deg] inline-block`}>
                And now you own an asset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── TikTok–Amazon Flywheel ─────────────────── */

function Flywheel() {
  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-orange-950 text-[#fdf6ec] py-16 md:py-24 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
            <Music className="w-3.5 h-3.5 text-orange-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-200">What we teach in 2026</span>
          </div>
          <h2 className={`${DISPLAY} text-4xl md:text-7xl font-black leading-[0.95] tracking-tight mb-4`}>
            The TikTok–Amazon<br /><span className="text-orange-400">Flywheel</span>
          </h2>
          <p className="text-stone-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The single biggest unlock in e-commerce right now. Here's the loop that makes the whole thing compound.
          </p>
        </div>

        {/* Flywheel diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <FlywheelStep num="1" title="Post on TikTok" body="Short-form content about your product, your niche, and your audience." arrow />
          <FlywheelStep num="2" title="Traffic to Amazon" body="Viewers discover you, click, and buy. Each sale signals Amazon your listing matters." arrow />
          <FlywheelStep num="3" title="Amazon ranks you" body="Amazon pushes your listing to more shoppers who never saw your TikTok." arrow />
          <FlywheelStep num="4" title="Customers make content" body="Happy buyers post their own videos. You get more reach. The loop starts over." />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 text-center max-w-3xl mx-auto">
          <p className={`${HAND} text-2xl md:text-3xl text-orange-300 mb-3 rotate-[-1deg] inline-block`}>
            The kicker
          </p>
          <p className="text-base md:text-xl text-white leading-relaxed">
            Every post sells product. Every product sale creates a buyer. Every buyer can make more content. TikTok feeds Amazon, Amazon feeds TikTok. The flywheel never stops.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlywheelStep({ num, title, body, arrow }: { num: string; title: string; body: string; arrow?: boolean }) {
  return (
    <div className="relative">
      <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-5 h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-black">
            {num}
          </div>
          <p className={`${DISPLAY} text-lg font-black text-white leading-tight`}>{title}</p>
        </div>
        <p className="text-sm text-stone-300 leading-relaxed">{body}</p>
      </div>
      {arrow && (
        <ArrowRight
          className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-orange-400"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ─────────────────────── FAQ ────────────────────────────────────── */

function FAQ() {
  const faqs = [
    {
      q: "Do I need a product idea to start?",
      a: "Nope. Most people who work with us don't. The whole first chapter is finding one. We teach you how to use real Amazon data to spot a gap instead of guessing.",
    },
    {
      q: "How is this different from dropshipping?",
      a: "Dropshipping resells other people's stuff with tiny margins and zero brand equity. The Passion Product Method builds your own brand, your own product, your own asset.",
    },
    {
      q: "Can I do this alongside a full-time job?",
      a: "Yes, and most of our students do. The process takes focused work, not endless hours. Once you're live, Amazon handles fulfillment. Students manage existing products in a few hours a week.",
    },
    {
      q: "Is Amazon still worth it in 2026?",
      a: "More than ever. Tariffs scared away a wave of generic sellers. Buyers now want products made for them, not for everyone. Niche brands are eating the market. The window is open.",
    },
    {
      q: "How much money do I need to start?",
      a: "Less than most people think. Many students start under $1,000 using Kickstarter, low-cost product launches, or smart financing. We help you find the right path based on your situation.",
    },
    {
      q: "What if my product doesn't sell?",
      a: "That's what steps 1, 2, and 5 are for. We validate real demand, confirm weak competition, and build momentum before you ever spend on inventory. You're not guessing at any point.",
    },
  ];

  return (
    <div className="bg-[#fdf6ec] py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className={`${HAND} text-2xl md:text-3xl text-orange-600 mb-2 rotate-[2deg] inline-block`}>
            Quick answers
          </p>
          <h2 className={`${DISPLAY} text-4xl md:text-6xl font-black leading-[1] tracking-tight`}>
            The stuff<br /><span className="italic text-orange-600">everyone</span> asks
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white border-2 border-stone-200 rounded-2xl p-5 md:p-6 hover:border-orange-300 transition-colors">
              <h3 className={`${DISPLAY} text-lg md:text-xl font-black text-stone-900 mb-2`}>
                {f.q}
              </h3>
              <p className="text-stone-700 text-sm md:text-base leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── CTA ────────────────────────────────────── */

function CTA() {
  return (
    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-16 md:py-24 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-10 left-10 w-16 h-16 rounded-full border-4 border-white/30" />
      <div className="absolute bottom-10 right-20 w-24 h-24 rounded-full border-4 border-white/20" />
      <div className="absolute top-20 right-10 w-10 h-10 bg-yellow-300 rounded-full" />
      <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-yellow-400 rounded-full" />

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <p className={`${HAND} text-3xl md:text-4xl text-orange-100 mb-3 rotate-[-2deg] inline-block`}>
          Now you know the method.
        </p>
        <h2 className={`${DISPLAY} text-4xl md:text-7xl font-black leading-[0.95] tracking-tight mb-5`}>
          Ready to<br />actually do it?
        </h2>
        <p className="text-lg md:text-xl text-orange-50 max-w-xl mx-auto mb-10 leading-relaxed">
          Book a call with our team. Walk through your situation. Find out if working together is the right move.
        </p>

        <a
          href="/book"
          className="inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white text-orange-700 rounded-2xl font-black text-base md:text-lg hover:bg-orange-50 transition-colors shadow-xl cursor-pointer"
        >
          Book Your Strategy Call
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="text-xs text-orange-100 mt-5">No pressure, no obligation. Just a real conversation.</p>
      </div>
    </div>
  );
}

/* ─────────────────────── Footer ─────────────────────────────────── */

function Footer() {
  return (
    <div className="bg-stone-900 text-stone-400 py-10 md:py-12">
      <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
        <p className={`${HAND} text-xl text-orange-400`}>
          Made with love in Santa Monica.
        </p>

        <p className="text-[11px] leading-relaxed max-w-2xl mx-auto">
          <span className="text-stone-300 font-bold">Disclosures.</span> Everything on this page is for educational purposes only. Nothing here is financial, legal, tax, or business advice. Any success stories, outcomes, or figures referenced are illustrative and not guaranteed. Your results will be different and may be lower, including no result at all. Selling on Amazon involves real financial risk. Please consult a qualified professional before making business decisions. See our full <a href="/terms" className="underline hover:text-orange-300 underline-offset-2">Terms of Service</a>.
        </p>

        <p className="text-[10px] uppercase tracking-widest text-stone-500 pt-3 border-t border-stone-800">
          &copy; {new Date().getFullYear()} Passion Product LLC &nbsp;│&nbsp; All rights reserved
        </p>
      </div>
    </div>
  );
}
