import React, { useState, useRef, useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { FeaturedLogos } from '../components/FeaturedLogos';
import { CheckCircle, Play, Calendar, Clock, Video, ChevronDown, ChevronUp, ExternalLink, BookOpen, Wrench, TrendingUp, Users, Star, ArrowRight, DollarSign, Briefcase, Target, Award, Shield, Lightbulb } from 'lucide-react';

/* ───────────────────────────── helpers ───────────────────────────── */

function LazyVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
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

function YouTubeLazyEmbed({ videoId, title }: { videoId: string; title: string }) {
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

/* ───────────────────────── section components ────────────────────── */

function ConfirmationBanner() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          Your Strategy Call is Booked!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-6">
          You're one step closer to building your Amazon business. Check your email for confirmation details.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
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
          Check your email for the call join link and exact time
        </div>
      </div>
    </div>
  );
}

function NextSteps() {
  const steps = [
    { num: 1, icon: <Video className="w-5 h-5" />, title: 'Watch the short video below', desc: 'Learn what to expect on your call (2 min)' },
    { num: 2, icon: <BookOpen className="w-5 h-5" />, title: 'Check out the videos that match your situation', desc: 'Get your top questions answered before we talk' },
    { num: 3, icon: <Wrench className="w-5 h-5" />, title: 'Browse the resource page to get a head start', desc: 'Free tools our most successful students use' },
    { num: 4, icon: <Calendar className="w-5 h-5" />, title: 'Show up to your call ready to build your plan', desc: 'We\'ll create a personalized roadmap together' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">
        Here's How to Get the Most Out of Your Call
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <div key={s.num} className="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">{s.num}</span>
              <span className="text-blue-600">{s.icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreCallVideo() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      <div className="text-center mb-6">
        <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Step 1</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Watch This Before Your Call
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          A quick look at what to expect so you can come prepared and get the most value from your session.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border-2 border-blue-200 shadow-lg">
        {/* Placeholder: replace src with the actual short pre-call video once recorded */}
        <LazyVideo
          src="https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/Draft%204%201080-1.m4v"
          poster="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
          title="What to expect on your strategy call"
        />
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-sm text-blue-900 font-medium mb-1">This is NOT a sales pitch.</p>
        <p className="text-sm text-blue-800">
          Your strategy call is a personalized planning session. We'll look at your situation, your goals, and map out a realistic path to your first (or next) Amazon product — whether or not you decide to work with us.
        </p>
      </div>
    </div>
  );
}

function BreakoutVideos() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const breakouts = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      objection: '"I don\'t have enough money to start"',
      headline: 'Think You Need Thousands to Get Started?',
      // Replace with actual video IDs / R2 URLs once recorded
      videoPlaceholder: true,
      summary: 'Most of our successful students started with $1,000–$2,500 in startup capital — far less than people assume. On your call, we\'ll show you exactly how to budget your launch and avoid the costly mistakes that drain beginners\' bank accounts. Several students even funded their first product from a single paycheck.',
      studentProof: { name: 'Carla M.', result: '$124.5K in sales', quote: 'The $997 I paid for the course saved me so much money I would have lost otherwise.' },
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      objection: '"The Amazon market is too saturated"',
      headline: 'Worried It\'s Too Late to Start on Amazon?',
      videoPlaceholder: true,
      summary: 'Amazon is a $600B+ marketplace that\'s still growing year over year. The difference isn\'t timing — it\'s strategy. Our students succeed because the Passion Product method finds underserved niches where you can build a real brand, not compete on price with thousands of identical products.',
      studentProof: { name: 'AJ', result: '$1M+ in revenue', quote: 'I started when everyone said the market was saturated. Turns out they were wrong — you just need the right approach.' },
    },
    {
      icon: <Clock className="w-5 h-5" />,
      objection: '"I don\'t have the time — I work full-time"',
      headline: 'Working a 9-to-5? Here\'s How Students Do Both',
      videoPlaceholder: true,
      summary: 'The majority of our students started their Amazon business while working a full-time job. The Passion Product system is designed around 5–10 hours per week. Your call advisor will help you build a realistic timeline that works alongside your current schedule — not instead of it.',
      studentProof: { name: 'Jeremy L.', result: '$150K in sales', quote: 'I built my entire Amazon business nights and weekends while working full-time. The program made it manageable.' },
    },
    {
      icon: <Shield className="w-5 h-5" />,
      objection: '"I\'ve tried other courses and they didn\'t work"',
      headline: 'Burned by Another Amazon Course? Read This.',
      videoPlaceholder: true,
      summary: 'We hear this a lot — and we get it. Most Amazon courses teach outdated tactics like retail arbitrage or dropshipping. The Passion Product method is fundamentally different: it starts with finding a product you\'re passionate about and building a real brand around it. That\'s why our students get results when other programs failed them.',
      studentProof: { name: 'Troy A.', result: '$521.6K in sales', quote: 'I don\'t think I could have done it without Travis & the program. The biggest shortcut to my success.' },
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      objection: '"I don\'t have any product ideas or experience"',
      headline: 'No Product Idea Yet? That\'s Actually Ideal.',
      videoPlaceholder: true,
      summary: 'You don\'t need a product idea before your call — in fact, most students don\'t have one when they start. Our method walks you through a proven product research process that uncovers opportunities based on your interests and real market data. No business experience required. Your call advisor will show you exactly how this works.',
      studentProof: { name: 'Michael S.', result: '$25,389 in early sales', quote: 'Joining the Passion Product Formula was the best business decision I could have made. I had zero experience.' },
    },
    {
      icon: <Award className="w-5 h-5" />,
      objection: '"How is Passion Product different from other programs?"',
      headline: 'What Makes Passion Product Different?',
      videoPlaceholder: true,
      summary: 'Three things set us apart: (1) We start with passion and product-market fit, not get-rich-quick arbitrage. (2) You get direct 1-on-1 mentorship, not just pre-recorded videos. (3) We have a community of 1,000+ students with documented, verifiable results — not anonymous screenshots. On your call, we\'ll explain exactly how the program works and whether it\'s right for your situation.',
      studentProof: { name: 'Mina R.', result: '$1.83M in sales', quote: 'Travis is one of the best coaches out there, and the program is undoubtedly worth the price.' },
    },
  ];

  return (
    <div className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Step 2</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Got Questions? We've Got Answers.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            These are the most common concerns people have after booking their call. Watch the ones that speak to you — you'll feel a lot more confident going in.
          </p>
        </div>

        <div className="space-y-4">
          {breakouts.map((b, i) => {
            const isOpen = expandedIdx === i;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedIdx(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left cursor-pointer"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0">
                    {b.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5 italic">{b.objection}</p>
                    <h3 className="font-semibold text-gray-900 text-base md:text-lg leading-snug">{b.headline}</h3>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 md:px-6 pb-6 pt-0">
                    {/* Video placeholder — replace with actual breakout video once recorded */}
                    <div className="aspect-video rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-5">
                      <Play className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400 font-medium">Breakout video coming soon</p>
                      <p className="text-xs text-gray-400">2–4 min</p>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{b.summary}</p>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.studentProof.name} — {b.studentProof.result}</p>
                        <p className="text-sm text-gray-600 italic">"{b.studentProof.quote}"</p>
                      </div>
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

function BeliefBreakers() {
  const beliefs = [
    {
      category: 'About You',
      color: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      icon: <Users className="w-5 h-5" />,
      title: 'You Don\'t Need Experience to Start',
      body: 'You don\'t need an MBA, a tech background, or prior business experience. Our most successful students include teachers, nurses, stay-at-home parents, and complete beginners. The system is step-by-step — if you can follow instructions, you can do this.',
    },
    {
      category: 'About the Market',
      color: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Amazon FBA Is a $600B+ Opportunity — Still Growing',
      body: 'Amazon\'s marketplace grows every year. The opportunity isn\'t shrinking — the strategies are just evolving. Our method focuses on building real brands in underserved niches, not competing on price. That\'s why our students launch products that sell for years, not weeks.',
    },
    {
      category: 'About Our Method',
      color: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: <Target className="w-5 h-5" />,
      title: 'Passion Product Is Different — Here\'s Why It Works',
      body: 'We don\'t teach arbitrage, dropshipping, or "find the cheapest product and undercut everyone" strategies. The Passion Product method starts with what you care about and builds a branded product with real differentiation. That\'s why our students get results where other programs failed them — and why their businesses last.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          What Our Most Successful Students Know
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Before their first call, every one of them had the same doubts you might have right now.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {beliefs.map((b, i) => (
          <div key={i} className={`${b.color} border rounded-xl p-6`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-8 h-8 rounded-full ${b.iconBg} ${b.iconColor} flex items-center justify-center`}>{b.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{b.category}</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{b.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialHighlights() {
  const testimonials = [
    {
      name: 'Mina R.',
      amount: '$1.83M',
      background: 'Started with no Amazon experience',
      quote: 'Travis is one of the best coaches out there, and the program is undoubtedly worth the price.',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/mina\'s_story%20(540p).mp4',
      poster: 'https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d7519befd324ec14d84be_677d70999ffc3ba242d8ed89_66ff0ab3ac2c8e55c331a54a_Mina-p-500%20copy.webp',
    },
    {
      name: 'Troy A.',
      amount: '$521.6K',
      background: 'Working a full-time job',
      quote: 'The biggest shortcut to my success. I don\'t think I could have done it without Travis & the program.',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/troy\'s_story%20(720p).mp4',
      poster: 'https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940371ae287aa0dfb62_Troy.webp',
    },
    {
      name: 'Darryl M.',
      amount: '$348K',
      background: 'Complete beginner',
      quote: 'The strategies I learned in this program completely transformed my Amazon business.',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/Darryl%20Testimonial%20(1).mp4',
      poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Julianna R.',
      amount: '$112K',
      background: 'No prior selling experience',
      quote: 'If you\'re looking to sell on Amazon, there is no better way!',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/julianna\'s_testimonial%20(720p).mp4',
      poster: 'https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d8940dd0e6c60fb389b1b_Juliana.webp',
    },
    {
      name: 'Jonathan P.',
      amount: '$427K',
      background: 'Started while raising a family',
      quote: 'The mentorship and support in this program are absolutely invaluable.',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/Jonathan%20Testimonial%20(1).mp4',
      poster: 'https://images.unsplash.com/photo-1619380061814-58f03707f082?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Jeremy L.',
      amount: '$150K',
      background: 'Built it alongside a full-time job',
      quote: 'I don\'t think my product would be nearly the success it is today without the Passion Product Formula.',
      video: 'https://pub-cda2548da4a2411a995b49fb5416f4ca.r2.dev/jeremy\'s_story%20(720p).mp4',
      poster: 'https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d894063844c7da9e9a54b_Jeremy.webp',
    },
  ];

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Real Students. Real Results.
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            These are people just like you who booked a call, showed up, and took action. Here's where they are now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <LazyVideo src={t.video} poster={t.poster} title={`${t.name} testimonial`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900">{t.name}</h4>
                  <span className="text-lg font-bold text-blue-600">{t.amount}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{t.background}</p>
                <p className="text-sm text-gray-600 italic">"{t.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResourceSection() {
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
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Step 3</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Your Amazon FBA Starter Resource Page
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            While you wait for your call, here are the tools and resources our most successful students use. Explore at your own pace — there's no homework, just a head start.
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
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-300" /> 1,000+ students enrolled</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-300" /> Personalized strategy session</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-200" /> No pressure, no obligation</span>
        </div>
      </div>
    </div>
  );
}

function Footer() {
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

/* ─────────────────────────── main export ─────────────────────────── */

export function TrainingNew() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeaderLight />
      <ConfirmationBanner />
      <NextSteps />
      <PreCallVideo />
      <BreakoutVideos />
      <BeliefBreakers />
      <TestimonialHighlights />
      <ResourceSection />
      <FeaturedLogos theme="light" />
      <FinalCTA />
      <Footer />
    </div>
  );
}
