import { TAX_BRACKETS } from './defaults';

/**
 * Общий налог с накопленного дохода
 */
export function calculateTotalTax(cumulativeIncome) {
  if (cumulativeIncome <= 0) return 0;

  let tax = 0;
  let prevLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    const upperLimit = bracket.limit;

    if (cumulativeIncome > prevLimit) {
      const taxableInBracket = Math.min(cumulativeIncome, upperLimit) - prevLimit;
      tax += taxableInBracket * bracket.rate;
    }

    if (cumulativeIncome <= upperLimit) break;
    prevLimit = upperLimit;
  }

  return Math.round(tax);
}

/**
 * Возвращает ставку для конкретного дохода
 */
export function getCurrentRate(cumulativeIncome) {
  for (const bracket of TAX_BRACKETS) {
    if (cumulativeIncome <= bracket.limit) {
      return bracket.rate;
    }
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1].rate;
}

/**
 * Разбивает выплату по налоговым диапазонам
 */
export function getPaymentTaxBreakdown(previousCumulativeIncome, currentPayment) {
  if (currentPayment <= 0) return [];

  const breakdown = [];
  let remaining = currentPayment;
  let currentBase = previousCumulativeIncome;

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    const prevLimit = i === 0 ? 0 : TAX_BRACKETS[i - 1].limit;
    const upperLimit = bracket.limit;

    if (currentBase >= upperLimit) continue;

    const availableInBracket = upperLimit === Infinity
      ? remaining
      : Math.max(0, upperLimit - currentBase);

    const amountInBracket = Math.min(remaining, availableInBracket);

    if (amountInBracket > 0) {
      breakdown.push({
        rate: bracket.rate,
        amount: Math.round(amountInBracket),
        tax: Math.round(amountInBracket * bracket.rate),
      });

      remaining -= amountInBracket;
      currentBase += amountInBracket;
    }

    if (remaining <= 0) break;
  }

  return breakdown;
}

/**
 * Расчёт налога по конкретной выплате
 */
export function calculatePaymentTax(previousCumulativeIncome, currentPayment) {
  if (currentPayment <= 0) {
    return {
      tax: 0,
      net: 0,
      effectiveRate: 0,
      marginalRate: 0.13,
      breakdown: [],
      rateLabel: '0%',
      crossedBracket: false,
    };
  }

  const breakdown = getPaymentTaxBreakdown(previousCumulativeIncome, currentPayment);
  const tax = breakdown.reduce((sum, part) => sum + part.tax, 0);
  const net = currentPayment - tax;
  const effectiveRate = currentPayment > 0 ? tax / currentPayment : 0;

  const uniqueRates = [...new Set(breakdown.map(b => b.rate))];
  const crossedBracket = uniqueRates.length > 1;
  const marginalRate = uniqueRates[uniqueRates.length - 1] || 0.13;

  let rateLabel = `${Math.round(marginalRate * 100)}%`;
  if (crossedBracket) {
    rateLabel = uniqueRates.map(r => Math.round(r * 100)).join('→') + '%';
  }

  return {
    tax: Math.round(tax),
    net: Math.round(net),
    effectiveRate,
    marginalRate,
    breakdown,
    rateLabel,
    crossedBracket,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatPercent(value) {
  return (value * 100).toFixed(2) + '%';
}