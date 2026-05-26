/* =============================================================
   Калькулятор Лонсурф® — ванильный JS-рендерер одного блока.
   Используется для проверки в браузере. В production-лендинг
   подключается React-компонент (Calculator.jsx).
   Финальная фарма-логика — за разработчиком; здесь иллюстрация.
   ============================================================= */

const RENAL_OPTIONS = [
  { value: 'normal',   label: 'Норма',                   perM2: 35, maxDaily: 160 },
  { value: 'mild',     label: 'Лёгкая степень тяжести',  perM2: 35, maxDaily: 160 },
  { value: 'moderate', label: 'Средняя степень тяжести', perM2: 30, maxDaily: 120 },
  { value: 'severe',   label: 'Тяжёлая степень',         perM2: 20, maxDaily: 80  }
];

const PACK_SIZES = [
  { key: 'lon-15-20', label: 'Лонсурф® 15 мг №20', dosage: 15, pack: 20 },
  { key: 'lon-20-20', label: 'Лонсурф® 20 мг №20', dosage: 20, pack: 20 },
  { key: 'lon-15-60', label: 'Лонсурф® 15 мг №60', dosage: 15, pack: 60 },
  { key: 'lon-20-60', label: 'Лонсурф® 20 мг №60', dosage: 20, pack: 60 }
];

const REQUIRED_FIELDS = ['weight', 'height', 'renal', 'days'];
const DEFAULT_VALUES = { weight: '', height: '', renal: '', days: '' };

// ----- demo-логика (заменяется разработчиком) -----------------

function calcBSA(weight, height) {
  return 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
}

function tabletCombo(mg) {
  let best = null;
  for (let p20 = Math.floor(mg / 20); p20 >= 0; p20--) {
    const rem = mg - p20 * 20;
    if (rem >= 0 && rem % 15 === 0) {
      const p15 = rem / 15;
      if (!best || p20 + p15 < best.p20 + best.p15) best = { p20, p15 };
    }
  }
  return best || { p20: 0, p15: 0 };
}

function roundTo5(x) { return Math.round(x / 5) * 5; }
function fmt(num, digits = 2) { return isFinite(num) ? num.toFixed(digits).replace('.', ',') : '—'; }

const REQUIRED_MSG = 'Поле обязательно для заполнения';
const NUMBER_MSG   = 'Введите число, например, 80';

function validateField(name, raw) {
  const value = (raw || '').trim();
  if (!value) return REQUIRED_MSG;
  if (name === 'renal') return null; // select — только проверка на «обязательно»
  // Принимаем целое или дробное (с точкой/запятой), без других символов
  if (!/^\d+([.,]\d+)?$/.test(value)) return NUMBER_MSG;
  if (name === 'weight' && parseFloat(value.replace(',', '.')) > 150) {
    return 'Вес должен быть не более 150 кг';
  }
  return null;
}

function validate(values) {
  const errors = {};
  for (const k of REQUIRED_FIELDS) {
    const err = validateField(k, values[k]);
    if (err) errors[k] = err;
  }
  return errors;
}

function compute(values) {
  const num = (v) => parseFloat(String(v || '').replace(',', '.'));
  const w = num(values.weight);
  const h = num(values.height);
  const d = parseInt(String(values.days || '').replace(',', '.'), 10);
  const renal = RENAL_OPTIONS.find((r) => r.value === values.renal);
  if (!renal) return { impossible: true, reason: 'Не указана почечная функция.' };

  const bsa = calcBSA(w, h);
  const singleTargetMg = bsa * renal.perM2;
  const singleMg = Math.min(roundTo5(singleTargetMg), Math.floor(renal.maxDaily / 2 / 5) * 5);
  const dailyMg = singleMg * 2;

  if (dailyMg > renal.maxDaily) {
    return { impossible: true,
      reason: 'Расчётная суточная доза превышает допустимый предел ' + renal.maxDaily +
              ' мг/сут для выбранной почечной функции. Скорректируйте параметры или ' +
              'обратитесь к клиническим рекомендациям.' };
  }
  if (singleMg < 15) {
    return { impossible: true,
      reason: 'Расчётная разовая доза меньше минимальной таблетируемой (15 мг). ' +
              'Скорректируйте параметры пациента.' };
  }

  const morning = tabletCombo(singleMg);
  const evening = tabletCombo(singleMg);
  const total15 = (morning.p15 + evening.p15) * d;
  const total20 = (morning.p20 + evening.p20) * d;

  return {
    impossible: false,
    bsa, singleMg, dailyMg,
    morningMg: singleMg, eveningMg: singleMg,
    morning, evening,
    packs: PACK_SIZES.map((sku) => {
      const total = sku.dosage === 15 ? total15 : total20;
      const raw = total / sku.pack;
      return { ...sku, raw, rounded: Math.ceil(raw) };
    })
  };
}

// ----- DOM helpers --------------------------------------------

function el(tag, props, ...kids) {
  const node = document.createElement(tag);
  Object.entries(props || {}).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : v);
  });
  kids.flat().forEach((kid) => {
    if (kid == null || kid === false) return;
    node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  });
  return node;
}

function field(opts) {
  const { id, label, placeholder, unit, value, error, select } = opts;
  const wrap = el('div', { class: 'lc-field' + (error ? ' is-error' : '') });
  wrap.appendChild(
    el('label', { class: 'lc-field__label', for: id },
      label,
      el('span', { class: 'lc-field__required', 'aria-label': 'обязательно' }, '*')
    )
  );
  const control = el('div', { class: 'lc-field__control' });
  if (select) {
    const sel = el('select', { class: 'lc-field__select', id, name: id });
    sel.appendChild(el('option', { value: '' }, placeholder || 'Выберите…'));
    select.forEach((opt) =>
      sel.appendChild(el('option', { value: opt.value, selected: opt.value === value ? true : null }, opt.label))
    );
    control.appendChild(sel);
  } else {
    control.appendChild(
      el('input', {
        class: 'lc-field__input', id, name: id, type: 'text',
        placeholder: placeholder || '', value: value || '',
        inputmode: 'decimal', autocomplete: 'off'
      })
    );
    if (unit) control.appendChild(el('span', { class: 'lc-field__unit' }, unit));
  }
  wrap.appendChild(control);
  if (error) wrap.appendChild(el('p', { class: 'lc-field__error' }, error));
  return wrap;
}

// ----- иконки --------------------------------------------------

function sunIcon() {
  return el('span', { class: 'lc-metric__icon', 'aria-label': 'утро', html:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#E98D01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="4" fill="#FFBB54" stroke="#E98D01"/>' +
    '<line x1="12" y1="2" x2="12" y2="4"/>' +
    '<line x1="12" y1="20" x2="12" y2="22"/>' +
    '<line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>' +
    '<line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>' +
    '<line x1="2" y1="12" x2="4" y2="12"/>' +
    '<line x1="20" y1="12" x2="22" y2="12"/>' +
    '<line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>' +
    '<line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>' +
    '</svg>'
  });
}

function moonIcon() {
  return el('span', { class: 'lc-metric__icon', 'aria-label': 'вечер', html:
    '<svg viewBox="0 0 24 24" fill="#2D2A52" stroke="#2D2A52" stroke-width="1" stroke-linejoin="round">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
    '</svg>'
  });
}

function emptyStateIcon() {
  return el('div', { class: 'lc-empty__icon', html:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="4" y="2" width="16" height="20" rx="2"/>' +
    '<line x1="8" y1="6" x2="16" y2="6"/>' +
    '<line x1="8" y1="10" x2="8" y2="10.01"/>' +
    '<line x1="12" y1="10" x2="12" y2="10.01"/>' +
    '<line x1="16" y1="10" x2="16" y2="10.01"/>' +
    '<line x1="8" y1="14" x2="8" y2="14.01"/>' +
    '<line x1="12" y1="14" x2="12" y2="14.01"/>' +
    '<line x1="16" y1="14" x2="16" y2="14.01"/>' +
    '<line x1="8" y1="18" x2="16" y2="18"/></svg>'
  });
}

function arrowIcon() {
  return el('span', { class: 'lc-btn__arrow', html:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  });
}

// ----- карточка-метрика ---------------------------------------

function metricCard({ label, value, unit, icon, extra }) {
  const headChildren = [el('span', { class: 'lc-metric__label' }, label)];
  if (icon === 'sun')  headChildren.push(sunIcon());
  if (icon === 'moon') headChildren.push(moonIcon());

  const valueChildren = [el('span', { class: 'lc-metric__num' }, value)];
  if (unit) valueChildren.push(el('span', { class: 'lc-metric__unit' }, unit));

  const kids = [
    el('div', { class: 'lc-metric__head' }, ...headChildren),
    el('div', { class: 'lc-metric__value' }, ...valueChildren)
  ];
  if (extra) kids.push(extra);
  return el('div', { class: 'lc-metric' }, ...kids);
}

// ----- секции результата ---------------------------------------

function sectionDose(data) {
  return el('section', { class: 'lc-section' },
    el('h3', { class: 'lc-section__title' }, 'Расчёт дозы'),
    el('div', { class: 'lc-section__row lc-section__row--5' },
      metricCard({ label: 'Площадь поверхности тела', value: fmt(data.bsa, 2), unit: 'м²' }),
      metricCard({ label: 'Разовая доза',  value: String(data.singleMg), unit: 'мг' }),
      metricCard({ label: 'Суточная доза', value: String(data.dailyMg),  unit: 'мг' }),
      metricCard({ label: 'Приём утром',   value: String(data.morningMg), unit: 'мг', icon: 'sun' }),
      metricCard({ label: 'Приём вечером', value: String(data.eveningMg), unit: 'мг', icon: 'moon' })
    )
  );
}

function sectionTablets(data) {
  return el('section', { class: 'lc-section' },
    el('h3', { class: 'lc-section__title' }, 'Количество таблеток'),
    el('div', { class: 'lc-section__row lc-section__row--4' },
      metricCard({ label: 'Таблетки 15 мг утром',   value: String(data.morning.p15), unit: 'шт', icon: 'sun' }),
      metricCard({ label: 'Таблетки 20 мг утром',   value: String(data.morning.p20), unit: 'шт', icon: 'sun' }),
      metricCard({ label: 'Таблетки 15 мг вечером', value: String(data.evening.p15), unit: 'шт', icon: 'moon' }),
      metricCard({ label: 'Таблетки 20 мг вечером', value: String(data.evening.p20), unit: 'шт', icon: 'moon' })
    )
  );
}

function sectionPacks(data) {
  return el('section', { class: 'lc-section' },
    el('h3', { class: 'lc-section__title' }, 'Количество упаковок'),
    el('div', { class: 'lc-section__row lc-section__row--4' },
      ...data.packs.map((p) => metricCard({
        label: p.label,
        value: fmt(p.raw, 2),
        unit: 'шт',
        extra: el('div', { class: 'lc-metric__rounded' },
          el('small', {}, '≈'),
          String(p.rounded) + ' шт'
        )
      }))
    )
  );
}

function emptyBlock() {
  return el('div', { class: 'lc-empty' },
    emptyStateIcon(),
    el('p', { class: 'lc-empty__text' },
      'Введите параметры пациента — калькулятор рассчитает рекомендованную стартовую дозу, ' +
      'разбивку приёмов и количество упаковок на курс.'
    )
  );
}

function impossibleBlock(reason) {
  return el('div', { class: 'lc-impossible' },
    el('div', { class: 'lc-impossible__icon' }, '!'),
    el('div', { class: 'lc-impossible__body' },
      el('h4', {}, 'Невозможно рассчитать дозу для выбранных параметров'),
      el('p', {}, reason)
    )
  );
}

// ----- основной рендер ----------------------------------------

function renderCalculator(root) {
  const state = {
    values: { ...DEFAULT_VALUES },
    errors: {},
    view: 'initial',
    result: null,
    impossibleReason: null
  };

  function render() {
    root.innerHTML = '';

    const calc = el('section', { class: 'lonsurf-calculator', 'aria-labelledby': 'lc-title' });
    calc.appendChild(el('h2', { class: 'lc__title', id: 'lc-title' }, 'Расчёт дозы Лонсурф®'));

    const layout = el('div', { class: 'lc__layout' });
    calc.appendChild(layout);

    // ===== col 1: форма =====
    const formCol = el('div', { class: 'lc__col' });
    const form = el('form', { class: 'lc-form', novalidate: true });

    const fields = el('div', { class: 'lc-form__fields' });
    fields.appendChild(field({ id: 'weight', label: 'Вес', unit: 'кг',
      placeholder: 'Например, 70', value: state.values.weight, error: state.errors.weight }));
    fields.appendChild(field({ id: 'height', label: 'Рост', unit: 'см',
      placeholder: 'Например, 180', value: state.values.height, error: state.errors.height }));
    fields.appendChild(field({ id: 'renal', label: 'Почечная функция',
      placeholder: 'Выберите степень функции', value: state.values.renal, error: state.errors.renal,
      select: RENAL_OPTIONS }));
    fields.appendChild(field({ id: 'days', label: 'Ожидаемая длительность курса', unit: 'дней',
      placeholder: 'Например, 28', value: state.values.days, error: state.errors.days }));
    form.appendChild(fields);

    const hasAnyValue = REQUIRED_FIELDS.some((k) => !!state.values[k]);

    const resetBtn = el('button', { class: 'lc-btn lc-btn--ghost', type: 'button' }, 'Сбросить');
    if (!hasAnyValue) resetBtn.setAttribute('disabled', '');

    const submitBtn = el('button', { class: 'lc-btn lc-btn--primary', type: 'submit' },
      'Рассчитать дозу');

    form.appendChild(el('div', { class: 'lc__actions' }, resetBtn, submitBtn));
    form.appendChild(el('div', { class: 'lc-form__spacer', 'aria-hidden': 'true' }));
    formCol.appendChild(form);
    layout.appendChild(formCol);

    // ===== col 2: результат =====
    const resultCol = el('div', { class: 'lc__col' });
    if (state.view === 'success') {
      const wrap = el('div', { class: 'lc-result' });
      wrap.appendChild(sectionDose(state.result));
      wrap.appendChild(sectionTablets(state.result));
      wrap.appendChild(sectionPacks(state.result));
      resultCol.appendChild(wrap);
    } else if (state.view === 'impossible') {
      resultCol.appendChild(impossibleBlock(state.impossibleReason));
    } else {
      resultCol.appendChild(emptyBlock());
    }
    layout.appendChild(resultCol);

    root.appendChild(calc);

    // -------- wiring --------
    form.querySelectorAll('input, select').forEach((inp) => {
      inp.addEventListener('input', () => {
        state.values[inp.name] = inp.value;
        if (state.errors[inp.name]) {
          delete state.errors[inp.name];
          render();
        } else {
          resetBtn.disabled = !REQUIRED_FIELDS.some((k) => !!state.values[k]);
        }
      });
      inp.addEventListener('blur', () => {
        const err = validateField(inp.name, state.values[inp.name]);
        if (err && !state.errors[inp.name]) {
          state.errors[inp.name] = err;
          render();
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errs = validate(state.values);
      if (Object.keys(errs).length) {
        state.errors = errs;
        state.view = 'initial';
        render();
        return;
      }
      state.errors = {};
      const r = compute(state.values);
      if (r.impossible) {
        state.view = 'impossible';
        state.impossibleReason = r.reason;
      } else {
        state.view = 'success';
        state.result = r;
      }
      render();

      // На мобиле — мягко проскроллить на пол-экрана вниз,
      // чтобы пользователь увидел появившийся результат.
      if (state.view === 'success' && window.matchMedia('(max-width: 768px)').matches) {
        requestAnimationFrame(() => {
          window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
        });
      }
    });

    resetBtn.addEventListener('click', () => {
      state.values = { ...DEFAULT_VALUES };
      state.errors = {};
      state.view = 'initial';
      state.result = null;
      state.impossibleReason = null;
      render();
    });
  }

  render();
}

window.renderCalculator = renderCalculator;
