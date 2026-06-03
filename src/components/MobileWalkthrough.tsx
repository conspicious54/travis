import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { trackEvent } from '../lib/posthog';
import { celebrateComplete, celebrateStepAdvance } from '../lib/celebrate';

export interface WalkthroughStepGate {
  canAdvance: () => boolean;
  title: string;
  body: string;
  stayLabel: string;
  advanceLabel: string;
}

export interface WalkthroughStep {
  key: string;
  label: string;
  content: React.ReactNode;
  gate?: WalkthroughStepGate;
}

interface MobileWalkthroughProps {
  steps: WalkthroughStep[];
  location: 'setter' | 'closer';
}

interface PendingAdvance {
  fromIndex: number;
  toIndex: number;
  source: AdvanceSource;
}

type AdvanceSource = 'tap' | 'next' | 'back' | 'swipe' | 'dot';

const SWIPE_THRESHOLD = 60;

export function MobileWalkthrough({ steps, location }: MobileWalkthroughProps) {
  const [current, setCurrent] = useState(0);
  const [pending, setPending] = useState<PendingAdvance | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const reachedMaxRef = useRef(0);
  const completedFiredRef = useRef(false);

  const total = steps.length;
  const isFirst = current === 0;
  const isLast = current === total - 1;
  const currentStep = steps[current];
  const nextStep = steps[current + 1];

  const performNavigation = (next: number, source: AdvanceSource) => {
    trackEvent('walkthrough_step_changed', {
      location,
      from_index: current,
      from_key: steps[current]?.key,
      to_index: next,
      to_key: steps[next]?.key,
      total,
      source,
    });
    const isNewMax = next > reachedMaxRef.current;
    if (isNewMax) {
      reachedMaxRef.current = next;
      // Subtle celebration the first time a step is reached. Skipped
      // for the final step - that gets a bigger celebration below.
      if (next < total - 1 && next > 0) {
        celebrateStepAdvance();
      }
      if (next === total - 1 && !completedFiredRef.current) {
        completedFiredRef.current = true;
        celebrateComplete();
        trackEvent('walkthrough_completed', { location, total });
      }
    }
    setCurrent(next);
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0 });
    });
  };

  const goTo = (next: number, source: AdvanceSource) => {
    if (next < 0 || next >= total) return;
    if (next === current) return;

    // Forward-only gating: backward and dot-jumps backward don't trigger.
    const advancing = next > current;
    const gate = steps[current]?.gate;
    if (advancing && gate && !gate.canAdvance()) {
      trackEvent('walkthrough_gate_shown', {
        location,
        step_index: current,
        step_key: steps[current]?.key,
      });
      setPending({ fromIndex: current, toIndex: next, source });
      return;
    }

    performNavigation(next, source);
  };

  const onGateStay = () => {
    if (!pending) return;
    trackEvent('walkthrough_gate_resolved', {
      location,
      step_index: pending.fromIndex,
      step_key: steps[pending.fromIndex]?.key,
      choice: 'stay',
    });
    setPending(null);
  };

  const onGateAdvance = () => {
    if (!pending) return;
    trackEvent('walkthrough_gate_resolved', {
      location,
      step_index: pending.fromIndex,
      step_key: steps[pending.fromIndex]?.key,
      choice: 'advance',
    });
    const target = pending.toIndex;
    const source = pending.source;
    setPending(null);
    performNavigation(target, source);
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goTo(current + 1, 'swipe');
    else goTo(current - 1, 'swipe');
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('walkthrough_started', {
      location,
      total,
      first_step: steps[0]?.key,
    });
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const idx = steps.findIndex((s) => s.key === hash);
      if (idx > 0) {
        setCurrent(idx);
        reachedMaxRef.current = idx;
      }
    }
  }, [location, total, steps]);

  useEffect(() => {
    trackEvent('walkthrough_step_viewed', {
      location,
      step_index: current,
      step_key: currentStep?.key,
      step_label: currentStep?.label,
      total,
    });
  }, [current, location, currentStep?.key, currentStep?.label, total]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 bg-white px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => goTo(current - 1, 'back')}
          disabled={isFirst}
          aria-label="Previous step"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-600 disabled:opacity-25 disabled:pointer-events-none active:bg-gray-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 px-1 overflow-hidden">
          {steps.map((s, i) => {
            const state = i === current ? 'current' : i < current ? 'done' : 'pending';
            const width = state === 'current' ? 'w-7' : 'w-1.5';
            const color =
              state === 'current'
                ? 'bg-orange-500'
                : state === 'done'
                ? 'bg-orange-300'
                : 'bg-gray-200';
            return (
              <button
                key={s.key}
                onClick={() => goTo(i, 'dot')}
                aria-label={`Step ${i + 1}: ${s.label}`}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out ${width} ${color}`}
              />
            );
          })}
        </div>
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400 tabular-nums w-10 text-right">
          {current + 1}/{total}
        </span>
      </div>

      <div
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div key={currentStep?.key} className="animate-walkthrough-fade-in">
          {currentStep?.content}
          <div className="h-6" />
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-3 flex items-center gap-2 pb-[max(env(safe-area-inset-bottom),12px)]">
        {!isFirst && (
          <button
            onClick={() => goTo(current - 1, 'back')}
            className="px-4 py-3 text-gray-600 font-semibold text-sm rounded-xl active:bg-gray-100 active:scale-95 transition-transform"
          >
            Back
          </button>
        )}
        {isLast ? (
          <div className="flex-1 px-5 py-3.5 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-sm flex items-center justify-center gap-2 animate-confirm-check-in">
            <Check className="w-4 h-4" strokeWidth={3} />
            You're all set
          </div>
        ) : (
          <button
            onClick={() => goTo(current + 1, 'next')}
            className="flex-1 px-5 py-3.5 bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] transition-transform"
          >
            <span className="truncate">
              {nextStep?.label ? `Next: ${nextStep.label}` : 'Next'}
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {pending && currentStep?.gate && (
        <GateModal
          gate={currentStep.gate}
          onStay={onGateStay}
          onAdvance={onGateAdvance}
        />
      )}
    </div>
  );
}

function GateModal({
  gate,
  onStay,
  onAdvance,
}: {
  gate: WalkthroughStepGate;
  onStay: () => void;
  onAdvance: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-6 animate-walkthrough-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" strokeWidth={2.4} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">
            {gate.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {gate.body}
          </p>
        </div>
        <div className="px-5 pb-5 pt-2 space-y-2">
          <button
            onClick={onStay}
            className="w-full px-5 py-3.5 bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            {gate.stayLabel}
          </button>
          <button
            onClick={onAdvance}
            className="w-full px-5 py-3 text-gray-500 font-semibold text-sm rounded-xl active:bg-gray-100"
          >
            {gate.advanceLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useIsMobileViewport(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [breakpointPx]);
  return isMobile;
}
