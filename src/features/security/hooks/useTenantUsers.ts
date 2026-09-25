// src/features/security/hooks/useTenantUsers.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '../services/userService';
import type { UserResponse } from '../types/user';
import type { PageResponse } from '../../../types/api';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';

interface UseTenantUsersOptions {
  initialPageSize?: number;
}

export const useTenantUsers = ({ initialPageSize = 10 }: UseTenantUsersOptions = {}) => {
  const { addToast: showToast } = useToast();

  const [data, setData] = useState<PageResponse<UserResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const debouncedSearch = useDebounce(searchQuery, 350);
  const isFirstRender = useRef(true);

  // Validación de mínimo 3 caracteres para búsqueda o vacío para traer todos
  const searchTrimmed = debouncedSearch.trim();
  const isSearchValid = searchTrimmed.length === 0 || searchTrimmed.length >= 3;

  const loadUsers = useCallback(
    async (currentPage: number, currentSize: number, q?: string, branchId?: string) => {
      try {
        setIsLoading(true);
        const response = await userService.getTenantUsers(
          currentPage,
          currentSize,
          q || undefined,
          branchId || undefined
        );
        setData(response);
      } catch (error) {
        console.error('Error loading tenant users:', error);
        showToast('Error al cargar la lista de usuarios del sistema', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Carga inicial y cambios en filtros (búsqueda y sucursal)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadUsers(page, pageSize, undefined, selectedBranchId);
      return;
    }

    // Si tiene 1 o 2 caracteres, no hacemos el llamado hasta que llegue a 3 o se limpie
    if (!isSearchValid) {
      return;
    }

    const queryToSearch = searchTrimmed.length >= 3 ? searchTrimmed : undefined;
    setPage(0);
    loadUsers(0, pageSize, queryToSearch, selectedBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedBranchId]);

  // Manejo de paginación
  useEffect(() => {
    if (isFirstRender.current) return;
    if (!isSearchValid) return;

    const queryToSearch = searchTrimmed.length >= 3 ? searchTrimmed : undefined;
    loadUsers(page, pageSize, queryToSearch, selectedBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const refetch = () => {
    const queryToSearch = searchTrimmed.length >= 3 ? searchTrimmed : undefined;
    loadUsers(page, pageSize, queryToSearch, selectedBranchId);
  };

  return {
    data,
    isLoading,
    page,
    pageSize,
    searchQuery,
    setSearchQuery,
    selectedBranchId,
    setSelectedBranchId,
    handlePageChange,
    handlePageSizeChange,
    refetch
  };
};
