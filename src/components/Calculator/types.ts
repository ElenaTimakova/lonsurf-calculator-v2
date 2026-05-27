export type RenalValue = 'normal' | 'mild' | 'moderate' | 'severe';

export type CalculatorField = 'weight' | 'height' | 'renal' | 'days';

export type CalculatorFormValues = Record<CalculatorField, string>;

export type CalculatorView = 'initial' | 'success' | 'impossible';

export type TabletCount = {
  p15: number;
  p20: number;
};

export type PackSku = {
  key: string;
  label: string;
  dosage: 15 | 20;
  pack: 20 | 60;
};

export type PackResult = PackSku & {
  raw: number;
  rounded: number;
};

export type LookupRow = {
  key: string;
  bsa: number;
  renal: string;
  singleDose: number;
  dailyDose: number;
  morningMg: number;
  eveningMg: number;
  morning: TabletCount;
  evening: TabletCount;
};

export type CalculationSuccess = {
  impossible: false;
  bsa: number;
  singleDose: number;
  dailyDose: number;
  morningMg: number;
  eveningMg: number;
  morning: TabletCount;
  evening: TabletCount;
  packs: PackResult[];
};

export type CalculationImpossible = {
  impossible: true;
  reason: string;
};

export type CalculationResult = CalculationSuccess | CalculationImpossible;

export type FieldErrors = Partial<Record<CalculatorField, string>>;

export type CalculatorProps = {
  className?: string;
};
