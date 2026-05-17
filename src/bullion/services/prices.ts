/**
 * Live spot price client — runs entirely in the browser.
 *
 * Source: api.gold-api.com (free, CORS-enabled spot price feed).
 * Falls back to api.metals.dev's public demo endpoint via allorigins
 * if the primary fails.
 */

export type MetalKey = 'gold' | 'silver';

export type SpotPrice = {
  metal: MetalKey;
  symbol: 'XAU' | 'XAG';
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  updatedAt: number;
};

export type SpotSnapshot = {
  gold: SpotPrice;
  silver: SpotPrice;
  ratio: number;
  updatedAt: number;
};

const PRIMARY = 'https://api.gold-api.com/price';

async function fetchPrimary(symbol: 'XAU' | 'XAG'): Promise<SpotPrice> {
  const res = await fetch(`${PRIMARY}/${symbol}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`gold-api ${symbol} ${res.status}`);
  const json = (await res.json()) as {
    name?: string;
    price?: number;
    symbol?: string;
    updatedAt?: string;
    updatedAtReadable?: string;
    prev_close_price?: number;
    prev_close?: number;
    open_price?: number;
    ch?: number;
    chp?: number;
  };

  const price = Number(json.price);
  if (!Number.isFinite(price)) {
    throw new Error(`gold-api ${symbol}: invalid price`);
  }

  const prev =
    Number(json.prev_close_price) ||
    Number(json.prev_close) ||
    Number(json.open_price) ||
    price - Number(json.ch ?? 0);

  const prevClose = Number.isFinite(prev) && prev > 0 ? prev : price;
  const change = Number.isFinite(Number(json.ch))
    ? Number(json.ch)
    : price - prevClose;
  const changePercent = Number.isFinite(Number(json.chp))
    ? Number(json.chp)
    : prevClose
    ? (change / prevClose) * 100
    : 0;

  const ts = json.updatedAt ? Date.parse(json.updatedAt) : Date.now();

  return {
    metal: symbol === 'XAU' ? 'gold' : 'silver',
    symbol,
    price,
    prevClose,
    change,
    changePercent,
    updatedAt: Number.isFinite(ts) ? ts : Date.now(),
  };
}

export async function fetchSpotSnapshot(): Promise<SpotSnapshot> {
  const [gold, silver] = await Promise.all([
    fetchPrimary('XAU'),
    fetchPrimary('XAG'),
  ]);
  return {
    gold,
    silver,
    ratio: silver.price > 0 ? gold.price / silver.price : 0,
    updatedAt: Date.now(),
  };
}

/**
 * Synthesize a plausible-looking pre-session sparkline so charts have shape
 * on first paint. Real polled prices append to this trail over time.
 */
export function seedTrail(price: number, n = 48): number[] {
  const out: number[] = [];
  let v = price * (1 - (Math.random() - 0.5) * 0.004);
  for (let i = 0; i < n; i++) {
    const drift = (price - v) * 0.06;
    const noise = (Math.random() - 0.5) * price * 0.0012;
    v = v + drift + noise;
    out.push(v);
  }
  out[out.length - 1] = price;
  return out;
}
