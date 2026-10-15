import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformService, platformError, type QueryParameters } from '../services/platformService';
import { useToast } from '../../../context/ToastContext';
export function usePlatformData<T>(path: string, params?: QueryParameters, enabled = true) {
  return useQuery({ queryKey: ['platform', path, params], queryFn: ({ signal }) => platformService.get<T>(path, params, signal),
    enabled, placeholderData: keepPreviousData, staleTime: 15000 });
}
export function usePlatformPage<T>(path: string, params?: QueryParameters, enabled = true) {
  const [page, setPage] = useState(0); const [size, setSize] = useState(10);
  const query = usePlatformData<import('../types/platform').PageResponse<T>>(path, { ...params, page, size }, enabled);
  return { ...query, pagination: { currentPage: page, pageSize: size, totalPages: query.data?.totalPages ?? 0, totalElements: query.data?.totalElements ?? 0,
    onPageChange: setPage, onPageSizeChange: (next: number) => { setPage(0); setSize(next); } } };
}
export function usePlatformAction<T, V>(action: (value: V) => Promise<T>) {
  const client = useQueryClient(); const toast = useToast();
  return useMutation({ mutationFn: action, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['platform'] }); },
    onError: (error: unknown) => toast.error(platformError(error)) });
}
