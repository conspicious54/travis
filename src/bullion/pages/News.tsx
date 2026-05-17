import { useLivePrices } from '../lib/useLivePrices';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { Ticker } from '../components/Ticker';
import { StatusBar } from '../components/StatusBar';
import { NewsList } from '../components/NewsList';

export function News() {
  const { snapshot, status, lastFetch } = useLivePrices();

  return (
    <div className="min-h-screen bg-[#0A0907] text-stone-100">
      <Nav />
      <Ticker snapshot={snapshot} />
      <StatusBar status={status} lastFetch={lastFetch} />

      <main className="mx-auto max-w-5xl px-4 lg:px-8 py-16">
        <header className="mb-10">
          <div
            className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            News index
          </div>
          <h1
            className="mt-3 text-4xl lg:text-6xl text-stone-50 leading-tight"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            Every line moving the metals.
          </h1>
          <p className="mt-4 text-stone-400 max-w-2xl">
            Headlines stream from a curated sweep of the metals wires —
            financial press, mining industry, exchanges, and the central
            research desks. Filter by metal, or open the full source list.
          </p>
        </header>

        <NewsList topicFilter="all" showFilter showSources />
      </main>

      <Footer />
    </div>
  );
}
