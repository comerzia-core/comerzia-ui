import { useEffect, useState } from 'react';
import { labelService, getLabelError } from '../services/labelService';
import type { RollSize, SaveRollSizeRequest } from '../types/labels';

export const useRollSizes = (refreshKey: number) => {
  const [items, setItems] = useState<RollSize[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    setIsLoading(true); setError('');
    labelService.getRolls(search, page, pageSize).then(result => {
      if (!current) return;
      setItems(result.content); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
      if (page > 0 && page >= result.totalPages) setPage(Math.max(0, result.totalPages - 1));
    }).catch((error: unknown) => { if (current) setError(getLabelError(error, 'No se pudieron cargar los rollos.')); })
      .finally(() => { if (current) setIsLoading(false); });
    return () => { current = false; };
  }, [page, pageSize, search, version, refreshKey]);

  const save = async (id: string | null, request: SaveRollSizeRequest) => {
    setIsSaving(true); setError('');
    try { await labelService.saveRoll(id, request); setVersion(value => value + 1); return true; }
    catch (error: unknown) { setError(getLabelError(error, 'No se pudo guardar el rollo.')); return false; }
    finally { setIsSaving(false); }
  };
  const remove = async (id: string) => {
    setIsSaving(true); setError('');
    try { await labelService.deleteRoll(id); setVersion(value => value + 1); return true; }
    catch (error: unknown) { setError(getLabelError(error, 'No se pudo eliminar el rollo.')); return false; }
    finally { setIsSaving(false); }
  };
  return { items, page, pageSize, search, totalElements, totalPages, isLoading, isSaving, error, save, remove,
    setPage, setPageSize: (value: number) => { setPage(0); setPageSize(value); },
    setSearch: (value: string) => { setPage(0); setSearch(value); } };
};
