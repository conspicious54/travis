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
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-10 md:pt-10 md:pb-12">
      <div className="text-center mb-7">
        <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
          Most Important Step
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
          Watch This Before<br className="md:hidden" /> Your Call
        </h2>
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
          Have questions? Keep scrolling — <span className="text-orange-600 font-bold">we've answered them below</span>
        </p>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 animate-bounce">
          <ChevronDown className="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </div>
  );
}

export function BreakoutVideos() {
  const breakouts = [
    {
      headline: 'Is It Actually Too Late to Start on Amazon?',
      embed: 'https://videos.sproutvideo.com/embed/dc9adbb31513e1c056/9a833984ebbbd62f',
    },
    {
      headline: 'Think You Need Tens of Thousands to Get Started?',
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb31511eec506/80d1f8e8fb8fd47b',
    },
    {
      headline: 'Working Full-Time? Here\'s How Students Do Both.',
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb31510e7cd06/6d5e29c2559707a4',
    },
    {
      headline: 'No Product Idea or Experience? That\'s Actually Ideal.',
      embed: 'https://videos.sproutvideo.com/embed/8c9adbb3181ee2cb06/c87808d62d097bd1',
    },
    {
      headline: 'Skeptical of Online Courses? Good — You Should Be.',
      embed: 'https://videos.sproutvideo.com/embed/ee9adbb31513e7c164/0e0d27cd2ae31e59',
    },
    {
      headline: 'What If You Pick the Wrong Product?',
      embed: 'https://videos.sproutvideo.com/embed/aa9adbb3181ee0c020/edb75f1300af4b4d',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">
            Common Questions
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Every Question You Have — <span className="text-orange-600">Answered</span>
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
            The Window Is Wide Open — <span className="text-orange-600">Right Now</span>
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

  const visible = showAll ? youtubeTestimonials : youtubeTestimonials.slice(0, 6);

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
            {youtubeTestimonials.length} real student stories. Watch any of them.
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
              onClick={() => setShowAll(true)}
              className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg"
            >
              Show All {youtubeTestimonials.length} Student Stories →
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
    <div className="bg-gradient-to-b from-gray-50 to-white py-14 md:py-20 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-3">Optional Bonus</span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-[1.1]">
            Get a Head Start <span className="text-orange-600">Before Your Call</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Tools and resources our most successful students use. No homework — just a head start.
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
