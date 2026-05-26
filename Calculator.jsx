/* =============================================================
   <DoseCalculator /> — React-компонент калькулятора Лонсурф®.
   Самодостаточный блок: разметка + стейт + 3 состояния
   (initial / success / impossible).
   Финальная фарма-логика реализуется разработчиком —
   см. функцию compute() ниже как demo.
   ============================================================= */

import { useState } from 'react';
import './Calculator.css';

const RENAL_OPTIONS = [
  { value: 'normal',   label: 'Норма',                   perM2: 35, maxDaily: 160 },
  { value: 'mild',     label: 'Лёгкая степень тяжести',  perM2: 35, maxDaily: 160 },
  { value: 'moderate', label: 'Средняя степень тяжести', perM2: 30, maxDaily: 120 },
  { value: 'severe',   label: 'Тяжёлая степень',         perM2: 20, maxDaily: 80  },
];

const PACK_SKUS = [
  { key: 'lon-15-20', label: 'Лонсурф® 15 мг №20', dosage: 15, pack: 20 },
  { key: 'lon-20-20', label: 'Лонсурф® 20 мг №20', dosage: 20, pack: 20 },
  { key: 'lon-15-60', label: 'Лонсурф® 15 мг №60', dosage: 15, pack: 60 },
  { key: 'lon-20-60', label: 'Лонсурф® 20 мг №60', dosage: 20, pack: 60 },
];

const REQUIRED_FIELDS = ['weight', 'height', 'renal', 'days'];
const initialForm = { weight: '', height: '', renal: '', days: '' };

// --- demo-логика; замените на финальные формулы ---------------
const tabletCombo = (mg) => {
  let best = null;
  for (let p20 = Math.floor(mg / 20); p20 >= 0; p20--) {
    const rem = mg - p20 * 20;
    if (rem >= 0 && rem % 15 === 0) {
      const p15 = rem / 15;
      if (!best || p20 + p15 < best.p20 + best.p15) best = { p20, p15 };
    }
  }
  return best || { p20: 0, p15: 0 };
};

const compute = (values) => {
  const num = (v) => parseFloat(String(v || '').replace(',', '.'));
  const w = num(values.weight);
  const h = num(values.height);
  const d = parseInt(String(values.days || '').replace(',', '.'), 10);
  const renal = RENAL_OPTIONS.find((r) => r.value === values.renal);
  if (!renal) return { impossible: true, reason: 'Не выбрана почечная функция' };

  const bsa = 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725);
  const single = Math.min(Math.round((bsa * renal.perM2) / 5) * 5,
                          Math.floor(renal.maxDaily / 10) * 5);
  const daily = single * 2;

  if (daily > renal.maxDaily) {
    return { impossible: true,
      reason: `Расчётная суточная доза превышает допустимый предел ${renal.maxDaily} мг/сут.` };
  }
  if (single < 15) {
    return { impossible: true,
      reason: 'Расчётная разовая доза меньше минимальной таблетируемой (15 мг).' };
  }

  const morning = tabletCombo(single);
  const evening = tabletCombo(single);
  const total15 = (morning.p15 + evening.p15) * d;
  const total20 = (morning.p20 + evening.p20) * d;

  return {
    impossible: false, bsa, single, daily,
    morning, evening,
    packs: PACK_SKUS.map((sku) => {
      const total = sku.dosage === 15 ? total15 : total20;
      const raw = total / sku.pack;
      return { ...sku, raw, rounded: Math.ceil(raw) };
    }),
  };
};

const REQUIRED_MSG = 'Поле обязательно для заполнения';
const NUMBER_MSG   = 'Введите число, например, 80';

const validateField = (name, raw) => {
  const value = (raw || '').trim();
  if (!value) return REQUIRED_MSG;
  if (name === 'renal') return null;
  if (!/^\d+([.,]\d+)?$/.test(value)) return NUMBER_MSG;
  if (name === 'weight' && parseFloat(value.replace(',', '.')) > 150) {
    return 'Вес должен быть не более 150 кг';
  }
  return null;
};

const validate = (values) => {
  const errors = {};
  for (const k of REQUIRED_FIELDS) {
    const err = validateField(k, values[k]);
    if (err) errors[k] = err;
  }
  return errors;
};

const fmt = (n, d = 2) => (isFinite(n) ? n.toFixed(d).replace('.', ',') : '—');

// ============================================================
// Иконки
// ============================================================
const SunIcon = () => (
  <span className="lc-metric__icon" aria-label="утро">
    <svg viewBox="0 0 24 24" fill="none" stroke="#E98D01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill="#FFBB54" stroke="#E98D01" />
      <line x1="12" y1="2"   x2="12"    y2="4" />
      <line x1="12" y1="20"  x2="12"    y2="22" />
      <line x1="4.93" y1="4.93"   x2="6.34"  y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2"  y1="12"  x2="4"  y2="12" />
      <line x1="20" y1="12"  x2="22" y2="12" />
      <line x1="4.93" y1="19.07"  x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.07" y2="4.93" />
    </svg>
  </span>
);

const MoonIcon = () => (
  <span className="lc-metric__icon" aria-label="вечер">
    <svg viewBox="0 0 24 24" fill="#2D2A52" stroke="#2D2A52" strokeWidth="1" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </span>
);

// ============================================================
// Атомы
// ============================================================
function Field({ id, label, unit, error, children }) {
  return (
    <div className={'lc-field' + (error ? ' is-error' : '')}>
      <label className="lc-field__label" htmlFor={id}>
        {label}
        <span className="lc-field__required" aria-label="обязательно">*</span>
      </label>
      <div className="lc-field__control">
        {children}
        {unit && <span className="lc-field__unit">{unit}</span>}
      </div>
      {error && <p className="lc-field__error">{error}</p>}
    </div>
  );
}

function MetricCard({ label, value, unit, icon, extra }) {
  return (
    <div className="lc-metric">
      <div className="lc-metric__head">
        <span className="lc-metric__label">{label}</span>
        {icon === 'sun'  && <SunIcon />}
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

const Section = ({ title, cols, children }) => (
  <section className="lc-section">
    <h3 className="lc-section__title">{title}</h3>
    <div className={`lc-section__row lc-section__row--${cols}`}>{children}</div>
  </section>
);

// ============================================================
// Пустое и «невозможно» состояния
// ============================================================
function EmptyState() {
  return (
    <div className="lc-empty">
      <div className="lc-empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6"  x2="16" y2="6" />
          <line x1="8" y1="10" x2="8"  y2="10.01" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
          <line x1="16" y1="10" x2="16" y2="10.01" />
          <line x1="8" y1="14" x2="8"  y2="14.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="16" y1="14" x2="16" y2="14.01" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </div>
      <p className="lc-empty__text">
        Введите параметры пациента — калькулятор рассчитает рекомендованную стартовую дозу,
        разбивку приёмов и количество упаковок на курс.
      </p>
    </div>
  );
}

function ImpossibleState({ reason }) {
  return (
    <div className="lc-impossible">
      <div className="lc-impossible__icon">!</div>
      <div className="lc-impossible__body">
        <h4>Невозможно рассчитать дозу для выбранных параметров</h4>
        <p>{reason}</p>
      </div>
    </div>
  );
}

// ============================================================
// Главный компонент
// ============================================================
export default function DoseCalculator({ className = '' }) {
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [view, setView]     = useState('initial');
  const [result, setResult] = useState(null);
  const [reason, setReason] = useState(null);

  const anyValue = REQUIRED_FIELDS.some((k) => !!values[k]);

  const setField = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) {
      const { [name]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const onFieldBlur = (name) => () => {
    const err = validateField(name, values[name]);
    if (err && !errors[name]) setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) { setErrors(errs); setView('initial'); return; }
    setErrors({});
    const r = compute(values);
    if (r.impossible) { setReason(r.reason); setView('impossible'); return; }
    setResult(r);
    setView('success');
    // На мобиле — мягко скроллим на пол-экрана вниз, чтобы показать результат.
    if (typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 768px)').matches) {
      requestAnimationFrame(() => {
        window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      });
    }
  };

  const onReset = () => {
    setValues(initialForm); setErrors({}); setResult(null); setReason(null); setView('initial');
  };

  return (
    <section className={`lonsurf-calculator ${className}`} aria-labelledby="dose-calc-title">
      <h2 className="lc__title" id="dose-calc-title">Расчёт дозы Лонсурф®</h2>

      <div className="lc__layout">
        {/* === col 1: форма === */}
        <div className="lc__col">
          <form className="lc-form" onSubmit={onSubmit} noValidate>
            <div className="lc-form__fields">
              <Field id="weight" label="Вес" unit="кг" error={errors.weight}>
                <input className="lc-field__input" id="weight" type="text" inputMode="decimal" autoComplete="off"
                       placeholder="Например, 70" value={values.weight}
                       onChange={setField('weight')} onBlur={onFieldBlur('weight')} />
              </Field>
              <Field id="height" label="Рост" unit="см" error={errors.height}>
                <input className="lc-field__input" id="height" type="text" inputMode="decimal" autoComplete="off"
                       placeholder="Например, 180" value={values.height}
                       onChange={setField('height')} onBlur={onFieldBlur('height')} />
              </Field>
              <Field id="renal" label="Почечная функция" error={errors.renal}>
                <select className="lc-field__select" id="renal" value={values.renal}
                        onChange={setField('renal')} onBlur={onFieldBlur('renal')}>
                  <option value="">Выберите степень функции</option>
                  {RENAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field id="days" label="Ожидаемая длительность курса" unit="дней" error={errors.days}>
                <input className="lc-field__input" id="days" type="text" inputMode="numeric" autoComplete="off"
                       placeholder="Например, 28" value={values.days}
                       onChange={setField('days')} onBlur={onFieldBlur('days')} />
              </Field>
            </div>

            <div className="lc__actions">
              <button type="button" className="lc-btn lc-btn--ghost" onClick={onReset} disabled={!anyValue}>
                Сбросить
              </button>
              <button type="submit" className="lc-btn lc-btn--primary">
                Рассчитать дозу
              </button>
            </div>
            <div className="lc-form__spacer" aria-hidden="true" />
          </form>
        </div>

        {/* === col 2: результат === */}
        <div className="lc__col">
          {view === 'success' && (
            <div className="lc-result">
              <Section title="Расчёт дозы" cols={5}>
                <MetricCard label="Площадь поверхности тела" value={fmt(result.bsa, 2)} unit="м²" />
                <MetricCard label="Разовая доза"  value={result.single} unit="мг" />
                <MetricCard label="Суточная доза" value={result.daily}  unit="мг" />
                <MetricCard label="Приём утром"   value={result.single} unit="мг" icon="sun" />
                <MetricCard label="Приём вечером" value={result.single} unit="мг" icon="moon" />
              </Section>

              <Section title="Количество таблеток" cols={4}>
                <MetricCard label="Таблетки 15 мг утром"   value={result.morning.p15} unit="шт" icon="sun" />
                <MetricCard label="Таблетки 20 мг утром"   value={result.morning.p20} unit="шт" icon="sun" />
                <MetricCard label="Таблетки 15 мг вечером" value={result.evening.p15} unit="шт" icon="moon" />
                <MetricCard label="Таблетки 20 мг вечером" value={result.evening.p20} unit="шт" icon="moon" />
              </Section>

              <Section title="Количество упаковок" cols={4}>
                {result.packs.map((p) => (
                  <MetricCard
                    key={p.key}
                    label={p.label}
                    value={fmt(p.raw, 2)}
                    unit="шт"
                    extra={
                      <div className="lc-metric__rounded">
                        <small>≈</small>{p.rounded} шт
                      </div>
                    }
                  />
                ))}
              </Section>
            </div>
          )}

          {view === 'impossible' && <ImpossibleState reason={reason} />}
          {view === 'initial'    && <EmptyState />}
        </div>
      </div>
    </section>
  );
}
