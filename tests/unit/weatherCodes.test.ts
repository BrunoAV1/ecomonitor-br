import { describe, expect, it } from 'vitest';
import { describeWeatherCode } from '../../src/utils/weatherCodes';

describe('códigos WMO', () => {
  it('traduz códigos representativos', () => {
    expect(describeWeatherCode(0).label).toBe('Céu limpo');
    expect(describeWeatherCode(63).tone).toBe('rain');
    expect(describeWeatherCode(95).tone).toBe('storm');
  });

  it('tem fallback compreensível', () => {
    expect(describeWeatherCode(999).label).toBe('Condição não informada');
    expect(describeWeatherCode(null).shortLabel).toBe('Sem condição');
  });
});
