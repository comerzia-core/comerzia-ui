/**
 * Diccionario centralizado de catálogos del sistema.
 * Evita hardcodear strings en las vistas.
 */
export const DICTIONARIES = {
    RECOVERY_ENTITY: "recovery-entity",
    SAAS_TEAM_ROLE: "saas-team-role",
    SUBSCRIPTION_PAYMENT_METHOD: "subscription-payment-method",
    SUBSCRIPTION_PAYMENT_STATUS: "subscription-payment-status",
    USER_STATUS: 'user-status',
    SUBSCRIPTION_STATUS: 'subscription-status',
    PLAN_TYPE: 'plan-type',
    DOCUMENT_TYPE: 'document-type',
    DOCUMENT_EXTENSION: 'document-extension',
    PAYMENT_FREQUENCY: 'payment-frequency',
    PAYMENT_TYPE: 'payment-type',
    MOVEMENT_TYPE: 'movement-type',
    SHIFT_STATUS: 'shift-status',
    // COMMERCIAL
    ADJUSTMENT_TYPE: 'adjustment-type',
    INVENTORY_STATUS: 'inventory-status',
    STOCK_STATUS: 'stock-status',
    VARIANT_TYPE: 'variant-type',
    REPLENISHMENT_STATUS: 'replenishment-status',
    // SALES
    SALE_STATUS: 'sale-status',
    CUSTOMER_TYPE: 'customer-type',
    LABEL_ROLL_SIZE: 'label-roll-size',
    LABEL_PRINTER: 'label-printer',
    LABEL_VARIANT: 'label-variant',
    // HARDWARE
    HW_AGENT_STATUS: 'hw-agent-status',
    HW_DEVICE_TYPE: 'hw-device-type',
    HW_DEVICE_STATUS: 'hw-device-status',
    HW_PRINT_JOB_TYPE: 'hw-print-job-type',
    HW_PRINT_JOB_STATUS: 'hw-print-job-status',
} as const;

// Este type mágico extrae los valores ("user-status", "plan-type", etc.)
// y nos obliga a usar solo llaves válidas en TypeScript.
export type DictionaryKey = typeof DICTIONARIES[keyof typeof DICTIONARIES];