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