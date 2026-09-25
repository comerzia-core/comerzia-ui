import { useAuthStore } from '../stores/useAuthStore';

/**
 * Formats a UTC ISO string into a localized timezone.
 * Uses timezoneOverride if provided, otherwise falls back to the user's companySettings,
 * and finally to the browser's timezone.
 */
export const formatDateForUser = (utcString: string | null | undefined, timezoneOverride?: string): string => {
    if (!utcString) return '-';

    // Obtenemos el perfil directamente del store
    const profile = useAuthStore.getState().userProfile;
    
    // Calculamos el timezone: 1. Override explícito, 2. Perfil del Usuario, 3. Navegador
    const tz = timezoneOverride || profile?.companySettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        const date = new Date(utcString);
        
        return new Intl.DateTimeFormat('es-ES', {
            timeZone: tz,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return utcString; // Retorno de seguridad
    }
};

/**
 * Formats a UTC ISO string into localized time only (e.g. 02:30 PM).
 */
export const formatTimeForUser = (utcString: string | null | undefined, timezoneOverride?: string): string => {
    if (!utcString) return '-';

    const profile = useAuthStore.getState().userProfile;
    const tz = timezoneOverride || profile?.companySettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        const date = new Date(utcString);
        
        return new Intl.DateTimeFormat('es-ES', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    } catch (error) {
        console.error("Error formatting time:", error);
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