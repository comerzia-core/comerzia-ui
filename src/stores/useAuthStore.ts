import { create } from 'zustand';
import api from '../lib/axios';
// Importamos estrictamente desde tu archivo central de tipos
import type { UserProfile, MenuItem } from '../features/auth/types';
import { getMyMenuTree } from '../services/menuService';
import { useThemeStore } from './useThemeStore';

interface AuthState {
    token: string | null;
    sessionNotice: string | null;
    isAuthenticated: boolean;
    userProfile: UserProfile | null;
    menuTree: MenuItem[]; // Usando la interfaz correcta
    isSessionReady: boolean;
    
    // Acciones del store
    login: (token: string) => Promise<void>;
    logout: (reason?: string) => void;
    initializeSession: () => Promise<void>;
    fetchUserProfile: () => Promise<void>;
    fetchMenuTree: () => Promise<void>;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
    // Recuperación inicial del token desde el almacenamiento local
    const storedToken = localStorage.getItem('token');
    
    return {
        token: storedToken,
        sessionNotice: sessionStorage.getItem('sessionNotice'),
        isAuthenticated: !!storedToken,
        userProfile: null,
        menuTree: [],
        isSessionReady: false, 

        login: async (token: string) => {
            useThemeStore.getState().clearSession();
            localStorage.setItem('token', token);
            set({ token, isAuthenticated: true, isSessionReady: false });
            
            // Inmediatamente disparamos la orquestación para cargar perfil y menú
            await get().initializeSession();
            if (get().token === token && get().isSessionReady) {
                sessionStorage.removeItem('sessionNotice');
                localStorage.removeItem('sessionRevocationReason');
                set({ sessionNotice: null });
            }
        },

        logout: (reason?: string) => {
            useThemeStore.getState().clearSession();
            const notices: Record<string, string> = {
                company_disabled: 'Tu empresa está deshabilitada. Contacta con soporte.',
                session_permissions_changed: 'Tus permisos cambiaron. Inicia sesión nuevamente.',
                session_access_changed: 'Tu acceso cambió. Inicia sesión nuevamente.',
                session_password_changed: 'Tu contraseña cambió. Inicia sesión nuevamente.',
            };
            const candidate = reason ? notices[reason] : undefined;
            const notice = typeof candidate === 'string' ? candidate : undefined;
            const stored = localStorage.getItem('token');
            const ownsStoredSession = stored === get().token;
            if (notice) sessionStorage.setItem('sessionNotice', notice);
            else sessionStorage.removeItem('sessionNotice');
            // Un cierre tardío en otra pestaña no debe borrar el token de un login nuevo.
            if (!stored || ownsStoredSession) {
                if (notice && reason) localStorage.setItem('sessionRevocationReason', reason);
                else localStorage.removeItem('sessionRevocationReason');
                if (ownsStoredSession) localStorage.removeItem('token');
            }
            set({ 
                token: null,
                sessionNotice: notice || null,
                isAuthenticated: false, 
                userProfile: null, 
                menuTree: [], 
                isSessionReady: false 
            });
        },

        initializeSession: async () => {
            const token = get().token;
            if (!token) return;
            try {
                // Ejecutamos ambas peticiones en paralelo para optimizar el tiempo de carga
                await Promise.all([
                    get().fetchUserProfile(),
                    get().fetchMenuTree()
                ]);
                
                // Si ambas promesas se resuelven, la sesión está lista para renderizar la UI
                if (get().token === token) set({ isSessionReady: true });
            } catch {
                console.error("Session initialization failed.");
                
                // Si falla la carga vital, forzamos el cierre de sesión por seguridad
                if (get().token === token) get().logout();
            }
        },

        fetchUserProfile: async () => {
            const token = get().token;
            const themeRevision = useThemeStore.getState().revision;
            const { data } = await api.get<UserProfile>('/auth/profile');
            if (token && get().token === token) {
                let planTypeCode = data.companySettings?.planTypeCode ?? data.planTypeCode;
                if (data.companySettings && planTypeCode === undefined) {
                    try {
                        const billingRes = await api.get<{ planTypeCode?: number }>('/tenant/billing/access');
                        if (billingRes.data?.planTypeCode !== undefined) {
                            planTypeCode = billingRes.data.planTypeCode;
                        }
                    } catch {
                        try {
                            const compRes = await api.get<{ currentSubscription?: { planTypeCode?: number } }>('/tenant/company/profile');
                            if (compRes.data?.currentSubscription?.planTypeCode !== undefined) {
                                planTypeCode = compRes.data.currentSubscription.planTypeCode;
                            }
                        } catch {
                            // Ignorar si no tiene acceso
                        }
                    }
                }

                const updatedProfile: UserProfile = planTypeCode !== undefined && data.companySettings
                    ? { ...data, planTypeCode, companySettings: { ...data.companySettings, planTypeCode } }
                    : data;

                set({ userProfile: updatedProfile });
                useThemeStore.getState().bindProfile(data.id, data.theme, token, themeRevision);
            }
        },

        fetchMenuTree: async () => {
            // Utilizamos el servicio que ya limpia la estructura del backend
            const token = get().token;
            const tree = await getMyMenuTree();
            if (token && get().token === token) set({ menuTree: tree });
        },

        hasRole: (role: string) => {
            return get().userProfile?.roles.includes(role) ?? false;
        },

        hasPermission: (permission: string) => {
            return get().userProfile?.permissions?.includes(permission) ?? false;
        }
    };
});
