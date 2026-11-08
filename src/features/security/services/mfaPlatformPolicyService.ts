import api from '../../../lib/axios';
import type { MfaPolicyStatusResponse, MfaPreflightResponse } from '../types/mfaPolicy';

export const mfaPlatformPolicyService = {
  getPolicyStatus: async (): Promise<MfaPolicyStatusResponse> => {
    const { data } = await api.get<MfaPolicyStatusResponse>('/saas/security/mfa/policy');
    return data;
  },

  activatePolicy: async (grantToken: string): Promise<MfaPolicyStatusResponse> => {
    const { data } = await api.post<MfaPolicyStatusResponse>(
      '/saas/security/mfa/policy/activate',
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  deactivatePolicy: async (grantToken: string): Promise<MfaPolicyStatusResponse> => {
    const { data } = await api.post<MfaPolicyStatusResponse>(
      '/saas/security/mfa/policy/deactivate',
      null,
      {
        headers: { 'X-Mfa-Step-Up-Grant': grantToken }
      }
    );
    return data;
  },

  getPreflight: async (): Promise<MfaPreflightResponse> => {
    const { data } = await api.get<MfaPreflightResponse>('/saas/security/mfa/preflight');
    return data;
  }
};

