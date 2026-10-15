const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function formatTimeAgo(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return '';

  // Clamp to "now" so small clock skew never renders as "in 2 minutes".
  const seconds = Math.min(0, (timestamp - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, unitSeconds] of TIME_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return rtf.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return rtf.format(0, 'second');
}

export function formatRemainingTime(expiresAt?: string): string {
  if (!expiresAt) return '24h story';
  try {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired (Archived)';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  } catch {
    return '24h story';
  }
}

export function getSocialUrl(type: string, val: string): string {
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const cleanVal = val.replace(/^@/, '');
  switch (type) {
    case 'github':
      return `https://github.com/${cleanVal}`;
    case 'linkedin':
      return val.includes('linkedin.com') ? `https://${val}` : `https://linkedin.com/in/${cleanVal}`;
    case 'twitter':
      return `https://x.com/${cleanVal}`;
    case 'instagram':
      return `https://instagram.com/${cleanVal}`;
    case 'website':
      return `https://${val}`;
    default:
      return `https://${val}`;
  }
}

