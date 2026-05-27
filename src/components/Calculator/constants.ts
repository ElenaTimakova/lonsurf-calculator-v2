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
export const WEIGHT_MAX_MSG = 'Вес должен быть не более 150 кг';

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

export const PACK_SKUS: PackSku[] = [
  { key: 'lon-15-20', label: 'Лонсурф® 15 мг №20', dosage: 15, pack: 20 },
  { key: 'lon-20-20', label: 'Лонсурф® 20 мг №20', dosage: 20, pack: 20 },
  { key: 'lon-15-60', label: 'Лонсурф® 15 мг №60', dosage: 15, pack: 60 },
  { key: 'lon-20-60', label: 'Лонсурф® 20 мг №60', dosage: 20, pack: 60 },
];

export const IMPOSSIBLE_LOOKUP_MSG =
  'Невозможно рассчитать дозу для выбранных параметров. Скорректируйте вес, рост или степень почечной недостаточности.';
