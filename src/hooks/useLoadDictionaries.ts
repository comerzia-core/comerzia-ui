import { useCallback, useEffect, useState } from 'react';
import { useDictionaryStore, dictionaryCacheKey, type DictionaryContext } from '../stores/useDictionaryStore';
import type { DictionaryKey } from '../config/dictionaries';
import type { SelectOption } from '../types/dictionary';

export const useLoadDictionaries = (keys: DictionaryKey[], context?: DictionaryContext) => {
    const { cache, fetchDictionaries } = useDictionaryStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const serializedKeys = JSON.stringify(keys);
    const scope = context?.scope;
    const productId = context?.productId;

    const reload = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await fetchDictionaries(JSON.parse(serializedKeys) as DictionaryKey[], scope ? { scope, productId } : undefined);
        } catch (error: unknown) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [serializedKeys, scope, productId, fetchDictionaries]);

    useEffect(() => { void reload(); }, [reload]);

    // Preparamos un objeto con las opciones listas para que la vista las consuma fácilmente
    const options: Record<string, SelectOption[]> = {};
    keys.forEach(k => {
        options[k] = cache[dictionaryCacheKey(k, context)] || [];
    });

    return { options, isLoading, error, reload };
};