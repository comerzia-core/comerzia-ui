export interface JwtPayload {
    sub: string;           // Username
    iss: string;           // Issuer
    exp: number;           // Expiración
    authorities: string[]; // Tus permisos ["ROLE_ROOT", "INV_MANAGE", etc]
}

// Lo que responde el endpoint /api/auth/login
export interface LoginResponse {
    token: string;
}

// Nuestro usuario en el estado de React
export interface User {
    username: string;
    roles: string[];
}

// Estructura del Menú que viene del Backend
export interface MenuItem {
    id: number;
    name: string;      // Ej: "Inventarios"
    route: string;     // Ej: "/inventory" o null si es solo padre
    icon?: string;     // Ej: "box", "users"
    children?: MenuItem[]; // RECURSIVIDAD: Lista de hijos opcional
}