import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { csrfHeaders } from '../features/auth/services/browserSessionService';
import { authorizeRejectedOperation, isStepUpAction } from '../features/security/services/stepUpCoordinator';
declare module 'axios' { interface InternalAxiosRequestConfig { sessionGeneration?: number; sessionRetried?: boolean; mfaRetried?: boolean; } }

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
            '/public/registrations/google',
            '/auth/logout-all', '/auth/reauthenticate',
            '/profile/mfa/totp/enroll/confirm',
            '/auth/oidc/google/start', '/auth/oidc/google/complete',
            '/profile/external-identities/google/link/start',
            '/profile/external-identities/google/link/confirm',
            '/profile/password/setup',
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
            if (status === 403 && error.response.data?.code === 'mfa_step_up_required' && error.config
                && !error.config.mfaRetried && !error.config.headers?.['X-Mfa-Step-Up-Grant']) {
                const original = error.config;
                const state = useAuthStore.getState();
                const action: unknown = error.response.data.errors?.find((item: { field?: string }) => item.field === 'actionType')?.reason;
                if (state.token && original.headers?.Authorization === `Bearer ${state.token}`
                    && original.sessionGeneration === state.generation && isStepUpAction(action)
                    && typeof original.url === 'string' && /^\/[A-Za-z0-9_/-]+(?:\?[^#]*)?$/.test(original.url)
                    && !original.params && ['post','put','patch','delete'].includes(original.method)) {
                    original.mfaRetried = true;
                    let body: unknown = original.data ?? null;
                    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return Promise.reject(error); } }
                    const grant = await authorizeRejectedOperation({ action, target: original.method.toUpperCase() + ':' + original.url, body });
                    const current = useAuthStore.getState();
                    if (current.generation !== state.generation || current.token !== state.token) return Promise.reject(error);
                    original.headers.set('X-Mfa-Step-Up-Grant', grant);
                    return api.request(original);
                }
            }
            
            // MAGIA AQUÍ: Detectamos si la petición iba dirigida a autenticación
            const isCredentialRequest = [
                '/auth/login', '/auth/change-temporary-password',
                '/public/registrations', '/public/registrations/google',
                '/auth/oidc/google/complete'
            ].includes(error.config?.url?.split('?')[0]);

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
                    'session_permissions_changed', 'session_access_changed', 'session_password_changed', 'session_email_changed', 'company_disabled',
                ].includes(code);
                // Una respuesta de una sesión anterior no debe cerrar una sesión recién iniciada.
                if (current.token && requestBearer === `Bearer ${current.token}` && (!isCredentialRequest || sessionChanged)
                    && !['invalid_totp_code', 'totp_code_replayed'].includes(String(code))) {
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
