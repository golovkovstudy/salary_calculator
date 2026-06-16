import { useMemo } from 'react';
import useStore from '../store/useStore';
import { calculatePaymentTax } from '../utils/taxCalculator';
import { MONTH_NAMES, BONUS_TYPES } from '../utils/defaults';
import {
  calculateVacationPay,
  getLast12MonthsSalaries,
} from '../utils/vacationCalculator';
import { getHalfMonthWorkDays, countWorkingDaysInRange, getPreviousWorkingDay } from '../utils/calendarApi';
import { format } from 'date-fns';

function netToGross(netAmount, cumulativeIncomeBefore) {
  if (netAmount <= 0) return 0;
  let low = netAmount;
  let high = Math.round(netAmount * 2.5);
  for (let i = 0; i < 10; i++) {
    const r = calculatePaymentTax(cumulativeIncomeBefore, high);
    if (r.net >= netAmount) break;
    high *= 2;
  }
  for (let i = 0; i < 100; i++) {
    const mid = Math.round((low + high) / 2);
    const r = calculatePaymentTax(cumulativeIncomeBefore, mid);
    if (r.net === netAmount) return mid;
    if (r.net < netAmount) low = mid + 1;
    else high = mid - 1;
    if (low >= high) {
      const r1 = calculatePaymentTax(cumulativeIncomeBefore, low);
      if (r1.net >= netAmount) return low;
      return low + 1;
    }
  }
  return Math.round(netAmount / 0.87);
}

export function useSalaryCalculator() {
  const defaultGrossSalary = useStore(s => s.defaultGrossSalary);
  const salaryChanges      = useStore(s => s.salaryChanges);
  const vacations          = useStore(s => s.vacations);
  const bonuses            = useStore(s => s.bonuses);
  const holidays           = useStore(s => s.holidays);
  const monthWorkDays      = useStore(s => s.monthWorkDays);
  const year               = useStore(s => s.year);

  return useMemo(() => {
    // 1. Зарплата каждого месяца
    const monthGross = new Array(12).fill(0).map((_, idx) => {
      let salary = defaultGrossSalary;
      for (const change of salaryChanges) {
        if (!change.startDate || !change.endDate || !change.amount) continue;
        const start = new Date(change.startDate);
        const end = new Date(change.endDate);
        const mid = new Date(year, idx, 15);
        if (mid >= start && mid <= end) salary = change.amount;
      }
      return salary;
    });

    // 2. Полумесяцы
    const halfMonths = [];
    for (let m = 0; m < 12; m++) {
      halfMonths.push(getHalfMonthWorkDays(m, year, holidays));
    }

    // 3. Отпуска
    const vacationDaysPerHalfMonth = new Array(12).fill(null).map(() => ({
      firstHalf: 0, secondHalf: 0,
    }));
    const vacationResults = [];

    vacations.forEach((v) => {
      if (!v.startDate || !v.endDate) return;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return;

      const last12 = getLast12MonthsSalaries(
        v.startDate,
        monthGross.map(g => ({ grossSalary: g })),
        salaryChanges,
        defaultGrossSalary
      );

      const vacResult = calculateVacationPay({
        startDate: v.startDate, endDate: v.endDate,
        last12MonthsSalaries: last12, holidays,
      });

      vacationResults.push({
        id: v.id, startDate: v.startDate, endDate: v.endDate,
        startDateStr: format(start, 'dd.MM.yyyy'),
        endDateStr: format(end, 'dd.MM.yyyy'),
        calendarDays: vacResult.calendarDays,
        workingDaysOff: vacResult.workingDaysOff,
        avgDailyPay: vacResult.avgDailyPay,
        vacationPayGross: vacResult.vacationPayGross,
        monthsAffected: vacResult.monthsAffected,
      });

      vacResult.monthsAffected.forEach(({ month }) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const overlapStart = start > new Date(year, month, 1) ? start : new Date(year, month, 1);
        const overlapEnd = end < new Date(year, month, daysInMonth) ? end : new Date(year, month, daysInMonth);

        if (overlapStart.getDate() <= 15) {
          const fhEnd = overlapEnd.getDate() <= 15 ? overlapEnd : new Date(year, month, 15);
          const fhStr = `${year}-${String(month+1).padStart(2,'0')}-${String(overlapStart.getDate()).padStart(2,'0')}`;
          const fhEndStr = `${year}-${String(month+1).padStart(2,'0')}-${String(fhEnd.getDate()).padStart(2,'0')}`;
          vacationDaysPerHalfMonth[month].firstHalf += countWorkingDaysInRange(fhStr, fhEndStr, holidays);
        }
        if (overlapEnd.getDate() > 15) {
          const shStart = overlapStart.getDate() > 15 ? overlapStart : new Date(year, month, 16);
          const shStr = `${year}-${String(month+1).padStart(2,'0')}-${String(shStart.getDate()).padStart(2,'0')}`;
          const shEndStr = `${year}-${String(month+1).padStart(2,'0')}-${String(overlapEnd.getDate()).padStart(2,'0')}`;
          vacationDaysPerHalfMonth[month].secondHalf += countWorkingDaysInRange(shStr, shEndStr, holidays);
        }
      });
    });

    // 4. Все выплаты
    const payments = [];

    for (let m = 0; m < 12; m++) {
      const gross = monthGross[m];
      const { firstHalf, secondHalf } = halfMonths[m];
      const totalWorkDays = firstHalf + secondHalf;
      const effFirst = Math.max(0, firstHalf - vacationDaysPerHalfMonth[m].firstHalf);
      const effSecond = Math.max(0, secondHalf - vacationDaysPerHalfMonth[m].secondHalf);
      const effTotal = effFirst + effSecond;
      const effectiveGross = totalWorkDays > 0 ? Math.round(gross * effTotal / totalWorkDays) : 0;
      const advanceGross = totalWorkDays > 0 ? Math.round(gross * effFirst / totalWorkDays) : 0;
      const salaryPartGross = effectiveGross - advanceGross;
      // Аванс 25 числа, зарплата 10 числа следующего месяца
      // Если выпадает на выходной/праздник — переносим на ближайший предыдущий рабочий день
      const rawAdvanceDate = new Date(year, m, 25);
      const rawSalaryDate = m + 1 >= 12 ? new Date(year + 1, 0, 10) : new Date(year, m + 1, 10);

      const advanceDate = getPreviousWorkingDay(rawAdvanceDate, holidays);
      const salaryDate = getPreviousWorkingDay(rawSalaryDate, holidays);

      if (advanceGross > 0) {
        payments.push({ type: 'advance', month: m, gross: advanceGross, date: advanceDate, label: `Аванс ${MONTH_NAMES[m]} (1-15)` });
      }
      if (salaryPartGross > 0) {
        payments.push({ type: 'salary', month: m, gross: salaryPartGross, date: salaryDate, label: `Зарплата ${MONTH_NAMES[m]} (16+)` });
      }
    }

    // Отпускные
    vacationResults.forEach((vr) => {
      if (vr.vacationPayGross > 0) {
        // По ТК РФ отпускные выплачиваются не позднее чем за 3 дня до начала отпуска.
        // Если день выплаты выпадает на выходной — переносим на предыдущий рабочий день.
        const rawPayDate = new Date(vr.startDate);
        rawPayDate.setDate(rawPayDate.getDate() - 3);
        const payDate = getPreviousWorkingDay(rawPayDate, holidays);

        payments.push({
          type: 'vacation',
          vacationId: vr.id,
          gross: vr.vacationPayGross,
          date: payDate,
          label: `Отпускные (${vr.startDateStr}–${vr.endDateStr})`,
        });
      }
    });

    // Премии
    bonuses.forEach((b) => {
      if (b.amount > 0 && b.date) {
        const dateObj = new Date(b.date);
        if (isNaN(dateObj.getTime())) return;
        if (dateObj.getFullYear() !== year) return;
        const typeObj = BONUS_TYPES.find(t => t.value === b.type) || { label: 'Прочее' };
        payments.push({
          type: 'bonus', bonusId: b.id, bonusType: b.type,
          gross: b.isNet ? 0 : b.amount,
          inputAmount: b.amount, isNet: b.isNet || false,
          date: dateObj,
          label: `${typeObj.label} (${format(dateObj, 'dd.MM.yyyy')})`,
          typeLabel: typeObj.label,
        });
      }
    });

    // 5. Сортировка
    const typePriority = { advance: 1, salary: 2, vacation: 3, bonus: 4 };
    payments.sort((a, b) => {
      const d = a.date.getTime() - b.date.getTime();
      if (d !== 0) return d;
      return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
    });

    // 6. Кумулятивный расчёт
    let cumulativeIncome = 0;
    const processedPayments = payments.map((p) => {
      let grossAmount = p.gross;
      if (p.type === 'bonus' && p.isNet && p.inputAmount > 0) {
        grossAmount = netToGross(p.inputAmount, cumulativeIncome);
      }
      const taxResult = calculatePaymentTax(cumulativeIncome, grossAmount);
      const result = {
        ...p,
        gross: grossAmount,
        cumulativeBefore: cumulativeIncome,
        cumulativeAfter: cumulativeIncome + grossAmount,
        tax: taxResult.tax,
        net: taxResult.net,
        effectiveRate: taxResult.effectiveRate,
        marginalRate: taxResult.marginalRate,
        breakdown: taxResult.breakdown,
        crossedBracket: taxResult.crossedBracket,
        rateLabel: taxResult.rateLabel,
        dateStr: format(p.date, 'dd.MM.yyyy'),
      };
      cumulativeIncome += grossAmount;
      return result;
    });

    // 7. Месячная таблица
    const monthlyResults = monthGross.map((gross, idx) => {
      const ap = processedPayments.find(p => p.type === 'advance' && p.month === idx);
      const sp = processedPayments.find(p => p.type === 'salary' && p.month === idx);

      const advanceTax = ap ? ap.tax : 0;
      const salaryTax = sp ? sp.tax : 0;
      const totalTax = advanceTax + salaryTax;

      // Берём ставки из кумулятивного расчёта — они УЖЕ учитывают все предшествующие выплаты (включая премии)
      const apRate = ap ? ap.marginalRate : 0;
      const spRate = sp ? sp.marginalRate : 0;
      const maxRate = Math.max(apRate, spRate, 0.13);

      // Формируем rateLabel с учётом пересечений
      let rateLabel;
      const labels = [];
      if (ap && ap.rateLabel) labels.push(ap.rateLabel);
      if (sp && sp.rateLabel && sp.rateLabel !== (ap?.rateLabel || '')) labels.push(sp.rateLabel);

      if (labels.length === 0) {
        rateLabel = gross > 0 ? '13%' : '—';
      } else if (labels.length === 1) {
        rateLabel = labels[0];
      } else {
        // Убираем дубликаты
        const unique = [...new Set(labels)];
        rateLabel = unique.join(' / ');
      }

      const { firstHalf, secondHalf } = halfMonths[idx];
      const effFirst = Math.max(0, firstHalf - vacationDaysPerHalfMonth[idx].firstHalf);
      const effSecond = Math.max(0, secondHalf - vacationDaysPerHalfMonth[idx].secondHalf);

      return {
        month: idx,
        monthName: MONTH_NAMES[idx],
        grossSalary: gross,
        effectiveGross: (ap ? ap.gross : 0) + (sp ? sp.gross : 0),
        workingDays: firstHalf + secondHalf,
        firstHalfDays: firstHalf,
        secondHalfDays: secondHalf,
        effectiveFirstHalf: effFirst,
        effectiveSecondHalf: effSecond,
        vacDaysFirst: vacationDaysPerHalfMonth[idx].firstHalf,
        vacDaysSecond: vacationDaysPerHalfMonth[idx].secondHalf,
        advanceGross: ap ? ap.gross : 0,
        advanceNet: ap ? ap.net : 0,
        advanceTax,
        advanceDateStr: ap ? ap.dateStr : '',
        salaryPartGross: sp ? sp.gross : 0,
        salaryPartNet: sp ? sp.net : 0,
        salaryPartTax: salaryTax,
        salaryDateStr: sp ? sp.dateStr : '',
        totalTax,
        totalNet: (ap ? ap.net : 0) + (sp ? sp.net : 0),
        maxRate,
        rateLabel,
        cumulativeAfter: sp ? sp.cumulativeAfter : (ap ? ap.cumulativeAfter : 0),
      };
    });

    // 8. Бонусы
    const bonusResults = processedPayments
      .filter(p => p.type === 'bonus')
      .map(p => ({
        id: p.bonusId,
        typeLabel: p.typeLabel || 'Прочее',
        gross: p.gross,
        tax: p.tax,
        net: p.net,
        dateStr: p.dateStr,
        effectiveRate: p.effectiveRate,
        marginalRate: p.marginalRate,
        rateLabel: p.rateLabel,
        breakdown: p.breakdown,
      }));

    // 9. Отпускные
    const vacPayments = processedPayments.filter(p => p.type === 'vacation');
    const vacationCalcResults = vacationResults.map(vr => {
      const payment = vacPayments.find(p => p.vacationId === vr.id);
      return {
        ...vr,
        tax: payment ? payment.tax : 0,
        net: payment ? payment.net : 0,
        payDateStr: payment ? payment.dateStr : '',
        marginalRate: payment ? payment.marginalRate : 0.13,
      };
    });

    // 10. Итоги
    const totalGross = processedPayments.reduce((s, p) => s + p.gross, 0);
    const totalTax = processedPayments.reduce((s, p) => s + p.tax, 0);
    const totalNet = totalGross - totalTax;
    const effectiveRate = totalGross > 0 ? totalTax / totalGross : 0;
    const totalSalaryGross = monthlyResults.reduce((s, m) => s + m.effectiveGross, 0);
    const totalBonusGross = bonusResults.reduce((s, b) => s + b.gross, 0);
    const totalVacationGross = vacationCalcResults.reduce((s, v) => s + v.vacationPayGross, 0);

    const summary = {
      totalGross, totalTax, totalNet, effectiveRate,
      totalSalaryGross, totalBonusGross, totalVacationGross,
    };

    // 11. График
    const chartData = processedPayments.map((p, i) => ({
      index: i, label: p.label, date: p.dateStr,
      cumulativeIncome: p.cumulativeAfter,
      cumulativeTax: processedPayments.slice(0, i + 1).reduce((s, pp) => s + pp.tax, 0),
      gross: p.gross, tax: p.tax, net: p.net, rate: p.marginalRate,
    }));

    return { monthlyResults, bonusResults, vacationCalcResults, summary, chartData, processedPayments, monthGross, halfMonths };
  }, [defaultGrossSalary, salaryChanges, vacations, bonuses, holidays, monthWorkDays, year]);
}