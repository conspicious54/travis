import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

/* ───── prep checklist context ────────────────────────────────────
   Shared state across the confirmation page sections so:
   - Banner buttons (Text, WhatsApp) can mark step 1 done
   - NextStepsList shows step 1 as checked
   - A 4-minute timer checks off step 2 automatically
   - Principle checkboxes feed into step 3 progress
   - Exit popup can check what's still undone before firing
──────────────────────────────────────────────────────────────────── */

type StepId = 'microAsk' | 'video' | 'principles';

interface PrepChecklistValue {
  completed: Record<StepId, boolean>;
  markDone: (step: StepId) => void;
  principlesChecked: Set<string>;
  togglePrinciple: (id: string) => void;
  principlesTotal: number;
  setPrinciplesTotal: (n: number) => void;
  isAllComplete: () => boolean;
}

const PrepChecklistContext = createContext<PrepChecklistValue | null>(null);

// 4 minutes in milliseconds
const VIDEO_TIMER_MS = 4 * 60 * 1000;

export function PrepChecklistProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<Record<StepId, boolean>>({
    microAsk: false,
    video: false,
    principles: false,
  });
  const [principlesChecked, setPrinciplesChecked] = useState<Set<string>>(new Set());
  const [principlesTotal, setPrinciplesTotal] = useState(4);
  const videoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-complete video step after 4 minutes on page
  useEffect(() => {
    videoTimerRef.current = setTimeout(() => {
      setCompleted(prev => ({ ...prev, video: true }));
    }, VIDEO_TIMER_MS);
    return () => {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    };
  }, []);

  // Principles step is auto-complete when all principles are checked
  useEffect(() => {
    if (principlesChecked.size >= principlesTotal && principlesTotal > 0) {
      setCompleted(prev => ({ ...prev, principles: true }));
    } else {
      setCompleted(prev => ({ ...prev, principles: false }));
    }
  }, [principlesChecked, principlesTotal]);

  const markDone = (step: StepId) => {
    setCompleted(prev => ({ ...prev, [step]: true }));
  };

  const togglePrinciple = (id: string) => {
    setPrinciplesChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllComplete = () => completed.microAsk && completed.video && completed.principles;

  return (
    <PrepChecklistContext.Provider
      value={{
        completed,
        markDone,
        principlesChecked,
        togglePrinciple,
        principlesTotal,
        setPrinciplesTotal,
        isAllComplete,
      }}
    >
      {children}
    </PrepChecklistContext.Provider>
  );
}

export function usePrepChecklist(): PrepChecklistValue {
  const ctx = useContext(PrepChecklistContext);
  if (!ctx) {
    // Safe fallback if provider is missing — returns no-op stubs
    return {
      completed: { microAsk: false, video: false, principles: false },
      markDone: () => {},
      principlesChecked: new Set(),
      togglePrinciple: () => {},
      principlesTotal: 4,
      setPrinciplesTotal: () => {},
      isAllComplete: () => false,
    };
  }
  return ctx;
}
