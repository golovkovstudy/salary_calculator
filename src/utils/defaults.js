export const MONTH_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

export const MONTH_NAMES_SHORT = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек'
];

export const DEFAULT_YEAR = 2026;

// Захардкоженный производственный календарь 2026 (фоллбэк)
export const FALLBACK_WORKING_DAYS = [15, 19, 22, 22, 18, 21, 23, 21, 22, 22, 20, 22];

// Праздничные/нерабочие дни 2026 (фоллбэк)
export const FALLBACK_HOLIDAYS = [
  '2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05',
  '2026-01-06','2026-01-07','2026-01-08',
  '2026-02-23',
  '2026-03-08','2026-03-09',
  '2026-05-01','2026-05-04','2026-05-09','2026-05-11',
  '2026-06-12',
  '2026-11-04',
  '2026-12-31',
];

export const DEFAULT_GROSS_SALARY = 0;

export const TAX_BRACKETS = [
  { limit: 2400000,  rate: 0.13, base: 0       },
  { limit: 5000000,  rate: 0.15, base: 312000   },
  { limit: 20000000, rate: 0.18, base: 702000   },
  { limit: 50000000, rate: 0.20, base: 3402000  },
  { limit: Infinity, rate: 0.22, base: 9402000  },
];

export const BONUS_TYPES = [
  { value: 'bonus',        label: 'Премия'       },
  { value: 'annual_bonus', label: 'Годовой бонус'},
  { value: 'dividends',    label: 'Дивиденды'    },
  { value: 'other',        label: 'Прочее'       },
];

export const AVERAGE_DAYS_IN_MONTH = 29.3;
export const MAX_VACATIONS = 10;