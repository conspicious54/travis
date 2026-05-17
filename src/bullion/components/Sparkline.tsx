type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke: string;
  fill?: string;
  trend?: 'up' | 'down' | 'flat';
  showDot?: boolean;
};

export function Sparkline({
  values,
  width = 320,
  height = 80,
  stroke,
  fill,
  trend = 'flat',
  showDot = true,
}: Props) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1][0].toFixed(2)} ${pad + h}` +
    ` L ${points[0][0].toFixed(2)} ${pad + h} Z`;

  const last = points[points.length - 1];
  const gradientId = `sg-${trend}-${stroke.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill !== 'none' && (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <>
          <circle cx={last[0]} cy={last[1]} r={5} fill={stroke} opacity={0.18} />
          <circle cx={last[0]} cy={last[1]} r={2.5} fill={stroke} />
        </>
      )}
    </svg>
  );
}
