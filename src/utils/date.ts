import { useAuthStore } from '../stores/useAuthStore';

/**
 * Formats a UTC ISO string into the user's localized timezone.
 * Uses the timezone from companySettings or falls back to the browser's timezone.
 */
export const formatDateForUser = (utcString: string | null | undefined): string => {
    if (!utcString) return '-';

    // Obtenemos el perfil directamente del store (sin hook, para usarlo en funciones puras)
    const profile = useAuthStore.getState().userProfile;
    
    // Calculamos el timezone (misma lógica que el hook)
    const tz = profile?.companySettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
        const date = new Date(utcString);
        
        // Usamos la API nativa Intl de Javascript que soporta Timezones perfectamente
        return new Intl.DateTimeFormat('es-ES', {
            timeZone: tz,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // o false si prefieres formato 24h
        }).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return utcString; // Retorno de seguridad
    }
};