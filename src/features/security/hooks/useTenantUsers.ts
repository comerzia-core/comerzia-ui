// src/features/security/hooks/useTenantUsers.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../services/userService';
import type { UserResponse } from '../types/user';
import type { PageResponse } from '../../../types/api';
import { useToast } from '../../../context/ToastContext';

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

  const loadUsers = useCallback(
    async (currentPage: number, currentSize: number) => {
      try {
        setIsLoading(true);
        const response = await userService.getTenantUsers(currentPage, currentSize);
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

  useEffect(() => {
    loadUsers(page, pageSize);
  }, [loadUsers, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const refetch = () => {
    loadUsers(page, pageSize);
  };

  // Filtrado local reactivo sobre los usuarios de la página cargada
  const filteredUsers = useMemo(() => {
    if (!data?.content) return [];
    if (!searchQuery.trim()) return data.content;

    const query = searchQuery.toLowerCase().trim();
    return data.content.filter(
      user =>
        user.username.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.roles.some(role => role.toLowerCase().includes(query)) ||
        (user.statusTypeName && user.statusTypeName.toLowerCase().includes(query))
    );
  }, [data?.content, searchQuery]);

  return {
    data: data ? { ...data, content: filteredUsers } : null,
    isLoading,
    page,
    pageSize,
    searchQuery,
    setSearchQuery,
    handlePageChange,
    handlePageSizeChange,
    refetch
  };
};
