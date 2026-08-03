import { fetchAirQuality, fetchWeather } from '../api/openMeteo';
import type { AirQuality, DashboardSnapshot, Location, UnitSystem } from '../types/weather';
import { unitsFor } from '../utils/units';

const unavailableAirQuality: AirQuality = {
  availability: 'unavailable',
  time: null,
  usAqi: null,
  pm25: null,
  pm10: null,
};

export async function loadDashboard(
  location: Location,
  unitSystem: UnitSystem,
  signal: AbortSignal,
): Promise<DashboardSnapshot> {
  const weatherPromise = fetchWeather(location, unitSystem, signal);
  const airPromise = fetchAirQuality(location, signal).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return unavailableAirQuality;
  });
  const [weather, airQuality] = await Promise.all([weatherPromise, airPromise]);
  return {
    location: { ...location, timezone: weather.timezone },
    current: weather.current,
    hourly: weather.hourly,
    daily: weather.daily,
    airQuality,
    units: unitsFor(unitSystem),
    fetchedAt: Date.now(),
  };
}
