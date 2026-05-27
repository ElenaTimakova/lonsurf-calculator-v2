import lookupTable from './lookupTable.json';
import {
  IMPOSSIBLE_LOOKUP_MSG,
  NUMBER_MSG,
  PACK_SKUS,
  REQUIRED_FIELDS,
  REQUIRED_MSG,
  RENAL_OPTIONS,
  WEIGHT_MAX_MSG,
} from './constants';
import type {
  CalculationResult,
  CalculatorField,
  CalculatorFormValues,
  FieldErrors,
  LookupRow,
  RenalValue,
} from './types';

const LOOKUP_ROWS = lookupTable as LookupRow[];

const lookupMap = new Map<string, LookupRow>();
for (const row of LOOKUP_ROWS) {
  lookupMap.set(`${row.bsa}|${row.renal}`, row);
}

const renalByValue = new Map<RenalValue, string>(
  RENAL_OPTIONS.map((option) => [option.value, option.excelLabel]),
);

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

export function validateField(name: CalculatorField, raw: string): string | null {
  const value = raw.trim();
  if (!value) return REQUIRED_MSG;
  if (name === 'renal') return null;

  if (!/^\d+([.,]\d+)?$/.test(value)) return NUMBER_MSG;

  const numeric = parseNumber(value);
  if (name === 'weight' && numeric > 150) return WEIGHT_MAX_MSG;
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

function findLookupRow(bsa: number, renalValue: RenalValue): LookupRow | null {
  const renalLabel = renalByValue.get(renalValue);
  if (!renalLabel) return null;
  return lookupMap.get(`${bsa}|${renalLabel}`) ?? null;
}

function calcPacks(
  days: number,
  morning: LookupRow['morning'],
  evening: LookupRow['evening'],
) {
  const total15 = (morning.p15 + evening.p15) * days;
  const total20 = (morning.p20 + evening.p20) * days;

  return PACK_SKUS.map((sku) => {
    const total = sku.dosage === 15 ? total15 : total20;
    const exact = total / sku.pack;
    const raw = roundToDecimals(exact, 1);
    return { ...sku, raw, rounded: Math.ceil(exact) };
  });
}

export function computeDose(values: CalculatorFormValues): CalculationResult {
  const weight = parseNumber(values.weight);
  const height = parseNumber(values.height);
  const days = parseInt(values.days.replace(',', '.'), 10);
  const renalValue = values.renal as RenalValue;

  if (!renalByValue.has(renalValue)) {
    return { impossible: true, reason: 'Не выбрана почечная функция.' };
  }

  const bsa = calcBsa(weight, height);
  const row = findLookupRow(bsa, renalValue);

  if (!row) {
    return { impossible: true, reason: IMPOSSIBLE_LOOKUP_MSG };
  }

  return {
    impossible: false,
    bsa,
    singleDose: row.singleDose,
    dailyDose: row.dailyDose,
    morningMg: row.morningMg,
    eveningMg: row.eveningMg,
    morning: row.morning,
    evening: row.evening,
    packs: calcPacks(days, row.morning, row.evening),
  };
}

export function formatNumber(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits).replace('.', ',') : '—';
}
