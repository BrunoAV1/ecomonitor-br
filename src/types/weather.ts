export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'auto' | 'dark' | 'light';

export interface Location {
  id: string;
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: 'geocoding' | 'geolocation' | 'fallback';
}

export interface CurrentWeather {
  time: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: number;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitationProbability: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
}

export interface DailyForecast {
  time: number;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitation: number | null;
  sunrise: number | null;
  sunset: number | null;
}

export type AirQualityAvailability = 'available' | 'missing' | 'unavailable';

export interface AirQuality {
  availability: AirQualityAvailability;
  time: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

export interface WeatherUnits {
  temperature: '°C' | '°F';
  windSpeed: 'km/h' | 'mph';
  precipitation: 'mm' | 'in';
}

export interface DashboardSnapshot {
  location: Location;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyForecast[];
  airQuality: AirQuality;
  units: WeatherUnits;
  fetchedAt: number;
}

export interface Preferences {
  units: UnitSystem;
  theme: ThemePreference;
}

export type ViewStatus = 'idle' | 'loading' | 'ready' | 'stale' | 'error';

export interface AppState {
  primaryLocation: Location;
  primarySnapshot: DashboardSnapshot | null;
  comparisonLocation: Location | null;
  comparisonSnapshot: DashboardSnapshot | null;
  favorites: Location[];
  recent: Location[];
  preferences: Preferences;
  status: ViewStatus;
  message: string;
}
