// src/features/organization/hooks/useBranchesInfinite.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { branchService } from '../services/branchService';
import type { BranchResponse } from '../types/branch';
import { useToast } from '../../../context/ToastContext';

// Configuración de filtro de estado
export type BranchStatusFilter = 'all' | 'active' | 'inactive';

interface UseBranchesInfiniteOptions {
  pageSize?: number;
}

export const useBranchesInfinite = ({ pageSize = 20 }: UseBranchesInfiniteOptions = {}) => {
  const { addToast: showToast } = useToast();

  // Estados de datos y paginación
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Banderas de carga
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BranchStatusFilter>('all');

  // Carga de una página específica desde el backend
  const loadPage = useCallback(
    async (pageToLoad: number, isInitial = false, currentStatusFilter = statusFilter) => {
      try {
        if (isInitial) {
          setIsLoadingInitial(true);
        } else {
          setIsLoadingMore(true);
        }

        const onlyActive = currentStatusFilter === 'active';
        const response = await branchService.getBranches(pageToLoad, pageSize, onlyActive);

        let newContent = response.content;
        if (currentStatusFilter === 'inactive') {
          newContent = newContent.filter(b => !b.status);
        }

        setBranches(prev => (isInitial ? newContent : [...prev, ...newContent]));
        setPage(response.number);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setHasMore(!response.last);
      } catch (error) {
        console.error('Error loading branches:', error);
        showToast('Error al cargar la lista de sucursales', 'error');
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, showToast, statusFilter]
  );

  // Recargar desde la página 0 cuando cambie el filtro de estado
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadPage(0, true, statusFilter);
  }, [statusFilter]);

  // Cargar siguiente página si existe más data y no está cargando
  const fetchNextPage = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoadingInitial) return;
    loadPage(page + 1, false, statusFilter);
  }, [hasMore, isLoadingMore, isLoadingInitial, page, loadPage, statusFilter]);

  // Reiniciar y recargar la lista completa desde el inicio
  const refetch = useCallback(() => {
    setPage(0);
    setHasMore(true);
    loadPage(0, true, statusFilter);
  }, [loadPage, statusFilter]);

  // Filtrado reactivo en memoria sobre la data acumulada
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (branch.code && branch.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && branch.status) ||
        (statusFilter === 'inactive' && !branch.status);

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  return {
    branches: filteredBranches,
    totalElements,
    totalPages,
    currentPage: page,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fetchNextPage,
    refetch
  };
};
