// src/hooks/useProgressiveTax.js
import { useMemo } from 'react';
import { calculateTotalTax, calculatePaymentTax, getCurrentRate } from '../utils/taxCalculator';

/**
 * Хук для работы с прогрессивным налогом
 */
export function useProgressiveTax() {
  return useMemo(() => ({
    calculateTotalTax,
    calculatePaymentTax,
    getCurrentRate,
  }), []);
}