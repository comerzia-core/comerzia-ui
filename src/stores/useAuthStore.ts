import { create } from 'zustand';
import api from '../lib/axios';
// Importamos estrictamente desde tu archivo central de tipos
import type { UserProfile, MenuItem } from '../features/auth/types';
import { getMyMenuTree } from '../services/menuService';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    userProfile: UserProfile | null;
    menuTree: MenuItem[]; // Usando la interfaz correcta
    isSessionReady: boolean;
    
    // Acciones del store
    login: (token: string) => Promise<void>;
    logout: () => void;
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
        isAuthenticated: !!storedToken,
        userProfile: null,
        menuTree: [],
        isSessionReady: false, 

        login: async (token: string) => {
            localStorage.setItem('token', token);
            set({ token, isAuthenticated: true, isSessionReady: false });
            
            // Inmediatamente disparamos la orquestación para cargar perfil y menú
            await get().initializeSession();
        },

        logout: () => {
            localStorage.removeItem('token');
            set({ 
                token: null, 
                isAuthenticated: false, 
                userProfile: null, 
                menuTree: [], 
                isSessionReady: false 
            });
        },

        initializeSession: async () => {
            try {
                // Ejecutamos ambas peticiones en paralelo para optimizar el tiempo de carga
                await Promise.all([
                    get().fetchUserProfile(),
                    get().fetchMenuTree()
                ]);
                
                // Si ambas promesas se resuelven, la sesión está lista para renderizar la UI
                set({ isSessionReady: true });
            } catch (error) {
                console.error("Fatal error initializing session:", error);
                
                // Si falla la carga vital, forzamos el cierre de sesión por seguridad
                get().logout(); 
            }
        },

        fetchUserProfile: async () => {
            const { data } = await api.get<UserProfile>('/auth/profile');
            set({ userProfile: data });
        },

        fetchMenuTree: async () => {
            // Utilizamos el servicio que ya limpia la estructura del backend
            const tree = await getMyMenuTree(); 
            set({ menuTree: tree });
        },

        hasRole: (role: string) => {
            return get().userProfile?.roles.includes(role) ?? false;
        },

        hasPermission: (permission: string) => {
            return get().userProfile?.permissions?.includes(permission) ?? false;
        }
    };
});