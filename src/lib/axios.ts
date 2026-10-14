import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// 1. Crear instancia base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor de solicitudes (Request)
api.interceptors.request.use(
    (config) => {
        // Leemos el token directamente desde la memoria de Zustand
        const token = useAuthStore.getState().token;
        
        if (token) {
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
    (error) => {
        if (error.response) {
            const { status } = error.response;
            
            // MAGIA AQUÍ: Detectamos si la petición iba dirigida a autenticación
            const isAuthRequest = error.config?.url?.includes('/auth/');

            if (status === 401) {
                const current = useAuthStore.getState();
                const requestBearer = error.config?.headers?.Authorization;
                const code: unknown = error.response.data?.code;
                const sessionChanged = typeof code === 'string' && [
                    'session_permissions_changed', 'session_access_changed', 'session_password_changed',
                ].includes(code);
                // Una respuesta de una sesión anterior no debe cerrar una sesión recién iniciada.
                if (current.token && requestBearer === `Bearer ${current.token}` && (!isAuthRequest || sessionChanged)) {
                    current.logout(sessionChanged ? code : undefined);
                }
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