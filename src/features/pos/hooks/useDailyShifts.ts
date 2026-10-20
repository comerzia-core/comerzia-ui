import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useRealtimeRefresh } from '../../realtime/hooks/useRealtimeRefresh';
import { posService } from '../services/posService';
import type { DailyShiftResponse } from '../types/pos';
import { getPosOperationMessage } from '../utils/posOperationMessages';

export const useDailyShifts = () => {
  const [shifts, setShifts] = useState<DailyShiftResponse[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReopening, setIsReopening] = useState(false);
  const revision = useRef(0);
  const { error: toastError, success: toastSuccess } = useToast();

  const loadShifts = useCallback(async (background = false) => {
    const current = ++revision.current;
    if (!background) setIsLoading(true);
    try {
      const response = await posService.getTodayShifts(page, size);
      if (current !== revision.current) return;
      if (response.totalPages > 0 && page >= response.totalPages) {
        setPage(response.totalPages - 1);
        return;
      }
      setShifts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: unknown) {
      if (current === revision.current && !background) {
        toastError(getPosOperationMessage(error, 'No se pudieron cargar los turnos.'));
      }
    } finally {
      if (current === revision.current) setIsLoading(false);
    }
  }, [page, size, toastError]);

  useEffect(() => {
    void loadShifts();
    return () => { revision.current += 1; };
  }, [loadShifts]);
  useRealtimeRefresh(['POS'], () => loadShifts(true));

  const reopenShift = async (id: string) => {
    if (isReopening) return;
    setIsReopening(true);
    try {
      await posService.reopenShift(id);
      toastSuccess('Turno reabierto.');
      await loadShifts(true);
    } catch (error: unknown) {
      toastError(getPosOperationMessage(error, 'No se pudo reabrir el turno.'));
      await loadShifts(true);
    } finally {
      setIsReopening(false);
    }
  };

  return { shifts, isLoading, isReopening, loadShifts, reopenShift, page, setPage, size,
    setSize: (value: number) => { setPage(0); setSize(value); }, totalPages, totalElements };
};
