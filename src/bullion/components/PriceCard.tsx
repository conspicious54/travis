import { useAnimatedNumber } from '../lib/useAnimatedNumber';
import { formatPct, formatSigned, formatUsd } from '../lib/format';
import type { SpotPrice } from '../services/prices';
import { Sparkline } from './Sparkline';

type Props = {
  quote: SpotPrice;
  trail: number[];
};

const PALETTE = {
  gold: {
    accent: '#E9C76A',
    soft: '#FFD56A',
    ring: 'ring-[#E9C76A]/20',
    border: 'border-[#E9C76A]/30',
    grad: 'from-[#3a2f0f] via-[#1a1409] to-[#0A0907]',
    label: 'AU',
    longLabel: 'Gold',
  },
  silver: {
    accent: '#D8DDE2',
    soft: '#F4F6F8',
    ring: 'ring-[#D8DDE2]/20',
    border: 'border-[#D8DDE2]/25',
    grad: 'from-[#222831] via-[#13171c] to-[#0A0907]',
    label: 'AG',
    longLabel: 'Silver',
  },
} as const;

export function PriceCard({ quote, trail }: Props) {
  const p = PALETTE[quote.metal];
  const displayed = useAnimatedNumber(quote.price);
  const displayedChange = useAnimatedNumber(quote.change);
  const displayedPct = useAnimatedNumber(quote.changePercent);
  const up = quote.change >= 0;
  const decimals = quote.metal === 'silver' ? 3 : 2;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${p.border} bg-gradient-to-br ${p.grad} p-6 lg:p-8 ring-1 ${p.ring}`}
    >
      {/* Metal sigil */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 text-[14rem] font-black opacity-[0.045] select-none"
        style={{
          fontFamily: 'Fraunces, serif',
          color: p.accent,
          lineHeight: 1,
        }}
      >
        {p.label}
      </div>

      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-[0.65rem] tracking-[0.35em] font-semibold uppercase"
              style={{ color: p.accent, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {quote.symbol}/USD
            </span>
            <span className="text-stone-500 text-xs">·</span>
            <span className="text-[0.65rem] tracking-[0.25em] text-stone-400 uppercase">
              Spot · troy oz
            </span>
          </div>
          <div
            className="mt-1 text-3xl text-stone-50 font-medium"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            {p.longLabel}
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] tracking-[0.2em] uppercase border ${
            up
              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
              : 'text-rose-300 border-rose-500/40 bg-rose-500/10'
          }`}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: up ? '#34D399' : '#FB7185' }}
          />
          {up ? 'Bid up' : 'Bid down'}
        </span>
      </div>

      <div className="mt-6 flex items-end gap-4 flex-wrap">
        <div
          className="text-5xl lg:text-6xl tracking-tight tabular-nums"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: p.soft,
            textShadow: `0 0 30px ${p.accent}22`,
          }}
        >
          ${formatUsd(displayed, decimals)}
        </div>
        <div className="pb-2 flex flex-col gap-1">
          <span
            className={`text-base tabular-nums ${
              up ? 'text-emerald-400' : 'text-rose-400'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatSigned(displayedChange, decimals)}
          </span>
          <span
            className={`text-sm tabular-nums ${
              up ? 'text-emerald-400/80' : 'text-rose-400/80'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatPct(displayedPct)}
          </span>
        </div>
      </div>

      <div className="mt-4 -mx-1">
        <Sparkline
          values={trail}
          width={520}
          height={84}
          stroke={up ? '#34D399' : '#FB7185'}
          trend={up ? 'up' : 'down'}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-stone-800/80 pt-4">
        <Stat label="Prev close" value={`$${formatUsd(quote.prevClose, decimals)}`} />
        <Stat
          label="Day range"
          value={`$${formatUsd(Math.min(...(trail.length ? trail : [quote.price])), decimals)} — $${formatUsd(Math.max(...(trail.length ? trail : [quote.price])), decimals)}`}
        />
        <Stat label="Updated" value={new Date(quote.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.6rem] tracking-[0.3em] text-stone-500 uppercase">
        {label}
      </div>
      <div
        className="mt-1 text-sm text-stone-200 tabular-nums"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {value}
      </div>
    </div>
  );
}
