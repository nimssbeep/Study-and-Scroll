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
