import { useQuery } from '@tanstack/react-query';
import type { SaleResponse } from '../types/sales';
import { salesService } from '../services/salesService';
import { getPosOperationMessage } from '../../pos/utils/posOperationMessages';

export const useReturnQuote = (sale: SaleResponse | null, quantities: Record<string, number>) => {
  const returnDetails = Object.entries(quantities).filter(([, quantity]) => quantity > 0)
    .map(([saleDetailId, quantityToReturn]) => ({ saleDetailId, quantityToReturn }))
    .sort((left, right) => left.saleDetailId.localeCompare(right.saleDetailId));
  const status = typeof sale?.saleStatus === 'number' ? sale.saleStatus : sale?.saleStatus?.code;
  const enabled = Boolean(sale && [602, 605].includes(status ?? 0) && returnDetails.length);
  const query = useQuery({
    queryKey: ['sales', 'return-quote', sale?.id, returnDetails, sale?.details?.map((detail) => [detail.id, detail.returnedQuantity])],
    queryFn: ({ signal }) => salesService.quoteReturn(sale!.id, returnDetails, signal),
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const selectedDetails = sale?.details?.filter((detail) => (quantities[detail.id] ?? 0) > 0) ?? [];
  return {
    quote: enabled ? query.data : undefined,
    isQuoteLoading: enabled && query.isFetching,
    quoteError: enabled && query.error ? getPosOperationMessage(query.error, 'No se pudo calcular el reembolso.') : null,
    hasQuote: enabled && Boolean(query.data) && !query.isFetching && !query.isError,
    totalReceiptItems: selectedDetails.reduce((total, detail) => total + quantities[detail.id], 0),
    totalPhysicalItems: selectedDetails.reduce((total, detail) => total + quantities[detail.id] * (detail.equivalenceFactor || 1), 0),
  };
};
