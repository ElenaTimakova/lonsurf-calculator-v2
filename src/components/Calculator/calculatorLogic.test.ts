import { describe, expect, it } from 'vitest';
import { BSA_NOT_IN_TABLE_ERROR } from './constants';
import {
  calcBsa,
  calculateCalculatorResult,
  roundToDecimals,
} from './calculatorLogic';
import type {
  CalculatorInput,
  CalculatorPackages,
  CalculatorSuccessResult,
} from './types';

function expectSuccess(
  input: CalculatorInput,
  expected: CalculatorSuccessResult,
) {
  const result = calculateCalculatorResult(input);

  expect(result).not.toHaveProperty('error');
  if ('error' in result) return;

  expect(result.bsa).toBe(expected.bsa);
  expect(result.singleDose).toBe(expected.singleDose);
  expect(result.dailyDose).toBe(expected.dailyDose);
  expect(result.morningDose).toBe(expected.morningDose);
  expect(result.eveningDose).toBe(expected.eveningDose);
  expect(result.tablets).toEqual(expected.tablets);

  const packKeys = Object.keys(expected.packages) as (keyof CalculatorPackages)[];
  for (const key of packKeys) {
    const pack = result.packages[key];
    const exp = expected.packages[key];

    if (Number.isInteger(exp.exact)) {
      expect(pack.exact).toBe(exp.exact);
    } else {
      expect(pack.exact).toBeCloseTo(exp.exact, 3);
    }

    expect(pack.rounded).toBe(exp.rounded);
  }
}

describe('calcBsa', () => {
  it('rounds BSA down to 2 decimal places', () => {
    expect(calcBsa(47, 180)).toBe(1.59);
    expect(calcBsa(104, 180)).toBe(2.23);
    expect(calcBsa(70, 170)).toBe(1.8);
  });
});

describe('calculateCalculatorResult', () => {
  it('test 1 — NEW file example: 47 kg, 180 cm, norm, 1 cycle', () => {
    expectSuccess(
      {
        weightKg: 47,
        heightCm: 180,
        renalFunction: 'Норма',
        cycles: 1,
      },
      {
        bsa: 1.59,
        singleDose: 55,
        dailyDose: 110,
        morningDose: 55,
        eveningDose: 55,
        tablets: {
          morning: { tablet15mg: 1, tablet20mg: 2 },
          evening: { tablet15mg: 1, tablet20mg: 2 },
        },
        packages: {
          pack15mg20: { exact: 1, rounded: 1 },
          pack20mg20: { exact: 2, rounded: 2 },
          pack15mg60: { exact: 0.333, rounded: 1 },
          pack20mg60: { exact: 0.667, rounded: 1 },
        },
      },
    );
  });

  it('test 2 — moderate renal, 2 cycles: 70 kg, 170 cm', () => {
    expectSuccess(
      {
        weightKg: 70,
        heightCm: 170,
        renalFunction: 'Средняя степень тяжести',
        cycles: 2,
      },
      {
        bsa: 1.8,
        singleDose: 60,
        dailyDose: 120,
        morningDose: 60,
        eveningDose: 60,
        tablets: {
          morning: { tablet15mg: 0, tablet20mg: 3 },
          evening: { tablet15mg: 0, tablet20mg: 3 },
        },
        packages: {
          pack15mg20: { exact: 0, rounded: 0 },
          pack20mg20: { exact: 6, rounded: 6 },
          pack15mg60: { exact: 0, rounded: 0 },
          pack20mg60: { exact: 2, rounded: 2 },
        },
      },
    );
  });

  it('test 3 — severe renal, 3 cycles: 95 kg, 190 cm', () => {
    expectSuccess(
      {
        weightKg: 95,
        heightCm: 190,
        renalFunction: 'Тяжелая степень',
        cycles: 3,
      },
      {
        bsa: 2.23,
        singleDose: 45,
        dailyDose: 90,
        morningDose: 45,
        eveningDose: 45,
        tablets: {
          morning: { tablet15mg: 3, tablet20mg: 0 },
          evening: { tablet15mg: 3, tablet20mg: 0 },
        },
        packages: {
          pack15mg20: { exact: 9, rounded: 9 },
          pack20mg20: { exact: 0, rounded: 0 },
          pack15mg60: { exact: 3, rounded: 3 },
          pack20mg60: { exact: 0, rounded: 0 },
        },
      },
    );
  });

  it('test 4 — mild renal, high BSA: 120 kg, 180 cm, 1 cycle', () => {
    expectSuccess(
      {
        weightKg: 120,
        heightCm: 180,
        renalFunction: 'Легкая степень тяжести',
        cycles: 1,
      },
      {
        bsa: 2.37,
        singleDose: 80,
        dailyDose: 160,
        morningDose: 80,
        eveningDose: 80,
        tablets: {
          morning: { tablet15mg: 0, tablet20mg: 4 },
          evening: { tablet15mg: 0, tablet20mg: 4 },
        },
        packages: {
          pack15mg20: { exact: 0, rounded: 0 },
          pack20mg20: { exact: 4, rounded: 4 },
          pack15mg60: { exact: 0, rounded: 0 },
          pack20mg60: { exact: 1.333, rounded: 2 },
        },
      },
    );
  });

  it('test 5 — old weight example with NEW cycles logic: 50 kg, 180 cm, norm, 1 cycle', () => {
    expectSuccess(
      {
        weightKg: 50,
        heightCm: 180,
        renalFunction: 'Норма',
        cycles: 1,
      },
      {
        bsa: 1.63,
        singleDose: 55,
        dailyDose: 110,
        morningDose: 55,
        eveningDose: 55,
        tablets: {
          morning: { tablet15mg: 1, tablet20mg: 2 },
          evening: { tablet15mg: 1, tablet20mg: 2 },
        },
        packages: {
          pack15mg20: { exact: 1, rounded: 1 },
          pack20mg20: { exact: 2, rounded: 2 },
          pack15mg60: { exact: 0.333, rounded: 1 },
          pack20mg60: { exact: 0.667, rounded: 1 },
        },
      },
    );
  });

  it('test 6 — mild renal, mixed tablets: 80 kg, 165 cm, 2 cycles', () => {
    expectSuccess(
      {
        weightKg: 80,
        heightCm: 165,
        renalFunction: 'Легкая степень тяжести',
        cycles: 2,
      },
      {
        bsa: 1.87,
        singleDose: 65,
        dailyDose: 130,
        morningDose: 65,
        eveningDose: 65,
        tablets: {
          morning: { tablet15mg: 3, tablet20mg: 1 },
          evening: { tablet15mg: 3, tablet20mg: 1 },
        },
        packages: {
          pack15mg20: { exact: 6, rounded: 6 },
          pack20mg20: { exact: 2, rounded: 2 },
          pack15mg60: { exact: 2, rounded: 2 },
          pack20mg60: { exact: 0.667, rounded: 1 },
        },
      },
    );
  });

  it('negative test 1 — BSA above table (130 kg, 180 cm), no nearest match', () => {
    expect(calcBsa(130, 180)).toBe(2.45);

    const result = calculateCalculatorResult({
      weightKg: 130,
      heightCm: 180,
      renalFunction: 'Норма',
      cycles: 1,
    });

    expect(result).toEqual({ error: BSA_NOT_IN_TABLE_ERROR });
    expect(result).not.toHaveProperty('singleDose');
  });

  it('negative test 2 — BSA below table (15 kg, 160 cm), no nearest match', () => {
    expect(calcBsa(15, 160)).toBe(0.89);

    const result = calculateCalculatorResult({
      weightKg: 15,
      heightCm: 160,
      renalFunction: 'Норма',
      cycles: 1,
    });

    expect(result).toEqual({ error: BSA_NOT_IN_TABLE_ERROR });
    expect(result).not.toHaveProperty('singleDose');
  });

  it('returns BSA table error when lookup row is not found (no nearest match)', () => {
    const result = calculateCalculatorResult({
      weightKg: 30,
      heightCm: 120,
      renalFunction: 'Норма',
      cycles: 1,
    });

    expect(result).toEqual({ error: BSA_NOT_IN_TABLE_ERROR });
  });

  it('returns error for unknown renal function label', () => {
    const result = calculateCalculatorResult({
      weightKg: 70,
      heightCm: 170,
      renalFunction: 'Неизвестная степень',
      cycles: 1,
    });

    expect(result).toHaveProperty('error');
  });
});

describe('roundToDecimals', () => {
  it('rounds to the given number of decimal places', () => {
    expect(roundToDecimals(1.24, 1)).toBe(1.2);
    expect(roundToDecimals(1.25, 1)).toBe(1.3);
    expect(roundToDecimals(2.96, 1)).toBe(3.0);
  });
});
