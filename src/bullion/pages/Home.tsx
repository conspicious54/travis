import { useLivePrices } from '../lib/useLivePrices';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { Ticker } from '../components/Ticker';
import { PriceCard } from '../components/PriceCard';
import { StatusBar } from '../components/StatusBar';
import { MarketStats } from '../components/MarketStats';
import { NewsList } from '../components/NewsList';
import { Sparkline } from '../components/Sparkline';
import { formatPct, formatUsd } from '../lib/format';

export function Home() {
  const { snapshot, goldTrail, silverTrail, status, lastFetch } = useLivePrices();

  return (
    <div className="min-h-screen bg-[#0A0907] text-stone-100 selection:bg-[#E9C76A]/30">
      <BackgroundFx />
      <Nav />
      <Ticker snapshot={snapshot} />
      <StatusBar status={status} lastFetch={lastFetch} />

      <main className="relative">
        <Hero snapshot={snapshot} />

        <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-8">
          <div className="grid lg:grid-cols-2 gap-5">
            {snapshot ? (
              <>
                <PriceCard quote={snapshot.gold} trail={goldTrail} />
                <PriceCard quote={snapshot.silver} trail={silverTrail} />
              </>
            ) : (
              <>
                <PriceCardSkeleton metal="gold" />
                <PriceCardSkeleton metal="silver" />
              </>
            )}
          </div>

          <RatioPanel snapshot={snapshot} />

          {snapshot && <MarketStats snapshot={snapshot} />}

          <section className="mt-20">
            <NewsList topicFilter="all" limit={10} />
            <div className="mt-6 flex justify-center">
              <a
                href="/news"
                className="inline-flex items-center gap-2 rounded-md border border-[#E9C76A]/30 px-5 py-2.5 text-[0.7rem] tracking-[0.3em] uppercase text-[#E9C76A] hover:bg-[#E9C76A]/10 transition"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Open the full news index →
              </a>
            </div>
          </section>

          <PromoPanel />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Hero({ snapshot }: { snapshot: ReturnType<typeof useLivePrices>['snapshot'] }) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 lg:px-8 pt-16 lg:pt-24 pb-10">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
        <div>
          <div
            className="text-[0.65rem] tracking-[0.5em] uppercase text-[#E9C76A] mb-5"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            ⏤ The precious metals terminal
          </div>
          <h1
            className="text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] text-stone-50"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            The price of <span className="text-[#E9C76A] italic">gold</span>
            <br />
            and <span className="text-[#E2E6EA] italic">silver,</span> live.
          </h1>
          <p className="mt-6 text-stone-400 text-base md:text-lg max-w-xl leading-relaxed">
            A market-grade dashboard for the two oldest stores of value on earth.
            Real-time spot. Bid, ask, and the news moving the metals — pulled
            from the wires, in one quiet, beautiful room.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#desk"
              className="inline-flex items-center gap-2 rounded-md bg-[#E9C76A] text-stone-950 px-5 py-3 text-[0.7rem] tracking-[0.3em] uppercase font-semibold hover:bg-[#FFD56A] transition"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Open the terminal
            </a>
            <a
              href="/news"
              className="inline-flex items-center gap-2 rounded-md border border-stone-700 px-5 py-3 text-[0.7rem] tracking-[0.3em] uppercase text-stone-200 hover:bg-stone-900 transition"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Read the wire
            </a>
          </div>
        </div>

        <HeroCallouts snapshot={snapshot} />
      </div>
      <div id="desk" className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E9C76A]/30 to-transparent" />
    </section>
  );
}

function HeroCallouts({
  snapshot,
}: {
  snapshot: ReturnType<typeof useLivePrices>['snapshot'];
}) {
  const items = snapshot
    ? [
        {
          label: 'Gold spot',
          value: `$${formatUsd(snapshot.gold.price, 2)}`,
          delta: formatPct(snapshot.gold.changePercent),
          up: snapshot.gold.change >= 0,
          accent: '#E9C76A',
        },
        {
          label: 'Silver spot',
          value: `$${formatUsd(snapshot.silver.price, 3)}`,
          delta: formatPct(snapshot.silver.changePercent),
          up: snapshot.silver.change >= 0,
          accent: '#D8DDE2',
        },
        {
          label: 'Gold / silver',
          value: formatUsd(snapshot.ratio, 2),
          delta: snapshot.ratio > 80 ? 'Silver favoured' : snapshot.ratio < 50 ? 'Gold favoured' : 'Balanced',
          up: true,
          accent: '#B6CFE6',
          neutral: true,
        },
      ]
    : null;

  return (
    <div className="rounded-2xl border border-stone-900 bg-stone-950/70 backdrop-blur p-5 lg:p-6">
      <div
        className="text-[0.6rem] tracking-[0.4em] uppercase text-stone-500 mb-3"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Live readout
      </div>
      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-stone-900/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.label} className="flex items-baseline justify-between gap-4 border-b border-stone-900 last:border-0 pb-3 last:pb-0">
              <div>
                <div
                  className="text-[0.55rem] tracking-[0.35em] uppercase"
                  style={{ color: it.accent, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {it.label}
                </div>
                <div
                  className="mt-1 text-2xl tabular-nums text-stone-50"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {it.value}
                </div>
              </div>
              <div
                className={`text-xs tabular-nums ${
                  it.neutral ? 'text-stone-400' : it.up ? 'text-emerald-400' : 'text-rose-400'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {it.delta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatioPanel({
  snapshot,
}: {
  snapshot: ReturnType<typeof useLivePrices>['snapshot'];
}) {
  if (!snapshot) return null;

  const ratio = snapshot.ratio;
  const blended: number[] = [];
  for (let i = 0; i < 48; i++) {
    const a = ratio * (1 - (Math.random() - 0.5) * 0.01);
    blended.push(a);
  }
  blended[blended.length - 1] = ratio;
  const interpretation =
    ratio > 80
      ? 'Ratio sits above the long-run band — historically a window where silver tends to outpace gold.'
      : ratio < 50
      ? 'Ratio is compressed — the gold/silver pair has favoured silver, suggesting rotation may turn.'
      : 'Ratio is within the historical 50–80 band. Neither metal has a structural lead today.';

  return (
    <section id="ratio" className="mt-8 rounded-2xl border border-stone-900 bg-stone-950/60 p-6 lg:p-8 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
      <div>
        <div
          className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          The ratio
        </div>
        <h3
          className="mt-2 text-3xl lg:text-4xl text-stone-50"
          style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
        >
          One ounce of gold buys{' '}
          <span className="text-[#E9C76A]">{formatUsd(ratio, 2)}</span>{' '}
          ounces of silver.
        </h3>
        <p className="mt-4 text-stone-400 text-base leading-relaxed max-w-xl">
          {interpretation}
        </p>
      </div>
      <div>
        <Sparkline
          values={blended}
          width={520}
          height={140}
          stroke="#B6CFE6"
          trend="flat"
          showDot
        />
        <div className="mt-3 flex items-center justify-between text-[0.6rem] tracking-[0.3em] uppercase text-stone-500"
             style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span>Long-run band</span>
          <span>50 — 80 — 100</span>
        </div>
      </div>
    </section>
  );
}

function PriceCardSkeleton({ metal }: { metal: 'gold' | 'silver' }) {
  const accent = metal === 'gold' ? '#E9C76A' : '#D8DDE2';
  return (
    <div
      className="rounded-2xl border p-6 lg:p-8 bg-stone-950/60"
      style={{ borderColor: `${accent}33` }}
    >
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 bg-stone-800 rounded animate-pulse" />
        <div className="h-5 w-16 bg-stone-800 rounded-full animate-pulse" />
      </div>
      <div className="mt-6 h-14 w-3/4 bg-stone-800 rounded animate-pulse" />
      <div className="mt-3 h-3 w-1/4 bg-stone-800 rounded animate-pulse" />
      <div className="mt-6 h-20 bg-stone-900 rounded animate-pulse" />
    </div>
  );
}

function PromoPanel() {
  return (
    <section
      id="alerts"
      className="mt-24 rounded-2xl border border-[#E9C76A]/30 bg-gradient-to-br from-[#1a1206] via-[#0e0a04] to-[#0A0907] p-8 lg:p-12 relative overflow-hidden"
    >
      <div
        className="absolute -right-16 -top-16 text-[18rem] font-black opacity-[0.05] pointer-events-none"
        style={{ fontFamily: 'Fraunces, serif', color: '#E9C76A', lineHeight: 1 }}
      >
        AU
      </div>
      <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-end">
        <div>
          <div
            className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Bullion alerts
          </div>
          <h3
            className="mt-2 text-3xl lg:text-5xl text-stone-50 max-w-2xl"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            Get a quiet ping when the metals move.
          </h3>
          <p className="mt-4 text-stone-400 max-w-xl">
            Set a threshold on gold, silver, or the ratio — we’ll send you
            a single, beautifully-typed email the moment your level prints.
            No noise. No newsletters. Just the level.
          </p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 rounded-md bg-black/60 border border-stone-700 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#E9C76A]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
          <button
            type="submit"
            className="rounded-md bg-[#E9C76A] text-stone-950 px-5 py-3 text-[0.7rem] tracking-[0.3em] uppercase font-semibold hover:bg-[#FFD56A] transition"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Watch the tape
          </button>
        </form>
      </div>
    </section>
  );
}

function BackgroundFx() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0A0907]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E9C76A 1px, transparent 1px), linear-gradient(to bottom, #E9C76A 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div
        className="absolute -top-32 left-1/3 h-[480px] w-[480px] rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #E9C76A, transparent 70%)' }}
      />
      <div
        className="absolute top-[40%] -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, #B6CFE6, transparent 70%)' }}
      />
    </div>
  );
}
