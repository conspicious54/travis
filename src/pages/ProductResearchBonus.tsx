import React, { useEffect, useState } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { ExitIntentPopup } from '../components/ExitIntentPopup';

function ProductResearchHeadline() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 text-center py-12">
      <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] tracking-tight leading-none text-gray-900">
        <div className="mb-1">My Complete Product Research Masterclass</div>
        <div className="font-bold flex items-center justify-center gap-2">
          ⬇️
        </div>
      </h1>
      <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
        I usually charge for this, but now it's yours for free.
      </p>
    </div>
  );
}

function YouTubeEmbed() {
  return (
    <div className="relative max-w-4xl mx-auto px-4 mb-8">
      <div className="rounded-2xl overflow-hidden border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/pBhY-fP2oiE"
            title="My Complete Product Research Masterclass"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <div className="max-w-4xl mx-auto px-4 text-center py-16">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-200 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
            🔥 LIMITED TIME OPPORTUNITY
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Build Your Own 6-Figure Amazon Empire?
          </h2>
          <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto font-medium">
            Stop watching from the sidelines. Get personalized guidance from our expert team who have helped <span className="text-blue-600 font-bold">1,000+ students</span> achieve Amazon success.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">$2.1M+</div>
                <div className="text-sm text-gray-600">Student Revenue Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">1,000+</div>
                <div className="text-sm text-gray-600">Success Stories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">4.9/5</div>
                <div className="text-sm text-gray-600">Student Rating</div>
              </div>
            </div>
          </div>
          
          <a
            href="https://start.travismarziani.com/apply-now"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-6 px-12 rounded-xl text-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(239,68,68,0.4)] hover:-translate-y-1 transform relative overflow-hidden group"
          >
            <span className="relative z-10">🚀 WORK WITH MY TEAM NOW</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
          
          <p className="mt-6 text-lg text-gray-600 font-medium">
            ⚡ Apply now for a <span className="text-red-600 font-bold">FREE strategy call</span> with our team
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Limited spots available • No obligation • Results guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}

function MainContent() {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    // 20 minutes in milliseconds
    const timer = setTimeout(() => {
      setShowCTA(true);
    }, 20 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-grid-pattern-light opacity-100"></div>
      <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-gradient-radial from-blue-100/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-gradient-radial from-purple-100/30 to-transparent pointer-events-none"></div>
      
      <div className="relative">
        <HeaderLight />
        <ProductResearchHeadline />
        <YouTubeEmbed />
        {showCTA && <CTASection />}
      </div>
    </div>
  );
}

export function ProductResearchBonus() {
  return (
    <>
      <MainContent />
      <ExitIntentPopup theme="light" />
    </>
  );
}

