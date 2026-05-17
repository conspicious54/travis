import { useEffect, useState } from 'react';
import { fetchAllNews, NEWS_SOURCES, type NewsItem, type NewsTopic } from '../services/news';
import { relativeTime } from '../lib/format';

type Props = {
  topicFilter?: NewsTopic | 'all';
  limit?: number;
  showFilter?: boolean;
  showSources?: boolean;
  compact?: boolean;
};

const TOPIC_LABEL: Record<NewsTopic, string> = {
  gold: 'Gold',
  silver: 'Silver',
  metals: 'Metals',
};

const TOPIC_COLOR: Record<NewsTopic, string> = {
  gold: '#E9C76A',
  silver: '#D8DDE2',
  metals: '#B6CFE6',
};

export function NewsList({
  topicFilter = 'all',
  limit,
  showFilter = true,
  showSources = false,
  compact = false,
}: Props) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [filter, setFilter] = useState<NewsTopic | 'all'>(topicFilter);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchAllNews();
        if (!active) return;
        if (res.items.length === 0) {
          setError('No headlines returned. Try again shortly.');
        } else {
          setItems(res.items);
          setUpdatedAt(Date.now());
          setError(null);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Feed offline');
      }
    }
    load();
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = (items ?? []).filter(
    (i) => filter === 'all' || i.topic === filter,
  );
  const visible = typeof limit === 'number' ? filtered.slice(0, limit) : filtered;

  return (
    <section>
      {showFilter && (
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <div
              className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              The wire
            </div>
            <h2
              className="mt-2 text-3xl lg:text-4xl text-stone-50"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
            >
              Precious metals headlines, in real time.
            </h2>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'gold', 'silver', 'metals'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[0.65rem] tracking-[0.3em] uppercase transition ${
                  filter === t
                    ? 'text-stone-50 bg-stone-50/10 ring-1 ring-stone-50/30'
                    : 'text-stone-500 hover:text-stone-200'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {t === 'all' ? 'All' : TOPIC_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {updatedAt && (
        <div
          className="text-[0.6rem] tracking-[0.3em] uppercase text-stone-600 mb-3"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Wire updated {relativeTime(updatedAt, now)}
        </div>
      )}

      {items === null && !error && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-lg border border-stone-900 bg-stone-950/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200/80">
          <div className="font-medium text-amber-200">News feed unavailable</div>
          <div className="mt-1 text-xs text-amber-200/70">{error}</div>
          {showSources && <SourcesGrid />}
        </div>
      )}

      {items && (
        <ul className={`divide-y divide-stone-900 ${compact ? '' : 'rounded-xl border border-stone-900 overflow-hidden'}`}>
          {visible.map((item) => (
            <li
              key={item.id}
              className="group hover:bg-stone-950/60 transition"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 px-4 py-4"
              >
                <span
                  className="mt-1 inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded-sm text-[0.55rem] tracking-[0.25em] uppercase border"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: TOPIC_COLOR[item.topic],
                    borderColor: `${TOPIC_COLOR[item.topic]}33`,
                  }}
                >
                  {TOPIC_LABEL[item.topic]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-base text-stone-100 leading-snug group-hover:text-white"
                       style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>
                    {item.title}
                  </div>
                  {!compact && item.summary && (
                    <div className="mt-1.5 text-xs text-stone-500 line-clamp-2">
                      {item.summary}
                    </div>
                  )}
                  <div
                    className="mt-2 flex items-center gap-3 text-[0.65rem] tracking-[0.2em] uppercase text-stone-600"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    <span className="text-stone-400">{item.source}</span>
                    <span>·</span>
                    <span>{relativeTime(item.publishedAt, now)}</span>
                  </div>
                </div>
                <div className="text-stone-700 group-hover:text-[#E9C76A] transition pt-1">
                  <ArrowOut />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {showSources && items && <SourcesGrid />}
    </section>
  );
}

function ArrowOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17L17 7M17 7H8M17 7V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourcesGrid() {
  return (
    <div id="sources" className="mt-14">
      <div
        className="text-[0.65rem] tracking-[0.4em] uppercase text-[#E9C76A]"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Trusted sources
      </div>
      <h3
        className="mt-2 text-2xl text-stone-50"
        style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}
      >
        The desks we read every morning.
      </h3>
      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {NEWS_SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-stone-900 bg-stone-950/70 p-4 hover:border-[#E9C76A]/40 transition"
          >
            <div
              className="text-[0.6rem] tracking-[0.3em] uppercase text-stone-500"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {s.tag}
            </div>
            <div className="mt-1 text-base text-stone-100"
                 style={{ fontFamily: 'Fraunces, serif', fontWeight: 500 }}>
              {s.name}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
