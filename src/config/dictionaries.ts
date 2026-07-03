/**
 * Diccionario centralizado de catálogos del sistema.
 * Evita hardcodear strings en las vistas.
 */
export const DICTIONARIES = {
    USER_STATUS: 'user-status',
    SUBSCRIPTION_STATUS: 'subscription-status',
    PLAN_TYPE: 'plan-type',
    DOCUMENT_TYPE: 'document-type',
    DOCUMENT_EXTENSION: 'document-extension',
    PAYMENT_FREQUENCY: 'payment-frequency',
    PAYMENT_TYPE: 'payment-type',
    MOVEMENT_TYPE: 'movement-type',
    SHIFT_STATUS: 'shift-status',
    ADJUSTMENT_TYPE: 'adjustment-type',
} as const;

// Este type mágico extrae los valores ("user-status", "plan-type", etc.)
// y nos obliga a usar solo llaves válidas en TypeScript.
export type DictionaryKey = typeof DICTIONARIES[keyof typeof DICTIONARIES];