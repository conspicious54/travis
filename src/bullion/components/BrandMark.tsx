type Props = {
  size?: number;
  withWordmark?: boolean;
};

export function BrandMark({ size = 36, withWordmark = true }: Props) {
  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-label="Bullion mark"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="bm-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="45%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6A1E" />
          </linearGradient>
          <linearGradient id="bm-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F4F6F8" />
            <stop offset="55%" stopColor="#B8BFC6" />
            <stop offset="100%" stopColor="#6B7178" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="12"
          fill="#0A0907"
          stroke="url(#bm-gold)"
          strokeWidth="1.5"
        />
        {/* Stacked ingot silhouette */}
        <path
          d="M14 38 L22 30 L42 30 L50 38 Z"
          fill="url(#bm-silver)"
          opacity="0.95"
        />
        <path
          d="M18 48 L26 40 L46 40 L54 48 Z"
          fill="url(#bm-gold)"
        />
        <rect x="14" y="48" width="36" height="3" rx="1" fill="#0A0907" opacity="0.3" />
      </svg>
      {withWordmark && (
        <div className="leading-none">
          <div
            className="text-[1.35rem] font-black tracking-[0.18em] text-[#F5E6B0]"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            BULLION
          </div>
          <div className="text-[0.55rem] tracking-[0.35em] text-stone-400 mt-1 uppercase">
            Precious Metals Index
          </div>
        </div>
      )}
    </div>
  );
}
