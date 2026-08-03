const locale = 'pt-BR';

export function formatLocalTime(timestamp: number, timezone: string, includeDate = false): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    ...(includeDate ? { day: '2-digit', month: 'short' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

export function formatWeekday(timestamp: number, timezone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: timezone, weekday: 'short' })
    .format(new Date(timestamp * 1000))
    .replace('.', '');
}

export function formatFullDate(timestamp: number, timezone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(timestamp * 1000));
}

export function ageInMinutes(fetchedAt: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - fetchedAt) / 60_000));
}

export function nearestTimestampIndex(times: number[], target: number): number {
  if (times.length === 0) return -1;
  let bestIndex = 0;
  let bestDistance = Math.abs((times[0] ?? target) - target);
  for (let index = 1; index < times.length; index += 1) {
    const distance = Math.abs((times[index] ?? target) - target);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
}
