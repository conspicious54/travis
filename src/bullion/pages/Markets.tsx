import { useLivePrices } from '../lib/useLivePrices';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { Ticker } from '../components/Ticker';
import { StatusBar } from '../components/StatusBar';
import { PriceCard } from '../components/PriceCard';
import { MarketStats } from '../components/MarketStats';

export function Markets() {
  const { snapshot, goldTrail, silverTrail, status, lastFetch } = useLivePrices();

  return (
    <div className="min-h-screen bg-[#0A0907] text-stone-100">
      <Nav />
      <Ticker snapshot={snapshot} />
      <StatusBar status={status} lastFetch={lastFetch} />

      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <header className="mb-10">
          <div
            className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Market terminal
          </div>
          <h1
            className="mt-3 text-4xl lg:text-6xl text-stone-50 leading-tight"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            Every weight, every ratio, every tick.
          </h1>
        </header>

        {snapshot && (
          <>
            <div className="grid lg:grid-cols-2 gap-5">
              <PriceCard quote={snapshot.gold} trail={goldTrail} />
              <PriceCard quote={snapshot.silver} trail={silverTrail} />
            </div>
            <MarketStats snapshot={snapshot} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
