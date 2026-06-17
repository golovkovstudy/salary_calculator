import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Gift, Info } from 'lucide-react';
import useStore from '../store/useStore';
import { formatNumber, calculatePaymentTax } from '../utils/taxCalculator';
import { BONUS_TYPES, DEFAULT_YEAR } from '../utils/defaults';

function getRateBg(rate) {
  if (rate <= 0.13) return 'bg-green-100  dark:bg-green-900/30  text-green-800  dark:text-green-300';
  if (rate <= 0.15) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (rate <= 0.18) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
  if (rate <= 0.20) return 'bg-red-100    dark:bg-red-900/30    text-red-800    dark:text-red-300';
  return               'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
}

function DateInput({ value, onChange, placeholder }) {
  const [textValue, setTextValue] = useState(value || '');
  
  // Синхронизация textValue с value извне (например при сбросе)
  useEffect(() => {
    if (!value) {
      setTextValue('');
    } else {
      const [y, m, d] = value.split('-');
      setTextValue(`${d}.${m}.${y}`);
    }
  }, [value]);

  const handleTextChange = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '');
    if (v.length === 2 && !v.includes('.')) v += '.';
    if (v.length === 5 && v.split('.').length === 2) v += '.';
    setTextValue(v);
    const parts = v.split('.');
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const isoDate = `${year}-${month}-${day}`;
      const dateObj = new Date(isoDate);
      if (!isNaN(dateObj.getTime())) onChange(isoDate);
    }
  };
  const handleNativeChange = (e) => {
    const iso = e.target.value;
    onChange(iso);
    if (iso) {
      const [y, m, d] = iso.split('-');
      setTextValue(`${d}.${m}.${y}`);
    } else {
      setTextValue('');
    }
  };
  return (
    <div className="relative flex gap-1">
      <input type="text" value={textValue} onChange={handleTextChange}
        placeholder={placeholder || 'ДД.ММ.ГГГГ'} className="input-field flex-1" maxLength={10} />
      <input type="date" value={value || ''} onChange={handleNativeChange}
        className="absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer" title="Выбрать из календаря" />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">📅</div>
    </div>
  );
}

function netToGross(netAmount, cumulativeIncomeBefore) {
  if (netAmount <= 0) return 0;
  let low = netAmount;
  let high = netAmount * 2;
  for (let i = 0; i < 10; i++) {
    const taxResult = calculatePaymentTax(cumulativeIncomeBefore, high);
    if (taxResult.net >= netAmount) break;
    high *= 2;
  }
  for (let i = 0; i < 100; i++) {
    const mid = Math.round((low + high) / 2);
    const taxResult = calculatePaymentTax(cumulativeIncomeBefore, mid);
    if (taxResult.net === netAmount) return mid;
    if (taxResult.net < netAmount) low = mid + 1;
    else high = mid - 1;
    if (low >= high) {
      const r1 = calculatePaymentTax(cumulativeIncomeBefore, low);
      const r2 = calculatePaymentTax(cumulativeIncomeBefore, low + 1);
      if (r1.net === netAmount) return low;
      if (r2.net === netAmount) return low + 1;
      return r1.net >= netAmount ? low : low + 1;
    }
  }
  return Math.round(netAmount / 0.87);
}

export default function BonusSection({ bonusResults }) {
  const bonuses     = useStore(s => s.bonuses);
  const addBonus    = useStore(s => s.addBonus);
  const removeBonus = useStore(s => s.removeBonus);
  const year        = useStore(s => s.year);
  const notify      = useStore(s => s.notify);
  const resetTrigger = useStore(s => s.resetTrigger); // 👈
  
  const [form, setForm] = useState({ amount: '', date: '', type: 'bonus', isNet: true });

  // Сброс формы при resetToDefaults
  useEffect(() => {
    setForm({ amount: '', date: '', type: 'bonus', isNet: true });
  }, [resetTrigger]);

  const handleAdd = () => {
    const amount = parseInt(form.amount);
    if (isNaN(amount) || amount <= 0) {
      notify({ type: 'error', title: 'Некорректная сумма', message: 'Введите положительное число' });
      return;
    }
    if (!form.date) {
      notify({ type: 'error', title: 'Не указана дата', message: 'Выберите дату выплаты премии' });
      return;
    }
    const dateObj = new Date(form.date);
    if (isNaN(dateObj.getTime())) {
      notify({ type: 'error', title: 'Ошибка даты', message: 'Некорректный формат даты' });
      return;
    }
    if (dateObj.getFullYear() !== year) {
      notify({ type: 'warning', title: 'Другой год', message: `Премии учитываются только за ${year} год.` });
      return;
    }
    addBonus({ amount, date: form.date, type: form.type, isNet: form.isNet });
    notify({ type: 'success', message: 'Премия добавлена', duration: 2500 });
    setForm(f => ({ ...f, amount: '', date: '' }));
  };

  return (
    <div className="card animate-fade-in">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Gift size={20} className="text-purple-500" /> Премии и допдоходы
      </h2>

      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 text-xs text-blue-700 dark:text-blue-300">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Премии учитываются в хронологическом порядке и влияют на ставку НДФЛ.
          Если вы знаете сумму «на руки» — выберите «Net», и система сама рассчитает gross.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Сумма</label>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
              <button onClick={() => setForm(f => ({ ...f, isNet: false }))}
                className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  !form.isNet ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}>Gross</button>
              <button onClick={() => setForm(f => ({ ...f, isNet: true }))}
                className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  form.isNet ? 'bg-primary-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}>Net</button>
            </div>
          </div>
          <input type="number" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="0" className="input-field" min="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Дата</label>
          <DateInput value={form.date} onChange={(v) => setForm(f => ({ ...f, date: v }))} placeholder="ДД.ММ.ГГГГ" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Тип</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
            {BONUS_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleAdd} className="btn-primary flex items-center gap-1.5 w-full justify-center">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      {bonuses.length > 0 ? (
        <div className="overflow-x-auto scrollbar-thin -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 text-xs">
                <th className="text-left   py-2 px-2 text-gray-500 dark:text-gray-400">Тип</th>
                <th className="text-right  py-2 px-2 text-gray-500 dark:text-gray-400">Gross</th>
                <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400">Дата</th>
                <th className="text-right  py-2 px-2 text-gray-500 dark:text-gray-400">Налог</th>
                <th className="text-right  py-2 px-2 text-gray-500 dark:text-gray-400">Net</th>
                <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400">Ставка</th>
                <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400">Ввод</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
            {[...bonuses]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(b => {
                const r = bonusResults.find(x => x.id === b.id);
                const hasResult = r && r.dateStr && r.dateStr !== '—';
                return (
                  <tr key={b.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100">
                      {BONUS_TYPES.find(t => t.value === b.type)?.label || 'Прочее'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                      {hasResult ? formatNumber(r.gross) : formatNumber(b.amount)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                      {hasResult ? r.dateStr : (b.date ? new Date(b.date).toLocaleDateString('ru-RU') : '—')}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-red-600 dark:text-red-400">
                      {hasResult ? formatNumber(r.tax) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-green-600 dark:text-green-400">
                      {hasResult ? formatNumber(r.net) : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {hasResult ? (
                        <span className={`badge ${getRateBg(r.marginalRate)}`}
                          title={r.breakdown && r.breakdown.length > 1
                            ? r.breakdown.map(br => `${formatNumber(br.amount)} × ${(br.rate * 100).toFixed(0)}% = ${formatNumber(br.tax)}`).join('\n')
                            : `Ставка НДФЛ: ${r.rateLabel || (r.marginalRate * 100).toFixed(0) + '%'}`}>
                          {r.rateLabel || `${(r.marginalRate * 100).toFixed(0)}%`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        b.isNet ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>{b.isNet ? 'net' : 'gross'}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => removeBonus(b.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {bonusResults.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
                  <td className="py-2 px-2">Итого</td>
                  <td className="py-2 px-2 text-right font-mono">{formatNumber(bonusResults.reduce((s, r) => s + r.gross, 0))}</td>
                  <td></td>
                  <td className="py-2 px-2 text-right font-mono text-red-600 dark:text-red-400">
                    {formatNumber(bonusResults.reduce((s, r) => s + r.tax, 0))}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-green-600 dark:text-green-400">
                    {formatNumber(bonusResults.reduce((s, r) => s + r.net, 0))}
                  </td>
                  <td></td><td></td><td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500">
          <Gift size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Нет добавленных премий</p>
        </div>
      )}
    </div>
  );
}