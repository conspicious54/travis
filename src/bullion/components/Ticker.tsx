import { formatPct, formatSigned, formatUsd } from '../lib/format';
import type { SpotSnapshot } from '../services/prices';

type Props = {
  snapshot: SpotSnapshot | null;
};

type TickerRow = {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePct: number;
  accent: 'gold' | 'silver' | 'ratio';
};

function buildRows(snap: SpotSnapshot): TickerRow[] {
  const { gold, silver, ratio } = snap;
  return [
    {
      symbol: 'XAU/USD',
      label: 'Gold spot',
      price: gold.price,
      change: gold.change,
      changePct: gold.changePercent,
      accent: 'gold',
    },
    {
      symbol: 'XAG/USD',
      label: 'Silver spot',
      price: silver.price,
      change: silver.change,
      changePct: silver.changePercent,
      accent: 'silver',
    },
    {
      symbol: 'XAU·OZ',
      label: 'Gold / troy oz',
      price: gold.price,
      change: gold.change,
      changePct: gold.changePercent,
      accent: 'gold',
    },
    {
      symbol: 'XAG·OZ',
      label: 'Silver / troy oz',
      price: silver.price,
      change: silver.change,
      changePct: silver.changePercent,
      accent: 'silver',
    },
    {
      symbol: 'XAU/XAG',
      label: 'Gold–silver ratio',
      price: ratio,
      change: 0,
      changePct: 0,
      accent: 'ratio',
    },
    {
      symbol: 'XAU·KG',
      label: 'Gold / kilo',
      price: gold.price * 32.1507,
      change: gold.change * 32.1507,
      changePct: gold.changePercent,
      accent: 'gold',
    },
    {
      symbol: 'XAG·KG',
      label: 'Silver / kilo',
      price: silver.price * 32.1507,
      change: silver.change * 32.1507,
      changePct: silver.changePercent,
      accent: 'silver',
    },
  ];
}

function Row({ row }: { row: TickerRow }) {
  const up = row.change >= 0;
  const chColor =
    row.accent === 'ratio'
      ? 'text-stone-400'
      : up
      ? 'text-emerald-400'
      : 'text-rose-400';
  const sym =
    row.accent === 'gold'
      ? 'text-[#E9C76A]'
      : row.accent === 'silver'
      ? 'text-[#D8DDE2]'
      : 'text-stone-300';
  return (
    <div className="inline-flex items-center gap-3 px-6 py-2 border-r border-stone-800/80">
      <span
        className={`text-[0.7rem] tracking-[0.25em] font-semibold ${sym}`}
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {row.symbol}
      </span>
      <span
        className="text-sm text-stone-100 tabular-nums"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {formatUsd(row.price, row.accent === 'silver' ? 3 : 2)}
      </span>
      {row.accent !== 'ratio' && (
        <span
          className={`text-xs tabular-nums ${chColor}`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {formatSigned(row.change, row.accent === 'silver' ? 3 : 2)} ({formatPct(row.changePct)})
        </span>
      )}
    </div>
  );
}

export function Ticker({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="h-10 border-y border-stone-800/80 bg-black/60 flex items-center">
        <div className="px-6 text-xs tracking-[0.3em] text-stone-500 uppercase">
          Connecting to live feed…
        </div>
      </div>
    );
  }

  const rows = buildRows(snapshot);
  const repeated = [...rows, ...rows];

  return (
    <div className="relative border-y border-stone-800/80 bg-black/60 overflow-hidden h-10">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
      <div className="flex items-center whitespace-nowrap animate-[ticker-scroll_55s_linear_infinite] h-full">
        {repeated.map((row, i) => (
          <Row key={`${row.symbol}-${i}`} row={row} />
        ))}
      </div>
    </div>
  );
}
