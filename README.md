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

## Подключение на странице лендинга

```tsx
import { Calculator } from '@/components/Calculator';

export function DosePage() {
  return <Calculator />;
}
```

Калькулятор использует шрифт **Montserrat**. Для корректного отображения на лендинге шрифт должен быть подключён на уровне приложения/страницы.

## Локальный запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # сверка с Excel
npm run build    # production-сборка
```

## Логика расчёта (Excel)

Чистая функция для тестов: `calculateCalculatorResult(input)` в `calculatorLogic.ts`.

1. **ППТ:** `ROUNDDOWN(0.007184 × вес^0.425 × рост^0.725, 2)`
2. **Доза и таблетки:** VLOOKUP по ключу `ППТ + почечная функция` в таблице `lookupTable.json`
3. **Упаковки:** `число циклов × 10 × (таблетки утро + таблетки вечер) / размер упаковки`, `rounded = exact === 0 ? 0 : ceil(exact)` (10 — дней приёма в 28-дневном цикле)

Пример из Excel (47 кг, 180 см, норма, 1 цикл): ППТ 1,59; разовая доза 55 мг; суточная 110 мг; упаковки №20: 1 и 2 шт.

## Состояния UI

- начальное (пустой результат)
- заполнение формы
- ошибки валидации
- успешный расчёт
- невозможность расчёта (нет строки в справочнике)
