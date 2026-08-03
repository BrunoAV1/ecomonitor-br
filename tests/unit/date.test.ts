import { describe, expect, it } from 'vitest';
import { formatLocalTime, nearestTimestampIndex } from '../../src/utils/date';

describe('datas globais', () => {
  it('formata o mesmo instante no fuso da cidade', () => {
    const timestamp = 1_785_780_000;
    expect(formatLocalTime(timestamp, 'America/Sao_Paulo')).not.toBe(
      formatLocalTime(timestamp, 'Asia/Tokyo'),
    );
  });

  it('seleciona o horário realmente mais próximo', () => {
    expect(nearestTimestampIndex([100, 200, 300], 249)).toBe(1);
    expect(nearestTimestampIndex([100, 200, 300], 251)).toBe(2);
    expect(nearestTimestampIndex([], 250)).toBe(-1);
  });
});
