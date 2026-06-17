import React from 'react';
import { Info } from 'lucide-react';
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
  const totals = monthlyResults.reduce(
    (acc, r) => ({
      grossSalary:   acc.grossSalary   + r.grossSalary,
      totalDays:     acc.totalDays     + r.firstHalfDays + r.secondHalfDays,
      effDays:       acc.effDays       + r.effectiveFirstHalf + r.effectiveSecondHalf,
      vacDays:       acc.vacDays       + (r.vacDaysFirst || 0) + (r.vacDaysSecond || 0),
      advanceNet:    acc.advanceNet    + r.advanceNet,
      salaryNet:     acc.salaryNet     + r.salaryPartNet,
      vacationNet:   acc.vacationNet   + (r.vacationNet || 0),
      bonusNet:      acc.bonusNet      + (r.bonusNet || 0),
      totalTax:      acc.totalTax      + r.totalTax,
      totalMonthNet: acc.totalMonthNet + (r.totalMonthNet || 0),
    }),
    { grossSalary:0, totalDays:0, effDays:0, vacDays:0,
      advanceNet:0, salaryNet:0, vacationNet:0, bonusNet:0, totalTax:0, totalMonthNet:0 }
  );

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Помесячный расчёт</h2>
      <div className="overflow-x-auto scrollbar-thin -mx-6 px-6">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-xs">
              <th className="text-left   py-3 px-2 text-gray-500 dark:text-gray-400">Месяц</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Gross</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400" title="Всего рабочих дней / Отработано (с учётом отпуска)">
                <div className="tooltip-container justify-center">
                  <span>Рабочие дни</span>
                  <div className="tooltip-content !w-72">
                    <p className="font-semibold mb-1">📅 Рабочие дни</p>
                    <p>Всего рабочих дней в месяце.</p>
                    <p>Если есть отпуск — ниже показывается фактически отработано.</p>
                  </div>
                </div>
              </th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Аванс net</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">ЗП net</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">
                <div className="tooltip-container justify-end">
                  <span>Отпускные net</span>
                  <div className="tooltip-content !w-80">
                    Отпускные выплачиваются не позднее чем за 3 дня до начала отпуска (ст. 136 ТК РФ).
                    Если дата выпадает на выходной/праздник — переносится на ближайший предыдущий рабочий день.
                  </div>
                </div>
              </th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Премии net</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Налог</th>
              <th className="text-center py-3 px-2 text-gray-500 dark:text-gray-400">Ставка</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400">Накоплено</th>
              <th className="text-right  py-3 px-2 text-gray-500 dark:text-gray-400 font-bold">Итого net</th>
            </tr>
          </thead>
          <tbody>
            {monthlyResults.map((r, idx) => {
              const hasVacation = r.vacDaysFirst > 0 || r.vacDaysSecond > 0;
              const totalDays = r.firstHalfDays + r.secondHalfDays;
              const effDays = r.effectiveFirstHalf + r.effectiveSecondHalf;

              return (
                <tr key={idx} className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasVacation ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                  {/* Месяц */}
                  <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                    {MONTH_NAMES_SHORT[r.month]}
                    {hasVacation && <span className="ml-1 text-green-500" title="Есть отпуск">🌴</span>}
                  </td>

                  {/* Gross */}
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatNumber(r.grossSalary)}
                    {r.effectiveGross !== r.grossSalary && (
                      <div className="text-xs text-orange-500">факт: {formatNumber(r.effectiveGross)}</div>
                    )}
                  </td>

                  {/* 👇 Рабочие дни — вторая строка ТОЛЬКО если есть отпуск */}
                  <td className="py-2 px-2 text-center text-xs">
                    {hasVacation ? (
                      <>
                        <div className="text-gray-500 dark:text-gray-400 font-medium">
                          {totalDays}
                        </div>
                        <div className="text-[11px] text-orange-500 font-semibold">
                          {effDays}
                          <span className="text-green-600 dark:text-green-400">
                            {' '}(-{r.vacDaysFirst + r.vacDaysSecond} отп.)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-700 dark:text-gray-300 font-medium">
                        {totalDays}
                      </div>
                    )}
                  </td>

                  {/* Аванс net + дата */}
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    <div>{formatNumber(r.advanceNet)}</div>
                    {r.advanceDateStr && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-sans">
                        {r.advanceDateStr}
                      </div>
                    )}
                  </td>

                  {/* ЗП net + дата */}
                  <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    <div>{formatNumber(r.salaryPartNet)}</div>
                    {r.salaryDateStr && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-sans">
                        {r.salaryDateStr}
                      </div>
                    )}
                  </td>

                  {/* Отпускные net + дата */}
                  <td className="py-2 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {r.vacationNet > 0 ? (
                      <div>
                        <div className="flex items-center justify-end gap-1">
                          <span>{formatNumber(r.vacationNet)}</span>
                          <div className="tooltip-container group">
                            <Info size={12} className="text-emerald-500/60 dark:text-emerald-400/60 cursor-help hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors" />
                            <div className="tooltip-content !w-80 left-auto right-0 translate-x-0">
                              <p className="font-semibold text-emerald-300 mb-1">🌴 Отпускные</p>
                              <p>Сумма: <span className="font-mono">{formatNumber(r.vacationNet)} ₽</span></p>
                              <p>Дата выплаты: <span className="font-mono">~{r.vacationDate}</span></p>
                              {r.vacationCount > 1 && (
                                <p className="text-[10px] text-gray-300 mt-1">Объединено выплат: {r.vacationCount}</p>
                              )}
                              <p className="mt-2 text-[10px] text-gray-300 leading-relaxed border-t border-gray-600 pt-2">
                                ⚠️ Дата примерная: отпускные выплачиваются не позднее чем за 3 дня до начала отпуска.
                                Если дата выпадает на выходной/праздник — переносится на ближайший предыдущий рабочий день.
                              </p>
                            </div>
                          </div>
                        </div>
                        {r.vacationDate && (
                          <div className="text-[10px] text-emerald-500/70 dark:text-emerald-400/70 font-sans">
                            ~{r.vacationDate}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Премии net + дата */}
                  <td className="py-2 px-2 text-right font-mono text-purple-600 dark:text-purple-400">
                    {r.bonusNet > 0 ? (
                      <div className="tooltip-container justify-end">
                        <div>
                          <div>{formatNumber(r.bonusNet)}</div>
                          {r.bonusDate && (
                            <div className="text-[10px] text-purple-500/70 dark:text-purple-400/70 font-sans">
                              {r.bonusDate}
                            </div>
                          )}
                        </div>
                        <div className="tooltip-content">
                          <p className="font-semibold text-purple-300 mb-1">🎁 Премии</p>
                          <p>Сумма: <span className="font-mono">{formatNumber(r.bonusNet)} ₽</span></p>
                          {r.bonusCount > 1 && (
                            <p className="text-[10px] text-gray-300 mt-1">Объединено выплат: {r.bonusCount}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Налог */}
                  <td className="py-2 px-2 text-right font-mono text-red-600 dark:text-red-400">
                    {formatNumber(r.totalTax)}
                  </td>

                  {/* Ставка */}
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

                  {/* Накоплено */}
                  <td className="py-2 px-2 text-right font-mono text-xs text-gray-400">
                    {formatNumber(r.cumulativeAfter)}
                  </td>

                  {/* Итого net */}
                  <td className="py-2 px-2 text-right font-mono font-bold text-gray-900 dark:text-white">
                    {formatNumber(r.totalMonthNet)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
              <td className="py-3 px-2">Итого</td>
              <td className="py-3 px-2 text-right font-mono">{formatNumber(totals.grossSalary)}</td>
              {/* 👇 Итого по рабочим дням — аналогичная логика */}
              <td className="py-3 px-2 text-center text-xs">
                {totals.vacDays > 0 ? (
                  <>
                    <div className="text-gray-700 dark:text-gray-300">{totals.totalDays}</div>
                    <div className="text-[11px] text-orange-500">
                      {totals.effDays}
                      <span className="text-green-600 dark:text-green-400"> (-{totals.vacDays} отп.)</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300">{totals.totalDays}</div>
                )}
              </td>
              <td className="py-3 px-2 text-right font-mono">{formatNumber(totals.advanceNet)}</td>
              <td className="py-3 px-2 text-right font-mono">{formatNumber(totals.salaryNet)}</td>
              <td className="py-3 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                {formatNumber(totals.vacationNet)}
              </td>
              <td className="py-3 px-2 text-right font-mono text-purple-600 dark:text-purple-400">
                {formatNumber(totals.bonusNet)}
              </td>
              <td className="py-3 px-2 text-right font-mono text-red-600 dark:text-red-400">
                {formatNumber(totals.totalTax)}
              </td>
              <td></td>
              <td></td>
              <td className="py-3 px-2 text-right font-mono text-lg">
                {formatNumber(totals.totalMonthNet)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}