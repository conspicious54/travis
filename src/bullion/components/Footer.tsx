import { BrandMark } from './BrandMark';

export function Footer() {
  return (
    <footer className="border-t border-stone-900 bg-black mt-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12 grid md:grid-cols-4 gap-10">
        <div>
          <BrandMark />
          <p className="mt-4 text-sm text-stone-500 max-w-xs leading-relaxed">
            A precious metals market terminal. Live spot pricing for gold and
            silver, curated news, and the global metals ratio — all in one
            place.
          </p>
        </div>
        <FooterCol
          title="Markets"
          links={[
            { label: 'Gold spot · XAU', href: '#xau' },
            { label: 'Silver spot · XAG', href: '#xag' },
            { label: 'Gold/Silver ratio', href: '#ratio' },
            { label: 'Per kilo conversions', href: '#kilo' },
          ]}
        />
        <FooterCol
          title="Coverage"
          links={[
            { label: 'News index', href: '/news' },
            { label: 'Sources', href: '/news#sources' },
            { label: 'Methodology', href: '#methodology' },
            { label: 'Glossary', href: '#glossary' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: 'About Bullion', href: '/about' },
            { label: 'API access', href: '#api' },
            { label: 'Press', href: '#press' },
            { label: 'Terms', href: '#terms' },
          ]}
        />
      </div>
      <div className="border-t border-stone-900 px-4 lg:px-8 py-5 mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div
          className="text-[0.65rem] tracking-[0.3em] uppercase text-stone-600"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          © {new Date().getFullYear()} Bullion Index. Spot data delayed up to 60s.
        </div>
        <div
          className="text-[0.65rem] tracking-[0.3em] uppercase text-stone-600"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Built for the carbon, the carat, and the canny.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div
        className="text-[0.65rem] tracking-[0.35em] uppercase text-[#E9C76A] mb-4"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {title}
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-stone-400 hover:text-stone-100 transition"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
