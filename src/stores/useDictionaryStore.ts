import { create } from 'zustand';
import api from '../lib/axios';
import { labelService } from '../features/pos/services/labelService';
import type { DictionaryKey } from '../config/dictionaries';
import type { DictionaryResponse, SelectOption } from '../types/dictionary';

export interface DictionaryContext { scope: string; productId?: string; }

export const dictionaryCacheKey = (key: DictionaryKey, context?: DictionaryContext) =>
    key.startsWith('label-') ? `${context?.scope || ''}:${context?.productId || ''}:${key}` : key;

interface DictionaryState {
    // Memoria Caché: Llave -> Array de Opciones listas para el Select
    cache: Record<string, SelectOption[]>;
    
    // Acción principal
    fetchDictionaries: (keys: DictionaryKey[], context?: DictionaryContext) => Promise<void>;
    invalidate: (keys: DictionaryKey[], context?: DictionaryContext) => void;
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
    cache: {},

    invalidate: (keys, context) => set(state => {
        const cache = { ...state.cache };
        for (const key of keys) delete cache[dictionaryCacheKey(key, context)];
        return { cache };
    }),
    fetchDictionaries: async (keys: DictionaryKey[], context?: DictionaryContext) => {
        const labelKeys = keys.filter(key => key.startsWith('label-'));
        await Promise.all(labelKeys.map(async key => {
            const cacheKey = dictionaryCacheKey(key, context);
            const options = await labelService.lookup(key, context?.productId);
            set(state => ({ cache: { ...state.cache, [cacheKey]: options } }));
        }));
        keys = keys.filter(key => !key.startsWith('label-'));
        const { cache } = get();
        
        // 1. Filtrar las llaves que YA tenemos en caché
        const keysToFetch = keys.filter(key => !cache[key]);

        // 2. Si ya tenemos todas en memoria, no tocamos la red (Zero API Calls)
        if (keysToFetch.length === 0) return;

        try {
            // 3. Preparar la petición en bloque (Bulk Fetch)
            // Ejemplo: ?keys=plan-type&keys=user-status
            const params = new URLSearchParams();
            keysToFetch.forEach(k => params.append('keys', k));

            const { data } = await api.get<Record<string, DictionaryResponse[]>>(`/generic/dictionaries?${params.toString()}`);

            // 4. Mapear del formato Backend (code) al formato Frontend (value)
            const newCacheEntries: Record<string, SelectOption[]> = {};
            
            Object.entries(data).forEach(([key, items]) => {
                newCacheEntries[key] = items.map(item => ({
                    value: item.code,
                    label: item.label
                }));
            });

            // 5. Fusionar lo nuevo con lo que ya teníamos en caché
            set(state => ({
                cache: { ...state.cache, ...newCacheEntries }
            }));

        } catch (error) {
            console.error("Error fetching generic dictionaries:", error);
            // Si hay error, las vistas simplemente mostrarán el select en blanco o con "Cargando..."
        }
    }
}));