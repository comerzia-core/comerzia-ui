import { useEffect, useState } from 'react';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import type { DictionaryKey } from '../config/dictionaries';
import type { SelectOption } from '../types/dictionary';

export const useLoadDictionaries = (keys: DictionaryKey[]) => {
    const { cache, fetchDictionaries } = useDictionaryStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setIsLoading(true);
            await fetchDictionaries(keys);
            if (isMounted) {
                setIsLoading(false);
            }
        };

        load();

        return () => { isMounted = false; };
        
        // Usamos JSON.stringify para comparar el array de llaves y evitar renders infinitos
    }, [JSON.stringify(keys), fetchDictionaries]);

    // Preparamos un objeto con las opciones listas para que la vista las consuma fácilmente
    const options: Record<string, SelectOption[]> = {};
    keys.forEach(k => {
        options[k] = cache[k] || [];
    });

    return { options, isLoading };
};