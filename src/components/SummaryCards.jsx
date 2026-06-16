import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '../utils/taxCalculator';

export default function SummaryCards({ summary }) {
  const cards = [
    {
      title: 'Общий Gross',
      value: formatCurrency(summary.totalGross),
      subtitle: `ЗП: ${Math.round(summary.totalSalaryGross).toLocaleString('ru-RU')} · Бонусы: ${Math.round(summary.totalBonusGross).toLocaleString('ru-RU')} · Отпускные: ${Math.round(summary.totalVacationGross || 0).toLocaleString('ru-RU')}`,
      Icon: DollarSign,
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Удержанный НДФЛ',
      value: formatCurrency(summary.totalTax),
      subtitle: 'Удержано за год',
      Icon: TrendingDown,
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-400 to-red-600',
    },
    {
      title: 'Итого Net',
      value: formatCurrency(summary.totalNet),
      subtitle: 'На руки за год',
      Icon: TrendingUp,
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-400 to-green-600',
    },
    {
      title: 'Эффективная ставка',
      value: (summary.effectiveRate * 100).toFixed(2) + '%',
      subtitle: 'Средняя ставка НДФЛ',
      Icon: Percent,
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {cards.map(({ title, value, subtitle, Icon, iconBg, iconColor, gradient }, idx) => (
        <div key={idx} className="card hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full`} />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-tight">{subtitle}</p>
            </div>
            <div className={`p-2.5 rounded-xl ml-3 flex-shrink-0 ${iconBg}`}>
              <Icon size={20} className={iconColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}