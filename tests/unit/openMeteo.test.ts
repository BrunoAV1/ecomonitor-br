import { describe, expect, it } from 'vitest';
import {
  parseAirQualityResponse,
  parseGeocodingResponse,
  parseWeatherResponse,
} from '../../src/api/openMeteo';

const baseWeather = {
  timezone: 'Europe/Lisbon',
  current_units: { temperature_2m: '°C', wind_speed_10m: 'km/h' },
  current: {
    time: 1_785_780_000,
    temperature_2m: 24,
    apparent_temperature: 25,
    relative_humidity_2m: 60,
    wind_speed_10m: 12,
    wind_direction_10m: 270,
    precipitation: 0,
    weather_code: 1,
    is_day: 1,
  },
  hourly: {
    time: [1_785_780_000, 1_785_783_600],
    temperature_2m: [24],
    apparent_temperature: [25, 24],
    relative_humidity_2m: [60, 64],
    precipitation_probability: [10, null],
    precipitation: [0, 0],
    weather_code: [1, 2],
    wind_speed_10m: [12, 10],
  },
  daily: {
    time: [1_785_715_200],
    weather_code: [1],
    temperature_2m_max: [26],
    temperature_2m_min: [17],
    precipitation_sum: [0],
    sunrise: [1_785_735_000],
    sunset: [1_785_786_000],
  },
};

describe('normalização Open-Meteo', () => {
  it('preserva timestamps Unix e tolera séries com tamanhos diferentes', () => {
    const result = parseWeatherResponse(baseWeather, 'metric');
    expect(result.timezone).toBe('Europe/Lisbon');
    expect(result.hourly).toHaveLength(2);
    expect(result.hourly[1]?.temperature).toBeNull();
  });

  it('usa current para AQI em vez do último ponto diário', () => {
    const result = parseAirQualityResponse({
      current: { time: 100, us_aqi: 42, pm2_5: 8.2, pm10: 14 },
      hourly: { time: [100, 200], us_aqi: [42, 199] },
    });
    expect(result.usAqi).toBe(42);
    expect(result.time).toBe(100);
  });

  it('descarta localidades inválidas sem interpretar conteúdo como HTML', () => {
    const locations = parseGeocodingResponse({
      results: [
        {
          id: 1,
          name: '<img src=x onerror=alert(1)>',
          latitude: 10,
          longitude: 20,
          country: 'Teste',
          timezone: 'UTC',
        },
        { id: 2, name: 'Inválida', latitude: 999, longitude: 20 },
      ],
    });
    expect(locations).toHaveLength(1);
    expect(locations[0]?.name).toContain('<img');
  });
});
