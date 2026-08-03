import type { UnitSystem, WeatherUnits } from '../types/weather';

export function unitsFor(system: UnitSystem): WeatherUnits {
  return system === 'imperial'
    ? { temperature: '°F', windSpeed: 'mph', precipitation: 'in' }
    : { temperature: '°C', windSpeed: 'km/h', precipitation: 'mm' };
}

export function formatMeasurement(value: number | null, unit: string, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value)} ${unit}`;
}

export function compassDirection(degrees: number): string {
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const normalized = ((degrees % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % 8] ?? 'N';
}
