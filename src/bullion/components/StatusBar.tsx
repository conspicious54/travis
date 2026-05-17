import { useEffect, useState } from 'react';
import { clockHMS, marketState, relativeTime } from '../lib/format';

type Props = {
  status: 'loading' | 'live' | 'stale' | 'error';
  lastFetch: number | null;
};

export function StatusBar({ status, lastFetch }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ms = marketState(new Date(now));
  const dot =
    status === 'live'
      ? 'bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.65)]'
      : status === 'stale'
      ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]'
      : status === 'error'
      ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.55)]'
      : 'bg-stone-500';

  const label =
    status === 'live'
      ? 'Live feed'
      : status === 'stale'
      ? 'Stale · retrying'
      : status === 'error'
      ? 'Feed offline'
      : 'Connecting';

  const marketDot =
    ms.status === 'open'
      ? 'bg-emerald-400'
      : ms.status === 'break'
      ? 'bg-amber-400'
      : 'bg-stone-500';

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.65rem] tracking-[0.3em] uppercase text-stone-400 border-b border-stone-900 px-4 lg:px-8 py-2 bg-black/50 backdrop-blur"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
        {lastFetch && status !== 'loading' && (
          <span className="text-stone-600 normal-case tracking-normal">
            · last tick {relativeTime(lastFetch, now)}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${marketDot}`} />
        {ms.label}
      </span>
      <span className="ml-auto text-stone-500">{clockHMS(now)}</span>
    </div>
  );
}
