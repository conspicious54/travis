import React, { useState } from 'react';
import { Calendar, MapPin, Users, Mic, Award, TrendingUp, Zap, Target, ChevronDown, ChevronUp, CheckCircle, Star, Clock, ArrowRight } from 'lucide-react';

/* ─────────────────────────── data ────────────────────────────────── */

const speakers = [
  {
    name: 'Travis Marziani',
    title: 'Founder, Passion Product Formula',
    bio: '$12M+ in e-commerce sales. 458K+ YouTube subscribers. 14,000+ students taught. Sold Carnivore Electrolytes for close to $1M. Still actively selling on Amazon.',
    img: 'https://yt3.googleusercontent.com/i8QyOXvpeMckQ0LPnVTwFjks-org7y9rP-2eSNPYdBPZuDDMBk3wznHbwa7oQfbT763spDyFjA=s900-c-k-c0x00ffffff-no-rj',
    keynote: true,
  },
  {
    name: 'Mina Elias',
    title: 'Founder, Trivium Group',
    bio: 'Started with $900, built a $4M+ supplement brand. Now runs one of the top Amazon PPC agencies in the industry.',
    img: 'https://cdn.prod.website-files.com/66fefebbdd3ababfcd16bca4/677d7519befd324ec14d84be_677d70999ffc3ba242d8ed89_66ff0ab3ac2c8e55c331a54a_Mina-p-500%20copy.webp',
  },
  {
    name: 'AJ Rantz',
    title: 'Founder, Cocktail Cards',
    bio: 'Raised $100K+ on Kickstarter. $500K+ in year one on Amazon. From bartender to multi-million dollar brand.',
    img: '',
  },
  {
    name: 'Brent Frazey',
    title: 'Founder, Sear Pro',
    bio: 'Helicopter pilot, father of three. Built a $3M+ Amazon business in year one working spare hours.',
    img: '',
  },
];

const schedule = [
  {
    day: 'Day 1',
    label: 'Welcome & Networking',
    events: [
      { time: '5:00 PM – 7:00 PM', title: 'Check-In, Networking & Drinks', desc: 'Meet fellow sellers, make connections, set the tone for the weekend' },
    ],
  },
  {
    day: 'Day 2',
    label: 'Core Training',
    events: [
      { time: '9:00 AM', title: 'Opening Keynote — The Mindset of 7-Figure Sellers', desc: 'What separates the people who build real businesses from everyone else' },
      { time: '10:00 AM', title: 'Product Research & Validation in 2026', desc: 'How to find winning niches using AI tools, Helium 10, and real search data' },
      { time: '11:00 AM', title: 'Manufacturing & Sourcing', desc: 'Finding reliable suppliers, negotiating, and avoiding costly mistakes' },
      { time: '12:00 PM', title: 'Lunch Break' },
      { time: '1:00 PM', title: 'The TikTok → Amazon Flywheel', desc: 'How one TikTok creator can explode your Amazon sales overnight' },
      { time: '2:00 PM', title: 'Building a Brand That Sells for 7 Figures', desc: 'How to build an asset — not just a product — that someone will pay millions for' },
      { time: '3:00 PM', title: 'Amazon PPC Masterclass', desc: 'Advanced PPC strategies from the team running millions in ad spend' },
      { time: '5:00 PM', title: 'VIP Dinner', desc: 'Exclusive dinner for VIP & Accelerator members' },
    ],
  },
  {
    day: 'Day 3',
    label: 'Advanced Strategies & Action',
    events: [
      { time: '9:00 AM', title: 'Kickstarter & Crowdfunding — Launch for $0', desc: 'How to fund your entire first product before spending a dollar' },
      { time: '10:00 AM', title: 'Listing Optimization & Conversion', desc: 'The listing elements that actually move the needle on sales' },
      { time: '11:00 AM', title: 'Scaling to Multi-Channel', desc: 'Walmart, TikTok Shop, Shopify — expanding beyond Amazon' },
      { time: '12:00 PM', title: 'Lunch & Networking' },
      { time: '1:00 PM', title: 'Hot Seat Sessions', desc: 'Bring your product, your listing, your questions — get live feedback from the speakers' },
      { time: '3:00 PM', title: 'Closing Keynote — Your 90-Day Action Plan', desc: 'Walk out with a clear plan for exactly what to do when you get home' },
    ],
  },
];

const topics = [
  { icon: <Target className="w-6 h-6" />, title: 'Product Research & Validation', desc: 'Find winning products using data, AI tools, and the niche branding method that built million-dollar brands.' },
  { icon: <TrendingUp className="w-6 h-6" />, title: 'The TikTok → Amazon Flywheel', desc: 'The strategy sending 10–15% of TikTok viewers to buy on Amazon. One creator can change everything.' },
  { icon: <Zap className="w-6 h-6" />, title: 'Amazon PPC & Launch Strategy', desc: 'Advanced ad strategies from teams managing millions in spend. Rank fast, scale profitably.' },
  { icon: <Award className="w-6 h-6" />, title: 'Build a Brand Worth 7 Figures', desc: 'Travis sold Carnivore Electrolytes for ~$1M and Performance Nut Butter for $1.1M. Learn how to build an exit.' },
];

/* ─────────────────────────── components ──────────────────────────── */

function Hero() {
  return (
    <div className="bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/20" />
      <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-blue-300 mb-6">
          <Calendar className="w-3.5 h-3.5" />
          Fall 2026 — Miami, Florida
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[1.1]">
          Passion Product<br /><span className="text-blue-400">Live 2026</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          A 3-day in-person mastermind for Amazon sellers who want to build real brands, scale faster, and connect with the people actually doing it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="#tickets"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg text-base"
          >
            Get Your Ticket
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Miami, Florida</span>
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> 3 Days</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Limited to 100 Seats</span>
          <span className="flex items-center gap-2"><Mic className="w-4 h-4" /> 8+ Speakers</span>
        </div>
      </div>
    </div>
  );
}

function WhyAttend() {
  return (
    <div className="bg-white py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          This Isn't a Conference. It's a Room Full of Builders.
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          The people in this room are launching products, scaling brands, and building real businesses on Amazon. Three days with them will do more for your business than three months of watching videos alone.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {topics.map((t, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                {t.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{t.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Speakers() {
  return (
    <div className="bg-gray-50 py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          Learn From People Who Actually Do the Thing
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-12">
          Every speaker on this stage still sells on Amazon. No armchair experts. No retired gurus. Just people building real businesses right now.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {speakers.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                {s.img ? (
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{s.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{s.bio}</p>
                {s.keynote && (
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Keynote</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">More speakers to be announced</p>
      </div>
    </div>
  );
}

function Schedule() {
  const [openDay, setOpenDay] = useState<number>(1);

  return (
    <div className="bg-white py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          3 Days That Will Change Your Business
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Every session is designed to give you something you can act on the moment you get home.
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          {schedule.map((s, i) => (
            <button
              key={i}
              onClick={() => setOpenDay(i)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                openDay === i
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.day}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {schedule[openDay].events.map((ev, i) => (
            <div key={i} className={`flex gap-4 p-4 rounded-xl ${ev.desc ? 'bg-gray-50 border border-gray-200' : 'bg-blue-50 border border-blue-100'}`}>
              <span className="text-xs font-mono font-bold text-gray-500 shrink-0 w-20 pt-0.5">{ev.time}</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{ev.title}</h4>
                {ev.desc && <p className="text-xs text-gray-600 mt-0.5">{ev.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Location() {
  return (
    <div className="bg-gray-50 py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          Miami, Florida
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Three days in one of the most energizing cities in the world. Venue details and hotel block coming soon.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center">
          <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Venue TBA</h3>
          <p className="text-sm text-gray-500 mb-4">Miami, FL — Fall 2026</p>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Exact venue and dates will be announced soon. Get your ticket now to lock in the early price — you'll be the first to know when details drop.
          </p>
        </div>
      </div>
    </div>
  );
}

function Tickets() {
  return (
    <div id="tickets" className="bg-white py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center tracking-tight mb-4">
          Get Your Ticket
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Limited to 100 seats. When they're gone, they're gone.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* General Admission */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 md:p-8">
            <h3 className="font-bold text-gray-900 text-lg mb-1">General Admission</h3>
            <p className="text-3xl font-black text-gray-900 mb-4">$497</p>
            <ul className="space-y-2.5 mb-6">
              {[
                'All talks & keynotes',
                'All workshops & sessions',
                'Day 1 networking & drinks',
                'Business networking',
                'Action plan workbook',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block text-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Get General Admission
            </a>
          </div>

          {/* VIP */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 md:p-8 relative">
            <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</span>
            <h3 className="font-bold text-gray-900 text-lg mb-1">VIP</h3>
            <p className="text-3xl font-black text-gray-900 mb-4">$997</p>
            <ul className="space-y-2.5 mb-6">
              {[
                'Everything in General Admission',
                'VIP dinner with speakers',
                'Priority seating',
                'Private Q&A with Travis',
                'Post-event group chat access',
                'Exclusive VIP swag',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Get VIP Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Guarantee() {
  return (
    <div className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">
          7-Day Money Back Guarantee
        </h2>
        <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
          After you get your ticket, you have 7 days to change your mind — no questions asked. I just want committed people in the room, so take advantage and secure your spot now.
        </p>
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <div className="bg-gray-950 py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
          100 Seats. That's It.
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          The people who show up to events like this are the ones who actually build something. Be one of them.
        </p>
        <a
          href="#tickets"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg text-base"
        >
          Get Your Ticket
          <ArrowRight className="w-4 h-4" />
        </a>
        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm mt-8">
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Miami, FL</span>
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Fall 2026</span>
          <span className="flex items-center gap-2"><Star className="w-4 h-4" /> 7-Day Guarantee</span>
        </div>
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

export function Live() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Hero />
      <WhyAttend />
      <Speakers />
      <Schedule />
      <Location />
      <Tickets />
      <Guarantee />
      <FinalCTA />
      <Footer />
    </div>
  );
}
