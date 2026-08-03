import { describe, expect, it } from 'vitest';
import { classifyAqi } from '../../src/utils/aqi';

describe('classifyAqi', () => {
  it.each([
    [0, 'good'],
    [50, 'good'],
    [51, 'moderate'],
    [100, 'moderate'],
    [101, 'sensitive'],
    [150, 'sensitive'],
    [151, 'unhealthy'],
    [200, 'unhealthy'],
    [201, 'very-unhealthy'],
    [300, 'very-unhealthy'],
    [301, 'hazardous'],
  ] as const)('classifica %s como %s', (value, level) => {
    expect(classifyAqi(value)?.level).toBe(level);
  });

  it('trata valores ausentes ou inválidos', () => {
    expect(classifyAqi(null)).toBeNull();
    expect(classifyAqi(Number.NaN)).toBeNull();
    expect(classifyAqi(-1)).toBeNull();
  });
});
