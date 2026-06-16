import React from 'react';
import { formatNumber } from '../utils/taxCalculator';
import { MONTH_NAMES_SHORT } from '../utils/defaults';

function getRateBg(rate) {
  if (rate <= 0.13) return 'bg-green-100  dark:bg-green-900/30  text-green-800  dark:text-green-300';
  if (rate <= 0.15) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (rate <= 0.18) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
  if (rate <= 0.20) return 'bg-red-100    dark:bg-red-900/30    text-red-800    dark:text-red-300';
  return               'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
}

export default function SalaryTable({ monthlyResults }) {
  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Помесячный расчёт</h2>

      <div className="overflow-x-auto scrollbar-thin -mx-6 px-6">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-xs">
              <th className="text-left   py-3 px-2 text-gray-500 dark:text-gray-400">Месяц</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Gross</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400" title="Рабочие дни (1-15 / 16+)">Дни 1-15/16+</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400" title="Отработано (с учётом отпуска)">Отраб.</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Аванс net</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400">Дата</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">ЗП net</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400">Дата</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Налог</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400">Ставка</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Накоплено</th>
            </tr>
          </thead>
          <tbody>
            {monthlyResults.map((r, idx) => {
              const hasVacation = r.vacDaysFirst > 0 || r.vacDaysSecond > 0;
              return (
                <tr key={idx} className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasVacation ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                  <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                    {MONTH_NAMES_SHORT[r.month]}
                    {hasVacation && <span className="ml-1 text-green-500" title="Есть отпуск">🌴</span>}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatNumber(r.grossSalary)}
                    {r.effectiveGross !== r.grossSalary && (
                      <div className="text-xs text-orange-500">
                        факт: {formatNumber(r.effectiveGross)}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    {r.firstHalfDays}/{r.secondHalfDays}
                  </td>
                  <td className="py-2 px-2 text-center text-xs">
                    <span className={hasVacation ? 'text-orange-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                      {r.effectiveFirstHalf}/{r.effectiveSecondHalf}
                    </span>
                    {hasVacation && (
                      <div className="text-[10px] text-green-600 dark:text-green-400">
                        -{r.vacDaysFirst + r.vacDaysSecond} отп.
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatNumber(r.advanceNet)}
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    {r.advanceDateStr}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatNumber(r.salaryPartNet)}
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    {r.salaryDateStr}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-red-600 dark:text-red-400">
                    {formatNumber(r.totalTax)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`badge ${getRateBg(r.maxRate)}`}
                      title={
                        r.rateLabel?.includes('→')
                          ? `Выплата пересекает налоговый порог: ${r.rateLabel}`
                          : `Ставка НДФЛ: ${r.rateLabel || `${(r.maxRate * 100).toFixed(0)}%`}`
                      }
                    >
                      {r.rateLabel || `${(r.maxRate * 100).toFixed(0)}%`}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-gray-400">
                    {formatNumber(r.cumulativeAfter)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
              <td className="py-3 px-2">Итого</td>
              <td className="py-3 px-2 text-right font-mono">
                {formatNumber(monthlyResults.reduce((s,r)=>s+r.grossSalary,0))}
              </td>
              <td className="py-3 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {monthlyResults.reduce((s,r)=>s+r.firstHalfDays,0)}/{monthlyResults.reduce((s,r)=>s+r.secondHalfDays,0)}
              </td>
              <td className="py-3 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {monthlyResults.reduce((s,r)=>s+r.effectiveFirstHalf,0)}/{monthlyResults.reduce((s,r)=>s+r.effectiveSecondHalf,0)}
              </td>
              <td className="py-3 px-2 text-right font-mono">
                {formatNumber(monthlyResults.reduce((s,r)=>s+r.advanceNet,0))}
              </td>
              <td></td>
              <td className="py-3 px-2 text-right font-mono">
                {formatNumber(monthlyResults.reduce((s,r)=>s+r.salaryPartNet,0))}
              </td>
              <td></td>
              <td className="py-3 px-2 text-right font-mono text-red-600 dark:text-red-400">
                {formatNumber(monthlyResults.reduce((s,r)=>s+r.totalTax,0))}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}