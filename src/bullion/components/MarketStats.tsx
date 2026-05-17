import { formatPct, formatUsd } from '../lib/format';
import type { SpotSnapshot } from '../services/prices';

const OZ_PER_KG = 32.1507;
const OZ_PER_GRAM = 1 / 31.1035;

export function MarketStats({ snapshot }: { snapshot: SpotSnapshot }) {
  const { gold, silver, ratio } = snapshot;

  const items = [
    {
      heading: 'Gold / silver ratio',
      value: formatUsd(ratio, 2),
      caption:
        ratio > 80
          ? 'Historically elevated — silver tends to outperform from here.'
          : ratio < 50
          ? 'Compressed ratio — gold leadership phase.'
          : 'Within long-run band of 50 to 80.',
      accent: '#E9C76A',
    },
    {
      heading: 'Gold per kilogram',
      value: `$${formatUsd(gold.price * OZ_PER_KG, 0)}`,
      caption: `One kilo bar at today’s spot. ${formatPct(gold.changePercent)} on the session.`,
      accent: '#E9C76A',
    },
    {
      heading: 'Silver per kilogram',
      value: `$${formatUsd(silver.price * OZ_PER_KG, 2)}`,
      caption: `Industrial-grade lot reference. ${formatPct(silver.changePercent)} today.`,
      accent: '#D8DDE2',
    },
    {
      heading: 'Gold per gram',
      value: `$${formatUsd(gold.price * OZ_PER_GRAM, 2)}`,
      caption: 'Retail jewellery reference price, pre-premium.',
      accent: '#E9C76A',
    },
    {
      heading: 'Silver per gram',
      value: `$${formatUsd(silver.price * OZ_PER_GRAM, 3)}`,
      caption: 'Scrap and sterling silver reference.',
      accent: '#D8DDE2',
    },
    {
      heading: '$1,000 in gold',
      value: `${formatUsd(1000 / gold.price, 4)} oz`,
      caption: `That is ${formatUsd((1000 / gold.price) * 31.1035, 2)} grams of fine gold.`,
      accent: '#E9C76A',
    },
  ];

  return (
    <section className="mt-12">
      <SectionHeader
        eyebrow="Reference grid"
        title="Across every weight and ratio."
      />
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <div
            key={it.heading}
            className="rounded-xl border border-stone-900 bg-stone-950/70 p-5 hover:border-stone-800 transition"
          >
            <div
              className="text-[0.62rem] tracking-[0.3em] uppercase"
              style={{
                color: it.accent,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {it.heading}
            </div>
            <div
              className="mt-2 text-2xl text-stone-50 tabular-nums"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {it.value}
            </div>
            <div className="mt-2 text-xs text-stone-500 leading-relaxed">
              {it.caption}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div
          className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {eyebrow}
        </div>
        <h2
          className="mt-2 text-3xl lg:text-4xl text-stone-50"
          style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}
