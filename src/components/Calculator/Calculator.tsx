import { useState, type FormEvent, type ReactNode } from 'react';
import {
  computeDose,
  formatNumber,
  validateField,
  validateForm,
} from './calculatorLogic';
import {
  BEVACIZUMAB_CHECKBOX_LABEL,
  BEVACIZUMAB_DOSE_LABEL,
  BEVACIZUMAB_SECTION_TITLE,
  COURSE_DURATION_LABEL,
  DOSAGE_REGIMEN_NOTE_AFTER,
  DOSAGE_REGIMEN_NOTE_BEFORE,
  DOSAGE_REGIMEN_NOTE_HIGHLIGHT,
  IMPOSSIBLE_EXPLANATION,
  IMPOSSIBLE_TITLE,
  INITIAL_FORM,
  REQUIRED_FIELDS,
  isRenalValue,
  RENAL_OPTIONS,
} from './constants';
import styles from './Calculator.module.css';
import type {
  CalculationSuccess,
  CalculatorField,
  CalculatorFormValues,
  CalculatorProps,
  CalculatorView,
  FieldErrors,
} from './types';

function SunIcon() {
  return (
    <span className="lc-metric__icon" aria-label="утро">
      <svg viewBox="0 0 24 24" fill="none" stroke="#E98D01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="#FFBB54" stroke="#E98D01" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
      </svg>
    </span>
  );
}

function MoonIcon() {
  return (
    <span className="lc-metric__icon" aria-label="вечер">
      <svg viewBox="0 0 24 24" fill="#2D2A52" stroke="#2D2A52" strokeWidth="1" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </span>
  );
}

function Field({
  id,
  label,
  unit,
  error,
  children,
}: {
  id: string;
  label: string;
  unit?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`lc-field${error ? ' is-error' : ''}`}>
      <label className="lc-field__label" htmlFor={id}>
        {label}
        <span className="lc-field__required" aria-label="обязательно">
          *
        </span>
      </label>
      <div className="lc-field__control">
        {children}
        {unit && <span className="lc-field__unit">{unit}</span>}
      </div>
      {error && <p className="lc-field__error">{error}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  extra,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: 'sun' | 'moon';
  extra?: ReactNode;
}) {
  return (
    <div className="lc-metric">
      <div className="lc-metric__head">
        <span className="lc-metric__label">{label}</span>
        {icon === 'sun' && <SunIcon />}
        {icon === 'moon' && <MoonIcon />}
      </div>
      <div className="lc-metric__value">
        <span className="lc-metric__num">{value}</span>
        {unit && <span className="lc-metric__unit">{unit}</span>}
      </div>
      {extra}
    </div>
  );
}

function Section({
  title,
  cols,
  children,
}: {
  title: string;
  cols: 4 | 5;
  children: ReactNode;
}) {
  return (
    <section className="lc-section">
      <h3 className="lc-section__title">{title}</h3>
      <div className={`lc-section__row lc-section__row--${cols}`}>{children}</div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="lc-empty">
      <div className="lc-empty__icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="8" y2="10.01" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
          <line x1="16" y1="10" x2="16" y2="10.01" />
          <line x1="8" y1="14" x2="8" y2="14.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="16" y1="14" x2="16" y2="14.01" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </div>
      <p className="lc-empty__text">
        Введите параметры пациента — калькулятор рассчитает рекомендованную стартовую дозу,
        разбивку приёмов и количество упаковок на выбранное число циклов.
      </p>
    </div>
  );
}

function ImpossibleState({ text }: { text: string }) {
  return (
    <div className="lc-impossible">
      <div className="lc-impossible__icon" aria-hidden="true">
        !
      </div>
      <h4 className="lc-impossible__title">{IMPOSSIBLE_TITLE}</h4>
      <p className="lc-impossible__text">{text}</p>
    </div>
  );
}

function PackCard({ pack }: { pack: CalculationSuccess['packs'][number] }) {
  return (
    <MetricCard
      label={pack.label}
      value={formatNumber(pack.exact, 1)}
      unit="шт"
      extra={
        <div className="lc-metric__rounded">
          <small>≈</small>
          {pack.rounded} шт
        </div>
      }
    />
  );
}

function PacksSection({ packs }: { packs: CalculationSuccess['packs'] }) {
  const packsByGroup = {
    20: packs.filter((pack) => pack.pack === 20),
    60: packs.filter((pack) => pack.pack === 60),
  };

  return (
    <section className="lc-section">
      <div className="lc-section__head">
        <h3 className="lc-section__title">Количество упаковок</h3>
        <p className="lc-section__hint">
          На выбранное число циклов достаточно <strong>одного</strong> из вариантов комплектации
        </p>
      </div>

      <div className="lc-packs">
        <div className="lc-packs__group">
          <div className="lc-packs__group-title">Вариант 1 · упаковки №20</div>
          <div className="lc-packs__cards">
            {packsByGroup[20].map((pack) => (
              <PackCard key={pack.key} pack={pack} />
            ))}
          </div>
        </div>

        <div className="lc-packs__divider" aria-hidden="true">
          <span>или</span>
        </div>

        <div className="lc-packs__group">
          <div className="lc-packs__group-title">Вариант 2 · упаковки №60</div>
          <div className="lc-packs__cards">
            {packsByGroup[60].map((pack) => (
              <PackCard key={pack.key} pack={pack} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BevacizumabSection({ data }: { data: NonNullable<CalculationSuccess['bevacizumab']> }) {
  return (
    <section className="lc-section lc-section--bevacizumab">
      <h3 className="lc-section__title">{BEVACIZUMAB_SECTION_TITLE}</h3>
      <div className="lc-bevacizumab">
        <div className="lc-bevacizumab__metric">
          <span className="lc-metric__label">{BEVACIZUMAB_DOSE_LABEL}</span>
          <div className="lc-metric__value">
            <span className="lc-metric__num">{data.doseMg}</span>
            <span className="lc-metric__unit">мг</span>
          </div>
        </div>
        <p className="lc-bevacizumab__phrase">{data.phrase}</p>
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: CalculationSuccess }) {
  return (
    <div className="lc-result">
      <Section title="Расчёт дозы" cols={5}>
        <MetricCard label="Площадь поверхности тела" value={formatNumber(result.bsa, 2)} unit="м²" />
        <MetricCard label="Разовая доза" value={result.singleDose} unit="мг" />
        <MetricCard label="Суточная доза" value={result.dailyDose} unit="мг" />
        <MetricCard label="Приём утром" value={result.morningMg} unit="мг" icon="sun" />
        <MetricCard label="Приём вечером" value={result.eveningMg} unit="мг" icon="moon" />
      </Section>

      <Section title="Количество таблеток" cols={4}>
        <MetricCard label="Таблетки 15 мг утром" value={result.morning.p15} unit="шт" icon="sun" />
        <MetricCard label="Таблетки 20 мг утром" value={result.morning.p20} unit="шт" icon="sun" />
        <MetricCard label="Таблетки 15 мг вечером" value={result.evening.p15} unit="шт" icon="moon" />
        <MetricCard label="Таблетки 20 мг вечером" value={result.evening.p20} unit="шт" icon="moon" />
      </Section>

      <PacksSection packs={result.packs} />

      {result.bevacizumab && <BevacizumabSection data={result.bevacizumab} />}
    </div>
  );
}

export function Calculator({ className = '' }: CalculatorProps) {
  const [values, setValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [view, setView] = useState<CalculatorView>('initial');
  const [result, setResult] = useState<CalculationSuccess | null>(null);
  const [impossibleReason, setImpossibleReason] = useState(IMPOSSIBLE_EXPLANATION);
  const anyValue = REQUIRED_FIELDS.some((field) => Boolean(values[field]));
  const isFormLocked = view === 'success';

  const setField = <K extends keyof CalculatorFormValues>(name: K) => (value: CalculatorFormValues[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if ((errors as Record<string, string | undefined>)[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as CalculatorField];
        return next;
      });
    }
  };

  const onFieldBlur = (name: CalculatorField) => () => {
    const error = validateField(name, values[name]);
    if (error) setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formErrors = validateForm(values);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setView('initial');
      return;
    }

    setErrors({});
    const calculation = computeDose(values);
    if (calculation.impossible) {
      setResult(null);
      setImpossibleReason(calculation.reason);
      setView('impossible');
      return;
    }

    setResult(calculation);
    setView('success');

    if (window.matchMedia('(max-width: 768px)').matches) {
      requestAnimationFrame(() => {
        window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      });
    }
  };

  const onReset = () => {
    setValues(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setImpossibleReason(IMPOSSIBLE_EXPLANATION);
    setView('initial');
  };

  return (
    <section
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      aria-labelledby="dose-calc-title"
    >
      <h2 className="lc__title" id="dose-calc-title">
        Расчёт дозы Лонсурф®
      </h2>

      <div className="lc__layout">
        <div className="lc__col">
          <form
            className={`lc-form${isFormLocked ? ' is-locked' : ''}`}
            onSubmit={onSubmit}
            noValidate
          >
            <div className="lc-form__fields">
              <Field id="weight" label="Вес" unit="кг" error={errors.weight}>
                <input
                  className="lc-field__input"
                  id="weight"
                  name="weight"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Например, 70"
                  value={values.weight}
                  disabled={isFormLocked}
                  onChange={(e) => setField('weight')(e.target.value)}
                  onBlur={onFieldBlur('weight')}
                />
              </Field>

              <Field id="height" label="Рост" unit="см" error={errors.height}>
                <input
                  className="lc-field__input"
                  id="height"
                  name="height"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Например, 180"
                  value={values.height}
                  disabled={isFormLocked}
                  onChange={(e) => setField('height')(e.target.value)}
                  onBlur={onFieldBlur('height')}
                />
              </Field>

              <Field id="renal" label="Почечная функция" error={errors.renal}>
                <select
                  className="lc-field__select"
                  id="renal"
                  name="renal"
                  value={values.renal}
                  disabled={isFormLocked}
                  onChange={(e) => {
                    const next = e.target.value;
                    setField('renal')(isRenalValue(next) ? next : '');
                  }}
                  onBlur={onFieldBlur('renal')}
                >
                  <option value="">Выберите степень функции</option>
                  {RENAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="days" label={COURSE_DURATION_LABEL} error={errors.days}>
                <input
                  className="lc-field__input"
                  id="days"
                  name="days"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Например, 1"
                  value={values.days}
                  disabled={isFormLocked}
                  onChange={(e) => setField('days')(e.target.value)}
                  onBlur={onFieldBlur('days')}
                />
              </Field>

              <label className={`lc-checkbox${isFormLocked ? ' is-locked' : ''}`}>
                <input
                  type="checkbox"
                  className="lc-checkbox__input"
                  name="bevacizumab"
                  checked={values.bevacizumab}
                  disabled={isFormLocked}
                  onChange={(e) => setField('bevacizumab')(e.target.checked)}
                />
                <span className="lc-checkbox__box" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <polyline points="4 10 8.5 14.5 16 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="lc-checkbox__text">{BEVACIZUMAB_CHECKBOX_LABEL}</span>
              </label>
            </div>

            <p className="lc-form__note">
              {DOSAGE_REGIMEN_NOTE_BEFORE}
              <strong>{DOSAGE_REGIMEN_NOTE_HIGHLIGHT}</strong>
              {DOSAGE_REGIMEN_NOTE_AFTER}
            </p>

            <div className="lc__actions">
              <button
                type="button"
                className={`lc-btn lc-btn--ghost${isFormLocked || anyValue ? ' lc-btn--reset-prominent' : ''}`}
                onClick={onReset}
                disabled={!isFormLocked && !anyValue}
              >
                Сбросить
              </button>
              <button type="submit" className="lc-btn lc-btn--primary" disabled={isFormLocked}>
                Рассчитать дозу
              </button>
            </div>
            <div className="lc-form__spacer" aria-hidden="true" />
          </form>
        </div>

        <div className="lc__col">
          {view === 'success' && result && <ResultPanel result={result} />}
          {view === 'impossible' && <ImpossibleState text={impossibleReason} />}
          {view === 'initial' && <EmptyState />}
        </div>
      </div>
    </section>
  );
}
