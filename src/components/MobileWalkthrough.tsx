import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { trackEvent } from '../lib/posthog';

export interface WalkthroughStep {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface MobileWalkthroughProps {
  steps: WalkthroughStep[];
  location: 'setter' | 'closer';
}

const SWIPE_THRESHOLD = 60;

export function MobileWalkthrough({ steps, location }: MobileWalkthroughProps) {
  const [current, setCurrent] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const reachedMaxRef = useRef(0);

  const total = steps.length;
  const isFirst = current === 0;
  const isLast = current === total - 1;
  const currentStep = steps[current];
  const nextStep = steps[current + 1];

  const goTo = (next: number, source: 'tap' | 'next' | 'back' | 'swipe' | 'dot') => {
    if (next < 0 || next >= total) return;
    if (next === current) return;
    trackEvent('walkthrough_step_changed', {
      location,
      from_index: current,
      from_key: steps[current]?.key,
      to_index: next,
      to_key: steps[next]?.key,
      total,
      source,
    });
    if (next > reachedMaxRef.current) {
      reachedMaxRef.current = next;
      if (next === total - 1) {
        trackEvent('walkthrough_completed', { location, total });
      }
    }
    setCurrent(next);
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0 });
    });
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
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-gray-600 disabled:opacity-25 disabled:pointer-events-none active:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 px-1 overflow-hidden">
          {steps.map((s, i) => {
            const state = i === current ? 'current' : i < current ? 'done' : 'pending';
            const width =
              state === 'current'
                ? 'w-7'
                : 'w-1.5';
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
                className={`h-1.5 rounded-full transition-all duration-200 ${width} ${color}`}
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
            className="px-4 py-3 text-gray-600 font-semibold text-sm rounded-xl active:bg-gray-100"
          >
            Back
          </button>
        )}
        {isLast ? (
          <div className="flex-1 px-5 py-3.5 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" strokeWidth={3} />
            You're all set
          </div>
        ) : (
          <button
            onClick={() => goTo(current + 1, 'next')}
            className="flex-1 px-5 py-3.5 bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 text-sm"
          >
            <span className="truncate">
              {nextStep?.label ? `Next: ${nextStep.label}` : 'Next'}
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2.4} />
          </button>
        )}
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
