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

// profile
export interface CompanySettings {
    id: string;
    commercialName: string;
    timezone: string;
    currencyCode: string;
    logoUrl: string | null;
    companyLogoUrl?: string | null;
    ticketLogoUrl?: string | null;
    companyQrUrl?: string | null;
}

export interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    paternalLastName: string;
    maternalFirstName: string | null;
    fullName: string;
    email: string;
    imageUrl: string | null;
    roles: string[];
    permissions: string[];
    companySettings: CompanySettings | null; 
}

// Request para cambio de contraseña temporal
export interface ChangeTemporaryPasswordRequest {
    username: string;
    currentPassword: string;
    newPassword: string;
}

export interface AuthErrorResponse {
    code: string;
    message: string;
    errors: string[] | null;
    timestamp: string;
}

export const AUTH_ERROR_CODES = {
    PASSWORD_CHANGE_REQUIRED: 'password_change_required',
    REQUIRES_PASSWORD_CHANGE: 'requires_password_change',
    ACCOUNT_DISABLED: 'account_disabled',
    USER_DISABLED: 'user_disabled',
    ACCOUNT_LOCKED: 'account_locked',
    AUTHENTICATION_FAILED: 'authentication_failed',
    ACCESS_DENIED: 'access_denied'
} as const;