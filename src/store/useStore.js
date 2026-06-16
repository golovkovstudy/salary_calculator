import { create } from 'zustand';
import { DEFAULT_YEAR, DEFAULT_GROSS_SALARY, MAX_VACATIONS } from '../utils/defaults';

let nextBonusId = 1;
let nextVacationId = 1;
let nextSalaryChangeId = 1;
let nextNotificationId = 1;
let nextConfirmId = 1;

// ============================================
// === LOCAL STORAGE: Автосохранение ===
// ============================================
const STORAGE_KEY = 'salaryCalculatorState';
const STORAGE_VERSION = 1;
const STORAGE_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 год

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Проверка версии
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Проверка TTL
    if (parsed.savedAt && (Date.now() - parsed.savedAt > STORAGE_TTL_MS)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn('Не удалось загрузить состояние из localStorage:', e);
    return null;
  }
}

function saveToStorage(state) {
  try {
    const data = {
      defaultGrossSalary: state.defaultGrossSalary,
      salaryChanges: state.salaryChanges,
      vacations: state.vacations,
      bonuses: state.bonuses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      data,
    }));
  } catch (e) {
    console.warn('Не удалось сохранить состояние в localStorage:', e);
  }
}

// Загружаем сохранённое состояние ДО создания стора
const initialState = loadFromStorage();

const useStore = create((set, get) => ({
  // === Тема ===
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    document.documentElement.classList.toggle('dark', newMode);
    return { darkMode: newMode };
  }),
  initTheme: () => {
    if (get().darkMode) document.documentElement.classList.add('dark');
  },

  // === Год ===
  year: DEFAULT_YEAR,

  // === Триггер сброса (для локальных форм компонентов) ===
  resetTrigger: 0,

  // === Производственный календарь ===
  calendarLoaded: false,
  calendarOnline: false,
  calendarError: null,
  calendarErrorDismissed: false,
  holidays: [],
  monthWorkDays: [15,19,21,22,19,21,23,21,22,22,20,22],
  halfMonthData: [],
  
  setCalendarData: (data) => set({
    calendarLoaded: true,
    calendarOnline: data.isOnline,
    calendarError: data.error,
    calendarErrorDismissed: false,
    holidays: data.holidays,
    monthWorkDays: data.workDays,
  }),
  setHalfMonthData: (data) => set({ halfMonthData: data }),
  dismissCalendarError: () => set({ calendarErrorDismissed: true }),

  // === Зарплата (базовая) ===
  defaultGrossSalary: initialState?.defaultGrossSalary ?? DEFAULT_GROSS_SALARY,
  setDefaultGrossSalary: (value) => set({ defaultGrossSalary: value }),

  // === Изменения зарплаты ===
  salaryChanges: initialState?.salaryChanges?.map(c => ({ ...c, id: (nextSalaryChangeId = Math.max(nextSalaryChangeId, c.id + 1)) - 1 })) ?? [],
  addSalaryChange: (change) => set((state) => {
    if (state.salaryChanges.length >= 20) return state;
    return {
      salaryChanges: [...state.salaryChanges, { ...change, id: nextSalaryChangeId++ }]
    };
  }),
  removeSalaryChange: (id) => set((state) => ({
    salaryChanges: state.salaryChanges.filter(c => c.id !== id)
  })),
  updateSalaryChange: (id, updates) => set((state) => ({
    salaryChanges: state.salaryChanges.map(c => c.id === id ? { ...c, ...updates } : c)
  })),

  // === Отпуска ===
  vacations: initialState?.vacations?.map(v => ({ ...v, id: (nextVacationId = Math.max(nextVacationId, v.id + 1)) - 1 })) ?? [],
  addVacation: (vacation) => set((state) => {
    if (state.vacations.length >= MAX_VACATIONS) return state;
    return {
      vacations: [...state.vacations, { ...vacation, id: nextVacationId++ }]
    };
  }),
  removeVacation: (id) => set((state) => ({
    vacations: state.vacations.filter(v => v.id !== id)
  })),
  updateVacation: (id, updates) => set((state) => ({
    vacations: state.vacations.map(v => v.id === id ? { ...v, ...updates } : v)
  })),

  // === Премии ===
  bonuses: initialState?.bonuses?.map(b => ({ ...b, id: (nextBonusId = Math.max(nextBonusId, b.id + 1)) - 1 })) ?? [],
  addBonus: (bonus) => set((state) => ({
    bonuses: [...state.bonuses, { ...bonus, id: nextBonusId++ }]
  })),
  removeBonus: (id) => set((state) => ({
    bonuses: state.bonuses.filter(b => b.id !== id)
  })),

  // === Сброс ===
  resetToDefaults: () => {
    set({
      defaultGrossSalary: DEFAULT_GROSS_SALARY,
      salaryChanges: [],
      vacations: [],
      bonuses: [],
      calendarErrorDismissed: false,
      resetTrigger: get().resetTrigger + 1, // 👈 инкрементируем триггер
    });
    // Сразу очищаем localStorage
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  },

  // === Импорт ===
  importData: (data) => set({
    defaultGrossSalary: data.defaultGrossSalary || DEFAULT_GROSS_SALARY,
    salaryChanges: (data.salaryChanges || []).map(c => ({ ...c, id: nextSalaryChangeId++ })),
    vacations: (data.vacations || []).map(v => ({ ...v, id: nextVacationId++ })),
    bonuses: (data.bonuses || []).map(b => ({ ...b, id: nextBonusId++ })),
  }),

  // ==========================================
  // === СИСТЕМА УВЕДОМЛЕНИЙ (TOASTS) ===
  // ==========================================
  notifications: [],
  notify: (notification) => {
    const id = nextNotificationId++;
    const n = {
      id,
      type: 'info',
      duration: 5000,
      exiting: false,
      ...notification,
    };
    set(state => ({ notifications: [...state.notifications, n] }));
    if (n.duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, n.duration);
    }
    return id;
  },
  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, exiting: true } : n
      )
    }));
    setTimeout(() => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, 300);
  },

  // === МОДАЛ ПОДТВЕРЖДЕНИЯ ===
  confirmDialog: null,
  showConfirm: (message, onConfirm, onCancel, options = {}) => {
    set({
      confirmDialog: {
        id: nextConfirmId++,
        message,
        onConfirm,
        onCancel: onCancel || (() => {}),
        title: options.title || 'Подтверждение',
        confirmText: options.confirmText || 'Да',
        cancelText: options.cancelText || 'Нет',
        danger: options.danger || false,
      }
    });
  },
  closeConfirm: () => set({ confirmDialog: null }),
}));

// ============================================
// === АВТОСОХРАНЕНИЕ С DEBOUNCE ===
// ============================================
let saveTimeout = null;
useStore.subscribe((state, prevState) => {
  // Сохраняем только если изменились пользовательские данные
  const keys = ['defaultGrossSalary', 'salaryChanges', 'vacations', 'bonuses'];
  const changed = keys.some(k => state[k] !== prevState[k]);
  if (!changed) return;
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(state);
  }, 500); // Debounce 500ms — не пишем при каждом нажатии клавиши
});

export default useStore;