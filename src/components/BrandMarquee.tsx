import React from 'react';

/* ───── BrandMarquee ─────────────────────────────────────────────
   Infinite horizontal scroll of brand logos / names, like the one
   on info.triviumco.com/google-ads-book-a-call. The track is the
   brand list duplicated once, then animated from translateX(0) to
   translateX(-50%). Because the duplicated half is identical to
   the first, the loop is seamless — the eye never sees a reset.

   Pass `brands` as an array of { name, logoUrl? }. If logoUrl is
   set, the item renders as an <img>; otherwise it renders as a
   text badge so the component is useful even before real logos
   are hosted.

   Props:
     - brands: list to render
     - label: optional eyebrow line above the strip
     - speedSeconds: how long one full loop takes (lower = faster)
──────────────────────────────────────────────────────────────── */

export interface Brand {
  name: string;
  logoUrl?: string;
}

interface BrandMarqueeProps {
  brands: Brand[];
  label?: string;
  speedSeconds?: number;
}

export function BrandMarquee({
  brands,
  label = 'Brands We Have Worked With',
  speedSeconds = 40,
}: BrandMarqueeProps) {
  if (!brands || brands.length === 0) return null;

  // Duplicate the list so the second half exactly matches the first.
  // Marker-key suffix keeps React happy with the duplicate keys.
  const loop = [...brands, ...brands];

  return (
    <div className="w-full">
      {label ? (
        <p className="text-center text-[11px] md:text-xs font-black uppercase tracking-[0.25em] text-slate-500 mb-5">
          {label}
        </p>
      ) : null}

      <div
        className="relative overflow-hidden"
        style={{
          // Fade edges so the first/last brand doesn't visually
          // snap in and out of view — matches Trivium's soft mask.
          maskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div
          className="flex items-center gap-12 md:gap-16 w-max brand-marquee-track"
          style={{ animationDuration: `${speedSeconds}s` }}
        >
          {loop.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="flex items-center justify-center shrink-0 w-32 md:w-44 h-12 md:h-16"
              aria-hidden={i >= brands.length ? 'true' : undefined}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition"
                />
              ) : (
                <span className="text-base md:text-lg font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scoped keyframes + pause-on-hover. Translating by -50% is
          what makes the loop seamless given the duplicated list. */}
      <style>{`
        @keyframes brand-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .brand-marquee-track {
          animation-name: brand-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .brand-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
