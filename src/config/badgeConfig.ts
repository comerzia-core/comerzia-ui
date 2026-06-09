// Importamos el tipo del Badge para mantener el tipado estricto
type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "ghost";

/**
 * MAPA GLOBAL DE COLORES PARA ESTADOS
 * Mapea los códigos enteros devueltos por el backend hacia una variante de UI.
 */
export const STATUS_COLOR_MAP: Record<number, BadgeVariant> = {
    // --- ESTADOS DE TENANTS (SaaS) ---
    901: "success", // Active
    902: "neutral", // Inactive
    903: "error",   // Suspended
    904: "warning", // Pending

    // --- ESTADOS DE SUSCRIPCIÓN ---
    201: "success", // Active
    202: "warning", // Past Due
    203: "error",   // Cancelled
    204: "info",    // Replaced

    // --- ESTADOS DE FACTURAS (Ejemplo futuro) ---
    301: "warning", // Unpaid
    302: "success", // Paid
    303: "error",   // Voided

    // --- ESTADOS DE PROVEEDORES (Tu código original) ---
    // Si tienes códigos para PENDING, CONFIRMED, etc., los agregas aquí.
};