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

            if (status === 401) {
                console.error("Token expired or invalid. Executing automatic logout...");
                
                // Limpiamos la memoria y forzamos la recarga hacia el login
                useAuthStore.getState().logout();
                window.location.href = '/login';
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