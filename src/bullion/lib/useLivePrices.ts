import { useEffect, useRef, useState } from 'react';
import { fetchSpotSnapshot, seedTrail, type SpotSnapshot } from '../services/prices';

export type LivePricesState = {
  snapshot: SpotSnapshot | null;
  goldTrail: number[];
  silverTrail: number[];
  status: 'loading' | 'live' | 'stale' | 'error';
  lastFetch: number | null;
  error: string | null;
};

const MAX_TRAIL = 90;

export function useLivePrices(intervalMs = 20_000): LivePricesState {
  const [state, setState] = useState<LivePricesState>({
    snapshot: null,
    goldTrail: [],
    silverTrail: [],
    status: 'loading',
    lastFetch: null,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timer: number | undefined;

    async function tick() {
      try {
        const snap = await fetchSpotSnapshot();
        if (!mounted.current) return;
        setState((prev) => {
          const goldTrail =
            prev.goldTrail.length === 0
              ? seedTrail(snap.gold.price)
              : [...prev.goldTrail, snap.gold.price].slice(-MAX_TRAIL);
          const silverTrail =
            prev.silverTrail.length === 0
              ? seedTrail(snap.silver.price)
              : [...prev.silverTrail, snap.silver.price].slice(-MAX_TRAIL);
          return {
            snapshot: snap,
            goldTrail,
            silverTrail,
            status: 'live',
            lastFetch: Date.now(),
            error: null,
          };
        });
      } catch (err) {
        if (!mounted.current) return;
        setState((prev) => ({
          ...prev,
          status: prev.snapshot ? 'stale' : 'error',
          error: err instanceof Error ? err.message : 'fetch failed',
        }));
      }
    }

    tick();
    timer = window.setInterval(tick, intervalMs);

    return () => {
      mounted.current = false;
      if (timer) window.clearInterval(timer);
    };
  }, [intervalMs]);

  return state;
}
