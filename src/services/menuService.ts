import api from '../lib/axios';
import type { MenuItem } from '../features/auth/types';

export const getMyMenuTree = async (): Promise<MenuItem[]> => {
    // 1. Pedimos la respuesta "cruda" (sin tipar el wrapper genérico todavía)
    const response = await api.get('/menus/my-tree');
    
    // 2. Inspeccionamos qué llegó realmente
    const payload = response.data; // Esto es el cuerpo del JSON

    // CASO A: Si el backend usa el wrapper ApiResponse (tiene propiedad .data interna)
    if (payload.data) {
        // Si es un array, lo devolvemos. Si es un objeto único, lo metemos en un array.
        return Array.isArray(payload.data) ? payload.data : [payload.data];
    }

    // CASO B: Si el backend devuelve el JSON directo (sin wrapper)
    // Si payload es un array, lo devolvemos. Si es un objeto, lo metemos en un array.
    return Array.isArray(payload) ? payload : [payload];
};

/**
 * Filtra el árbol de menú de manera recursiva.
 * Si la empresa tiene plan Perpetuo (705), oculta el ítem de "Suscripción y pagos".
 */
export const filterMenuTree = (items: MenuItem[], isPerpetual: boolean): MenuItem[] => {
    if (!items || items.length === 0) return [];

    return items
        .filter(item => {
            if (isPerpetual) {
                const route = item.route?.toLowerCase().trim() || '';
                const name = item.name?.toLowerCase().trim() || '';
                // Si la ruta o el nombre apuntan a suscripción y pagos, se omite
                if (route === '/organization/subscription' || route === '/subscription' || name.includes('suscripci')) {
                    return false;
                }
            }
            return true;
        })
        .map(item => {
            if (item.children && item.children.length > 0) {
                return {
                    ...item,
                    children: filterMenuTree(item.children, isPerpetual)
                };
            }
            return item;
        })
        .filter(item => {
            // Si era un grupo padre sin ruta propia y tras el filtrado quedó sin hijos, se descarta
            if (item.children && item.children.length === 0 && !item.route) {
                return false;
            }
            return true;
        });
};