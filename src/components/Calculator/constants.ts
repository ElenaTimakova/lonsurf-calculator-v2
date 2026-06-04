import type { CalculatorField, CalculatorFormValues, PackSku, RenalValue } from './types';

export const REQUIRED_FIELDS: CalculatorField[] = ['weight', 'height', 'renal', 'days'];

export const INITIAL_FORM: CalculatorFormValues = {
  weight: '',
  height: '',
  renal: '',
  days: '',
};

export const REQUIRED_MSG = 'Поле обязательно для заполнения';
export const NUMBER_MSG = 'Введите число, например, 80';

export const RENAL_VALUES = ['normal', 'mild', 'moderate', 'severe'] as const satisfies readonly RenalValue[];

export const RENAL_OPTIONS: Array<{
  value: RenalValue;
  label: string;
  excelLabel: string;
}> = [
  { value: 'normal', label: 'Норма', excelLabel: 'Норма' },
  { value: 'mild', label: 'Лёгкая степень тяжести', excelLabel: 'Легкая степень тяжести ' },
  { value: 'moderate', label: 'Средняя степень тяжести', excelLabel: 'Средняя степень тяжести' },
  { value: 'severe', label: 'Тяжёлая степень', excelLabel: 'Тяжелая степень ' },
];

/** Ключ строки в lookupTable.json (значение renal из Excel, без опечаток в UI). */
export function getRenalLookupKey(value: RenalValue): string | null {
  const option = RENAL_OPTIONS.find((item) => item.value === value);
  return option ? option.excelLabel.trim() : null;
}

export function isRenalValue(value: string): value is RenalValue {
  return (RENAL_VALUES as readonly string[]).includes(value);
}

/** Дней приёма в одном 28-дневном цикле (дни 1–5 и 8–12), по Excel */
export const TREATMENT_DAYS_PER_CYCLE = 10;

export const COURSE_DURATION_LABEL =
  'Ожидаемая длительность курса терапии, число циклов / месяцев';

export const DOSAGE_REGIMEN_NOTE_BEFORE =
  'Для взрослых пациентов рекомендованная начальная доза Лонсурфа в качестве монотерапии или в комбинации с бевацизумабом составляет 35 мг/м² площади поверхности тела (ППТ) на приём перорально 2 раза в сутки ';

export const DOSAGE_REGIMEN_NOTE_HIGHLIGHT =
  'с 1 по 5 день и с 8 по 12 день (всего 10 дней) каждого 28-дневного цикла';

export const DOSAGE_REGIMEN_NOTE_AFTER =
  ', до прогрессирования заболевания или до развития неприемлемых явлений токсичности.';

export const PACK_SKUS: PackSku[] = [
  { key: 'lon-15-20', label: 'Лонсурф® 15 мг №20', dosage: 15, pack: 20 },
  { key: 'lon-20-20', label: 'Лонсурф® 20 мг №20', dosage: 20, pack: 20 },
  { key: 'lon-15-60', label: 'Лонсурф® 15 мг №60', dosage: 15, pack: 60 },
  { key: 'lon-20-60', label: 'Лонсурф® 20 мг №60', dosage: 20, pack: 60 },
];

export const IMPOSSIBLE_TITLE = 'Невозможно рассчитать дозу для выбранных параметров';

export const IMPOSSIBLE_EXPLANATION = 'Скорректируйте вес или рост для корректного расчета';

export const BSA_NOT_IN_TABLE_ERROR =
  'Рассчитанная площадь поверхности тела выходит за пределы диапазона, предусмотренного таблицей дозировок. Проверьте введенные данные или обратитесь к специалисту.';
