/**
 * Live news client — runs entirely in the browser.
 *
 * Sources Google News RSS through api.rss2json.com (a CORS-enabled
 * RSS→JSON proxy). If the proxy fails (rate-limited / network), the UI
 * falls back to a curated set of evergreen source links.
 */

export type NewsTopic = 'gold' | 'silver' | 'metals';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: number;
  summary: string;
  topic: NewsTopic;
};

type Rss2JsonResponse = {
  status: string;
  feed?: { title?: string };
  items?: Array<{
    title: string;
    link: string;
    pubDate?: string;
    description?: string;
    author?: string;
    enclosure?: { link?: string };
  }>;
};

const FEEDS: { topic: NewsTopic; query: string }[] = [
  { topic: 'gold', query: 'gold price OR "gold market" when:7d' },
  { topic: 'silver', query: 'silver price OR "silver market" when:7d' },
  { topic: 'metals', query: '"precious metals" OR bullion when:7d' },
];

function googleNewsUrl(query: string): string {
  return (
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query) +
    '&hl=en-US&gl=US&ceid=US:en'
  );
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTitleSource(t: string): { title: string; source: string } {
  const idx = t.lastIndexOf(' - ');
  if (idx > 12 && t.length - idx < 60) {
    return { title: t.slice(0, idx).trim(), source: t.slice(idx + 3).trim() };
  }
  return { title: t, source: '' };
}

async function fetchOne(topic: NewsTopic, query: string): Promise<NewsItem[]> {
  const url =
    'https://api.rss2json.com/v1/api.json?count=24&rss_url=' +
    encodeURIComponent(googleNewsUrl(query));

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`rss2json ${topic} ${res.status}`);
  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error(`rss2json ${topic} bad payload`);
  }

  return data.items.map((item) => {
    const { title, source } = splitTitleSource(stripHtml(item.title));
    const ts = item.pubDate ? Date.parse(item.pubDate) : Date.now();
    return {
      id: `${topic}-${btoa(unescape(encodeURIComponent(item.link))).replace(/=+$/, '')}`,
      title,
      link: item.link,
      source: source || item.author || 'Web',
      publishedAt: Number.isFinite(ts) ? ts : Date.now(),
      summary: stripHtml(item.description ?? '').slice(0, 260),
      topic,
    };
  });
}

export async function fetchAllNews(): Promise<{
  items: NewsItem[];
  ok: boolean;
}> {
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchOne(f.topic, f.query)),
  );
  const merged: NewsItem[] = [];
  const seen = new Set<string>();
  let anyOk = false;

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    anyOk = true;
    for (const item of r.value) {
      const key = item.title.toLowerCase().slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.publishedAt - a.publishedAt);
  return { items: merged, ok: anyOk };
}

export const NEWS_SOURCES: { name: string; url: string; tag: string }[] = [
  { name: 'Kitco News', url: 'https://www.kitco.com/news/', tag: 'Newsroom' },
  { name: 'Reuters Metals', url: 'https://www.reuters.com/markets/commodities/', tag: 'Wire' },
  { name: 'Bloomberg Metals', url: 'https://www.bloomberg.com/markets/commodities/futures/metals', tag: 'Markets' },
  { name: 'MarketWatch Metals', url: 'https://www.marketwatch.com/investing/futures/gold', tag: 'Markets' },
  { name: 'Mining.com', url: 'https://www.mining.com/commodity/gold/', tag: 'Industry' },
  { name: 'World Gold Council', url: 'https://www.gold.org/goldhub/research', tag: 'Research' },
  { name: 'Silver Institute', url: 'https://www.silverinstitute.org/news/', tag: 'Research' },
  { name: 'LBMA', url: 'https://www.lbma.org.uk/news', tag: 'Exchange' },
];
