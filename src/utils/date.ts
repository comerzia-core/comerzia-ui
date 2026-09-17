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