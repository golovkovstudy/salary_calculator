import React from 'react';
import { CloudOff, RefreshCw, Cloud, Check } from 'lucide-react';
import useStore from '../store/useStore';
import { loadProductionCalendar, getHalfMonthWorkDays } from '../utils/calendarApi';
import { DEFAULT_YEAR } from '../utils/defaults';

export default function CalendarStatus() {
  const calendarLoaded = useStore(s => s.calendarLoaded);
  const calendarOnline = useStore(s => s.calendarOnline);
  const calendarError = useStore(s => s.calendarError);
  const calendarErrorDismissed = useStore(s => s.calendarErrorDismissed);
  const dismissCalendarError = useStore(s => s.dismissCalendarError);
  const setCalendarData = useStore(s => s.setCalendarData);
  const setHalfMonthData = useStore(s => s.setHalfMonthData);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await loadProductionCalendar(true);
      setCalendarData(data);
      if (data.holidays) {
        const halfData = [];
        for (let m = 0; m < 12; m++) {
          halfData.push(getHalfMonthWorkDays(m, DEFAULT_YEAR, data.holidays));
        }
        setHalfMonthData(halfData);
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  // Модальное предупреждение
  if (calendarError && !calendarErrorDismissed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="card max-w-md mx-4 text-center">
          <CloudOff size={48} className="mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Внимание
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {calendarError}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRefresh} className="btn-secondary flex items-center gap-1.5" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Повторить
            </button>
            <button onClick={dismissCalendarError} className="btn-primary">
              Понятно
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Иконка статуса в углу
  return (
    <div className="flex items-center gap-1.5">
      {calendarOnline ? (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400" title="Производственный календарь загружен">
          <Cloud size={16} />
          <Check size={12} />
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <CloudOff size={16} className="text-orange-500" title="Нет соединения с API календаря" />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Обновить производственный календарь"
          >
            <RefreshCw size={14} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}