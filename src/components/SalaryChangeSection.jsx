import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import useStore from '../store/useStore';
import { formatNumber } from '../utils/taxCalculator';

export default function SalaryChangeSection() {
  const defaultGross = useStore(s => s.defaultGrossSalary);
  const setDefaultGross = useStore(s => s.setDefaultGrossSalary);
  const salaryChanges = useStore(s => s.salaryChanges);
  const addSalaryChange = useStore(s => s.addSalaryChange);
  const removeSalaryChange = useStore(s => s.removeSalaryChange);
  const notify = useStore(s => s.notify);
  const resetTrigger = useStore(s => s.resetTrigger); // 👈
  
  const [form, setForm] = useState({ startDate: '', endDate: '', amount: '' });
  const [editingGross, setEditingGross] = useState(defaultGross);

  // Синхронизация editingGross с store (при сбросе или загрузке из localStorage)
  useEffect(() => {
    setEditingGross(defaultGross);
  }, [defaultGross]);

  // Сброс локальной формы при resetToDefaults
  useEffect(() => {
    setForm({ startDate: '', endDate: '', amount: '' });
  }, [resetTrigger]);

  const handleApplyGross = () => {
    const n = parseInt(editingGross);
    if (isNaN(n) || n <= 0) {
      notify({ type: 'error', title: 'Некорректная сумма', message: 'Базовая зарплата должна быть положительным числом' });
      return;
    }
    setDefaultGross(n);
    notify({ type: 'success', message: 'Базовая зарплата обновлена', duration: 2500 });
  };

  const handleAdd = () => {
    const amount = parseInt(form.amount);
    if (isNaN(amount) || amount <= 0) {
      notify({ type: 'error', title: 'Некорректная сумма', message: 'Введите положительное число для зарплаты' });
      return;
    }
    if (!form.startDate || !form.endDate) {
      notify({ type: 'error', title: 'Не указаны даты', message: 'Укажите дату начала и окончания периода' });
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      notify({ type: 'error', title: 'Некорректный период', message: 'Дата начала должна быть раньше даты окончания' });
      return;
    }
    addSalaryChange({ startDate: form.startDate, endDate: form.endDate, amount });
    notify({ type: 'success', message: 'Изменение зарплаты добавлено', duration: 2500 });
    setForm(f => ({ ...f, amount: '' }));
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-blue-500" /> Зарплата
      </h2>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Базовая зарплата (gross)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Применяется ко всем месяцам, если не указано иное
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={editingGross}
            onChange={e => setEditingGross(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleApplyGross()}
            className="input-field w-36 text-right" min="0" />
          <button onClick={handleApplyGross} className="btn-primary text-xs">
            Применить
          </button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Изменения зарплаты в течение года
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Если зарплата менялась, укажите период и сумму. Эти данные также влияют на расчёт отпускных.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">С даты</label>
          <input type="date" value={form.startDate}
            onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">По дату</label>
          <input type="date" value={form.endDate}
            onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Зарплата gross</label>
          <input type="number" value={form.amount}
            onChange={e => setForm(f => ({...f, amount: e.target.value}))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="0" className="input-field" min="0" /> {/* 👈 placeholder "0" */}
        </div>
        <div className="flex items-end">
          <button onClick={handleAdd} className="btn-primary flex items-center gap-1.5 w-full justify-center">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      {salaryChanges.length > 0 && (
        <div className="space-y-2">
          {salaryChanges.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(c.startDate).toLocaleDateString('ru-RU')} – {new Date(c.endDate).toLocaleDateString('ru-RU')}
                </span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {formatNumber(c.amount)} ₽
                </span>
                {c.amount > defaultGross && (
                  <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    +{formatNumber(c.amount - defaultGross)}
                  </span>
                )}
                {c.amount < defaultGross && (
                  <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    {formatNumber(c.amount - defaultGross)}
                  </span>
                )}
              </div>
              <button onClick={() => removeSalaryChange(c.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}