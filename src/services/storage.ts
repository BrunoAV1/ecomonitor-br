import type { DashboardSnapshot, Location, Preferences } from '../types/weather';

const KEYS = {
  preferences: 'ecomonitor.preferences.v2',
  lastLocation: 'ecomonitor.last-location.v2',
  favorites: 'ecomonitor.favorites.v2',
  recent: 'ecomonitor.recent.v2',
  snapshot: 'ecomonitor.snapshot.v2',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private or quota-limited contexts.
  }
}

export const storage = {
  preferences(): Preferences {
    const value = read<Partial<Preferences>>(KEYS.preferences);
    return {
      units: value?.units === 'imperial' ? 'imperial' : 'metric',
      theme: value?.theme === 'light' || value?.theme === 'dark' ? value.theme : 'auto',
    };
  },
  savePreferences(value: Preferences): void {
    write(KEYS.preferences, value);
  },
  lastLocation(): Location | null {
    return read<Location>(KEYS.lastLocation);
  },
  saveLastLocation(value: Location): void {
    if (value.source !== 'geolocation') write(KEYS.lastLocation, value);
  },
  favorites(): Location[] {
    return read<Location[]>(KEYS.favorites) ?? [];
  },
  saveFavorites(value: Location[]): void {
    write(KEYS.favorites, value.slice(0, 12));
  },
  recent(): Location[] {
    return read<Location[]>(KEYS.recent) ?? [];
  },
  saveRecent(value: Location[]): void {
    write(KEYS.recent, value.slice(0, 6));
  },
  snapshot(): DashboardSnapshot | null {
    return read<DashboardSnapshot>(KEYS.snapshot);
  },
  saveSnapshot(value: DashboardSnapshot): void {
    write(KEYS.snapshot, value);
  },
  clear(): void {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
