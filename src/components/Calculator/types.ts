export type RenalValue = 'normal' | 'mild' | 'moderate' | 'severe';

export type CalculatorField = 'weight' | 'height' | 'renal' | 'days';

export type CalculatorFormValues = {
  weight: string;
  height: string;
  renal: RenalValue | '';
  days: string;
};

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

export type PackAmount = {
  exact: number;
  rounded: number;
};

export type PackResult = PackSku & PackAmount;

export type CalculatorTablets = {
  morning: { tablet15mg: number; tablet20mg: number };
  evening: { tablet15mg: number; tablet20mg: number };
};

export type CalculatorPackages = {
  pack15mg20: PackAmount;
  pack20mg20: PackAmount;
  pack15mg60: PackAmount;
  pack20mg60: PackAmount;
};

export type CalculatorInput = {
  weightKg: number;
  heightCm: number;
  renalFunction: RenalValue;
  cycles: number;
};

export type CalculatorSuccessResult = {
  bsa: number;
  singleDose: number;
  dailyDose: number;
  morningDose: number;
  eveningDose: number;
  tablets: CalculatorTablets;
  packages: CalculatorPackages;
};

export type CalculatorErrorResult = {
  error: string;
};

export type CalculatorResult = CalculatorSuccessResult | CalculatorErrorResult;

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
