import { AVERAGE_DAYS_IN_MONTH, DEFAULT_YEAR } from './defaults';
import { countCalendarDaysInRange, countWorkingDaysInRange } from './calendarApi';

/**
 * Рассчитать отпускные по ТК РФ
 *
 * @param {Object} params
 * @param {string} params.startDate - начало отпуска 'YYYY-MM-DD'
 * @param {string} params.endDate   - конец отпуска 'YYYY-MM-DD'
 * @param {number[]} params.last12MonthsSalaries - массив зарплат gross за последние 12 месяцев
 * @param {string[]} params.holidays - список праздничных дней
 * @returns {{ calendarDays: number, workingDaysOff: number, avgDailyPay: number, vacationPayGross: number, monthsAffected: {month: number, workingDaysOff: number}[] }}
 */
export function calculateVacationPay({ startDate, endDate, last12MonthsSalaries, holidays }) {
  const calendarDays = countCalendarDaysInRange(startDate, endDate);
  const workingDaysOff = countWorkingDaysInRange(startDate, endDate, holidays);

  // Средний дневной заработок = сумма ЗП за 12 мес / (12 * 29.3)
  const totalSalary = last12MonthsSalaries.reduce((s, v) => s + v, 0);
  const avgDailyPay = totalSalary / (12 * AVERAGE_DAYS_IN_MONTH);
  const vacationPayGross = Math.round(avgDailyPay * calendarDays);

  // Определяем какие месяцы затронуты отпуском и сколько рабочих дней пропущено
  const monthsAffected = getAffectedMonths(startDate, endDate, holidays);

  return {
    calendarDays,
    workingDaysOff,
    avgDailyPay: Math.round(avgDailyPay * 100) / 100,
    vacationPayGross,
    monthsAffected,
  };
}

/**
 * Определяет какие месяцы затронуты отпуском
 */
function getAffectedMonths(startDate, endDate, holidays) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];

  let current = new Date(start);
  while (current <= end) {
    const month = current.getMonth();
    const year = current.getFullYear();

    // Найти пересечение отпуска с этим месяцем
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const overlapStart = start > monthStart ? start : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;

    const workDaysOff = countWorkingDaysInRange(
      overlapStart.toISOString().split('T')[0],
      overlapEnd.toISOString().split('T')[0],
      holidays
    );

    if (workDaysOff > 0) {
      const existing = result.find(r => r.month === month);
      if (existing) {
        existing.workingDaysOff += workDaysOff;
      } else {
        result.push({ month, workingDaysOff: workDaysOff });
      }
    }

    // Перейти к следующему месяцу
    current = new Date(year, month + 1, 1);
  }

  return result;
}

/**
 * Получить массив зарплат за последние 12 месяцев перед отпуском
 * с учётом изменений зарплаты
 */
export function getLast12MonthsSalaries(vacationStartDate, monthsData, salaryChanges, defaultGross) {
  const startDate = new Date(vacationStartDate);
  const salaries = [];

  for (let i = 12; i >= 1; i--) {
    const m = new Date(startDate);
    m.setMonth(m.getMonth() - i);
    const monthIndex = m.getMonth();
    const year = m.getFullYear();

    // Определяем зарплату для этого месяца
    let salary = defaultGross;

    // Проверяем изменения зарплаты
    if (salaryChanges && salaryChanges.length > 0) {
      for (const change of salaryChanges) {
        const changeStart = new Date(change.startDate);
        const changeEnd = new Date(change.endDate);
        const monthDate = new Date(year, monthIndex, 15); // середина месяца

        if (monthDate >= changeStart && monthDate <= changeEnd) {
          salary = change.amount;
          break;
        }
      }
    }

    // Если есть данные в monthsData для текущего года
    if (year === DEFAULT_YEAR && monthsData[monthIndex]) {
      salary = monthsData[monthIndex].grossSalary;
    }

    salaries.push(salary);
  }

  return salaries;
}