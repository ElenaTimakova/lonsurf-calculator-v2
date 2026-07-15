import lookupTable from './lookupTable.json';
import {
  BEVACIZUMAB_MG_PER_KG,
  BSA_NOT_IN_TABLE_ERROR,
  getRenalLookupKey,
  IMPOSSIBLE_EXPLANATION,
  isRenalValue,
  NUMBER_MSG,
  PACK_SKUS,
  REQUIRED_FIELDS,
  REQUIRED_MSG,
  TREATMENT_DAYS_PER_CYCLE,
} from './constants';
import type {
  BevacizumabResult,
  CalculationResult,
  CalculatorField,
  CalculatorFormValues,
  CalculatorInput,
  CalculatorPackages,
  CalculatorResult,
  CalculatorSuccessResult,
  FieldErrors,
  LookupRow,
  PackAmount,
} from './types';

const LOOKUP_ROWS = lookupTable as LookupRow[];

const lookupMap = new Map<string, LookupRow>();
for (const row of LOOKUP_ROWS) {
  lookupMap.set(`${row.bsa}|${row.renal.trim()}`, row);
}

/** ППТ по формуле из Excel: ROUNDDOWN(0.007184 * вес^0.425 * рост^0.725, 2) */
export function calcBsa(weightKg: number, heightCm: number): number {
  const raw = 0.007184 * weightKg ** 0.425 * heightCm ** 0.725;
  return Math.floor(raw * 100) / 100;
}

export function parseNumber(raw: string): number {
  return parseFloat(raw.trim().replace(',', '.'));
}

/** Округление до N знаков после запятой (математическое). */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function validateField(
  name: CalculatorField,
  value: CalculatorFormValues[CalculatorField],
): string | null {
  if (name === 'renal') {
    if (!value) return REQUIRED_MSG;
    return isRenalValue(value) ? null : REQUIRED_MSG;
  }

  const raw = value.trim();
  if (!raw) return REQUIRED_MSG;

  if (!/^\d+([.,]\d+)?$/.test(raw)) return NUMBER_MSG;

  const numeric = parseNumber(raw);
  if (name === 'days' && (!Number.isInteger(numeric) || numeric <= 0)) {
    return NUMBER_MSG;
  }

  return null;
}

export function validateForm(values: CalculatorFormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of REQUIRED_FIELDS) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

function findLookupRow(bsa: number, renalLabel: string): LookupRow | null {
  return lookupMap.get(`${bsa}|${renalLabel.trim()}`) ?? null;
}

function roundPackAmount(exact: number): number {
  return exact === 0 ? 0 : Math.ceil(exact);
}

function calcPackAmounts(
  cycles: number,
  morning: LookupRow['morning'],
  evening: LookupRow['evening'],
): CalculatorPackages {
  const treatmentDays = cycles * TREATMENT_DAYS_PER_CYCLE;
  const total15 = (morning.p15 + evening.p15) * treatmentDays;
  const total20 = (morning.p20 + evening.p20) * treatmentDays;

  const pack = (total: number, size: 20 | 60): PackAmount => {
    const exact = total / size;
    return { exact, rounded: roundPackAmount(exact) };
  };

  return {
    pack15mg20: pack(total15, 20),
    pack20mg20: pack(total20, 20),
    pack15mg60: pack(total15, 60),
    pack20mg60: pack(total20, 60),
  };
}

function toSuccessResult(bsa: number, row: LookupRow, cycles: number): CalculatorSuccessResult {
  return {
    bsa,
    singleDose: row.singleDose,
    dailyDose: row.dailyDose,
    morningDose: row.morningMg,
    eveningDose: row.eveningMg,
    tablets: {
      morning: { tablet15mg: row.morning.p15, tablet20mg: row.morning.p20 },
      evening: { tablet15mg: row.evening.p15, tablet20mg: row.evening.p20 },
    },
    packages: calcPackAmounts(cycles, row.morning, row.evening),
  };
}

/** Чистая функция расчёта по входным параметрам (для unit-тестов и UI). */
export function calculateCalculatorResult(input: CalculatorInput): CalculatorResult {
  const { weightKg, heightCm, renalFunction, cycles } = input;

  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || cycles <= 0) {
    return { error: IMPOSSIBLE_EXPLANATION };
  }

  const bsa = calcBsa(weightKg, heightCm);
  const renalLookupKey = getRenalLookupKey(renalFunction);

  if (!renalLookupKey) {
    return { error: IMPOSSIBLE_EXPLANATION };
  }

  const row = findLookupRow(bsa, renalLookupKey);

  if (!row) {
    return { error: BSA_NOT_IN_TABLE_ERROR };
  }

  return toSuccessResult(bsa, row, cycles);
}

function calcPacksForUi(
  cycles: number,
  morning: LookupRow['morning'],
  evening: LookupRow['evening'],
) {
  const packages = calcPackAmounts(cycles, morning, evening);
  const byKey: Record<string, PackAmount> = {
    'lon-15-20': packages.pack15mg20,
    'lon-20-20': packages.pack20mg20,
    'lon-15-60': packages.pack15mg60,
    'lon-20-60': packages.pack20mg60,
  };

  return PACK_SKUS.map((sku) => ({
    ...sku,
    exact: byKey[sku.key].exact,
    rounded: byKey[sku.key].rounded,
  }));
}

/** Доза бевацизумаба: округл. вес × 5 мг/кг. Фраза зависит от числа циклов. */
export function computeBevacizumab(weightKg: number, cycles: number): BevacizumabResult {
  const doseMg = Math.round(weightKg) * BEVACIZUMAB_MG_PER_KG;
  const phrase =
    cycles <= 1
      ? `${doseMg} мг Бевацизумаба в/в в 1 и 15 день цикла терапии`
      : `${doseMg} мг Бевацизумаба в 1 и 15 день каждого цикла терапии`;
  return { doseMg, cycles, phrase };
}

export function computeDose(values: CalculatorFormValues): CalculationResult {
  const weight = parseNumber(values.weight);
  const height = parseNumber(values.height);
  const cycles = parseInt(values.days.replace(',', '.'), 10);

  if (!values.renal || !isRenalValue(values.renal)) {
    return { impossible: true, reason: IMPOSSIBLE_EXPLANATION };
  }

  const result = calculateCalculatorResult({
    weightKg: weight,
    heightCm: height,
    renalFunction: values.renal,
    cycles,
  });

  if ('error' in result) {
    return { impossible: true, reason: result.error };
  }

  const { tablets } = result;

  const success: CalculationResult = {
    impossible: false,
    bsa: result.bsa,
    singleDose: result.singleDose,
    dailyDose: result.dailyDose,
    morningMg: result.morningDose,
    eveningMg: result.eveningDose,
    morning: {
      p15: tablets.morning.tablet15mg,
      p20: tablets.morning.tablet20mg,
    },
    evening: {
      p15: tablets.evening.tablet15mg,
      p20: tablets.evening.tablet20mg,
    },
    packs: calcPacksForUi(cycles, {
      p15: tablets.morning.tablet15mg,
      p20: tablets.morning.tablet20mg,
    }, {
      p15: tablets.evening.tablet15mg,
      p20: tablets.evening.tablet20mg,
    }),
  };

  if (values.bevacizumab) {
    success.bevacizumab = computeBevacizumab(weight, cycles);
  }

  return success;
}

export function formatNumber(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits).replace('.', ',') : '—';
}
