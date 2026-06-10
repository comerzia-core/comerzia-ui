import { useAuthStore } from '../stores/useAuthStore';

export const useCompanyContext = () => {
    // Obtenemos el perfil completo desde Zustand
    const userProfile = useAuthStore(state => state.userProfile);

    // Valores por defecto (Fallback para usuarios SaaS)
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaultCompanyName = "Comerzia";

    const settings = userProfile?.companySettings;

    return {
        // Si no hay settings, es un Admin SaaS y usamos los defaults
        commercialName: settings?.commercialName || defaultCompanyName,
        timezone: settings?.timezone || browserTimezone,
        currencyCode: settings?.currencyCode || 'BOB', 
        logoUrl: settings?.logoUrl || null,
        
        // Bandera útil por si alguna vista necesita saber si es un inquilino real
        isTenant: !!settings 
    };
};