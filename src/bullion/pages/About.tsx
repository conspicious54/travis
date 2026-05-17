import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';

export function About() {
  return (
    <div className="min-h-screen bg-[#0A0907] text-stone-100">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 lg:px-8 py-20">
        <div
          className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          About Bullion
        </div>
        <h1
          className="mt-3 text-4xl lg:text-6xl text-stone-50 leading-tight"
          style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
        >
          A quieter way to read the metals.
        </h1>

        <div className="prose prose-invert prose-stone mt-10 max-w-none text-stone-300 leading-relaxed">
          <p className="text-lg">
            Bullion is a single page for the two oldest stores of value on
            earth. It pulls live spot from the global wire, runs the gold–silver
            ratio in real time, and indexes the news desks that actually move
            the market.
          </p>
          <p>
            There are no candle widgets begging to be configured, no popups
            asking you to set up a watchlist, no flashing red banners selling
            you a webinar. Bullion is a tape, a wire, and a calm room.
          </p>

          <h2
            className="mt-12 text-2xl text-stone-50"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            How the numbers are sourced.
          </h2>
          <p>
            Spot prices come from a public metals feed that aggregates pricing
            from major bullion banks and the COMEX continuous front month.
            We refresh in the browser every 20 seconds. The news index is
            assembled from the metals wires you already trust — Kitco,
            Reuters, Bloomberg, MarketWatch, Mining.com, the World Gold
            Council, the Silver Institute and the LBMA.
          </p>

          <h2
            className="mt-12 text-2xl text-stone-50"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
          >
            A note on the ratio.
          </h2>
          <p>
            The gold–silver ratio has, for two thousand years, hovered between
            15 and 100. It is the ledger most underrated by modern markets —
            the one number that tells you whether the world is hoarding gold
            or rotating into silver. Bullion keeps it on the desk at all
            times, in the centre of the room.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
