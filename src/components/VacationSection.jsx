import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Palmtree, Info } from 'lucide-react';
import useStore from '../store/useStore';
import { formatNumber } from '../utils/taxCalculator';
import { MAX_VACATIONS } from '../utils/defaults';

function getRateBg(rate) {
  if (rate <= 0.13) return 'bg-green-100  dark:bg-green-900/30  text-green-800  dark:text-green-300';
  if (rate <= 0.15) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (rate <= 0.18) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
  if (rate <= 0.20) return 'bg-red-100    dark:bg-red-900/30    text-red-800    dark:text-red-300';
  return               'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
}

export default function VacationSection({ vacationCalcResults }) {
  const vacations = useStore(s => s.vacations);
  const addVacation = useStore(s => s.addVacation);
  const removeVacation = useStore(s => s.removeVacation);
  const year = useStore(s => s.year);
  const notify = useStore(s => s.notify);
  const resetTrigger = useStore(s => s.resetTrigger); // 👈
  
  const [form, setForm] = useState({ startDate: '', endDate: '' });

  // Сброс формы при resetToDefaults
  useEffect(() => {
    setForm({ startDate: '', endDate: '' });
  }, [resetTrigger]);

  const checkOverlap = (newStart, newEnd) => {
    const newStartDate = new Date(newStart);
    const newEndDate = new Date(newEnd);
    for (const v of vacations) {
      const existingStart = new Date(v.startDate);
      const existingEnd = new Date(v.endDate);
      if (newStartDate <= existingEnd && existingStart <= newEndDate) return true;
    }
    return false;
  };

  const handleAdd = () => {
    if (!form.startDate || !form.endDate) {
      notify({ type: 'error', title: 'Не указаны даты', message: 'Укажите дату начала и окончания отпуска' });
      return;
    }
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    if (startDate > endDate) {
      notify({ type: 'error', title: 'Некорректный период', message: 'Дата начала должна быть раньше даты окончания' });
      return;
    }
    if (startDate.getFullYear() !== year || endDate.getFullYear() !== year) {
      notify({ type: 'warning', title: 'Неверный год', message: `Даты отпуска должны быть в ${year} году` });
      return;
    }
    if (vacations.length >= MAX_VACATIONS) {
      notify({ type: 'warning', title: 'Достигнут лимит', message: `Максимум ${MAX_VACATIONS} отпусков.` });
      return;
    }
    if (checkOverlap(form.startDate, form.endDate)) {
      notify({ type: 'error', title: 'Пересечение дат', message: 'Указанный период пересекается с уже добавленным отпуском.' });
      return;
    }
    addVacation({ startDate: form.startDate, endDate: form.endDate });
    notify({ type: 'success', message: 'Отпуск добавлен', duration: 2500 });
    setForm({ startDate: '', endDate: '' });
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Palmtree size={20} className="text-green-500" />
        Отпуска
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-2">
          {vacations.length}/{MAX_VACATIONS}
        </span>
      </h2>

      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4 text-xs text-amber-700 dark:text-amber-300">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Отпускные = средний дневной заработок за 12 мес × календарные дни отпуска.
          Даты отпусков не должны пересекаться.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Начало отпуска</label>
          <input type="date" value={form.startDate}
            onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Конец отпуска</label>
          <input type="date" value={form.endDate}
            onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="input-field" />
        </div>
        <div className="flex items-end">
          <button onClick={handleAdd}
            disabled={vacations.length >= MAX_VACATIONS}
            className="btn-primary flex items-center gap-1.5 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={16} /> Добавить отпуск
          </button>
        </div>
      </div>

      {vacations.length > 0 ? (
        <div className="space-y-3">
          {vacations.map(v => {
            const result = vacationCalcResults.find(r => r.id === v.id);
            return (
              <div key={v.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Palmtree size={18} className="text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {result?.startDateStr || '—'} – {result?.endDateStr || '—'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {result ? `${result.calendarDays} календ. дн. (${result.workingDaysOff} рабочих)` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeVacation(v.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
                {result && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Отпускные gross</p>
                      <p className="font-mono font-semibold text-gray-900 dark:text-white">
                        {formatNumber(result.vacationPayGross)} ₽
                      </p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">НДФЛ</p>
                      <p className="font-mono font-semibold text-red-600 dark:text-red-400">
                        {formatNumber(result.tax)} ₽
                      </p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">На руки</p>
                      <p className="font-mono font-semibold text-green-600 dark:text-green-400">
                        {formatNumber(result.net)} ₽
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ставка / Ср.дн.</p>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getRateBg(result.marginalRate)}`}>
                          {(result.marginalRate * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs font-mono text-gray-500">
                          {formatNumber(result.avgDailyPay)} ₽/д
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500">
          <Palmtree size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Нет добавленных отпусков</p>
        </div>
      )}
    </div>
  );
}