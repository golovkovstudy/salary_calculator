// src/components/TaxScaleInfo.jsx
import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from '../utils/taxCalculator';
import { DEFAULT_YEAR } from '../utils/defaults';

export default function TaxScaleInfo() {
  const [open, setOpen] = useState(false);

  const brackets = [
    { range: 'до 2 400 000', rate: '13%', base: '0', extra: '+13% с суммы', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    { range: '2 400 001 – 5 000 000', rate: '15%', base: '312 000', extra: '+15% с превышения', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    { range: '5 000 001 – 20 000 000', rate: '18%', base: '702 000', extra: '+18% с превышения', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
    { range: '20 000 001 – 50 000 000', rate: '20%', base: '3 402 000', extra: '+20% с превышения', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    { range: 'свыше 50 000 000', rate: '22%', base: '9 402 000', extra: '+22% с превышения', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  ];

  return (
    <div className="card animate-fade-in">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Info size={20} className="text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Прогрессивная шкала НДФЛ {DEFAULT_YEAR}</h3>
        </div>
        {open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {open && (
        <div className="mt-4 overflow-x-auto animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Доход за год</th>
                <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">Ставка</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Базовый налог</th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Доп. налог</th>
              </tr>
            </thead>
            <tbody>
              {brackets.map((b, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{b.range}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`badge ${b.color}`}>{b.rate}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{b.base} ₽</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">{b.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <strong>Как работает:</strong> Налог рассчитывается кумулятивно – каждая выплата увеличивает
            накопленный доход за год. Когда суммарный доход пересекает порог, на сумму превышения
            применяется повышенная ставка.
          </div>
        </div>
      )}
    </div>
  );
}