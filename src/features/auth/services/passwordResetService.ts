import { publicApi } from '../../public/services/publicService';
import type {
  PasswordResetRequestDto,
  PasswordResetInspectRequestDto,
  PasswordResetConfirmRequestDto,
  PasswordResetResponse,
  PasswordResetInspectionResponse,
} from '../types/passwordReset';

export const passwordResetService = {
  requestReset: async (dto: PasswordResetRequestDto): Promise<PasswordResetResponse> => {
    const { data } = await publicApi.post<PasswordResetResponse>('/public/password-reset/request', dto);
    return data;
  },

  inspectToken: async (token: string, signal?: AbortSignal): Promise<PasswordResetInspectionResponse> => {
    const { data } = await publicApi.post<PasswordResetInspectionResponse>(
      '/public/password-reset/inspect',
      { token } as PasswordResetInspectRequestDto,
      { signal }
    );
    return data;
  },

  confirmReset: async (token: string, newPassword: string): Promise<PasswordResetResponse> => {
    const { data } = await publicApi.post<PasswordResetResponse>(
      '/public/password-reset/confirm',
      { token, newPassword } as PasswordResetConfirmRequestDto
    );
    return data;
  },
};
