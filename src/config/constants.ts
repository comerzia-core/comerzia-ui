/**
 * Configuración global de la aplicación y reglas de negocio del Frontend.
 */
export const APP_CONFIG = {
    PAGINATION: {
        // El índice visual para el usuario siempre empieza en 1
        DEFAULT_PAGE: 1, 
        DEFAULT_SIZE: 10,
        // Opciones para el selector de "Registros por página"
        OPTIONS: [5, 10, 15, 25, 50] 
    }
} as const;

/**
 * Códigos de Categoría para el Módulo GENERIC.
 * Estos strings deben coincidir con la columna 'category' en tu BD.
 */
export const PARAM_CATEGORIES = {
    CLIENT_TYPE: 'CLIENT_TYPE',       // Ej: 701 (Estudiante), 702 (Profesional)
    PAYMENT_METHOD: 'PAYMENT_METHOD', // Ej: 401 (QR), 402 (Transferencia)
    PRODUCT_CATEGORY: 'PRODUCT_CATEGORY', // Ej: 601 (Electrónica)
    PROVIDER_STATUS: 'PROVIDER_STATUS', // 121, 122...
    RESERVATION_STATUS: 'RESERVATION_STATUS', // Ej: Confirmada, Cancelada
    TRANSACTION_STATUS: 'TRANSACTION_STATUS',
    COMMISSION_TYPE: 'COMMISSION_TYPE', 
} as const;

// Tipos base para Travesía
export interface SystemParameter {
    id: number;
    numericCode: number; // 701, 702, etc.
    name: string;        // "Estudiante"
    description?: string;
    category: string;
}

// ✅ MAPA DE ESTADOS DE PROVEEDOR (Ajusta los IDs según tu Base de Datos)
export const PROVIDER_STATUS_ID = {
    PENDING: 121,
    CONFIRMED: 122,
    CANCELLED: 123,
    INACTIVE: 124
};

export const COMMISSION_CODES = {
    PERCENTAGE: 621,
    FIXED_AMOUNT: 622
};

export const RESERVATION_STATUS_ID = {
    PENDING: 101,
    CONFIRMED: 102, // ✅ Usaremos este para la sumatoria
    CANCELLED: 103,
    EXPIRED: 104,
    COMPLETED: 105
} as const;

export const TRANSACTION_STATUS_ID = {
    PENDING: 501,
    CONFIRMED: 502,
    REFUSED: 503,
    RETURN: 504
} as const;