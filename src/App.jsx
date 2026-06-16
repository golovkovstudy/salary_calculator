import React, { useEffect, useState } from 'react';
import useStore from './store/useStore';
import { useSalaryCalculator } from './hooks/useSalaryCalculator';
import { loadProductionCalendar, getHalfMonthWorkDays } from './utils/calendarApi';
import { DEFAULT_YEAR } from './utils/defaults';
import Header from './components/Header';
import TaxScaleInfo from './components/TaxScaleInfo';
import SalaryChangeSection from './components/SalaryChangeSection';
import SalaryTable from './components/SalaryTable';
import VacationSection from './components/VacationSection';
import BonusSection from './components/BonusSection';
import SummaryCards from './components/SummaryCards';
import NotificationContainer from './components/NotificationContainer';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const initTheme = useStore(s => s.initTheme);
  const setCalendarData = useStore(s => s.setCalendarData);
  const setHalfMonthData = useStore(s => s.setHalfMonthData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initTheme();
    (async () => {
      try {
        const data = await loadProductionCalendar(false);
        setCalendarData(data);
        if (data.holidays) {
          const halfData = [];
          for (let m = 0; m < 12; m++) {
            halfData.push(getHalfMonthWorkDays(m, DEFAULT_YEAR, data.holidays));
          }
          setHalfMonthData(halfData);
        }
      } catch (e) {
        console.error('Ошибка загрузки календаря:', e);
      }
      setLoading(false);
    })();
  }, []);

  const { monthlyResults, bonusResults, vacationCalcResults, summary } = useSalaryCalculator();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">💰</div>
          <div className="text-lg font-medium text-gray-600 dark:text-gray-400">Загрузка производственного календаря...</div>
          <div className="mt-3 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <SummaryCards summary={summary} />
        <TaxScaleInfo />
        <SalaryChangeSection />
        <SalaryTable monthlyResults={monthlyResults} />
        <VacationSection vacationCalcResults={vacationCalcResults} />
        <BonusSection bonusResults={bonusResults} />

        <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
          <p>Калькулятор зарплаты с прогрессивным НДФЛ © {DEFAULT_YEAR}</p>
          <p className="mt-1">Расчёт носит исключительно информационный характер</p>
        </footer>
      </main>

      {/* Глобальные UI-элементы */}
      <NotificationContainer />
      <ConfirmModal />
    </div>
  );
}