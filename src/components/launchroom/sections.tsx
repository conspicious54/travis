import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Youtube,
  Store,
  Package,
  Factory,
  CheckCircle2,
  Circle,
  Lightbulb,
  AlertCircle,
  Users,
  DollarSign,
  Flame,
  Globe2,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { LaunchRoomRecord, LaunchRoomScore } from '../../lib/launchroom';
import {
  formatLaunchDate,
  computeLaunchDate,
} from '../../lib/launchroom';

/* ───── Launch Room — section modules ────────────────────────────
   Every per-answer section the brief lists, built as a real
   visual/data module rather than a placeholder+video slot.
   Each section exports a React component that renders itself
   from the Launch Room record.

   Design notes:
   - Diagrams over copy. If something can be a stackup, a
     timeline, or a geo bar instead of a paragraph, it is.
   - No em dashes in UI strings (hard rule).
   - YouTube link slots on the student-story section only;
     everywhere else uses written modules + diagrams.
   - Numbers used throughout are the ones Connor named:
     student funding distribution with the $1-3K majority,
     60/25/15 US/CA/EU breakdown, 4-month fast-case timeline.
──────────────────────────────────────────────────────────────── */

const CARD_BASE = 'rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8';
const EYEBROW = 'text-[11px] font-black uppercase tracking-wider text-orange-600';

interface Props { record: LaunchRoomRecord; }
interface ScoredProps extends Props { score: LaunchRoomScore; }

/* ─── Product Idea block (TOP of page, interactive) ──────────── */

export function ProductIdeaBlock({ record }: Props) {
  const q9 = record.answers.q9;
  const [interestInput, setInterestInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Suggestion heuristic for the no_idea path. Not AI yet; it maps
  // a free-text interest to a product shape + a reason, so the lead
  // gets a concrete starting point instead of a blank page. Real
  // AI integration is a separate task once ANTHROPIC_API_KEY is
  // wired on Netlify.
  const suggestion = useMemo(() => {
    if (!submitted || !interestInput.trim()) return null;
    const i = interestInput.toLowerCase();
    if (i.includes('fitness') || i.includes('gym') || i.includes('workout')) {
      return {
        shape: 'A specialty fitness accessory your gym friends ask to borrow',
        why: 'Fitness buyers on Amazon over-reward products that solve one annoying moment at the gym. Your lived knowledge is the moat.',
      };
    }
    if (i.includes('kitchen') || i.includes('cooking') || i.includes('food')) {
      return {
        shape: 'A kitchen tool that fixes one specific cooking frustration you already live with',
        why: 'Kitchen on Amazon is loud, but single-task tools with a clear hero use case keep converting. Your frustration is the research.',
      };
    }
    if (i.includes('pet') || i.includes('dog') || i.includes('cat')) {
      return {
        shape: 'A pet accessory for the specific breed or life stage you own',
        why: 'Breed-specific or senior-pet gear outsells generic pet gear because owners search that way. Your pet is the test market.',
      };
    }
    if (i.includes('baby') || i.includes('kid') || i.includes('parent')) {
      return {
        shape: 'A parenting micro-pain-point product for a specific age band',
        why: 'Parents search for the exact age and the exact problem. Age-banded products beat generic ones on both click and convert.',
      };
    }
    if (i.includes('garden') || i.includes('plant') || i.includes('outdoor')) {
      return {
        shape: 'A gardening tool scoped to one plant type or climate',
        why: 'Hobbyist gardeners buy specialized gear the big brands ignore. Scope by plant or region and the listing writes itself.',
      };
    }
    return {
      shape: `A product in "${interestInput.trim()}" scoped to one specific user, use case, or moment of friction`,
      why: 'Generic beats narrow on Amazon almost never. The sharper the user and the moment, the easier the listing, the easier the ads, and the easier it is to beat incumbents.',
    };
  }, [submitted, interestInput]);

  // Different panel per q9 answer. Each one is a self-contained
  // interactive moment that gives the lead real value in 30s.
  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Your Product Idea</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          {q9 === 'validated' && 'Score the idea you already have'}
          {q9 === 'niche' && 'Narrow your niche into one product'}
          {q9 === 'no_idea' && 'Brainstorm a product in 30 seconds'}
          {q9 === 'unsure' && 'Is Amazon FBA the right path for you?'}
          {!q9 && 'Start with a product direction'}
        </h2>

        {/* no_idea or missing: free-text interest → suggestion */}
        {(q9 === 'no_idea' || !q9) && (
          <div className="mt-5">
            <p className="text-slate-700">
              Type anything you already know, do, or spend time on. We will aim you at a product shape worth testing.
            </p>
            <div className="mt-4 flex flex-col md:flex-row gap-2">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g. home fitness, baking, dog training, gardening"
                className="flex-1 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none p-3 text-slate-900"
                onKeyDown={(e) => { if (e.key === 'Enter') setSubmitted(true); }}
              />
              <button
                onClick={() => setSubmitted(true)}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black px-5 py-3 transition inline-flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4" /> Get a direction
              </button>
            </div>
            {suggestion && (
              <div className="mt-5 rounded-xl bg-orange-50 border border-orange-200 p-5">
                <p className={EYEBROW}>Starting Shape</p>
                <p className="mt-1 text-lg md:text-xl font-black text-slate-900">{suggestion.shape}</p>
                <p className="mt-3 text-slate-700">{suggestion.why}</p>
                <p className="mt-4 text-sm text-slate-600">
                  Next: your strategist pressure-tests this on your call and gives you three real supplier directions you can quote this week.
                </p>
              </div>
            )}
          </div>
        )}

        {/* niche: 3 narrowing prompts */}
        {q9 === 'niche' && (
          <div className="mt-5 space-y-3">
            <p className="text-slate-700">You know your space. The money is in picking the one SKU that works. Answer these on the back of a napkin before your call.</p>
            {[
              'Who is your most frustrated customer in this niche, specifically?',
              'What is the one thing they already pay for that annoys them?',
              'What would make them switch in one sentence?',
            ].map((q, i) => (
              <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm font-black text-orange-600">Question {i + 1}</p>
                <p className="mt-1 text-slate-900 font-bold">{q}</p>
              </div>
            ))}
          </div>
        )}

        {/* validated: scoring checklist */}
        {q9 === 'validated' && (
          <div className="mt-5">
            <p className="text-slate-700">You have an idea. Here is the 5-point gut check your strategist runs. Score yourself before your call.</p>
            <ul className="mt-4 space-y-2">
              {[
                'There is proof someone paid for a near-match in the last 90 days.',
                'You can get to a sampling supplier in under 10 days of outreach.',
                'The buyer searches for it by name, not by category.',
                'The margin after Amazon fees and ads clears 25 percent.',
                'You are not the hero of the listing. The outcome is.',
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 mt-[2px] shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* unsure: FBA fit flow */}
        {q9 === 'unsure' && (
          <div className="mt-5">
            <p className="text-slate-700">Fair question. FBA is right for a specific kind of operator. Here is the quick read.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm font-black text-emerald-700 uppercase tracking-wider">FBA fits if</p>
                <ul className="mt-2 space-y-1 text-slate-800">
                  <li>You want to build an asset, not a side gig</li>
                  <li>You can wait 4 to 6 months on first revenue</li>
                  <li>You have between $1K and $25K to deploy</li>
                </ul>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-700 uppercase tracking-wider">FBA is wrong if</p>
                <ul className="mt-2 space-y-1 text-slate-800">
                  <li>You need cash in 60 days</li>
                  <li>You want services or digital products</li>
                  <li>You will not read a listing or an ad report</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Why You Built This (q5) — student story + YouTube link ─ */

export function WhyYouBuilt({ record }: Props) {
  // Placeholder student until we build a q5-answer -> student mapping.
  const story = {
    name: 'Nathan G.',
    tag: 'Started with no idea, launched in month 5',
    quote: 'I spent two years reading. The Launch Room gave me the first week of actions I could not skip, and the call told me which of my ideas was actually the one.',
    youtubeUrl: '', // slot for the real success-story video
    youtubeTitle: 'Nathan on going from no idea to first order',
  };

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Why You Built This</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          Someone just like you already did it. Here is the shortest story we tell.
        </h2>
        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-5 md:p-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-lg font-black text-slate-900">{story.name}</p>
            <p className="text-sm text-slate-500">{story.tag}</p>
          </div>
          <p className="mt-3 text-slate-800 italic">&ldquo;{story.quote}&rdquo;</p>

          <a
            href={story.youtubeUrl || '#'}
            target={story.youtubeUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={
              'mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ' +
              (story.youtubeUrl
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed')
            }
            onClick={(e) => { if (!story.youtubeUrl) e.preventDefault(); }}
          >
            <Youtube className="w-4 h-4" />
            {story.youtubeUrl ? `Watch: ${story.youtubeTitle}` : 'Full story video dropping soon'}
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Your strategist will match you to the student whose starting point most looks like yours and send you their walkthrough.
        </p>
      </div>
    </section>
  );
}

/* ─── Where You're Starting (q6) ───────────────────────────── */

export function WhereYouStart({ record }: Props) {
  const q6 = record.answers.q6;

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Where You're Starting</p>

        {q6 === 'already_selling' && (
          <>
            <h2 className="mt-1 text-xl md:text-2xl font-black">You are already selling. Different conversation.</h2>
            <p className="mt-3 text-slate-700">
              The Launch Room is built for people getting to their first product. You are past that. Your call needs to be a scale conversation, not a launch one.
            </p>
            <Link
              to="/scalers"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-3 transition"
            >
              Go to FBA Scalers <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {q6 === 'tried_business' && (
          <>
            <h2 className="mt-1 text-xl md:text-2xl font-black">You have run something before. That shortens this.</h2>
            <ul className="mt-4 space-y-2 text-slate-800">
              <li className="flex items-start gap-2"><Flame className="w-5 h-5 text-orange-600 mt-[2px] shrink-0" /> You already know what a bad week feels like, so we skip the pep talks.</li>
              <li className="flex items-start gap-2"><Target className="w-5 h-5 text-orange-600 mt-[2px] shrink-0" /> You know what finishing feels like, which is the one skill most people here are still earning.</li>
              <li className="flex items-start gap-2"><ArrowRight className="w-5 h-5 text-orange-600 mt-[2px] shrink-0" /> The gap we close for you is Amazon-specific rules: PPC, listings, FBA logistics. Your prior experience doesn't carry 1 to 1.</li>
            </ul>
          </>
        )}

        {(q6 === 'none' || !q6) && (
          <>
            <h2 className="mt-1 text-xl md:text-2xl font-black">You are starting from zero. Good. That is the easiest version to coach.</h2>
            <p className="mt-3 text-slate-700">No bad habits to unlearn. Three things to lock down in week one:</p>
            <ol className="mt-4 space-y-2 text-slate-800">
              <li className="flex gap-3"><span className="font-black text-orange-600">1.</span> Open a US Amazon Seller Central account (or confirm the one you have is clean).</li>
              <li className="flex gap-3"><span className="font-black text-orange-600">2.</span> Pick a lane. We work in three product categories, not nine. Your call narrows it.</li>
              <li className="flex gap-3"><span className="font-black text-orange-600">3.</span> Block two hours of work time a week on your calendar. Protect them.</li>
            </ol>
          </>
        )}
      </div>
    </section>
  );
}

/* ─── Who's Guiding You (q8) ─────────────────────────────── */

export function WhoGuides({ record }: Props) {
  const q8 = record.answers.q8;

  const lede =
    q8 === 'over_year' ? "You already know the vibe. Here's who you'd be working with hands-on."
    : q8 === 'several_months' ? "You know enough to be in the right place. Here's the actual team."
    : q8 === 'recently' ? "Fast version of who we are and why that matters."
    : "Short version: this is a working team, not a course.";

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Who's Guiding You</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">{lede}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { role: 'Strategist', detail: 'Runs your call. Points at the one thing to fix next.' },
            { role: 'Launch coach', detail: 'The person you message when a supplier replies weird.' },
            { role: 'Travis', detail: 'Reviews your plan every quarter. Full stop, no middle-manager chain.' },
          ].map((p) => (
            <div key={p.role} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                <p className="font-black text-slate-900">{p.role}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Funding Path (q13) — distribution diagram ────────────── */

const FUNDING_BANDS = [
  { key: 'under_1k', label: 'Under $1K', share: 10, note: 'Mostly launching via Kickstarter', color: 'bg-slate-400' },
  { key: '1k_5k',   label: '$1K to $5K',  share: 55, note: 'The majority. $1K to $3K manufacturing is the sweet spot.', color: 'bg-orange-500' },
  { key: '5k_10k',  label: '$5K to $10K', share: 25, note: 'Faster to break even on ads', color: 'bg-orange-400' },
  { key: '10k_plus', label: '$10K+',     share: 10, note: 'Launches with ad budget pre-loaded', color: 'bg-emerald-500' },
] as const;

export function FundingPath({ record }: Props) {
  const q13 = record.answers.q13;

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Your Funding Path</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          Where you sit vs. the majority of our students
        </h2>

        <div className="mt-5 flex items-end gap-1 h-32">
          {FUNDING_BANDS.map((b) => (
            <div key={b.key} className="flex-1 flex flex-col items-center justify-end">
              <div className={'w-full rounded-t ' + b.color} style={{ height: `${b.share * 1.6}px` }} />
              <p className="mt-2 text-[11px] font-black text-slate-700 text-center">{b.label}</p>
              <p className="text-[10px] text-slate-500">{b.share}%</p>
            </div>
          ))}
        </div>

        {q13 && (
          <p className="mt-5 text-slate-800">
            You said <span className="font-black">{FUNDING_BANDS.find((b) => b.key === q13)?.label}</span>. {FUNDING_BANDS.find((b) => b.key === q13)?.note}.
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <p className="font-black text-slate-900">What this means</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              Most students launch for $1,000 to $3,000 in manufacturing cost. The ones who feel like they need more usually don't. Scope is the real lever.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <p className="font-black text-slate-900">If you are under $1K</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              Kickstarter is a real path. We have launched products that way. Your call maps out whether that fits your product shape.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Timeline (q10/q7) — horizontal milestone map ────────── */

const TIMELINE_MILESTONES = [
  { month: 1, label: 'Lock product + supplier shortlist' },
  { month: 2, label: 'Samples in hand' },
  { month: 3, label: 'First order in production' },
  { month: 4, label: 'First order shipping to FBA' },
  { month: 5, label: 'Listing live, first ads' },
  { month: 6, label: 'First profitable month target' },
] as const;

export function TimelineMap({ record }: Props) {
  const launch = computeLaunchDate(record.answers);
  const months = Math.max(
    1,
    Math.round((launch.getTime() - Date.now()) / (30 * 86_400_000)),
  );

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Your Timeline</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          From today to live on Amazon
        </h2>
        <p className="mt-2 text-slate-600">
          4 to 6 months is average. If we get you moving fast, 4 is the fast-case target.
        </p>

        <div className="relative mt-8 pb-16">
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
          <div
            className="absolute top-5 left-0 h-1 bg-orange-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (4 / 6) * 100)}%` }}
          />
          <div className="relative grid grid-cols-6 gap-1">
            {TIMELINE_MILESTONES.map((m) => {
              const highlight = m.month <= 4;
              return (
                <div key={m.month} className="flex flex-col items-center">
                  <div
                    className={
                      'relative z-10 w-5 h-5 rounded-full border-4 ' +
                      (highlight
                        ? 'bg-orange-500 border-orange-200'
                        : 'bg-slate-300 border-slate-100')
                    }
                  />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Month {m.month}</p>
                  <p className="mt-1 text-[11px] md:text-xs text-slate-700 text-center leading-tight">{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-sm text-slate-800">
            <span className="font-black">Your projected launch:</span> {formatLaunchDate(launch)}{' '}
            <span className="text-slate-600">
              ({months} month{months === 1 ? '' : 's'} out, if you start this week)
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Selling From Where You Are (q4) — geo breakdown ────── */

const GEO_BANDS = [
  { key: 'us',    label: 'United States', share: 60, color: 'bg-orange-500' },
  { key: 'ca',    label: 'Canada',        share: 25, color: 'bg-orange-400' },
  { key: 'eu',    label: 'Europe + UK',   share: 15, color: 'bg-emerald-500' },
] as const;

const GEO_EDGE: Record<string, { label: string; edge: string }> = {
  us: {
    label: 'US seller',
    edge: 'The largest buying marketplace in the world is in your home currency. The friction we usually walk other countries through, you skip.',
  },
  ca: {
    label: 'Canadian seller',
    edge: 'Easiest cross-border setup on earth. You sell US-first, then unify a Canadian account in week eight. One SKU, two markets, same cash flow.',
  },
  eu: {
    label: 'European seller',
    edge: 'EU VAT and Pan-EU FBA sound scary; they are a 2-page checklist. Once you unify, one listing hits five of the biggest buying countries in Europe.',
  },
  other: {
    label: 'International seller',
    edge: 'Your path routes through a US tax/entity setup and an incorporated address. We have mapped that for sellers from 40+ countries. It is paperwork, not a wall.',
  },
};

function detectGeo(q4: string | undefined): keyof typeof GEO_EDGE {
  if (!q4) return 'us';
  const s = q4.toLowerCase();
  if (/\bus\b|united states|america|texas|florida|california|new york|usa\b/.test(s)) return 'us';
  if (/canada|canadian|toronto|vancouver|montreal|ontario|alberta|bc\b|quebec/.test(s)) return 'ca';
  if (/uk|united kingdom|britain|london|france|germany|spain|italy|netherlands|poland|ireland|sweden|europe/.test(s)) return 'eu';
  return 'other';
}

export function SellingFromWhere({ record }: Props) {
  const geo = detectGeo(record.answers.q4);
  const edge = GEO_EDGE[geo];

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Selling From Where You Are</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          Where our students live, and your edge
        </h2>

        <div className="mt-5">
          <div className="flex w-full h-6 rounded-full overflow-hidden">
            {GEO_BANDS.map((b) => (
              <div
                key={b.key}
                className={b.color}
                style={{ width: `${b.share}%` }}
                title={`${b.label}: ${b.share}%`}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {GEO_BANDS.map((b) => (
              <div key={b.key} className="text-center">
                <p className="text-sm font-black text-slate-900">{b.share}%</p>
                <p className="text-[11px] text-slate-600">{b.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-5">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-orange-600" />
            <p className="font-black text-slate-900">Your edge as a {edge.label}</p>
          </div>
          <p className="mt-2 text-slate-800">{edge.edge}</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Gap Filler (q11) — maps score.gaps to specific support ─ */

const GAP_SUPPORT: Record<string, { heading: string; body: string; icon: typeof Users }> = {
  product: {
    heading: 'Product scoring call',
    body: 'Travis + two coaches review your idea against the 5-point score. Walk out with a go/no-go and the one tweak that would flip it.',
    icon: Lightbulb,
  },
  capital: {
    heading: 'Sourcing strategy call',
    body: 'A sourcing specialist right-sizes your spend to the product and the manufacturing region. No oversized orders.',
    icon: DollarSign,
  },
  timing: {
    heading: 'Weekly accountability pod',
    body: 'A 4-person pod meets weekly with a coach. The default answer to drift is accountability, not more content.',
    icon: Target,
  },
  knowledge: {
    heading: 'Full training library + a direct line',
    body: 'All the training on how Amazon actually works today, plus a dedicated line to a coach when the training stops being enough.',
    icon: AlertCircle,
  },
  support: {
    heading: 'Your pod + a strategist',
    body: 'Three sellers at your stage plus a strategist. The team you did not have before, now around every move you make.',
    icon: Users,
  },
};

export function GapFiller({ score }: ScoredProps) {
  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>How We Would Support You</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">
          Your 3 gaps, matched to 3 specific pieces of our support
        </h2>
        <p className="mt-2 text-slate-600">
          We built this program around what people miss on the way to launch. Here is how your current gaps map to what you would get.
        </p>

        <div className="mt-5 space-y-3">
          {score.gaps.map((g) => {
            const s = GAP_SUPPORT[g];
            const Icon = s.icon;
            return (
              <div key={g} className="rounded-xl bg-slate-50 border border-slate-200 p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 text-white shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{s.heading}</p>
                    <p className="mt-1 text-slate-700">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
