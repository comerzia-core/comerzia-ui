// src/features/security/services/auditService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type { AuditLogResponse } from '../types/audit';

export const auditService = {
  getCompanyAuditLogs: async (page: number, size: number): Promise<PageResponse<AuditLogResponse>> => {
    const response = await api.get<PageResponse<AuditLogResponse>>('/audit', {
      params: { page, size }
    });
    return response.data;
  }
};
