import api from '../../../lib/axios';
import { publicApi } from '../../public/services/publicService';
import type {
  EmailVerificationStatusResponse,
  EmailVerificationRequestResponse,
  PublicChallengeInspectionResponse,
  PublicChallengeConfirmationResponse,
} from '../types/emailVerification';

export const emailVerificationService = {
  /**
   * Retrieves the current email verification status for the authenticated user.
   */
  getMyStatus: async (): Promise<EmailVerificationStatusResponse> => {
    const { data } = await api.get<EmailVerificationStatusResponse>('/auth/email-verification/status');
    return data;
  },

  /**
   * Requests a new email verification challenge.
   */
  requestVerification: async (): Promise<EmailVerificationRequestResponse> => {
    const { data } = await api.post<EmailVerificationRequestResponse>('/auth/email-verification/request');
    return data;
  },

  /**
   * Public: Inspects a token without consuming it (safe for web crawlers/scanners).
   */
  inspectToken: async (token: string, signal?: AbortSignal): Promise<PublicChallengeInspectionResponse> => {
    const { data } = await publicApi.post<PublicChallengeInspectionResponse>(
      '/public/email-verification/inspect', { token }, { signal }
    );
    return data;
  },

  /**
   * Public: Confirms and atomically consumes the email verification token.
   */
  confirmVerification: async (token: string): Promise<PublicChallengeConfirmationResponse> => {
    const { data } = await publicApi.post<PublicChallengeConfirmationResponse>(
      '/public/email-verification/confirm',
      { token }
    );
    return data;
  },
};

