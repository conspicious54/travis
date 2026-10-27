import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Youtube,
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

const SCORE_LABELS: Record<string, string> = {
  product:   'Product',
  capital:   'Capital',
  timing:    'Timing',
  knowledge: 'Knowledge',
  support:   'Support',
};

const GAP_HINTS: Record<string, string> = {
  product:   'Lock in a product idea that will actually sell.',
  capital:   'Right-size your launch budget to what you can deploy.',
  timing:    'Nail down a start date so this stops drifting.',
  knowledge: 'Fill in the gaps on how Amazon actually works today.',
  support:   'Line up the people and tools you need around the launch.',
};

/** Returns a Tailwind-safe hex colour for a 0-100 total score. */
function colorForTotal(total: number): string {
  if (total >= 80) return '#10b981'; // emerald
  if (total >= 60) return '#f97316'; // orange
  if (total >= 40) return '#f59e0b'; // amber
  return '#ef4444';                  // red
}

/** Hex colour for a 0-20 dimension score. */
function colorForDimension(v: number): string {
  if (v >= 15) return '#10b981';
  if (v >= 10) return '#f97316';
  if (v >= 5)  return '#f59e0b';
  return '#ef4444';
}

/* ─── Readiness Score — hero semi-arc + dimension dials ──── */

export function ReadinessScore({ score }: ScoredProps) {
  // Animate from empty to actual on mount so the dials "fill
  // in" and the number counts up. CSS transition handles the
  // visual; a one-shot state flip triggers it.
  const [filled, setFilled] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 60);
    // Count-up for the big number. 1200ms matches the dial fill.
    const start = performance.now();
    const target = score.total;
    const duration = 1200;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplayTotal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [score.total]);

  // Hero semi-arc: radius 100, 180deg arc. Arc length = pi * r.
  const HERO_R = 100;
  const HERO_LEN = Math.PI * HERO_R;
  const heroOffset = filled ? HERO_LEN * (1 - score.total / 100) : HERO_LEN;
  const heroColor = colorForTotal(score.total);

  // Dimension dials: radius 36, full circle. Circumference 2*pi*r.
  const DIAL_R = 36;
  const DIAL_LEN = 2 * Math.PI * DIAL_R;

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <p className={EYEBROW}>Launch Readiness</p>
        <h2 className="mt-1 text-xl md:text-2xl font-black">Your score across the five dimensions</h2>

        {/* Hero semi-arc with centered number */}
        <div className="mt-5 flex justify-center">
          <div className="relative w-full max-w-[320px]">
            <svg viewBox="0 0 240 140" className="w-full h-auto">
              {/* Background arc */}
              <path
                d={`M 20 120 A ${HERO_R} ${HERO_R} 0 0 1 220 120`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Foreground arc, animated */}
              <path
                d={`M 20 120 A ${HERO_R} ${HERO_R} 0 0 1 220 120`}
                fill="none"
                stroke={heroColor}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${HERO_LEN} ${HERO_LEN}`}
                strokeDashoffset={heroOffset}
                style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms' }}
              />
            </svg>
            {/* Score number overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
              <p className="text-5xl md:text-6xl font-black tracking-tight" style={{ color: heroColor }}>
                {displayTotal}
                <span className="text-slate-400 text-xl md:text-2xl font-bold">/100</span>
              </p>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                Launch Readiness
              </p>
            </div>
          </div>
        </div>

        {/* 5 dimension dials */}
        <div className="mt-8 grid grid-cols-5 gap-2 md:gap-4">
          {(['product', 'capital', 'timing', 'knowledge', 'support'] as const).map((k) => {
            const v = score[k];
            const color = colorForDimension(v);
            const offset = filled ? DIAL_LEN * (1 - v / 20) : DIAL_LEN;
            const isGap = score.gaps.includes(k);
            return (
              <div
                key={k}
                className={
                  'flex flex-col items-center rounded-xl p-2 md:p-3 transition ' +
                  (isGap
                    ? 'bg-orange-50 ring-1 ring-orange-200'
                    : 'bg-slate-50 ring-1 ring-slate-100')
                }
              >
                <div className="relative w-full max-w-[90px]">
                  <svg viewBox="0 0 90 90" className="w-full h-auto -rotate-90">
                    <circle cx="45" cy="45" r={DIAL_R} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="45"
                      cy="45"
                      r={DIAL_R}
                      fill="none"
                      stroke={color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${DIAL_LEN} ${DIAL_LEN}`}
                      strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-base md:text-xl font-black" style={{ color }}>
                      {v}
                      <span className="text-slate-400 text-[10px] md:text-xs font-bold">/20</span>
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-600 text-center">
                  {SCORE_LABELS[k]}
                </p>
                {isGap && (
                  <p className="mt-1 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-orange-600">
                    Gap
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Gap callout */}
        <div className="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4 md:p-5">
          <p className="text-sm font-black uppercase tracking-wider text-orange-700 mb-2">
            Your 3 gaps, your strategist covers these on your call
          </p>
          <ul className="space-y-2">
            {score.gaps.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-slate-800">
                <ArrowRight className="w-4 h-4 text-orange-600 mt-[2px] shrink-0" />
                <span><span className="font-black">{SCORE_LABELS[g]}:</span> {GAP_HINTS[g]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─── Product Idea block (TOP, AI-driven multi-turn chat) ──── */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ProductIdeaBlock({ record }: Props) {
  const q9 = record.answers.q9;

  const openerByQ9: string = useMemo(() => {
    if (q9 === 'validated')
      return `You said you have an idea. Tell me what it is in one sentence (the product and who it is for) and I will help you sharpen it before your strategy call.`;
    if (q9 === 'niche')
      return `You know your niche. Tell me what it is and I will help you narrow it to one product worth sampling this month.`;
    if (q9 === 'unsure')
      return `Fair. Tell me what you spend your time on and I will tell you honestly whether an Amazon product fits, and if so what shape it would take.`;
    // no_idea or missing q9
    return `Type anything you already know, do, or spend time on. We will work together to find a product shape worth testing. Even one word is enough to start.`;
  }, [q9]);

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setErrorMsg(null);
    const next: ChatMessage[] = [...history, { role: 'user', content: text }];
    setHistory(next);
    setInput('');
    setSending(true);
    try {
      const r = await fetch('/.netlify/functions/launchroom-brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: {
            firstName: record.contact?.firstName,
            q13: record.answers.q13,
            q10: record.answers.q10,
          },
        }),
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => '');
        console.error('[brainstorm]', r.status, detail);
        setErrorMsg('The brainstormer is taking a breath. Try sending that again in a sec.');
        setHistory(history); // roll back the user turn so they can retry
        setInput(text);
        return;
      }
      const { reply, handoff: nextHandoff } = (await r.json()) as { reply: string; handoff: boolean };
      setHistory([...next, { role: 'assistant', content: reply }]);
      if (nextHandoff) setHandoff(true);
    } catch (err) {
      console.error('[brainstorm]', err);
      setErrorMsg('Could not reach the brainstormer. Try again.');
      setHistory(history);
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setHistory([]);
    setInput('');
    setHandoff(false);
    setErrorMsg(null);
  }

  return (
    <section className="mt-10">
      <div className={CARD_BASE}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className={EYEBROW}>Your Product Idea</p>
            <h2 className="mt-1 text-xl md:text-2xl font-black">
              Workshop a product idea with the coach
            </h2>
          </div>
          {history.length > 0 && (
            <button
              onClick={reset}
              className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
            >
              Start over
            </button>
          )}
        </div>

        {/* Opening prompt before any conversation. */}
        {history.length === 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <p className="text-slate-800 leading-relaxed">{openerByQ9}</p>
            </div>
          </div>
        )}

        {/* Conversation */}
        {history.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Keep the opener visible as the first assistant bubble */}
            <ChatBubble role="assistant" content={openerByQ9} />
            {history.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {sending && (
              <ChatBubble role="assistant" content="Thinking..." muted />
            )}
          </div>
        )}

        {/* Composer */}
        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder={
              history.length === 0
                ? 'e.g. home fitness, baking, dog training, gardening'
                : 'Keep going. Tell me more, or ask a question.'
            }
            className="flex-1 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none p-3 text-slate-900 disabled:bg-slate-50"
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black px-5 py-3 transition inline-flex items-center justify-center gap-2"
          >
            {sending ? 'Working...' : history.length === 0 ? 'Start' : 'Send'}
          </button>
        </div>

        {errorMsg && (
          <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
        )}

        {/* Handoff — appears after enough back-and-forth */}
        {handoff && (
          <div className="mt-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-5 md:p-6">
            <p className={EYEBROW}>Where We Take This Next</p>
            <h3 className="mt-1 text-lg md:text-xl font-black text-slate-900">
              Nice. You have a shape worth walking into your call with.
            </h3>
            <p className="mt-2 text-slate-700">
              Here is what the first three weeks look like once you are inside the program.
            </p>
            <ol className="mt-4 space-y-2">
              {[
                'Your strategist pressure-tests this idea against the 5-point score, live, on the call.',
                'Week one: three real supplier quotes in your inbox, no outreach to write yourself.',
                'Week two: your listing and ad plan drafted with you, not for you.',
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-800">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-slate-600 italic">
              Scroll down to book your strategy call when you are ready.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  muted?: boolean;
}

function ChatBubble({ role, content, muted }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={'flex gap-3 ' + (isUser ? 'justify-end' : '')}>
      {!isUser && (
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
      )}
      <div
        className={
          'max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ' +
          (isUser
            ? 'bg-slate-900 text-white'
            : muted
            ? 'bg-slate-50 border border-slate-200 text-slate-500 italic'
            : 'bg-slate-50 border border-slate-200 text-slate-800')
        }
      >
        {content}
      </div>
    </div>
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

/* ─── Locked Steps 4-8 — full preview cards, gated ─────────── */

/** Each locked step renders as a near-full-sized section preview
 *  with real-looking content (supplier cards, budget rows, keyword
 *  table, timeline, campaign table) blurred under a lock overlay.
 *  The point is to show the lead what they are missing, not a
 *  one-line label. */
export function LockedSteps({ record }: Props) {
  const first = record.contact?.firstName || 'you';

  return (
    <section className="mt-10">
      <div className="relative">
        <div className="mb-4">
          <p className={EYEBROW}>Steps 4 to 8</p>
          <h2 className="mt-1 text-xl md:text-2xl font-black">
            Built live with your strategist on your call
          </h2>
          <p className="mt-2 text-slate-600">
            These are the sections {first} would walk through next. They are personalized to your product, your budget, and your timeline, so they only make sense once a strategist has you in the chair.
          </p>
        </div>

        <div className="space-y-5">
          {/* 4. Supplier shortlist */}
          <LockedCard number={4} title="Your supplier shortlist" subtitle="Three real factories that will quote your product this week.">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { name: 'Ningbo Precision Co.', region: 'Zhejiang, CN', moq: 'MOQ 300', lead: '35 day lead time', score: 92 },
                { name: 'Dongguan Craft Mfg.',  region: 'Guangdong, CN', moq: 'MOQ 500', lead: '28 day lead time', score: 88 },
                { name: 'Vinh Phuc Industries', region: 'Hanoi, VN',    moq: 'MOQ 250', lead: '42 day lead time', score: 85 },
              ].map((s) => (
                <div key={s.name} className="rounded-xl bg-white border border-slate-200 p-4">
                  <p className="font-black text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.region}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{s.moq}</span>
                    <span className="font-black text-orange-600">Fit {s.score}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{s.lead}</p>
                </div>
              ))}
            </div>
          </LockedCard>

          {/* 5. Launch budget */}
          <LockedCard number={5} title="Your launch budget" subtitle="Month-by-month cash plan, right-sized to your capital answer.">
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-black">Month</th>
                    <th className="text-left px-4 py-2 font-black">Line item</th>
                    <th className="text-right px-4 py-2 font-black">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1', 'Samples + supplier deposits',    '$620'],
                    ['2', 'Production + QC inspection',     '$1,840'],
                    ['3', 'Freight + FBA inbound',          '$520'],
                    ['4', 'Launch ads week 1-4',            '$900'],
                    ['5', 'Reorder + ad scale',             '$2,400'],
                  ].map(([m, item, spend]) => (
                    <tr key={m} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-black text-slate-900">{m}</td>
                      <td className="px-4 py-2 text-slate-700">{item}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-900">{spend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LockedCard>

          {/* 6. Keyword map */}
          <LockedCard number={6} title="Your pre-launch keyword map" subtitle="The 10 search terms your listing has to win on day one.">
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { kw: 'collapsible dog bowl travel', vol: '18.2K', comp: 'Low' },
                { kw: 'dog bowl for suv',            vol: '9.8K',  comp: 'Low' },
                { kw: 'portable water bowl hiking',  vol: '14.1K', comp: 'Medium' },
                { kw: 'leak proof travel bowl',      vol: '6.4K',  comp: 'Low' },
                { kw: 'silicone dog bowl camping',   vol: '11.0K', comp: 'Medium' },
                { kw: 'collapsible water dish',      vol: '7.9K',  comp: 'Low' },
              ].map((k) => (
                <div key={k.kw} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-800">{k.kw}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{k.vol}/mo</span>
                    <span className={'font-black ' + (k.comp === 'Low' ? 'text-emerald-600' : 'text-amber-600')}>{k.comp}</span>
                  </div>
                </div>
              ))}
            </div>
          </LockedCard>

          {/* 7. 9-month roadmap */}
          <LockedCard number={7} title="Your 9-month roadmap" subtitle="Quarter-by-quarter moves from launch to your first scale decision.">
            <div className="space-y-2">
              {[
                { q: 'Q1', focus: 'Launch SKU 1, break into category top 100',  cash: 'Cash flow positive by month 4' },
                { q: 'Q2', focus: 'Push SKU 1 to top 20, open sampling SKU 2', cash: 'Reinvest 70% of profit into inventory' },
                { q: 'Q3', focus: 'Launch SKU 2, start brand-registry work',   cash: 'First owner distribution' },
              ].map((r) => (
                <div key={r.q} className="rounded-xl bg-white border border-slate-200 p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-600">{r.q}</span>
                    <p className="font-black text-slate-900">{r.focus}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{r.cash}</p>
                </div>
              ))}
            </div>
          </LockedCard>

          {/* 8. First paid campaign */}
          <LockedCard number={8} title="Your first paid campaign" subtitle="The exact ad groups, keywords and bid strategy for launch week.">
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-black">Ad group</th>
                    <th className="text-left px-4 py-2 font-black">Match</th>
                    <th className="text-right px-4 py-2 font-black">Daily cap</th>
                    <th className="text-right px-4 py-2 font-black">Target ACoS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Exact brand defense',  'Exact',   '$8',  '12%'],
                    ['Phrase high-intent',    'Phrase',  '$18', '28%'],
                    ['Broad research',        'Broad',   '$12', '45%'],
                    ['Auto discovery',        'Auto',    '$10', '35%'],
                  ].map(([g, m, cap, acos]) => (
                    <tr key={g} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-black text-slate-900">{g}</td>
                      <td className="px-4 py-2 text-slate-700">{m}</td>
                      <td className="px-4 py-2 text-right text-slate-900">{cap}</td>
                      <td className="px-4 py-2 text-right text-slate-900">{acos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LockedCard>
        </div>
      </div>
    </section>
  );
}

interface LockedCardProps {
  number: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function LockedCard({ number, title, subtitle, children }: LockedCardProps) {
  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header stays sharp so the module reads as a real section */}
      <div className="relative z-20 p-6 md:p-7 border-b border-slate-100 bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className={EYEBROW}>Step {number}</p>
            <h3 className="mt-1 text-lg md:text-xl font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Locked
          </span>
        </div>
      </div>

      {/* Preview body, blurred and dimmed */}
      <div className="relative p-6 md:p-7 bg-slate-50/70">
        <div
          className="pointer-events-none select-none"
          style={{ filter: 'blur(5px)', opacity: 0.9 }}
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Centered unlock overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <div className="rounded-xl bg-white border border-slate-200 shadow-md px-5 py-4 text-center max-w-sm">
            <p className="text-sm font-black text-slate-900">
              Unlocks on your strategy call
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Your strategist fills this in live with you, so it fits your actual product and situation.
            </p>
          </div>
        </div>
      </div>
    </div>
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
