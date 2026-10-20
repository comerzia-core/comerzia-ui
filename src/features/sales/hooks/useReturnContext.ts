import { useCallback, useRef, useState } from 'react';
import { salesService } from '../services/salesService';
import type { ShiftSummaryResponse } from '../../pos/types/pos';
import { getPosOperationMessage } from '../../pos/utils/posOperationMessages';

export const useReturnContext = () => {
  const [activeShifts, setActiveShifts] = useState<ShiftSummaryResponse[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shiftErrorMessage, setShiftErrorMessage] = useState<string | null>(null);
  const revision = useRef(0);

  const clearReturnContext = useCallback(() => {
    revision.current += 1;
    setActiveShifts([]);
    setSelectedShiftId('');
    setShiftErrorMessage(null);
    setIsLoadingShifts(false);
  }, []);

  const loadReturnContext = useCallback(async (saleId: string) => {
    const current = ++revision.current;
    setIsLoadingShifts(true);
    setShiftErrorMessage(null);
    setSelectedShiftId('');
    try {
      const context = await salesService.getReturnContext(saleId);
      if (current !== revision.current) return;
      setActiveShifts(context.availableShifts);
      setSelectedShiftId(context.availableShifts.length === 1 ? context.availableShifts[0].id : '');
    } catch (error: unknown) {
      if (current !== revision.current) return;
      setActiveShifts([]);
      setShiftErrorMessage(getPosOperationMessage(error, 'No se pudieron consultar los turnos.'));
    } finally {
      if (current === revision.current) setIsLoadingShifts(false);
    }
  }, []);

  return { activeShifts, selectedShiftId, setSelectedShiftId, isLoadingShifts, shiftErrorMessage,
    clearReturnContext, loadReturnContext };
};
