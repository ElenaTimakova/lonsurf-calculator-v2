# Калькулятор дозы Лонсурф®

Переиспользуемый React-компонент для лендинга препарата **Лонсурф®** (трифлуридин + типирацил, Servier).

Стек: **React + Vite + TypeScript**.

> ⚠️ **Расчёт справочный и не заменяет клиническое решение.**

## Структура

```
src/components/Calculator/
  Calculator.tsx          # UI и состояние
  calculatorLogic.ts    # расчёт по таблице Excel
  calculatorLogic.test.ts
  types.ts
  constants.ts
  lookupTable.json      # справочник из листа «техн_РАСЧЕТ терапии»
  Calculator.module.css # изолированные стили
  pattern.svg
  index.ts
```

Корневые файлы `Calculator.jsx`, `Calculator.js`, `Calculator.css` — прежний прототип для справки.

## Подключение на странице лендинга

```tsx
import { Calculator } from '@/components/Calculator';

export function DosePage() {
  return <Calculator />;
}
```

## Локальный запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # сверка с Excel
npm run build    # production-сборка
```

## Логика расчёта (Excel)

1. **ППТ:** `ROUNDDOWN(0.007184 × вес^0.425 × рост^0.725, 2)`
2. **Доза и таблетки:** VLOOKUP по ключу `ППТ + почечная функция` в таблице `lookupTable.json`
3. **Упаковки:** `дни × (таблетки утро + таблетки вечер) / размер упаковки`, округление `ROUNDUP`

Пример из Excel (104 кг, 180 см, средняя степень, 10 дней): ППТ 2,23; разовая доза 75 мг; суточная 150 мг.

## Состояния UI

- начальное (пустой результат)
- заполнение формы
- ошибки валидации
- успешный расчёт
- невозможность расчёта (нет строки в справочнике)
