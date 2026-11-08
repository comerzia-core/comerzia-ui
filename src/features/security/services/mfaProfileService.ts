import api from '../../../lib/axios';
import { useAuthStore } from '../../../stores/useAuthStore';
import type {
  MfaStatusResponse,
  TotpEnrollmentStartResponse,
  TotpEnrollmentConfirmResponse,
  MfaStepUpResponse,
  MfaStepUpRequest
} from '../types/mfa';

export const mfaProfileService = {
  getMfaStatus: async (): Promise<MfaStatusResponse> => {
    const { data } = await api.get<MfaStatusResponse>('/profile/mfa');
    return data;
  },

  startTotpEnrollment: async (grantToken?: string): Promise<TotpEnrollmentStartResponse> => {
    const headers: Record<string, string> = {};
    if (grantToken) {
      headers['X-Mfa-Step-Up-Grant'] = grantToken;
    }
    const { data } = await api.post<TotpEnrollmentStartResponse>('/profile/mfa/totp/enroll/start', null, { headers });
    return data;
  },

  confirmTotpEnrollment: async (code: string): Promise<TotpEnrollmentConfirmResponse> => {
    const generation = useAuthStore.getState().generation;
    const { data } = await api.post<TotpEnrollmentConfirmResponse>('/profile/mfa/totp/enroll/confirm', { code });
    if (!data.token || !data.sessionId || !useAuthStore.getState().acceptMfaEnrollment(data.token, data.sessionId, generation))
      throw new Error('mfa_enrollment_session_changed');
    return data;
  },

  cancelTotpEnrollment: async (): Promise<void> => {
    await api.post<void>('/profile/mfa/totp/enroll/cancel');
  },

  requestStepUp: async (req: MfaStepUpRequest): Promise<MfaStepUpResponse> => {
    const { data } = await api.post<MfaStepUpResponse>('/auth/mfa/step-up', req);
    return data;
  },

  deactivateMfa: async (grantToken: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/profile/mfa/deactivate', null, {
      headers: {
        'X-Mfa-Step-Up-Grant': grantToken
      }
    });
    return data;
  },

  regenerateRecoveryCodes: async (grantToken: string): Promise<TotpEnrollmentConfirmResponse> => {
    const { data } = await api.post<TotpEnrollmentConfirmResponse>('/profile/mfa/recovery-codes/regenerate', null, {
      headers: {
        'X-Mfa-Step-Up-Grant': grantToken
      }
    });
    return data;
  }
};
