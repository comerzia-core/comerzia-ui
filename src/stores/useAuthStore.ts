import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload, User } from '../features/auth/types';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    // Acciones
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
    // 1. Intentar recuperar sesión al recargar la página
    const storedToken = localStorage.getItem('token');
    let initialUser: User | null = null;
    let initialAuth = false;

    if (storedToken) {
        try {
            const decoded = jwtDecode<JwtPayload>(storedToken);
            // Validar expiración básica
            if (decoded.exp * 1000 > Date.now()) {
                initialUser = {
                    username: decoded.sub,
                    roles: decoded.authorities
                };
                initialAuth = true;
            } else {
                localStorage.removeItem('token'); // Token expirado
            }
        } catch (error) {
            localStorage.removeItem('token');
        }
    }

    return {
        token: storedToken,
        user: initialUser,
        isAuthenticated: initialAuth,

        login: (token: string) => {
            // Guardamos en LocalStorage para persistencia
            localStorage.setItem('token', token);
            
            // Decodificamos para obtener datos de usuario
            const decoded = jwtDecode<JwtPayload>(token);
            
            set({
                token,
                isAuthenticated: true,
                user: {
                    username: decoded.sub,
                    roles: decoded.authorities
                }
            });
        },

        logout: () => {
            localStorage.removeItem('token');
            set({ token: null, user: null, isAuthenticated: false });
        }
    };
});