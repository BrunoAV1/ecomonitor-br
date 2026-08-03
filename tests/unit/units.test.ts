import { describe, expect, it } from 'vitest';
import { compassDirection, formatMeasurement, unitsFor } from '../../src/utils/units';

describe('unidades', () => {
  it('expõe unidades coerentes por sistema', () => {
    expect(unitsFor('metric')).toEqual({
      temperature: '°C',
      windSpeed: 'km/h',
      precipitation: 'mm',
    });
    expect(unitsFor('imperial')).toEqual({
      temperature: '°F',
      windSpeed: 'mph',
      precipitation: 'in',
    });
  });

  it('formata valores ausentes e direções', () => {
    expect(formatMeasurement(null, '°C')).toBe('—');
    expect(compassDirection(0)).toBe('N');
    expect(compassDirection(90)).toBe('L');
    expect(compassDirection(225)).toBe('SO');
  });
});
