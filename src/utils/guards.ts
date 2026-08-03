export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function finiteInteger(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

export function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().slice(0, 160) : fallback;
}

export function nullableNumberArray(value: unknown): Array<number | null> {
  if (!Array.isArray(value)) return [];
  return value.map((item) => finiteNumber(item));
}

export function numberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => finiteNumber(item)).filter((item): item is number => item !== null);
}
