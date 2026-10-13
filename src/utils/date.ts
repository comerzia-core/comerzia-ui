import { useAuthStore } from '../stores/useAuthStore';

/**
 * Normalizes an incoming date string so that ISO strings without offset are explicitly parsed as UTC.
 */
export const normalizeUtcString = (utcString: string): string => {
    let s = utcString.trim();
    if (s.includes(' ') && !s.includes('T')) {
        s = s.replace(' ', 'T');
    }
    if (s.includes('T') && !s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
        s = `${s}Z`;
    }
    return s;
};

/**
 * Returns a validated IANA timezone candidate:
 * 1. Explicit override
 * 2. User's companySettings.timezone
 * 3. Browser resolved timezone
 * 4. Fallback to 'UTC'
 */
export const getEffectiveTimezone = (timezoneOverride?: string): string => {
    const profile = useAuthStore.getState().userProfile;
    const candidates = [
        timezoneOverride,
        profile?.companySettings?.timezone,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        'UTC',
    ];
    for (const candidate of candidates) {
        if (candidate && typeof candidate === 'string' && candidate.trim()) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: candidate.trim() });
                return candidate.trim();
            } catch {
                // Continue to next candidate if invalid
            }
        }
    }
    return 'UTC';
};

/**
 * Formats a UTC ISO string into a localized timezone.
 * Uses timezoneOverride if provided, otherwise falls back to the user's companySettings,
 * and finally to the browser's timezone.
 */
export const formatDateForUser = (utcString: string | null | undefined, timezoneOverride?: string): string => {
    if (!utcString) return '-';

    const tz = getEffectiveTimezone(timezoneOverride);

    try {
        const normalized = normalizeUtcString(utcString);
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return utcString;

        return new Intl.DateTimeFormat('es-ES', {
            timeZone: tz,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return utcString;
    }
};

/**
 * Formats a UTC ISO string into localized time only (e.g. 02:30 PM).
 */
export const formatTimeForUser = (utcString: string | null | undefined, timezoneOverride?: string): string => {
    if (!utcString) return '-';

    const tz = getEffectiveTimezone(timezoneOverride);

    try {
        const normalized = normalizeUtcString(utcString);
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return utcString;

        return new Intl.DateTimeFormat('es-ES', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    } catch (error) {
        console.error('Error formatting time:', error);
        return utcString;
    }
};

export type FilterPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export const PERIOD_OPTIONS = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes anterior' },
  { value: 'THIS_YEAR', label: 'Este año' },
  { value: 'CUSTOM', label: 'Rango personalizado' }
];

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Retorna una descripción amigable del periodo seleccionado (ej. "25 de Septiembre 2026", "Septiembre 2026 (01 - 25 sep)").
 * Retorna cadena vacía para 'CUSTOM' ya que el usuario ingresa las fechas manualmente.
 */
export const getPeriodDescription = (period: FilterPeriod | string): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const pad = (n: number) => String(n).padStart(2, '0');

  switch (period) {
    case 'TODAY': {
      return `${currentDay} de ${MONTH_NAMES_ES[currentMonth]} ${currentYear}`;
    }
    case 'THIS_WEEK': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      const monDay = monday.getDate();
      const monMonth = MONTH_NAMES_ES[monday.getMonth()].slice(0, 3).toLowerCase();
      const nowMonth = MONTH_NAMES_ES[currentMonth].slice(0, 3).toLowerCase();
      return `${monDay} ${monMonth} - ${currentDay} ${nowMonth} ${currentYear}`;
    }
    case 'THIS_MONTH': {
      return `${MONTH_NAMES_ES[currentMonth]} ${currentYear} (01 - ${pad(currentDay)} ${MONTH_NAMES_ES[currentMonth].slice(0, 3).toLowerCase()})`;
    }
    case 'LAST_MONTH': {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthIndex = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0).getDate();
      return `${MONTH_NAMES_ES[lastMonthIndex]} ${lastMonthYear} (01 - ${lastDayOfLastMonth} ${MONTH_NAMES_ES[lastMonthIndex].slice(0, 3).toLowerCase()})`;
    }
    case 'THIS_YEAR': {
      return `Año ${currentYear} (01 ene - ${pad(currentDay)} ${MONTH_NAMES_ES[currentMonth].slice(0, 3).toLowerCase()})`;
    }
    case 'CUSTOM':
    default:
      return '';
  }
};