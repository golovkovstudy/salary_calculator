import {
  FALLBACK_WORKING_DAYS,
  FALLBACK_HOLIDAYS,
  DEFAULT_YEAR,
} from './defaults';

const CACHE_KEY = 'productionCalendar';
const CACHE_TTL = 72 * 60 * 60 * 1000;

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.year !== DEFAULT_YEAR) return null;
    const age = Date.now() - parsed.timestamp;
    if (age > CACHE_TTL) return { ...parsed, expired: true };
    return { ...parsed, expired: false };
  } catch {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      year: DEFAULT_YEAR,
      timestamp: Date.now(),
      holidays: data.holidays,
      workDays: data.workDays,
    }));
  } catch {}
}

async function fetchFromApi() {
  const response = await fetch(
    `https://isdayoff.ru/api/getdata?year=${DEFAULT_YEAR}&cc=ru&pre=0`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!response.ok) throw new Error(`API ответил ${response.status}`);
  const text = await response.text();
  if (!/^[012]+$/.test(text)) throw new Error('Некорректный формат ответа API');
  return text;
}

function parseIsDayOffResponse(responseText) {
  const holidays = [];
  const monthWorkDays = new Array(12).fill(0);
  const dailyData = [];
  let dayIndex = 0;

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(DEFAULT_YEAR, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const char = responseText[dayIndex];
      const isOff = char === '1' || char === '2';
      const dateStr = `${DEFAULT_YEAR}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyData.push({ date: dateStr, month, day, isWorking: !isOff });
      if (isOff) holidays.push(dateStr);
      else monthWorkDays[month]++;
      dayIndex++;
    }
  }

  return { holidays, workDays: monthWorkDays, dailyData };
}

function buildFallbackData() {
  const holidays = [...FALLBACK_HOLIDAYS];
  const dailyData = [];
  const monthWorkDays = new Array(12).fill(0);

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(DEFAULT_YEAR, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${DEFAULT_YEAR}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(DEFAULT_YEAR, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(dateStr);
      const isWorking = !isWeekend && !isHoliday;
      dailyData.push({ date: dateStr, month, day, isWorking });
      if (isWorking) monthWorkDays[month]++;
    }
  }

  return { holidays, workDays: monthWorkDays, dailyData };
}

export async function loadProductionCalendar(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached && !cached.expired) {
      const fallback = buildFallbackData();
      return {
        workDays: cached.workDays,
        holidays: cached.holidays,
        dailyData: fallback.dailyData,
        fromCache: true,
        isOnline: true,
        error: null,
      };
    }
  }

  try {
    const responseText = await fetchFromApi();
    const parsed = parseIsDayOffResponse(responseText);
    setCachedData({ holidays: parsed.holidays, workDays: parsed.workDays });
    return { ...parsed, fromCache: false, isOnline: true, error: null };
  } catch (err) {
    console.warn('Ошибка загрузки производственного календаря:', err.message);
    const cached = getCachedData();
    if (cached) {
      const fallback = buildFallbackData();
      return {
        workDays: cached.workDays,
        holidays: cached.holidays,
        dailyData: fallback.dailyData,
        fromCache: true,
        isOnline: false,
        error: 'Производственный календарь не доступен, данные могут быть не корректны',
      };
    }
    const fallback = buildFallbackData();
    return {
      ...fallback,
      fromCache: false,
      isOnline: false,
      error: 'Производственный календарь не доступен, данные могут быть не корректны',
    };
  }
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function countWorkingDaysInRange(startDate, endDate, holidays) {
  const holidaySet = new Set(holidays);
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = formatDateStr(current);
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function countCalendarDaysInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getHalfMonthWorkDays(month, year, holidays) {
  const holidaySet = new Set(holidays);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstHalf = 0;
  let secondHalf = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    const dateStr = formatDateStr(dateObj);
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      if (day <= 15) firstHalf++;
      else secondHalf++;
    }
  }
  return { firstHalf, secondHalf };
}

/**
 * Находит ближайший предыдущий рабочий день к указанной дате (включительно).
 * Если targetDate — рабочий, возвращает её.
 * Если выходной/праздник — возвращает ближайший предыдущий рабочий день.
 */
export function getPreviousWorkingDay(targetDate, holidays) {
  const holidaySet = new Set(holidays);
  const current = new Date(targetDate);

  for (let i = 0; i < 14; i++) {
    const dayOfWeek = current.getDay();
    const dateStr = formatDateStr(current);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      return new Date(current);
    }
    current.setDate(current.getDate() - 1);
  }

  return new Date(targetDate); // фоллбэк
}
