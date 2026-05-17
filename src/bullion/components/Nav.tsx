import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';

const LINKS = [
  { to: '/', label: 'Terminal' },
  { to: '/news', label: 'News index' },
  { to: '/markets', label: 'Markets' },
  { to: '/about', label: 'About' },
];

export function Nav() {
  const loc = useLocation();
  return (
    <header className="border-b border-stone-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 lg:px-8 py-4">
        <Link to="/" className="flex items-center">
          <BrandMark />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.to === '/'
                ? loc.pathname === '/'
                : loc.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-md text-[0.7rem] tracking-[0.3em] uppercase transition ${
                  active
                    ? 'text-[#E9C76A] bg-[#E9C76A]/10 ring-1 ring-[#E9C76A]/30'
                    : 'text-stone-400 hover:text-stone-100'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <a
          href="#alerts"
          className="hidden md:inline-flex items-center gap-2 rounded-md border border-[#E9C76A]/30 px-4 py-2 text-[0.7rem] tracking-[0.3em] uppercase text-[#E9C76A] hover:bg-[#E9C76A]/10 transition"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E9C76A] animate-pulse" />
          Price alerts
        </a>
      </div>
    </header>
  );
}
