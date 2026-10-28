import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { csrfHeaders } from '../features/auth/services/browserSessionService';
declare module 'axios' { interface InternalAxiosRequestConfig { sessionGeneration?: number; sessionRetried?: boolean; } }

// 1. Crear instancia base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor de solicitudes (Request)
api.interceptors.request.use(
    async (config) => {
        // Leemos el token directamente desde la memoria de Zustand
        const state = useAuthStore.getState();
        const token = state.token;
        config.sessionGeneration ??= state.generation;
        const path = config.url?.split('?')[0];
        if (config.method?.toLowerCase() === 'post' && path && [
            '/auth/login', '/auth/change-temporary-password', '/public/registrations',
            '/auth/logout-all', '/auth/reauthenticate',
        ].includes(path)) {
            config.withCredentials = true;
            const headers = await csrfHeaders();
            config.headers.set('X-CSRF-TOKEN', headers['X-CSRF-TOKEN']);
        }
        
        // Una petición ligada explícitamente a una sesión conserva su credencial al cambiar de cuenta.
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Interceptor de respuestas (Response)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response) {
            const { status } = error.response;
            
            // MAGIA AQUÍ: Detectamos si la petición iba dirigida a autenticación
            const isCredentialRequest = ['/auth/login', '/auth/change-temporary-password', '/public/registrations'].includes(error.config?.url?.split('?')[0]);

            if (status === 401) {
                const current = useAuthStore.getState();
                const requestBearer = error.config?.headers?.Authorization;
                const code: unknown = error.response.data?.code;
                if (code === 'access_token_expired' && !isCredentialRequest && error.config
                    && !error.config.sessionRetried && error.config.sessionGeneration === current.generation) {
                    error.config.sessionRetried = true;
                    const token = current.token && requestBearer !== `Bearer ${current.token}`
                        ? current.token : await current.refreshSession();
                    if (error.config.sessionGeneration !== useAuthStore.getState().generation) return Promise.reject(error);
                    error.config.headers.Authorization = `Bearer ${token}`;
                    return api.request(error.config);
                }
                const sessionChanged = typeof code === 'string' && [
                    'session_permissions_changed', 'session_access_changed', 'session_password_changed', 'company_disabled',
                ].includes(code);
                // Una respuesta de una sesión anterior no debe cerrar una sesión recién iniciada.
                if (current.token && requestBearer === `Bearer ${current.token}` && (!isCredentialRequest || sessionChanged)) {
                    current.expireSession(typeof code === 'string' ? code : undefined);
                }
            }

            if (status === 402 && error.response.data?.code === 'subscription_required') {
                const current = useAuthStore.getState();
                if (current.userProfile && error.config?.headers?.Authorization === 'Bearer ' + current.token)
                    useAuthStore.setState({ userProfile: { ...current.userProfile, operational: false } });
            }
            if (status === 403 && error.response.data?.code === 'session_authentication_incomplete'
                && error.config?.sessionGeneration === useAuthStore.getState().generation) {
                useAuthStore.getState().requireAdditionalAuthentication();
            }
            if (status === 403) {
                console.error("Access denied by backend configuration.");
            }
            
            if (status >= 500) {
                console.error("Critical server error. Backend is failing.");
            }
        } else {
            console.error("Network error. Unable to connect to the server.");
        }
        
        return Promise.reject(error);
    }
);

export default api;
