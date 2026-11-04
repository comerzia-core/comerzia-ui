import api from '../../../lib/axios';
import type {
  MfaEmergencyRequestResponse,
  CreateMfaEmergencyRequest,
  RejectMfaEmergencyRequest
} from '../types/mfaRecovery';

export const mfaAdminRecoveryService = {
  // Tenant endpoints
  getActiveTenantRequest: async (userId: string): Promise<MfaEmergencyRequestResponse | null> => {
    try {
      const { data } = await api.get<MfaEmergencyRequestResponse>(`/tenant/users/${userId}/mfa-recovery/active`);
      return data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 204 || axiosErr.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  listTenantRequests: async (userId: string): Promise<MfaEmergencyRequestResponse[]> => {
    const { data } = await api.get<MfaEmergencyRequestResponse[]>(`/tenant/users/${userId}/mfa-recovery`);
    return data;
  },

  createTenantRequest: async (
    userId: string,
    req: CreateMfaEmergencyRequest,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/tenant/users/${userId}/mfa-recovery`,
      req,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  approveTenantRequest: async (
    userId: string,
    requestId: string,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/tenant/users/${userId}/mfa-recovery/${requestId}/approve`,
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  executeTenantRequest: async (
    userId: string,
    requestId: string,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/tenant/users/${userId}/mfa-recovery/${requestId}/execute`,
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  rejectTenantRequest: async (
    userId: string,
    requestId: string,
    req: RejectMfaEmergencyRequest
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/tenant/users/${userId}/mfa-recovery/${requestId}/reject`,
      req
    );
    return data;
  },

  // SaaS Team endpoints
  getActiveSaasRequest: async (userId: string): Promise<MfaEmergencyRequestResponse | null> => {
    try {
      const { data } = await api.get<MfaEmergencyRequestResponse>(`/saas/team/${userId}/mfa-recovery/active`);
      return data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 204 || axiosErr.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  listSaasRequests: async (userId: string): Promise<MfaEmergencyRequestResponse[]> => {
    const { data } = await api.get<MfaEmergencyRequestResponse[]>(`/saas/team/${userId}/mfa-recovery`);
    return data;
  },

  createSaasRequest: async (
    userId: string,
    req: CreateMfaEmergencyRequest,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/saas/team/${userId}/mfa-recovery`,
      req,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  approveSaasRequest: async (
    userId: string,
    requestId: string,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/saas/team/${userId}/mfa-recovery/${requestId}/approve`,
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  executeSaasRequest: async (
    userId: string,
    requestId: string,
    grantToken: string
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/saas/team/${userId}/mfa-recovery/${requestId}/execute`,
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  rejectSaasRequest: async (
    userId: string,
    requestId: string,
    req: RejectMfaEmergencyRequest
  ): Promise<MfaEmergencyRequestResponse> => {
    const { data } = await api.post<MfaEmergencyRequestResponse>(
      `/saas/team/${userId}/mfa-recovery/${requestId}/reject`,
      req
    );
    return data;
  }
};

