// src/features/security/hooks/useAuditLogs.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { auditService } from '../services/auditService';
import type { AuditLogResponse } from '../types/audit';
import type { PageResponse } from '../../../types/api';
import { useToast } from '../../../context/ToastContext';

interface UseAuditLogsOptions {
  initialPageSize?: number;
}

export const useAuditLogs = ({ initialPageSize = 5 }: UseAuditLogsOptions = {}) => {
  const { addToast: showToast } = useToast();

  const [data, setData] = useState<PageResponse<AuditLogResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAuditLogs = useCallback(
    async (currentPage: number, currentSize: number) => {
      try {
        setIsLoading(true);
        const response = await auditService.getCompanyAuditLogs(currentPage, currentSize);
        setData(response);
      } catch (error) {
        console.error('Error loading audit logs:', error);
        showToast('Error al cargar la bitácora de auditoría', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadAuditLogs(page, pageSize);
  }, [loadAuditLogs, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const refetch = () => {
    loadAuditLogs(page, pageSize);
  };

  // Filtrado local sobre la página actual por término de búsqueda
  const filteredContent = useMemo(() => {
    if (!data?.content) return [];
    if (!searchQuery.trim()) return data.content;

    const query = searchQuery.toLowerCase().trim();
    return data.content.filter(
      log =>
        log.userFullName?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.module?.toLowerCase().includes(query) ||
        log.entity?.toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query)
    );
  }, [data?.content, searchQuery]);

  return {
    data: data ? { ...data, content: filteredContent } : null,
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
