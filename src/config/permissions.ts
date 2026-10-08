// Define los permisos tal cual te llegan del Backend (JWT)
export const PERMISSIONS = {
    PRODUCTS: {
        VIEW: 'products:view',
        CREATE: 'products:create',
        EDIT: 'products:edit',
        DELETE: 'products:delete',
        CHANGE_STATUS: 'INV_PRODUCT_STATUS', // ✅ Este es el que usaremos
    },
    PACKAGES: {
        VIEW: 'packages:view',
        CREATE: 'packages:create',
        EDIT: 'packages:edit',
        DELETE: 'packages:delete',
        CHANGE_STATUS: 'packages:change_status',
        PUBLISH: 'COM_PACKAGE_PUBLISH', // ✅ AGREGA ESTE (o el nombre que use tu backend)
    },
    PROVIDERS: {
        VIEW: 'providers:view',
        // ... otros
    },
    // ... otros módulos
    SALES: {
        VIEW_ALL: 'sales:view_all',
        MANAGE_COMMISSIONS: 'COM_SELLER_MANAGE',
    },
    HARDWARE: {
        AGENTS_MANAGE: 'HW_AGENTS_MANAGE',
        AGENTS_READ: 'HW_AGENTS_READ',
        DEVICES_MANAGE: 'HW_DEVICES_MANAGE',
        DEVICES_READ: 'HW_DEVICES_READ',
        PRINT_EXECUTE: 'HW_PRINT_EXECUTE',
        PRINT_JOBS_READ: 'HW_PRINT_JOBS_READ',
        PRINTERS_VIEW: 'HW_PRINTERS_VIEW',
    },
} as const;