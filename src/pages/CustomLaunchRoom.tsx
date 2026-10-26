import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Download,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  scoreLaunchReadiness,
  computeLaunchDate,
  formatLaunchDate,
  blockKey,
  type LaunchRoomRecord,
  type LaunchRoomChecklist,
} from '../lib/launchroom';
import { SECTIONS, resolveBlock } from '../lib/launchroom.content';
import { trackEvent } from '../lib/posthog';

/* ───── /customlaunchroom/:id — the personalized Launch Room ─────
   Day-one feel: name header, projected launch date countdown,
   readiness score, personalized sections, 3-step checklist, locked
   steps, commitment, booking block, PDF export.

   V1 scope:
     - Reads from /.netlify/functions/launchroom-get
     - Checklist and commitment persist via launchroom-update
     - Launch date recomputed on every mount so the countdown
       visibly slips the longer the lead waits (brief explicitly
       calls this out)
     - PDF via client-side html2pdf.js injected on demand
     - Booking block is placeholder until the OnceHub inline embed
       lands; v2 will swap in the real calendar
──────────────────────────────────────────────────────────────── */

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

export function CustomLaunchRoom() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<LaunchRoomRecord | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [commitmentDraft, setCommitmentDraft] = useState('');
  const saveTimer = useRef<number | null>(null);

  // Initial load.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/.netlify/functions/launchroom-get?id=${encodeURIComponent(id)}`);
        if (r.status === 404) { if (!cancelled) setState('not_found'); return; }
        if (!r.ok) { if (!cancelled) setState('error'); return; }
        const { record: rec } = (await r.json()) as { record: LaunchRoomRecord };
        if (cancelled) return;
        setRecord(rec);
        setCommitmentDraft(rec.commitment ?? '');
        setState('ready');
        try { trackEvent('launchroom_viewed', { id: rec.id, tier: rec.tier }); } catch { /* noop */ }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Title.
  useEffect(() => {
    if (record?.contact?.firstName) {
      document.title = `${record.contact.firstName}'s Launch Room`;
    } else {
      document.title = 'Your Launch Room';
    }
  }, [record?.contact?.firstName]);

  // Launch date is recomputed on every render so the countdown
  // moves back the longer the lead waits (brief: "visibly moves
  // back the longer they wait").
  const launchDate = useMemo(
    () => (record ? computeLaunchDate(record.answers) : null),
    [record],
  );
  const score = useMemo(
    () => (record ? scoreLaunchReadiness(record.answers) : null),
    [record],
  );
  const daysToLaunch = useMemo(() => {
    if (!launchDate) return null;
    return Math.max(0, Math.ceil((launchDate.getTime() - Date.now()) / 86_400_000));
  }, [launchDate]);

  const checklistCompleted = record
    ? Object.values(record.checklist).filter(Boolean).length
    : 0;
  // 8 total planned steps (3 unlocked + 5 locked). Progress bar is
  // scoped to the whole plan so it visibly maxes at 37.5% without
  // the call — a deliberate open loop.
  const TOTAL_STEPS = 8;
  const progress = Math.round((checklistCompleted / TOTAL_STEPS) * 100);

  async function patch(body: { checklist?: LaunchRoomChecklist; commitment?: string }) {
    if (!id) return;
    try {
      const r = await fetch('/.netlify/functions/launchroom-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      });
      if (r.ok) {
        const { record: rec } = await r.json();
        setRecord(rec);
      }
    } catch { /* no-op */ }
  }

  function toggleStep(step: 'step1' | 'step2' | 'step3') {
    if (!record) return;
    const next = { ...record.checklist, [step]: !record.checklist[step] };
    setRecord({ ...record, checklist: next });
    void patch({ checklist: next });
    try { trackEvent('launchroom_step_toggled', { step, next: next[step] }); } catch { /* noop */ }
  }

  function onCommitmentChange(v: string) {
    setCommitmentDraft(v);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void patch({ commitment: v }); }, 800);
  }

  function exportPdf() {
    try { trackEvent('launchroom_pdf_download'); } catch { /* noop */ }
    // v1 uses the browser's own print-to-PDF. Step 5 of the build
    // plan upgrades this to html2pdf.js once the dep is added.
    window.print();
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900">We couldn't find that Launch Room.</h1>
          <p className="mt-3 text-slate-600">
            The link may have been mistyped, or your room is still being built. Check the latest email we sent you.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'error' || !record || !score || !launchDate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900">Something went wrong loading your Launch Room.</h1>
          <p className="mt-3 text-slate-600">Try refreshing. If it keeps failing, reply to the email we sent you and we'll fix it fast.</p>
        </div>
      </div>
    );
  }

  const firstName = record.contact?.firstName || 'Your';
  const booked = record.bookingStatus === 'booked';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-wider text-orange-600">Launch Room</span>
          <button
            onClick={exportPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-bold hover:bg-slate-800"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </header>

      <main id="launchroom-print-area" className="max-w-5xl mx-auto px-5 pt-10 pb-20">
        {/* Hero: name + projected launch date countdown */}
        <section>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
            {firstName}'s Launch Room
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl">
            Day one of your Amazon launch. The first half of your plan is below. The second half you build live with a strategist on your call.
          </p>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
              Your Projected Launch Date
            </p>
            <p className="mt-3 text-2xl md:text-4xl font-black">
              {formatLaunchDate(launchDate)}
            </p>
            <p className="mt-2 text-slate-300">
              If you start this week — {daysToLaunch} days away. Every week you wait pushes this back.
            </p>
          </div>
        </section>

        {/* Readiness Score */}
        <section className="mt-10">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <h2 className="text-xl md:text-2xl font-black">Launch Readiness Score</h2>
              <p className="text-3xl md:text-5xl font-black text-orange-600">
                {score.total}
                <span className="text-slate-400 text-xl md:text-2xl font-bold">/100</span>
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['product', 'capital', 'timing', 'knowledge', 'support'] as const).map((k) => {
                const v = score[k];
                return (
                  <div key={k} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{SCORE_LABELS[k]}</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{v}<span className="text-slate-400 text-sm font-bold">/20</span></p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(v / 20) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4 md:p-5">
              <p className="text-sm font-black uppercase tracking-wider text-orange-700 mb-2">Your 3 gaps — your strategist covers these on your call</p>
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

        {/* Personalized sections — one block per section, placeholder */}
        <section className="mt-10 space-y-5">
          {SECTIONS.map((s) => {
            const answer = record.answers[s.id as keyof typeof record.answers] as string | undefined;
            const block = resolveBlock(blockKey(s.id, answer));
            return (
              <article key={s.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-7">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-600">{s.label}</p>
                <h3 className="mt-1 text-lg md:text-xl font-black text-slate-900">{block.heading}</h3>
                <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-line">{block.body}</p>
                {/* Video slot — fills in when Travis records */}
                {block.videoUrl ? (
                  <div className="mt-4 aspect-video rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                    <iframe src={block.videoUrl} className="w-full h-full" allow="autoplay; fullscreen" />
                  </div>
                ) : (
                  <div className="mt-4 aspect-video rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                    Travis video placeholder
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* First 3 moves */}
        <section className="mt-10">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-baseline justify-between flex-wrap gap-3">
              <h2 className="text-xl md:text-2xl font-black">Your First 3 Moves</h2>
              <p className="text-sm font-bold text-slate-500">You're {progress}% of the way to launch</p>
            </div>

            <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>

            <ul className="mt-6 space-y-3">
              {([
                { k: 'step1' as const, label: 'Run the Product Validator on 3 ideas', detail: 'The exact same tool paid clients use in their first week.' },
                { k: 'step2' as const, label: "Write a one-paragraph pitch of your product for someone who has never heard of it", detail: 'If you can\'t explain it simply, the listing won\'t sell it.' },
                { k: 'step3' as const, label: "Open your Amazon seller account (or confirm the one you have is in good standing)", detail: 'The one admin task you cannot skip. Nothing else works without it.' },
              ]).map((s) => {
                const done = Boolean(record.checklist[s.k]);
                return (
                  <li key={s.k}>
                    <button
                      onClick={() => toggleStep(s.k)}
                      className={
                        'w-full text-left flex items-start gap-3 rounded-xl border p-4 transition ' +
                        (done ? 'bg-orange-50 border-orange-300' : 'bg-slate-50 border-slate-200 hover:border-orange-300')
                      }
                    >
                      {done
                        ? <CheckCircle2 className="w-5 h-5 text-orange-600 mt-[2px] shrink-0" />
                        : <Circle className="w-5 h-5 text-slate-400 mt-[2px] shrink-0" />
                      }
                      <div>
                        <p className={'font-black ' + (done ? 'line-through text-slate-500' : 'text-slate-900')}>{s.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{s.detail}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Locked steps 4–8 */}
        <section className="mt-10">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black">Steps 4 to 8 — Built live on your call</h2>
            <p className="mt-2 text-slate-600">
              Your manufacturer shortlist, your launch budget, your 9-month roadmap. Your strategist walks these with you so the plan fits your actual situation, not a template.
            </p>

            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                '4 — Your supplier shortlist (3 real options)',
                '5 — Your launch budget by month',
                '6 — Your pre-launch keyword map',
                '7 — Your 9-month roadmap',
                '8 — Your first paid campaign',
              ].map((label) => (
                <li
                  key={label}
                  className="relative rounded-xl bg-slate-50 border border-slate-200 p-4 overflow-hidden"
                >
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/50" aria-hidden />
                  <div className="relative flex items-center gap-2 text-slate-700">
                    <Lock className="w-4 h-4" />
                    <span className="font-black">{label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Commitment */}
        <section className="mt-10">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-black">Before your call</h2>
            <p className="mt-2 text-slate-700">What would launching this year change for you?</p>
            <textarea
              value={commitmentDraft}
              onChange={(e) => onCommitmentChange(e.target.value)}
              rows={5}
              placeholder="One honest sentence is more valuable than a polished paragraph."
              className="mt-4 w-full rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none p-3 text-slate-900 placeholder:text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-500">Saves automatically. Your strategist reads this before your call.</p>
          </div>
        </section>

        {/* Booking block — v1 placeholder, v2 gets the OnceHub inline embed */}
        <section className="mt-10">
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-6 md:p-8">
            {booked ? (
              <>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Your strategy call is booked</h2>
                <p className="mt-2 text-slate-700">3 things to have ready: your Amazon seller login, a rough budget number, and one honest answer to the question above.</p>
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Book your strategy call</h2>
                <p className="mt-2 text-slate-700">Steps 4 to 8 unlock when you show up. 45 minutes with a strategist who has run this exact plan with 100+ sellers.</p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-200 border border-slate-300 px-4 py-3 text-sm text-slate-500 italic">
                  OnceHub inline calendar embeds here once Connor sends the snippet.
                </p>
              </>
            )}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-slate-400">
          Launch Room ID: {record.id} · Last updated {new Date(record.updatedAt).toLocaleString()}
        </p>
      </main>
    </div>
  );
}
