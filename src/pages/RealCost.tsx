import { useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Check,
  Search,
  Palette,
  Package,
  Rocket,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRight,
  Skull,
} from 'lucide-react';
import { trackEvent } from '../lib/posthog';

/* ──────────────────────────── page ──────────────────────────────── */

export function RealCost() {
  useEffect(() => {
    trackEvent('real_cost_page_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Hero />
      <Disclaimer />
      <StageSection
        num={1}
        icon={<Search className="w-5 h-5" />}
        stage="Product Validation"
        diy={{
          title: 'Watch a few YouTube videos. Guess.',
          bullets: [
            'You pick a product based on a hunch',
            'No one tells you if the data actually supports it',
            'You find out the market is dead after you spend $3,000 on inventory',
            'Or worse, you never find out at all and just blame yourself',
          ],
          cost: 'First product fails',
          costSub: '$3,000–$10,000 gone before you sell a single unit',
        }}
        withUs={{
          title: 'A coach validates your idea before you spend a dollar',
          bullets: [
            'We look at the real Amazon data with you',
            'A coach reviews your idea and tells you if it will actually sell',
            'We show you how to see the opportunity yourself',
            'You only commit money when the data says go',
          ],
          cost: '$0 in wasted validation',
          costSub: 'You know before you buy',
        }}
      />

      <StageSection
        num={2}
        icon={<Palette className="w-5 h-5" />}
        stage="Branding & Design"
        flipped
        diy={{
          title: 'Fiverr gig for $50. Looks like a Fiverr gig for $50.',
          bullets: [
            'Cheap logo that undersells your product',
            'Packaging design that looks generic',
            'Main image that gets skipped on the Amazon grid',
            'Costs you sales every single day it\'s live',
          ],
          cost: 'Silent revenue leak',
          costSub: 'Bad branding steals money from you every single month',
        }}
        withUs={{
          title: 'Real designers and a branding framework that converts',
          bullets: [
            'Work with designers who understand Amazon shoppers',
            'Branding built around your niche, not a generic template',
            'Main image, packaging, and logo designed to stand out',
            'Higher click-through, higher conversion, higher rank',
          ],
          cost: 'Your brand earns its money back',
          costSub: 'Branding that actually converts pays for itself fast',
        }}
      />

      <StageSection
        num={3}
        icon={<Package className="w-5 h-5" />}
        stage="Manufacturing & Sourcing"
        diy={{
          title: 'Find a random supplier on Alibaba. Hope for the best.',
          bullets: [
            'No idea if the manufacturer is legit until the shipment arrives',
            'You overpay because you don\'t know what to negotiate',
            'Quality issues on 10–30% of your units',
            'Delays that push your launch back 2–3 months',
            'In the worst case, you get scammed and lose it all',
          ],
          cost: 'Easily $5,000–$20,000 in losses',
          costSub: 'Bad inventory. Worse, lost time.',
        }}
        withUs={{
          title: 'Verified manufacturers and a coach in your corner',
          bullets: [
            'We point you to manufacturers other students have used',
            'Negotiation scripts that get you a better unit cost',
            'Quality checks built into the process',
            'Launch on schedule, not 3 months late',
          ],
          cost: 'Lower cost per unit',
          costSub: 'And no horror stories',
        }}
        flipped
      />

      <KickstarterSection />

      <StageSection
        num={4}
        icon={<Rocket className="w-5 h-5" />}
        stage="The Launch"
        diy={{
          title: 'Post the listing. Hope it ranks.',
          bullets: [
            'A listing cobbled together from free YouTube videos',
            'Keywords you guessed at',
            'No one to review it before it goes live',
            'Zero reviews on day one, nobody buying, Amazon ignores you',
            'You miss the honeymoon period entirely',
          ],
          cost: 'Dead listing',
          costSub: 'The biggest Amazon mistake there is',
        }}
        withUs={{
          title: 'A coach approves your listing before it goes live',
          bullets: [
            'Optimized listing with the right keywords from day one',
            'Your listing reviewed and approved by a coach',
            'The Passion Product community supports your first orders and reviews',
            'You catch Amazon\'s honeymoon period and rank fast',
          ],
          cost: 'A launch that actually launches',
          costSub: 'Momentum on day one',
        }}
        flipped
      />

      <BigCostSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ──────────────────────────── sections ──────────────────────────── */

function Hero() {
  return (
    <div className="bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-gray-950 to-gray-950" />

      {/* Warning stripes */}
      <div className="relative h-2 bg-yellow-400 overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#000_15px,#000_30px)] opacity-40" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-red-900/40 border border-red-500/50 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-red-200 mb-6">
          <AlertTriangle className="w-3.5 h-3.5" />
          Warning: This is what nobody tells you
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[0.95]">
          The Real Cost of<br />
          Launching on Amazon<br />
          <span className="text-red-400">By Yourself.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-3">
          Most people don't see the bill until it's too late.
        </p>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Here's what DIY Amazon FBA actually costs, stage by stage, compared to doing it with a team behind you.
        </p>
      </div>

      <div className="relative h-2 bg-yellow-400 overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#000_15px,#000_30px)] opacity-40" />
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-3xl mx-auto px-4 py-3 text-center">
        <p className="text-xs text-yellow-900">
          <span className="font-bold">Estimates, not guarantees.</span> These numbers are based on common outcomes we see. Your results will vary. What's consistent is the pattern.
        </p>
      </div>
    </div>
  );
}

interface StageData {
  title: string;
  bullets: string[];
  cost: string;
  costSub: string;
}

function StageSection({
  num,
  icon,
  stage,
  diy,
  withUs,
  flipped = false,
}: {
  num: number;
  icon: React.ReactNode;
  stage: string;
  diy: StageData;
  withUs: StageData;
  flipped?: boolean;
}) {
  return (
    <div className={`py-14 md:py-20 ${flipped ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {icon}
            Stage {num}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.05]">
            {stage}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DIY side */}
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-2xl p-6 md:p-7 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-red-800 text-xs font-black uppercase tracking-wider">Doing it alone</span>
            </div>

            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4 leading-tight">
              {diy.title}
            </h3>

            <ul className="space-y-2 mb-6">
              {diy.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-red-500 mt-1 shrink-0">&bull;</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="bg-red-600 text-white rounded-xl p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-red-100 mb-1">True cost</p>
              <p className="font-black text-lg md:text-xl leading-tight">{diy.cost}</p>
              <p className="text-xs text-red-100 mt-1">{diy.costSub}</p>
            </div>
          </div>

          {/* With us side */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100/40 border-2 border-green-200 rounded-2xl p-6 md:p-7 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-green-800 text-xs font-black uppercase tracking-wider">Working with us</span>
            </div>

            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4 leading-tight">
              {withUs.title}
            </h3>

            <ul className="space-y-2 mb-6">
              {withUs.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-green-600 mt-1 shrink-0">&bull;</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="bg-green-700 text-white rounded-xl p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-green-100 mb-1">True cost</p>
              <p className="font-black text-lg md:text-xl leading-tight">{withUs.cost}</p>
              <p className="text-xs text-green-100 mt-1">{withUs.costSub}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KickstarterSection() {
  return (
    <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 text-white py-14 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent" />
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-300 mb-4">
          <DollarSign className="w-3.5 h-3.5" />
          Bonus stage
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4">
          The Kickstarter Route<br />
          <span className="text-orange-400">Launch With Someone Else's Money</span>
        </h2>
        <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10">
          We guide students through Kickstarter launches where real customers pay for your product before you manufacture a single unit.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KickstarterStat name="AJ" amount="$120K+" />
          <KickstarterStat name="Travis" amount="$15K+" />
          <KickstarterStat name="Jeremy" amount="$10K+" />
          <KickstarterStat name="Brent" amount="Multi-$10Ks" />
        </div>

        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Dozens of students have funded their entire launch this way. Zero out-of-pocket inventory risk. Demand validated before you spend a dollar.
        </p>
      </div>
    </div>
  );
}

function KickstarterStat({ name, amount }: { name: string; amount: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{name}</p>
      <p className="text-lg md:text-2xl font-black text-orange-400">{amount}</p>
      <p className="text-xs text-slate-500">raised</p>
    </div>
  );
}

function BigCostSection() {
  return (
    <div className="bg-gray-950 text-white py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-gray-950 to-gray-950" />

      <div className="relative h-2 bg-red-600 overflow-hidden mb-12 md:mb-16">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#000_15px,#000_30px)] opacity-50" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-900/40 border border-red-500/50 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-red-200 mb-5">
            <Skull className="w-3.5 h-3.5" />
            The real bill
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
            The Biggest Cost Isn't<br />
            <span className="text-red-400">The One You See.</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
            Six months after launch, here's the difference between doing it alone and doing it with a team behind you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DIY big cost */}
          <div className="bg-red-950/30 border-2 border-red-500/40 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <X className="w-5 h-5 text-red-400" strokeWidth={3} />
              <span className="text-red-300 text-xs font-black uppercase tracking-wider">DIY, 6 months in</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">Your product is live. It's doing maybe</p>
            <p className="text-3xl md:text-4xl font-black text-red-400 mb-4">$25K/month</p>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              But because you cut corners on validation, branding, and launch, you're <span className="font-bold text-white">barely breaking even on ads</span>. Margins are thin. Rank is unstable.
            </p>
            <div className="bg-black/40 border border-red-500/30 rounded-xl p-4 mt-5">
              <p className="text-xs uppercase tracking-wider text-red-300 mb-2">The hidden yearly cost</p>
              <p className="text-2xl md:text-3xl font-black text-red-400 leading-tight">$200K–$300K+</p>
              <p className="text-xs text-slate-400 mt-2">
                in lost profit over the next 12 months compared to what your product could have been doing.
              </p>
            </div>
          </div>

          {/* With us big cost */}
          <div className="bg-green-950/20 border-2 border-green-500/40 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Check className="w-5 h-5 text-green-400" strokeWidth={3} />
              <span className="text-green-300 text-xs font-black uppercase tracking-wider">With us, 6 months in</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">Your product is live. It's doing</p>
            <p className="text-3xl md:text-4xl font-black text-green-400 mb-4">$25K/month+</p>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              But because the fundamentals were right from day one, you're <span className="font-bold text-white">profitable</span>, you have room to scale ads, and rank is sticky.
            </p>
            <div className="bg-black/40 border border-green-500/30 rounded-xl p-4 mt-5">
              <p className="text-xs uppercase tracking-wider text-green-300 mb-2">The real ceiling</p>
              <p className="text-2xl md:text-3xl font-black text-green-400 leading-tight">$300K–$1M+</p>
              <p className="text-xs text-slate-400 mt-2">
                in year 1 revenue. A real business that can be scaled, sold, or lived off.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Again, estimates. Individual results vary. But the gap between doing it right and doing it alone compounds every single month.
          </p>
        </div>
      </div>

      <div className="relative h-2 bg-red-600 overflow-hidden mt-12 md:mt-16">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#000_15px,#000_30px)] opacity-50" />
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.05] mb-4">
          Now Do You See<br />
          <span className="text-orange-600">Why the Video Matters?</span>
        </h2>
        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-xl mx-auto">
          The cost of skipping your prep isn't the 5 minutes you save. It's everything you don't know walking into your call.
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/trainingnew/closer';
            }
          }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg cursor-pointer text-sm md:text-base"
        >
          Take Me Back to the Video
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
          &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved. Estimates shown are not guarantees of results.
        </p>
      </div>
    </div>
  );
}
