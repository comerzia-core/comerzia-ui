import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SetUrlParamOptions {
  replace?: boolean;
}

/**
 * Hook para gestionar múltiples parámetros de URL de forma atómica y reactiva.
 * Permite sincronizar filtros, pestañas y modales manteniendo la URL como
 * la única fuente de verdad (Single Source of Truth).
 */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Obtener el valor actual de un parámetro
  const getParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  // Actualizar múltiples parámetros en una sola operación sin sobreescribir otros
  const setParams = useCallback((
    updates: Record<string, string | null | undefined>,
    options?: SetUrlParamOptions
  ) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    }, { replace: options?.replace ?? false });
  }, [setSearchParams]);

  // Eliminar parámetros específicos
  const removeParams = useCallback((keys: string[], options?: SetUrlParamOptions) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      keys.forEach((key) => next.delete(key));
      return next;
    }, { replace: options?.replace ?? false });
  }, [setSearchParams]);

  // Helper para resetear todos los parámetros opcionales manteniendo una lista blanca
  const clearExcept = useCallback((whitelistKeys: string[], options?: SetUrlParamOptions) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      whitelistKeys.forEach((key) => {
        const val = prev.get(key);
        if (val !== null) next.set(key, val);
      });
      return next;
    }, { replace: options?.replace ?? false });
  }, [setSearchParams]);

  return {
    searchParams,
    getParam,
    setParams,
    removeParams,
    clearExcept
  };
}

/**
 * Hook de conveniencia para un solo parámetro en la URL, con interfaz similar a useState.
 * @param key Nombre del query param en la URL
 * @param defaultValue Valor predeterminado en caso de no existir en la URL
 * @param defaultOptions Opciones por defecto (replace: true para búsquedas/filtros, false para modales/historial)
 */
export function useUrlState(
  key: string,
  defaultValue = '',
  defaultOptions: SetUrlParamOptions = { replace: true }
): [string, (newValue: string | null | undefined, options?: SetUrlParamOptions) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    return searchParams.get(key) ?? defaultValue;
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback((
    newValue: string | null | undefined,
    options?: SetUrlParamOptions
  ) => {
    const opts = { ...defaultOptions, ...options };
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newValue === null || newValue === undefined || newValue === '' || newValue === defaultValue) {
        next.delete(key);
      } else {
        next.set(key, newValue);
      }
      return next;
    }, { replace: opts.replace });
  }, [key, defaultValue, defaultOptions, setSearchParams]);

  return [value, setValue];
}
