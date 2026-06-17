import React from 'react';
import { Sun, Moon, RotateCcw, Calendar, Wallet, Briefcase } from 'lucide-react';
import useStore from '../store/useStore';
import { useSalaryCalculator } from '../hooks/useSalaryCalculator';
import CalendarStatus from './CalendarStatus';
import { DEFAULT_YEAR, MONTH_NAMES_SHORT } from '../utils/defaults';
import { formatNumber } from '../utils/taxCalculator';

const PAYMENT_TYPE_LABELS = {
  advance: 'Аванс',
  salary: 'Зарплата',
  vacation: 'Отпускные',
  bonus: 'Премия',
};

const PAYMENT_TYPE_ICONS = {
  advance: '💼',
  salary: '💰',
  vacation: '🌴',
  bonus: '🎁',
};

export default function Header() {
  const darkMode         = useStore(s => s.darkMode);
  const toggleDarkMode   = useStore(s => s.toggleDarkMode);
  const resetToDefaults  = useStore(s => s.resetToDefaults);
  const notify           = useStore(s => s.notify);
  const showConfirm      = useStore(s => s.showConfirm);

  // 👇 Получаем данные о выплатах
  const { monthlyResults, processedPayments } = useSalaryCalculator();

  // Ближайшая выплата (дата >= сегодня, net > 0)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextPayment = processedPayments
    .filter(p => {
      const pDate = new Date(p.date);
      pDate.setHours(0, 0, 0, 0);
      return pDate >= today && p.net > 0;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const daysUntil = nextPayment
    ? Math.ceil((new Date(nextPayment.date).setHours(0, 0, 0, 0) - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Стоимость рабочего дня текущего месяца (gross)
  const currentMonth = today.getMonth();
  const currentMonthData = monthlyResults[currentMonth];
  const workDays = currentMonthData
    ? currentMonthData.firstHalfDays + currentMonthData.secondHalfDays
    : 0;
  const gross = currentMonthData ? currentMonthData.grossSalary : 0;
  const dailyRate = workDays > 0 ? Math.round(gross / workDays) : 0;

  const handleReset = () => {
    showConfirm(
      'Все введённые данные (зарплата, отпуска, премии) будут удалены. Продолжить?',
      () => {
        resetToDefaults();
        notify({ type: 'success', message: 'Настройки сброшены к значениям по умолчанию' });
      },
      null,
      {
        title: 'Сброс настроек',
        confirmText: 'Сбросить',
        cancelText: 'Отмена',
        danger: true,
      }
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Верхняя строка: заголовок + ближайшая выплата + кнопки */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Заголовок */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Калькулятор зарплаты
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Прогрессивный НДФЛ {DEFAULT_YEAR} · Премии · Отпуска · Аванс/Зарплата
              </p>
            </div>
          </div>

          {/* 👇 Блок ближайшей выплаты */}
          {nextPayment && (
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 animate-fade-in">
              {/* Дата и тип */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">
                    Ближайшая выплата
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mt-0.5">
                    <span className="mr-1">{PAYMENT_TYPE_ICONS[nextPayment.type] || '💵'}</span>
                    {nextPayment.dateStr}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                      · {PAYMENT_TYPE_LABELS[nextPayment.type] || nextPayment.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Сумма net */}
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-green-500 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">
                    Сумма net
                  </div>
                  <div className="text-sm font-bold font-mono text-green-600 dark:text-green-400 leading-tight mt-0.5">
                    {formatNumber(nextPayment.net)} ₽
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Дней осталось */}
              <div className="text-center min-w-[40px]">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">
                  Осталось
                </div>
                <div className={`text-lg font-bold leading-tight mt-0.5 ${
                  daysUntil === 0 
                    ? 'text-orange-500 animate-pulse' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {daysUntil}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">
                    {daysUntil === 1 ? 'день' : daysUntil >= 2 && daysUntil <= 4 ? 'дня' : 'дней'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки управления */}
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarStatus />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block" />
            <button onClick={handleReset} className="btn-secondary flex items-center gap-1.5">
              <RotateCcw size={16} /><span className="hidden sm:inline">Сброс</span>
            </button>
            <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
              {darkMode
                ? <Sun  size={20} className="text-yellow-400" />
                : <Moon size={20} className="text-gray-600" />}
            </button>
          </div>
        </div>

        {/* 👇 Нижняя строка: стоимость рабочего дня */}
        {dailyRate > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
            <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
            <span>Стоимость рабочего дня(gross) в </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {MONTH_NAMES_SHORT[currentMonth].toLowerCase()}е
            </span>
            <span className="text-gray-400">—</span>
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
              {formatNumber(dailyRate)} ₽/день
            </span>
            <span className="text-gray-400 hidden sm:inline">
              ({formatNumber(gross)} ₽ gross / {workDays} раб. дн.)
            </span>
          </div>
        )}
      </div>
    </header>
  );
}