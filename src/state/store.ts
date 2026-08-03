import type { AppState, Location, Preferences } from '../types/weather';
import { storage } from '../services/storage';

export const DEFAULT_LOCATION: Location = {
  id: '3448439',
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.6361,
  timezone: 'America/Sao_Paulo',
  source: 'fallback',
};

type Listener = (state: AppState) => void;

export class Store {
  private listeners = new Set<Listener>();
  private state: AppState;

  constructor() {
    const preferences = storage.preferences();
    this.state = {
      primaryLocation: storage.lastLocation() ?? DEFAULT_LOCATION,
      primarySnapshot: null,
      comparisonLocation: null,
      comparisonSnapshot: null,
      favorites: storage.favorites(),
      recent: storage.recent(),
      preferences,
      status: 'idle',
      message: '',
    };
  }

  get(): AppState {
    return this.state;
  }

  update(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  selectPrimary(location: Location): void {
    const recent = [location, ...this.state.recent.filter((item) => item.id !== location.id)].slice(
      0,
      6,
    );
    storage.saveLastLocation(location);
    storage.saveRecent(recent);
    this.update({ primaryLocation: location, primarySnapshot: null, recent });
  }

  setPreferences(preferences: Preferences): void {
    storage.savePreferences(preferences);
    this.update({ preferences });
  }

  toggleFavorite(location: Location): void {
    const exists = this.state.favorites.some((item) => item.id === location.id);
    const favorites = exists
      ? this.state.favorites.filter((item) => item.id !== location.id)
      : [location, ...this.state.favorites].slice(0, 12);
    storage.saveFavorites(favorites);
    this.update({ favorites });
  }
}
