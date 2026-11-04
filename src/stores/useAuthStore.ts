import { create } from 'zustand';
import { refreshBrowserSession, closeBrowserSession, authenticationRejected, authenticationErrorCode, tokenSessionReference, authenticationPending } from '../features/auth/services/browserSessionService';
let initialization: Promise<void> | null = null;
localStorage.removeItem('token');
import api from '../lib/axios';
// Importamos estrictamente desde tu archivo central de tipos
import type { UserProfile, MenuItem } from '../features/auth/types';
import { getMyMenuTree } from '../services/menuService';
import { useThemeStore } from './useThemeStore';

interface AuthState {
    token: string | null;
    sessionId: string | null;
    generation: number;
    status: 'initializing' | 'anonymous' | 'authenticated' | 'mfa_pending' | 'temporarily_unavailable';
    refreshSession: () => Promise<string>;
    expireSession: (reason?: string) => void;
    requireAdditionalAuthentication: () => void;
    sessionNotice: string | null;
    isAuthenticated: boolean;
    userProfile: UserProfile | null;
    menuTree: MenuItem[]; // Usando la interfaz correcta
    isSessionReady: boolean;
    
    // Acciones del store
    login: (token: string) => Promise<void>;
    logout: (reason?: string) => Promise<boolean>;
    initializeSession: () => Promise<void>;
    fetchUserProfile: () => Promise<void>;
    fetchMenuTree: () => Promise<void>;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
    // Recuperación inicial del token desde el almacenamiento local
    const storedToken = null;
    
    return {
        token: storedToken, sessionId: null, generation: 0, status: 'initializing',
        sessionNotice: sessionStorage.getItem('sessionNotice'),
        isAuthenticated: !!storedToken,
        userProfile: null,
        menuTree: [],
        isSessionReady: false, 

        login: async (token: string) => {
            useThemeStore.getState().clearSession();
            initialization = null;
            set({ token, sessionId: tokenSessionReference(token), generation: get().generation + 1, status: 'authenticated', isAuthenticated: true, isSessionReady: false });
            
            // Inmediatamente disparamos la orquestación para cargar perfil y menú
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('comerzia-session');
                channel.postMessage({ type: 'account-changed', sessionId: get().sessionId }); channel.close();
            }
            await get().initializeSession();
            if (get().token === token && get().isSessionReady) {
                sessionStorage.removeItem('sessionNotice');
                localStorage.removeItem('sessionRevocationReason');
                set({ sessionNotice: null });
            }
        },

        expireSession: (reason?: string) => {
            const previousSession = get().sessionId;
            useThemeStore.getState().clearSession();
            const notices: Record<string, string> = {
                company_disabled: 'Tu empresa está deshabilitada. Contacta con soporte.',
                session_permissions_changed: 'Tus permisos cambiaron. Inicia sesión nuevamente.',
                session_access_changed: 'Tu acceso cambió. Ingresa nuevamente.',
                session_password_changed: 'Tu contraseña cambió. Ingresa nuevamente.',
                session_email_changed: 'Tu correo de acceso ha cambiado. Ingresa nuevamente.',
                session_inactive: 'La sesión venció por inactividad.',
                session_refresh_reused: 'Por seguridad, ingresa nuevamente.',
                session_expired: 'Tu sesión venció. Ingresa nuevamente.',
            };
            const notice = reason ? notices[reason] : undefined;
            if (notice) sessionStorage.setItem('sessionNotice', notice);
            else sessionStorage.removeItem('sessionNotice');
            set({ token: null, sessionId: null, generation: get().generation + 1,
                status: 'anonymous', isAuthenticated: false, userProfile: null,
                menuTree: [], isSessionReady: false, sessionNotice: notice ?? null });
            if (previousSession && typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('comerzia-session');
                channel.postMessage({ type: 'logout', sessionId: previousSession, reason }); channel.close();
            }
        },

        logout: async (reason?: string) => {
            const { generation, token } = get();
            try {
                await closeBrowserSession(token);
                if (generation !== get().generation) return false;
                get().expireSession(reason);
                return true;
            } catch {
                if (generation === get().generation) set({ sessionNotice: 'No se pudo cerrar la sesión. Reintenta.' });
                return false;
            }
        },

        requireAdditionalAuthentication: () => {
            useThemeStore.getState().clearSession();
            set({ token: null, isAuthenticated: false, isSessionReady: false, userProfile: null, menuTree: [],
                generation: get().generation + 1, status: 'mfa_pending' });
        },
        refreshSession: async () => {
            const generation = get().generation;
            const previousSession = get().sessionId;
            try {
                const response = await refreshBrowserSession();
                if (generation !== get().generation) throw new Error('Session changed during renewal');
                if (previousSession && previousSession !== response.sessionId) {
                    get().expireSession('session_access_changed');
                    throw new Error('Browser account changed');
                }
                if (response.mfaRequired || response.authenticationState === 'MFA_PENDING' || !response.token) {
                    get().requireAdditionalAuthentication();
                    return '';
                }
                set({ token: response.token, sessionId: response.sessionId,
                    isAuthenticated: true, status: 'authenticated' });
                return response.token;
            } catch (error: unknown) {
                if (generation === get().generation) {
                    if (authenticationPending(error)) get().requireAdditionalAuthentication();
                    else if (authenticationRejected(error)) get().expireSession(previousSession ? authenticationErrorCode(error) : undefined);
                    else set({ status: 'temporarily_unavailable' });
                }
                throw error;
            }
        },

        initializeSession: async () => {
            if (initialization) return initialization;
            const generation = get().generation;
            const task = (async () => {
                try {
                    if (!get().token) await get().refreshSession();
                    if (generation !== get().generation) return;
                    await Promise.all([get().fetchUserProfile(), get().fetchMenuTree()]);
                    if (generation === get().generation) set({ isSessionReady: true, status: 'authenticated' });
                } catch (error: unknown) {
                    if (generation !== get().generation) return;
                    if (authenticationRejected(error)) get().expireSession(authenticationErrorCode(error));
                    else set({ status: 'temporarily_unavailable' });
                }
            })();
            initialization = task;
            try { await task; } finally { if (initialization === task) initialization = null; }
        },

        fetchUserProfile: async () => {
            const token = get().token;
            const sessionId = get().sessionId;
            const themeRevision = useThemeStore.getState().revision;
            const { data } = await api.get<UserProfile>('/auth/profile');
            if (token && sessionId && get().sessionId === sessionId) {
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

                if (get().sessionId !== sessionId) return;
                set({ userProfile: updatedProfile });
                useThemeStore.getState().bindProfile(data.id, data.theme, sessionId, themeRevision);
            }
        },

        fetchMenuTree: async () => {
            // Utilizamos el servicio que ya limpia la estructura del backend
            const sessionId = get().sessionId;
            const tree = await getMyMenuTree();
            if (sessionId && get().sessionId === sessionId) set({ menuTree: tree });
        },

        hasRole: (role: string) => {
            return get().userProfile?.roles.includes(role) ?? false;
        },

        hasPermission: (permission: string) => {
            return get().userProfile?.permissions?.includes(permission) ?? false;
        }
    };
});
