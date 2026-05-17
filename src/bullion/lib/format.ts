export function formatUsd(n: number, frac = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });
}

export function formatSigned(n: number, frac = 2): string {
  if (!Number.isFinite(n)) return '—';
  const s = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });
  return n >= 0 ? `+${s}` : `−${s}`;
}

export function formatPct(n: number, frac = 2): string {
  if (!Number.isFinite(n)) return '—';
  const s = Math.abs(n).toFixed(frac);
  return n >= 0 ? `+${s}%` : `−${s}%`;
}

export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.round((now - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function clockHMS(ts: number = Date.now()): string {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} UTC`;
}

/**
 * Approximate NY COMEX market state. Globex futures trade nearly 24/5,
 * with a 60-minute daily break (17:00–18:00 ET) and weekend close.
 * This is a UI hint, not a trading source of truth.
 */
export function marketState(now: Date = new Date()): {
  status: 'open' | 'break' | 'closed';
  label: string;
} {
  // Convert to America/New_York via Intl.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = get('weekday');
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const mins = hour * 60 + minute;

  // Weekend: closed from Fri 17:00 ET through Sun 18:00 ET.
  if (weekday === 'Sat') return { status: 'closed', label: 'Weekend close' };
  if (weekday === 'Sun' && mins < 18 * 60) {
    return { status: 'closed', label: 'Weekend close' };
  }
  if (weekday === 'Fri' && mins >= 17 * 60) {
    return { status: 'closed', label: 'Weekend close' };
  }
  // Daily maintenance break.
  if (mins >= 17 * 60 && mins < 18 * 60) {
    return { status: 'break', label: 'Daily settlement' };
  }
  return { status: 'open', label: 'COMEX Globex open' };
}
