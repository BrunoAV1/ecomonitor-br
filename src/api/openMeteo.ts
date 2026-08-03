import type {
  AirQuality,
  CurrentWeather,
  DailyForecast,
  HourlyPoint,
  Location,
  UnitSystem,
} from '../types/weather';
import {
  finiteInteger,
  finiteNumber,
  isRecord,
  nullableNumberArray,
  safeString,
} from '../utils/guards';
import { unitsFor } from '../utils/units';
import { ApiError, requestJson } from './client';

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const AIR_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = finiteNumber(record[key]);
  if (value === null)
    throw new ApiError(`Campo numérico ausente: ${key}.`, null, 'invalid-response');
  return value;
}

function optionalAt(values: Array<number | null>, index: number): number | null {
  return values[index] ?? null;
}

function parseCurrent(value: unknown): CurrentWeather {
  if (!isRecord(value)) throw new ApiError('Condições atuais ausentes.', null, 'invalid-response');
  return {
    time: requiredNumber(value, 'time'),
    temperature: requiredNumber(value, 'temperature_2m'),
    apparentTemperature: requiredNumber(value, 'apparent_temperature'),
    humidity: requiredNumber(value, 'relative_humidity_2m'),
    windSpeed: requiredNumber(value, 'wind_speed_10m'),
    windDirection: requiredNumber(value, 'wind_direction_10m'),
    precipitation: requiredNumber(value, 'precipitation'),
    weatherCode: requiredNumber(value, 'weather_code'),
    isDay: requiredNumber(value, 'is_day') === 1,
  };
}

function parseHourly(value: unknown): HourlyPoint[] {
  if (!isRecord(value)) throw new ApiError('Série horária ausente.', null, 'invalid-response');
  const times = nullableNumberArray(value.time);
  const temperature = nullableNumberArray(value.temperature_2m);
  const apparent = nullableNumberArray(value.apparent_temperature);
  const humidity = nullableNumberArray(value.relative_humidity_2m);
  const probability = nullableNumberArray(value.precipitation_probability);
  const precipitation = nullableNumberArray(value.precipitation);
  const weatherCode = nullableNumberArray(value.weather_code);
  const windSpeed = nullableNumberArray(value.wind_speed_10m);

  return times.flatMap((time, index) =>
    time === null
      ? []
      : [
          {
            time,
            temperature: optionalAt(temperature, index),
            apparentTemperature: optionalAt(apparent, index),
            humidity: optionalAt(humidity, index),
            precipitationProbability: optionalAt(probability, index),
            precipitation: optionalAt(precipitation, index),
            weatherCode: optionalAt(weatherCode, index),
            windSpeed: optionalAt(windSpeed, index),
          },
        ],
  );
}

function parseDaily(value: unknown): DailyForecast[] {
  if (!isRecord(value)) throw new ApiError('Previsão diária ausente.', null, 'invalid-response');
  const times = nullableNumberArray(value.time);
  const codes = nullableNumberArray(value.weather_code);
  const maxima = nullableNumberArray(value.temperature_2m_max);
  const minima = nullableNumberArray(value.temperature_2m_min);
  const precipitation = nullableNumberArray(value.precipitation_sum);
  const sunrise = nullableNumberArray(value.sunrise);
  const sunset = nullableNumberArray(value.sunset);

  return times.flatMap((time, index) =>
    time === null
      ? []
      : [
          {
            time,
            weatherCode: optionalAt(codes, index),
            temperatureMax: optionalAt(maxima, index),
            temperatureMin: optionalAt(minima, index),
            precipitation: optionalAt(precipitation, index),
            sunrise: optionalAt(sunrise, index),
            sunset: optionalAt(sunset, index),
          },
        ],
  );
}

export function parseWeatherResponse(
  value: unknown,
  unitSystem: UnitSystem,
): { current: CurrentWeather; hourly: HourlyPoint[]; daily: DailyForecast[]; timezone: string } {
  if (!isRecord(value))
    throw new ApiError('Resposta meteorológica inválida.', null, 'invalid-response');
  const timezone = safeString(value.timezone);
  if (!timezone) throw new ApiError('Fuso horário ausente.', null, 'invalid-response');
  const hourly = parseHourly(value.hourly);
  const daily = parseDaily(value.daily);
  if (hourly.length === 0 || daily.length === 0)
    throw new ApiError('Previsão sem pontos válidos.', null, 'invalid-response');
  const expected = unitsFor(unitSystem);
  const currentUnits = isRecord(value.current_units) ? value.current_units : {};
  if (
    safeString(currentUnits.temperature_2m) !== expected.temperature ||
    safeString(currentUnits.wind_speed_10m) !== expected.windSpeed
  ) {
    throw new ApiError('Unidades meteorológicas inesperadas.', null, 'invalid-response');
  }
  return { current: parseCurrent(value.current), hourly, daily, timezone };
}

export function parseAirQualityResponse(value: unknown): AirQuality {
  if (!isRecord(value) || !isRecord(value.current)) {
    return { availability: 'missing', time: null, usAqi: null, pm25: null, pm10: null };
  }
  const time = finiteNumber(value.current.time);
  const usAqi = finiteNumber(value.current.us_aqi);
  const pm25 = finiteNumber(value.current.pm2_5);
  const pm10 = finiteNumber(value.current.pm10);
  const hasAnyValue = usAqi !== null || pm25 !== null || pm10 !== null;
  return {
    availability: hasAnyValue ? 'available' : 'missing',
    time,
    usAqi,
    pm25,
    pm10,
  };
}

export function parseGeocodingResponse(value: unknown): Location[] {
  if (!isRecord(value) || !Array.isArray(value.results)) return [];
  return value.results.flatMap((result): Location[] => {
    if (!isRecord(result)) return [];
    const id = finiteInteger(result.id);
    const latitude = finiteNumber(result.latitude);
    const longitude = finiteNumber(result.longitude);
    const name = safeString(result.name);
    const timezone = safeString(result.timezone, 'auto');
    if (
      id === null ||
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !name
    )
      return [];
    return [
      {
        id: String(id),
        name,
        country: safeString(result.country),
        admin1: safeString(result.admin1),
        latitude,
        longitude,
        timezone,
        source: 'geocoding',
      },
    ];
  });
}

export async function searchLocations(query: string, signal: AbortSignal): Promise<Location[]> {
  const normalized = query.normalize('NFC').trim().slice(0, 80);
  if (normalized.length < 2) return [];
  const url = new URL(GEOCODING_ENDPOINT);
  url.search = new URLSearchParams({
    name: normalized,
    count: '8',
    language: 'pt',
    format: 'json',
  }).toString();
  return parseGeocodingResponse(await requestJson(url, signal));
}

export async function fetchWeather(
  location: Location,
  unitSystem: UnitSystem,
  signal: AbortSignal,
): Promise<ReturnType<typeof parseWeatherResponse>> {
  const url = new URL(FORECAST_ENDPOINT);
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    hourly:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_hours: '24',
    forecast_days: '7',
  });
  if (unitSystem === 'imperial') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
    params.set('precipitation_unit', 'inch');
  }
  url.search = params.toString();
  return parseWeatherResponse(await requestJson(url, signal), unitSystem);
}

export async function fetchAirQuality(
  location: Location,
  signal: AbortSignal,
): Promise<AirQuality> {
  const url = new URL(AIR_ENDPOINT);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'us_aqi,pm2_5,pm10',
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_hours: '24',
  }).toString();
  return parseAirQualityResponse(await requestJson(url, signal));
}
