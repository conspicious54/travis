import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Skull,
  ArrowRight,
} from 'lucide-react';
import { trackEvent } from '../lib/posthog';

/* ───── design system ─────────────────────────────────────────────
   Anti-smoking PSA aesthetic:
   - System serif + Impact-style condensed sans for headlines
   - Monospace for numbers (receipt / invoice vibe)
   - Hard edges, minimal radius
   - Hazard tape dividers (SVG-like CSS stripes)
   - Red INK STAMPS with rotation
   - Newspaper column dividers
─────────────────────────────────────────────────────────────────── */

const SERIF = "font-serif";
const IMPACT = "font-['Impact','Haettenschweiler','Arial_Narrow_Bold',sans-serif]";
const MONO = "font-mono";

const HAZARD_STRIPES = "bg-[repeating-linear-gradient(45deg,#facc15_0,#facc15_20px,#000_20px,#000_40px)]";
const DANGER_STRIPES = "bg-[repeating-linear-gradient(45deg,#dc2626_0,#dc2626_20px,#000_20px,#000_40px)]";

/* ──────────────────────────── page ──────────────────────────────── */

export function RealCost() {
  useEffect(() => {
    trackEvent('real_cost_page_viewed');
  }, []);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-black selection:bg-yellow-300 selection:text-black">
      <Hero />
      <IntroStatement />
      <Stage1 />
      <Stage2 />
      <Stage3 />
      <KickstarterInterlude />
      <Stage4 />
      <TheBill />
      <FinalCTA />
      <Footer />
      <RealCostExitPopup />
    </div>
  );
}

/* ───── exit popup ───────────────────────────────────────────────── */

function RealCostExitPopup() {
  const [show, setShow] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const FLAG = 'pp_realcost_exit_shown';
    if (sessionStorage.getItem(FLAG)) return;

    const trigger = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      sessionStorage.setItem(FLAG, '1');
      setShow(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) trigger();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') trigger();
    };

    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      <div className="relative bg-[#faf7f2] max-w-lg w-full p-7 md:p-9 text-center border-4 border-black">
        <button
          onClick={() => setShow(false)}
          className={`${MONO} absolute top-3 right-3 text-black/40 hover:text-black cursor-pointer text-sm leading-none`}
          aria-label="Close"
        >
          &times; CLOSE
        </button>

        <div className={`h-2 ${HAZARD_STRIPES} -mx-7 md:-mx-9 mb-6 -mt-7 md:-mt-9`} />

        <p className={`${IMPACT} uppercase text-[10px] md:text-xs tracking-[0.25em] text-red-600 mb-3`}>
          ── Before you go ──
        </p>

        <h3 className={`${IMPACT} uppercase text-3xl md:text-4xl leading-[0.9] tracking-tight mb-4`}>
          Okay but<br />
          <span className="text-red-600">HOW does it work?</span>
        </h3>

        <p className="text-sm md:text-base text-black/80 leading-relaxed mb-3">
          You just saw the cost of doing it wrong. But what does doing it <em>right</em> actually look like?
        </p>

        <p className="text-sm md:text-base text-black/80 leading-relaxed mb-6">
          We break down the entire Passion Product Method step by step. How we find winning products, build premium brands, and make money without fighting a race to the bottom.
        </p>

        <a
          href="/method"
          onClick={() => trackEvent('realcost_exit_method_clicked')}
          className={`${IMPACT} inline-flex items-center gap-3 w-full justify-center px-8 py-4 bg-black text-white hover:bg-red-700 uppercase tracking-[0.1em] text-sm md:text-base transition-colors cursor-pointer border-2 border-black`}
        >
          Show me the method
          <ArrowRight className="w-4 h-4" />
        </a>

        <button
          onClick={() => setShow(false)}
          className={`${MONO} mt-4 text-[11px] uppercase tracking-widest text-black/50 hover:text-black cursor-pointer`}
        >
          No thanks, I'll figure it out myself
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────── warning label hero ────────────────────── */

function Hero() {
  return (
    <>
      <div className={`h-3 ${HAZARD_STRIPES}`} />

      <div className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
          {/* Warning label */}
          <div className="border-4 border-white p-4 md:p-6 mb-10 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
              <p className={`${IMPACT} uppercase text-sm md:text-base tracking-[0.2em]`}>
                Public Awareness Notice
              </p>
            </div>
            <p className="text-xs md:text-sm leading-snug text-white/80">
              The following document contains cost disclosures regarding
              unsupervised Amazon FBA launches. Viewer discretion is advised.
            </p>
          </div>

          <h1 className={`${IMPACT} uppercase text-center leading-[0.85] tracking-tight`}>
            <span className="block text-[14vw] md:text-[10rem] text-white">
              THE REAL
            </span>
            <span className="block text-[18vw] md:text-[13rem] text-red-500" style={{ textShadow: '4px 4px 0 #000' }}>
              COST
            </span>
            <span className="block text-[6vw] md:text-5xl text-white/90 mt-2">
              of launching on Amazon alone.
            </span>
          </h1>

          <p className={`${SERIF} italic text-center text-white/70 text-base md:text-lg mt-10 max-w-xl mx-auto`}>
            "Nobody ever tells you the bill until it's already due."
          </p>
        </div>
      </div>

      <div className={`h-3 ${HAZARD_STRIPES}`} />
    </>
  );
}

/* ──────────────────────── intro statement ───────────────────────── */

function IntroStatement() {
  return (
    <div className="bg-[#faf7f2] border-b-4 border-black">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 bg-red-600 text-white flex items-center justify-center">
            <span className={`${IMPACT} text-4xl md:text-5xl leading-none`}>!</span>
          </div>
          <div>
            <p className={`${SERIF} text-xl md:text-3xl leading-tight text-black font-bold`}>
              Every stage of an Amazon launch comes with a price.
            </p>
            <p className={`${SERIF} text-lg md:text-2xl leading-tight text-black/70 mt-2 italic`}>
              Most people pay it twice. Once in dollars, again in lost time.
            </p>
          </div>
        </div>

        <p className="text-xs text-black/60 mt-8 uppercase tracking-wider border-t border-black/20 pt-4">
          Disclosure: The following figures are estimates based on common outcomes.
          Individual results vary. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────── stage component ───────────────────────── */

interface Side {
  title: string;
  bullets: string[];
  verdict: string;
  verdictSub: string;
}

function Stage({
  num,
  name,
  diy,
  withUs,
}: {
  num: string;
  name: string;
  diy: Side;
  withUs: Side;
}) {
  return (
    <div className="bg-[#faf7f2] border-b-4 border-black">
      <div className="max-w-6xl mx-auto">
        {/* Stage header — newspaper style */}
        <div className="border-b-2 border-black px-4 py-5 md:py-7 flex items-baseline gap-4 md:gap-6">
          <span className={`${IMPACT} text-5xl md:text-7xl leading-none text-black/20`}>
            {num}
          </span>
          <div className="border-l-2 border-black pl-4 md:pl-6">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-black/60 mb-1">
              Stage {num}
            </p>
            <h2 className={`${IMPACT} uppercase text-3xl md:text-6xl leading-[0.9] tracking-tight`}>
              {name}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* DIY */}
          <div className="border-b md:border-b-0 md:border-r-2 border-black p-5 md:p-8 bg-white relative">
            <StampDIY />
            <p className={`${IMPACT} uppercase text-xs tracking-[0.2em] text-red-600 mb-3`}>
              If you do this alone
            </p>
            <h3 className={`${SERIF} text-xl md:text-2xl font-bold leading-tight mb-5`}>
              {diy.title}
            </h3>
            <ul className="space-y-3 mb-6">
              {diy.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm md:text-[15px] leading-relaxed">
                  <span className="text-red-600 shrink-0 font-bold">✗</span>
                  <span className="text-black/80">{b}</span>
                </li>
              ))}
            </ul>

            {/* Receipt-style verdict */}
            <div className="bg-black text-white p-4 md:p-5 border-l-4 border-red-600">
              <p className={`${MONO} text-[10px] uppercase tracking-wider text-white/60 mb-1`}>
                &gt; true cost
              </p>
              <p className={`${IMPACT} uppercase text-xl md:text-2xl leading-tight text-red-400`}>
                {diy.verdict}
              </p>
              <p className={`${MONO} text-xs text-white/70 mt-2`}>
                {diy.verdictSub}
              </p>
            </div>
          </div>

          {/* With us */}
          <div className="p-5 md:p-8 bg-[#faf7f2] relative">
            <p className={`${IMPACT} uppercase text-xs tracking-[0.2em] text-green-700 mb-3`}>
              If you work with us
            </p>
            <h3 className={`${SERIF} text-xl md:text-2xl font-bold leading-tight mb-5`}>
              {withUs.title}
            </h3>
            <ul className="space-y-3 mb-6">
              {withUs.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm md:text-[15px] leading-relaxed">
                  <span className="text-green-700 shrink-0 font-bold">✓</span>
                  <span className="text-black/80">{b}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white border-2 border-black p-4 md:p-5 border-l-4 border-l-green-700">
              <p className={`${MONO} text-[10px] uppercase tracking-wider text-black/50 mb-1`}>
                &gt; true cost
              </p>
              <p className={`${IMPACT} uppercase text-xl md:text-2xl leading-tight text-green-800`}>
                {withUs.verdict}
              </p>
              <p className={`${MONO} text-xs text-black/60 mt-2`}>
                {withUs.verdictSub}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StampDIY() {
  return (
    <div className="absolute top-3 right-3 md:top-5 md:right-5 pointer-events-none">
      <div className={`${IMPACT} uppercase border-[3px] border-red-600 text-red-600 px-2.5 py-1 text-[10px] md:text-xs tracking-[0.2em] rotate-[-8deg] opacity-80`}>
        High risk
      </div>
    </div>
  );
}

/* ──────────────────────── individual stages ─────────────────────── */

function Stage1() {
  return (
    <Stage
      num="01"
      name="Product Validation"
      diy={{
        title: 'Watch some YouTube videos. Pick a product. Hope.',
        bullets: [
          'You base the decision on a hunch',
          'Nobody tells you if real Amazon data supports it',
          'You find out the market is dead after spending $3,000 on inventory',
          'Or worse, you never find out at all',
        ],
        verdict: 'First product fails',
        verdictSub: '$3,000 – $10,000 gone before you sell one unit',
      }}
      withUs={{
        title: 'A real coach validates the idea before you spend a dollar.',
        bullets: [
          'We look at the actual Amazon data together',
          'A coach reviews your idea and tells you if it will sell',
          'We teach you how to read the data yourself',
          'You commit capital only when the numbers say yes',
        ],
        verdict: 'Zero in wasted money',
        verdictSub: 'You know before you buy',
      }}
    />
  );
}

function Stage2() {
  return (
    <Stage
      num="02"
      name="Branding & Design"
      diy={{
        title: 'A $50 Fiverr gig that looks like a $50 Fiverr gig.',
        bullets: [
          'Cheap logo that undersells the product',
          'Packaging design that looks generic',
          'Main image that gets skipped on the Amazon grid',
          'Bad branding costs you sales every single day',
        ],
        verdict: 'Silent revenue leak',
        verdictSub: 'You bleed money and never see where',
      }}
      withUs={{
        title: 'Real designers. A framework built to convert on Amazon.',
        bullets: [
          'Designers who understand Amazon shoppers',
          'Branding built around your niche, not a template',
          'Listing images, packaging, logo: all designed to stand out',
          'Higher click-through. Higher conversion. Higher rank.',
        ],
        verdict: 'Pays itself back',
        verdictSub: 'Good branding compounds every month',
      }}
    />
  );
}

function Stage3() {
  return (
    <Stage
      num="03"
      name="Manufacturing & Sourcing"
      diy={{
        title: 'A random supplier on Alibaba. A prayer.',
        bullets: [
          'No idea if the manufacturer is legit until the shipment arrives',
          'You overpay because you don\'t know what to negotiate',
          'Quality issues on 10-30% of your units',
          '2-3 month delays push your launch back',
          'In the worst case, you get scammed and lose it all',
        ],
        verdict: '$5,000 - $20,000',
        verdictSub: 'In losses. And lost time you will never get back.',
      }}
      withUs={{
        title: 'Verified manufacturers. Real negotiation help. Quality checks.',
        bullets: [
          'Manufacturers other students have vetted and used',
          'Negotiation scripts that lower your unit cost',
          'Quality control built into the process',
          'Launch on schedule, not three months late',
        ],
        verdict: 'Lower cost per unit',
        verdictSub: 'No horror stories',
      }}
    />
  );
}

/* ──────────────────────── Kickstarter interlude ─────────────────── */

function KickstarterInterlude() {
  return (
    <div className="bg-black text-white border-b-4 border-black">
      <div className={`h-3 ${DANGER_STRIPES}`} />
      <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <p className={`${IMPACT} uppercase text-[10px] md:text-xs tracking-[0.3em] text-yellow-400 mb-3`}>
            ── A brief interruption ──
          </p>
          <h2 className={`${IMPACT} uppercase leading-[0.88] tracking-tight`}>
            <span className="block text-4xl md:text-7xl">or, you could launch</span>
            <span className="block text-5xl md:text-8xl text-yellow-400 mt-1">with someone else's money.</span>
          </h2>
        </div>

        {/* Plain-English explainer of Kickstarter */}
        <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-sm border border-white/15 p-6 md:p-8 mb-10">
          <p className={`${IMPACT} uppercase text-[10px] md:text-xs tracking-[0.3em] text-yellow-400 mb-4`}>
            ── What is Kickstarter? ──
          </p>
          <p className={`${SERIF} text-base md:text-lg text-white/90 leading-relaxed mb-4`}>
            Kickstarter is a website where people go to fund products before they exist. You create a page showing what you're going to make. Real customers pay in advance to get one when it ships.
          </p>
          <p className={`${SERIF} text-base md:text-lg text-white/80 leading-relaxed mb-6`}>
            If enough people pledge their money, your product gets built. If not, nobody gets charged and you lose nothing. It's essentially a live stress test for your idea, and if it passes, you walk away with the cash to manufacture.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/15">
            <KickstarterBenefit
              num="1"
              title="No inventory risk"
              body="You don't manufacture until real customers have already paid for it. You can't end up with a garage full of unsold product."
            />
            <KickstarterBenefit
              num="2"
              title="Market validation"
              body="If people pull out their wallets for a product that doesn't exist yet, you have proof the market wants it before you bet a dollar."
            />
            <KickstarterBenefit
              num="3"
              title="Launch capital"
              body="The money you raise is what pays for the first manufacturing run. You get funded and validated in the same move."
            />
          </div>
        </div>

        <p className={`${SERIF} italic text-white/70 text-base md:text-lg text-center max-w-xl mx-auto mb-10`}>
          We guide students through the entire Kickstarter launch. Here's what a few of them have raised.
        </p>

        {/* Receipt of raises */}
        <div className="max-w-2xl mx-auto bg-[#faf7f2] text-black p-5 md:p-7 border-2 border-yellow-400">
          <p className={`${MONO} text-[10px] uppercase tracking-widest text-black/60 border-b border-black/20 pb-2 mb-3`}>
            STUDENT LAUNCH FUND RECEIPTS
          </p>
          <ul className={`${MONO} text-sm md:text-base space-y-3`}>
            <ReceiptRow
              name="AJ"
              project="Cocktail Cards"
              amount="$120,000+"
              url="https://www.indiegogo.com/en/projects/albertrantz/cocktail-cards"
            />
            <ReceiptRow
              name="Brent"
              project="SearPro Torch"
              amount="multi $10,000s"
              url="https://www.kickstarter.com/projects/searprollc/searpro-the-best-multi-use-torch-on-the-market"
            />
            <ReceiptRow
              name="Travis"
              project="Performance Nut Butter"
              amount="$15,000+"
              url="https://www.kickstarter.com/projects/739456358/performance-nut-butter-on-the-go-keto-paleo-and-ve"
            />
            <ReceiptRow
              name="Jeremy"
              project="Slim Caddy Organizer"
              amount="$10,000+"
              url="https://www.kickstarter.com/projects/slimcaddy/slim-caddytm-organizer"
            />
            <ReceiptRow
              name="Connor"
              project="Performance Gum"
              amount="fully funded"
              url="https://www.kickstarter.com/projects/connorbyers/performance-gum-elite-energy-gum-for-peak-performance"
            />
          </ul>
          <p className={`${MONO} text-xs text-black/60 border-t border-black/20 pt-3 mt-4`}>
            ── click any campaign to see the real receipts ──
          </p>
        </div>

        <p className="text-center text-white/60 text-sm mt-8 max-w-xl mx-auto">
          Zero out-of-pocket inventory risk. Demand validated before you spend a dollar. It's the opposite of the Alibaba horror story above.
        </p>
      </div>
      <div className={`h-3 ${DANGER_STRIPES}`} />
    </div>
  );
}

function KickstarterBenefit({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`${IMPACT} text-yellow-400 text-xl leading-none`}>{num}.</span>
        <p className={`${IMPACT} uppercase text-sm md:text-base tracking-wider text-white`}>{title}</p>
      </div>
      <p className="text-xs md:text-sm text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}

function ReceiptRow({
  name,
  project,
  amount,
  url,
}: {
  name: string;
  project: string;
  amount: string;
  url: string;
}) {
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-wrap items-baseline gap-x-2 gap-y-0 hover:bg-black/5 -mx-2 px-2 py-1 transition-colors"
      >
        <span className="font-bold">{name}</span>
        <span className="text-black/60 text-xs md:text-sm italic group-hover:underline underline-offset-2">
          {project} →
        </span>
        <span className="flex-1 border-b border-dotted border-black/40 min-w-[20px]" />
        <span className="font-bold text-green-800">{amount}</span>
      </a>
    </li>
  );
}

function Stage4() {
  return (
    <Stage
      num="04"
      name="The Launch"
      diy={{
        title: 'Post the listing. Hope Amazon ranks it. It won\'t.',
        bullets: [
          'Listing cobbled together from free YouTube videos',
          'Keywords you guessed at',
          'No one to review it before it goes live',
          'Zero reviews day one. Amazon ignores dead listings.',
          'You miss the honeymoon period entirely',
        ],
        verdict: 'Dead on arrival',
        verdictSub: 'The most expensive mistake on Amazon',
      }}
      withUs={{
        title: 'Coach-approved listing. Community ready for day one.',
        bullets: [
          'Optimized listing with the right keywords from day one',
          'Listing reviewed and approved by a coach before launch',
          'The Passion Product community supports your first orders and reviews',
          'You catch Amazon\'s honeymoon period and rank fast',
        ],
        verdict: 'Momentum on day one',
        verdictSub: 'The launch that actually launches',
      }}
    />
  );
}

/* ──────────────────────── the bill ──────────────────────────────── */

function TheBill() {
  return (
    <div className="bg-black text-white">
      <div className={`h-4 ${DANGER_STRIPES}`} />

      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        {/* Warning badge */}
        <div className="flex justify-center mb-10">
          <div className="border-4 border-red-500 px-5 py-3 flex items-center gap-3">
            <Skull className="w-5 h-5 text-red-500" />
            <p className={`${IMPACT} uppercase tracking-[0.25em] text-red-500 text-sm md:text-base`}>
              FINAL BILL ENCLOSED
            </p>
          </div>
        </div>

        <h2 className={`${IMPACT} uppercase text-center leading-[0.88] tracking-tight mb-6`}>
          <span className="block text-5xl md:text-8xl">THE BIGGEST COST</span>
          <span className="block text-3xl md:text-5xl text-white/70 mt-2">isn't the one you see.</span>
        </h2>

        <p className={`${SERIF} italic text-white/70 text-center max-w-xl mx-auto text-base md:text-lg mb-14`}>
          Six months after launch. Two very different realities.
        </p>

        {/* Two invoices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Invoice
            kind="diy"
            title="Invoice: Doing it alone"
            lines={[
              ['Revenue per month', '$3,500'],
              ['Ad spend (untuned PPC)', '-$1,500'],
              ['Cost of goods (no negotiation)', '-$1,700'],
              ['Amazon fees', '-$600'],
              ['Net margin', 'losing money'],
            ]}
            total="Stuck under $5K/mo"
            totalSub="A product that can't get off the ground. Most DIY launches never break out of this range."
          />

          <Invoice
            kind="withus"
            title="Invoice: Working with us"
            lines={[
              ['Revenue per month', '$25,000+'],
              ['Ad spend (optimized PPC)', '-$3,500'],
              ['Cost of goods (negotiated)', '-$9,000'],
              ['Amazon fees', '-$4,000'],
              ['Net margin', 'profitable'],
            ]}
            total="$300,000 – $1,000,000+"
            totalSub="REAL YEAR 1 REVENUE. A business you can scale, sell, or live off of."
          />
        </div>

        <p className="text-center text-white/40 text-xs mt-10 max-w-xl mx-auto">
          Estimates based on common outcomes. Not a guarantee. Individual results vary widely.
        </p>
      </div>

      <div className={`h-4 ${DANGER_STRIPES}`} />
    </div>
  );
}

function Invoice({
  kind,
  title,
  lines,
  total,
  totalSub,
}: {
  kind: 'diy' | 'withus';
  title: string;
  lines: [string, string][];
  total: string;
  totalSub: string;
}) {
  const isDIY = kind === 'diy';
  return (
    <div className="bg-[#faf7f2] text-black p-5 md:p-7 relative">
      {/* Torn edge top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle_at_10px_0,transparent_6px,#faf7f2_6px)] bg-[length:20px_10px] -translate-y-[8px]" />

      <p className={`${MONO} text-[10px] uppercase tracking-widest text-black/60 mb-1`}>
        &gt;&gt; {isDIY ? 'UNAUDITED' : 'VERIFIED'}
      </p>
      <h3 className={`${IMPACT} uppercase text-xl md:text-2xl leading-tight mb-5`}>
        {title}
      </h3>

      <ul className={`${MONO} text-sm space-y-2 mb-5`}>
        {lines.map(([k, v], i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-black/70">{k}</span>
            <span className="flex-1 border-b border-dotted border-black/30" />
            <span className="font-bold">{v}</span>
          </li>
        ))}
      </ul>

      <div className={`border-t-2 border-black pt-4 mt-4 ${isDIY ? 'border-red-700' : 'border-green-800'}`}>
        <p className={`${MONO} text-[10px] uppercase tracking-widest ${isDIY ? 'text-red-700' : 'text-green-800'} mb-1`}>
          {isDIY ? 'TOTAL OPPORTUNITY LOST' : 'TOTAL POTENTIAL'}
        </p>
        <p className={`${IMPACT} uppercase text-2xl md:text-3xl leading-tight ${isDIY ? 'text-red-700' : 'text-green-800'}`}>
          {total}
        </p>
        <p className="text-xs text-black/70 mt-2 leading-relaxed">
          {totalSub}
        </p>
      </div>

      {/* Stamp */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className={`${IMPACT} uppercase border-[3px] px-2.5 py-1 text-[10px] tracking-[0.2em] rotate-[-12deg] ${isDIY ? 'border-red-700 text-red-700' : 'border-green-800 text-green-800'}`}>
          {isDIY ? 'DECLINED' : 'APPROVED'}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── final CTA ─────────────────────────────── */

function FinalCTA() {
  return (
    <div className="bg-[#faf7f2] border-b-4 border-black">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
        <p className={`${IMPACT} uppercase text-xs md:text-sm tracking-[0.3em] text-black/60 mb-5`}>
          ── This has been a public service announcement ──
        </p>

        <h2 className={`${IMPACT} uppercase leading-[0.88] tracking-tight mb-6`}>
          <span className="block text-4xl md:text-7xl">NOW DO YOU SEE</span>
          <span className="block text-5xl md:text-8xl text-red-600 mt-1" style={{ textShadow: '3px 3px 0 #000' }}>
            WHY THE VIDEO
          </span>
          <span className="block text-4xl md:text-7xl">MATTERS?</span>
        </h2>

        <p className={`${SERIF} italic text-black/70 text-base md:text-lg mb-10 max-w-xl mx-auto`}>
          The cost of skipping your prep isn't the 5 minutes you save. It's every expensive mistake above.
        </p>

        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/trainingnew/closer';
            }
          }}
          className={`${IMPACT} inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-red-700 uppercase tracking-[0.1em] text-base md:text-lg transition-colors cursor-pointer border-4 border-black`}
        >
          Take me back to the video
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────── footer ────────────────────────────────── */

function Footer() {
  return (
    <div className="bg-black text-white/70">
      {/* Full disclosure block */}
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <p className={`${IMPACT} uppercase text-xs md:text-sm tracking-[0.25em] text-white/80 mb-5 text-center`}>
          ── Full Disclosure ──
        </p>

        <div className="space-y-4 text-[11px] md:text-xs leading-relaxed text-white/60 max-w-3xl mx-auto">
          <p>
            <span className="text-white/90 font-bold uppercase">Not financial, legal, tax, or business advice.</span> The information on this page is provided for general educational and illustrative purposes only. It is not intended as, and should not be relied upon as, financial, legal, tax, investment, or business advice. Before making any business, financial, investment, credit, tax, or legal decision, you should consult a qualified licensed professional in your jurisdiction.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">No earnings or results guarantees.</span> Any revenue, profit, cost, timeline, or outcome figures referenced on this page (including, without limitation, any stage-by-stage cost estimates, six-month projections, first-year revenue ranges, Kickstarter fundraise amounts, or any comparison between "doing it alone" and "working with us") are estimates based on anecdotal outcomes, illustrative scenarios, or individual student experiences. They are not typical. They are not promises. They are not guarantees, representations, or assurances of any kind regarding the results you may personally achieve. Your results will be different, and may be materially lower, including no result at all or a complete loss of capital.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Student stories are not typical.</span> Any individuals referenced on this page (including AJ, Brent, Travis, Jeremy, Connor, and others) are actual past or present students or associates of Passion Product LLC whose outcomes are highlighted for illustrative purposes. Their results are atypical. The U.S. Bureau of Labor Statistics and multiple independent studies report that a significant percentage of new small businesses fail within their first few years. Most people who attempt to sell on Amazon, start a Kickstarter, or launch a product do not achieve the outcomes described above. The fact that someone is shown on this page is not a promise that you will achieve comparable results.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Kickstarter references.</span> Kickstarter and Indiegogo are independent third-party crowdfunding platforms with their own terms, policies, and platform fees. Passion Product LLC is not affiliated with, endorsed by, or a sponsor of Kickstarter, PBC or Indiegogo, Inc. Links to specific campaigns are provided for informational purposes only. Not every Kickstarter or Indiegogo campaign succeeds. A campaign can fail to reach its funding goal, fail to deliver, or fail to produce a profitable product even after successful funding. Running a successful crowdfunding campaign requires significant work and carries real risk.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Business and financial risk.</span> Selling on Amazon, starting an e-commerce brand, launching a product, sourcing inventory, and using credit or financing involve material risk, including the risk of losing some or all of the money you invest. Outcomes depend on many factors outside of our control, including but not limited to your effort, skill, experience, market conditions, competition, platform policy changes, supplier reliability, advertising performance, macroeconomic conditions, regulatory changes, and tariffs. No one, including Passion Product LLC, can guarantee the performance or success of any business venture.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Credit and debt disclaimer.</span> Where we reference credit cards, 0% APR promotional periods, business financing, or the concept of "good debt" versus "bad debt," we are making a general educational commentary, not a specific recommendation to you. Credit products have terms, fees, interest rates, and conditions that can change. Approval depends solely on the lender. Misusing credit, carrying balances past a promotional period, or taking on more debt than you can responsibly manage can cause serious financial harm, including damaged credit, default, collections, and bankruptcy. Do not take on any debt without first consulting a qualified financial advisor.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Third-party tools and links.</span> This site may contain references, links, or affiliate links to third-party products, services, or websites. Passion Product LLC may receive compensation when you interact with these links. We only recommend tools we believe may be useful, but we make no representations about them. You are responsible for reviewing the terms, privacy policies, and fees of any third party before engaging with them.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">No professional relationship.</span> Viewing this page, clicking a link, or speaking with our team does not create a client, fiduciary, or advisory relationship of any kind. Any coaching, community, or program relationship is governed solely by the written agreement you sign when you enroll.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">No liability.</span> To the fullest extent permitted by law, Passion Product LLC, its officers, employees, contractors, affiliates, and associated parties disclaim any and all liability for losses, damages, or costs arising out of or related to your reliance on the information on this page, any actions you take or fail to take as a result, or any business decision you make. By continuing to use this page, you agree that you are solely responsible for your decisions and their outcomes.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Forward-looking statements.</span> Certain statements on this page may be considered "forward-looking." These statements are based on assumptions that may or may not prove accurate, and actual results may differ materially. We undertake no obligation to update such statements.
          </p>

          <p>
            <span className="text-white/90 font-bold uppercase">Applicable terms.</span> Your use of this site is governed by our full <a href="/terms" className="underline underline-offset-2 hover:text-white">Terms of Service</a> and any other agreements you sign with Passion Product LLC. If there is any conflict between the summary disclosures above and those agreements, those agreements control.
          </p>
        </div>

        <p className={`${SERIF} italic text-white/50 text-xs text-center mt-8 max-w-2xl mx-auto`}>
          Passion Product LLC believes in honest education and full transparency. These disclosures exist to make sure you have a realistic understanding of what's involved before you act on anything you read here.
        </p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5 text-center">
        <p className={`${MONO} text-[10px] uppercase tracking-widest text-white/40`}>
          &copy; {new Date().getFullYear()} PASSION PRODUCT LLC &nbsp;│&nbsp; ALL RIGHTS RESERVED &nbsp;│&nbsp; <a href="/terms" className="hover:text-white underline-offset-2 hover:underline">TERMS</a>
        </p>
      </div>
    </div>
  );
}
