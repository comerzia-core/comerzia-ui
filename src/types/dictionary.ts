import type { SelectOption } from '../components/ui/ComerziaSelect'; 
// Asumo que tu interfaz SelectOption quedó exportada desde el componente UI

/**
 * Estructura cruda que devuelve el endpoint genérico del backend
 */
export interface DictionaryResponse {
    code: number;
    label: string;
}

// Re-exportamos SelectOption por si lo necesitas importar desde este archivo
export type { SelectOption };