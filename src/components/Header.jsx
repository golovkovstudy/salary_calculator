import React from 'react';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import useStore from '../store/useStore';
import CalendarStatus from './CalendarStatus';
import { DEFAULT_YEAR } from '../utils/defaults';

export default function Header() {
  const darkMode         = useStore(s => s.darkMode);
  const toggleDarkMode   = useStore(s => s.toggleDarkMode);
  const resetToDefaults  = useStore(s => s.resetToDefaults);
  const notify           = useStore(s => s.notify);
  const showConfirm      = useStore(s => s.showConfirm);

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
        <div className="flex items-center justify-between flex-wrap gap-3">
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
      </div>
    </header>
  );
}