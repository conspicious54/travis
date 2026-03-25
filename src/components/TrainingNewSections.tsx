import React, { useState, useRef, useEffect } from 'react';
import { Play, Video, ChevronDown, ChevronUp, ExternalLink, BookOpen, Wrench, TrendingUp, ArrowRight, DollarSign, Briefcase, Target, Clock, Shield, Lightbulb, AlertTriangle, Quote, Zap } from 'lucide-react';

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

export function ResearchVideo() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
      <h2 className="text-3xl md:text-5xl font-black text-gray-900 text-center mb-6 tracking-tight">
        Watch This Before Your Call
      </h2>
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <LazyVideo
          src="https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/Draft%204%201080-1.m4v"
          poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
          title="Watch this before your call"
        />
      </div>
    </div>
  );
}

export function BreakoutVideos() {
  const breakouts = [
    'Is It Actually Too Late to Start on Amazon?',
    'Think You Need Tens of Thousands to Get Started?',
    'Working Full-Time? Here\'s How Students Do Both.',
    'No Product Idea or Experience? That\'s Actually Ideal.',
    'Skeptical of Online Courses? Good — You Should Be.',
    'What If You Pick the Wrong Product?',
  ];

  return (
    <div className="bg-gray-50 py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-black text-gray-900 text-center mb-8 tracking-tight">
          Every Question You Have — Answered
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {breakouts.map((headline, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 text-base p-4">{headline}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OpportunitySection() {
  return (
    <div className="bg-gradient-to-b from-white to-blue-50 py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-amber-600 text-sm font-semibold uppercase tracking-wider mb-2">Why Now Matters</p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
            The Window Is Wide Open — Right Now
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            While most people are scared away by headlines, the data tells a different story. Here's what's actually happening on the ground.
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
              Generic products are saturated — and should be. But customer expectations have shifted. People want products tailored to them. That shift has created thousands of new niches that didn't exist five years ago. Those niches are waiting to be claimed.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Travis Proved It Again — This Year</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Travis launched 5 products this past year across completely different niches. Every single one recouped its investment in the first month. Carnivore Electrolytes crossed $1M and was sold for nearly $1M. Not theory — proof.
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
            <span className="font-semibold">The people who make the most money are the ones who take action first</span> — not the ones who wait until everyone else has already proven it works and there's less opportunity left. Every month spent in analysis paralysis is a month of real money left on the table.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialHighlights() {
  const [showAll, setShowAll] = useState(false);

  const youtubeTestimonials = [
    { id: '9GSDrJRv2CE', title: 'How I Turned $0 to $1 MILLION with Amazon FBA' },
    { id: 'ZRKOfZ1dhMQ', title: 'Amazon FBA to Shark Tank - How I Made $2 MILLION' },
    { id: '-z12BPgI1Wk', title: 'Amazon FBA to Shark Tank - How I Made $2.7 MILLION' },
    { id: 'Xg-ELT32Hvs', title: 'Amazon FBA to Shark Tank - How I Made $5.2 MILLION' },
    { id: 'z7e05PDZ8ao', title: 'Amazon FBA to Shark Tank - How I Made $1.3 MILLION' },
    { id: 'mmKSnvLMLQY', title: 'How I Turned $700 Into $1.5 Million on Amazon' },
    { id: 'xhic32ZsIsk', title: 'Meet The Kid Who Makes $10 Million a Year With Amazon FBA' },
    { id: 'ZXJQ0Djz7-k', title: 'I Tried Every Amazon FBA Selling Method - Here\'s What Made Me $2 Million' },
    { id: 'Wi2sK5GjvFk', title: 'How I Turned $0 to $3M+' },
    { id: 'TOTLViQC_AY', title: 'How I Started An Amazon FBA Business With $0' },
    { id: 'IRb5EpPGnRU', title: 'How I Created a $1M+ Brand' },
    { id: '0FQHEwSVjQw', title: 'Meet The $250K Amazon Seller' },
    { id: '2X10mIm5eXc', title: 'My First Year Selling On Amazon FBA - The Honest Results' },
    { id: 'R-NmmLoh2jo', title: 'I Tested if Amazon FBA Still Works in 2026 - The Honest Results' },
    { id: 'Sg3Vg6C3E-4', title: 'My Honest Amazon FBA Results in 2026' },
    { id: 'TE9uGqS0tt0', title: 'I Tried Amazon FBA In 2026 - The Honest Results' },
    { id: 'sO9ne4DVaR4', title: 'I Tried Amazon FBA In 2026 (RAW RESULTS)' },
    { id: 'Vw9OrGVTGoI', title: 'Exposing the TRUTH about Amazon FBA...' },
    { id: 'plUMdd5W5Fo', title: 'Amazon FBA 2026 - My Honest Results' },
    { id: 'ujMaZSEOFKM', title: 'I Tried Amazon FBA In 2026 - My Real Results' },
    { id: 'RniagkArQ2Q', title: 'I Tried Amazon FBA 2026 - My Honest Results' },
    { id: 'gWGMmZqLr1w', title: 'I Tried Amazon FBA For 1 Year... Here\'s What They Won\'t Tell You' },
    { id: 'ApGQl9mNqrM', title: 'I Tried Amazon FBA With No Experience - The Honest Results' },
    { id: 'SH24ylGlT8k', title: 'My First Year Selling on Amazon FBA' },
    { id: 'sWabSSwVsXg', title: 'My First Year Selling on Amazon FBA - My Amazon Guy Results' },
    { id: 'SvWcnRlXQqQ', title: 'I Tried Amazon FBA for 6 Months - The Honest Results' },
    { id: 'faZRpz7roPI', title: 'I Tried Amazon FBA For 6 Months - The Honest Results' },
    { id: 'k7XMP5U1DCk', title: 'THE TRUTH of Starting an Amazon FBA Business in 2026' },
    { id: 'IDgGFwK1H1o', title: 'I Tried Amazon FBA For 3 Months - The Honest Results' },
    { id: 'vM2lRASP0YI', title: 'How I Made $250K+' },
    { id: 'gpkaZsTgePo', title: 'Passive Income: How Amazon FBA Made Me $430K+' },
    { id: 'psC5efZpdIM', title: 'How I Make $5K+/Month' },
    { id: 'qOknVztF9c8', title: 'I Tried Selling on Walmart.com - The Honest Results' },
    { id: 'ix6rLsCJqeQ', title: 'I Tried Selling On Amazon FBA - The Honest Results' },
    { id: 'E8HQu4glbEY', title: 'I Tried Selling On Amazon FBA For 1 Month - The Honest Results' },
    { id: 'TK6Qgd_UmRo', title: 'How Scott Made $400K+' },
    { id: 'Hzl9b8trydU', title: 'I Tried Amazon FBA For 1 Year - The Honest Results' },
    { id: 'A3mW5yzush0', title: 'I Tried Amazon FBA For 1 Month - The Honest Results' },
    { id: 'UC-bOKUK3jk', title: 'My First Year Selling on Amazon FBA - The Honest Results' },
    { id: 'HQxeNn2S9m8', title: 'How To ACTUALLY Make $10K+/Month' },
    { id: 'b_qIEC8Wnhw', title: 'I Tried Amazon FBA for 3 Months - The Honest Results' },
    { id: 'uJxgKMbOdLE', title: 'I Tried Amazon FBA For 2 Weeks - The Honest Results' },
    { id: '5UPi4XZIdZA', title: 'I Tried Amazon FBA - Honest New Product Results' },
    { id: 'HX2LoqSdHJA', title: 'My Amazon FBA Business Failed...' },
    { id: 'pdm1mQWHRWE', title: 'My First Ecommerce Business - The Honest Results' },
    { id: 'EP--rNIg--I', title: 'Amazon FBA Success Stories - Honest Results' },
    { id: '8mZNPOi-Rq8', title: 'How I Made $57K+' },
    { id: '5EBJIqKslKg', title: 'How I Used TikTok To Raise $40K+' },
    { id: 'rNt5LtAgbKA', title: '$170K+ Amazon FBA Results' },
    { id: 'AQam5rsO7I8', title: 'I Tried Amazon FBA for 1 Year - The Honest Results' },
    { id: 'rqatb8mOlF8', title: 'My First Year Selling On Amazon - The Honest Results' },
    { id: '4apONZaT8G8', title: 'I Tried Amazon FBA For 2 Months - The Truth' },
    { id: 'z2YIae_QeWo', title: 'I Tried Amazon FBA for 2 Weeks - My Honest Results' },
    { id: 'oiqdgmZYnDU', title: 'Amazon FBA: I Launched a Board Game - The Honest Results' },
    { id: 'r9Ra5KJEpiU', title: 'I Tried Amazon FBA - The Honest Results' },
    { id: 'eJiiN-dkRcI', title: 'Amazon FBA Private Label is Dead in 2026 - My Honest Results' },
    { id: '2eIf8HkISnM', title: 'I Quit Amazon FBA - My Business Went Bankrupt' },
    { id: 'u0uTL3662Ic', title: 'My Amazon FBA Business Failed... (Honest Results)' },
    { id: '-OA9kOOLCj0', title: 'We Built a $1M+ Brand' },
  ];

  const visible = showAll ? youtubeTestimonials : youtubeTestimonials.slice(0, 6);

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            People Just Like You Who Took Action
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            {youtubeTestimonials.length}+ real student stories. Watch any of them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((v) => (
            <div key={v.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <YouTubeLazyEmbed videoId={v.id} title={v.title} />
              <p className="font-semibold text-gray-900 text-sm p-4">{v.title}</p>
            </div>
          ))}
        </div>

        {!showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Show All {youtubeTestimonials.length} Student Stories
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
        { name: 'Our Product Scorecard Tool', desc: 'Rate any product idea across 16 key factors — built by Passion Product', link: '/productscorecard' },
        { name: 'Our Profit Estimator', desc: 'Estimate your monthly revenue based on search volume and rank position', link: '/productestimator' },
      ],
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: 'Recommended Videos from Travis',
      description: 'Watch these to get a head start on the concepts we\'ll discuss on your call',
      resources: [
        { name: 'How to Find Your First Product (Full Walkthrough)', desc: 'The complete product research process from start to finish', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'Amazon FBA for Beginners — Everything You Need to Know', desc: 'A beginner-friendly overview of the entire Amazon FBA process', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'How I Built a $1M Amazon Brand', desc: 'Travis\'s personal story and the method behind it', link: 'https://www.youtube.com/c/TravisMarziani', isYoutube: true },
        { name: 'Free 12-Hour Amazon Masterclass', desc: 'Our complete free training — everything from product research to launch', link: '/freecourse' },
      ],
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Beginner Checklist: What You\'ll Need',
      description: 'A quick overview so you feel prepared — not overwhelmed',
      resources: [
        { name: 'Amazon Seller Account', desc: 'Professional plan is $39.99/mo — you can sign up anytime (no rush before your call)', link: 'https://sell.amazon.com' },
        { name: 'A Product Idea (or the willingness to find one)', desc: 'We\'ll help you with this — most students don\'t have one when they start' },
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
        { name: 'Helium 10', desc: 'All-in-one Amazon seller toolkit — product research, keyword tracking, listing optimization', link: 'https://www.helium10.com' },
        { name: 'Canva', desc: 'Design product images, A+ Content, and brand assets — free plan available', link: 'https://www.canva.com' },
        { name: 'Alibaba', desc: 'Find manufacturers and suppliers for your product — where most students source', link: 'https://www.alibaba.com' },
        { name: 'Photoshop / Lightroom', desc: 'Professional product photography editing (optional — Canva works great too)' },
        { name: 'Google Sheets / Excel', desc: 'Track inventory, costs, and profit margins — we provide templates in the program' },
      ],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Get a Head Start Before Your Call
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Here are the tools and resources our most successful students use. Explore at your own pace — there's no homework, just a head start.
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
