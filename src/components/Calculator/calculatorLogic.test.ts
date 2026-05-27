import { describe, expect, it } from 'vitest';
import { calcBsa, computeDose, roundToDecimals } from './calculatorLogic';

describe('calculatorLogic (Excel)', () => {
  it('calculates BSA with ROUNDDOWN to 2 decimals', () => {
    expect(calcBsa(104, 180)).toBe(2.23);
  });

  it('matches Excel example: 104 kg, 180 cm, moderate renal, 10 days', () => {
    const result = computeDose({
      weight: '104',
      height: '180',
      renal: 'moderate',
      days: '10',
    });

    expect(result.impossible).toBe(false);
    if (result.impossible) return;

    expect(result.bsa).toBe(2.23);
    expect(result.singleDose).toBe(75);
    expect(result.dailyDose).toBe(150);
    expect(result.morningMg).toBe(75);
    expect(result.eveningMg).toBe(75);
    expect(result.morning).toEqual({ p15: 1, p20: 3 });
    expect(result.evening).toEqual({ p15: 1, p20: 3 });

    const pack15x20 = result.packs.find((p) => p.key === 'lon-15-20');
    const pack20x20 = result.packs.find((p) => p.key === 'lon-20-20');

    expect(pack15x20?.raw).toBe(1);
    expect(pack15x20?.rounded).toBe(1);
    expect(pack20x20?.raw).toBe(3);
    expect(pack20x20?.rounded).toBe(3);
  });

  it('rounds pack raw value to 1 decimal place', () => {
    expect(roundToDecimals(1.24, 1)).toBe(1.2);
    expect(roundToDecimals(1.25, 1)).toBe(1.3);
    expect(roundToDecimals(2.96, 1)).toBe(3.0);
  });

  it('returns impossible when BSA is out of lookup range', () => {
    const result = computeDose({
      weight: '30',
      height: '120',
      renal: 'normal',
      days: '28',
    });

    expect(result.impossible).toBe(true);
  });
});
