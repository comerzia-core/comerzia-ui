import api from '../../../lib/axios';
import { publicApi } from '../../public/services/publicService';
import type {
  EmailChangeRequestDto,
  EmailChangeInspectRequestDto,
  EmailChangeConfirmRequestDto,
  EmailChangeResponse,
  EmailChangeInspectionResponse,
  PendingEmailChangeResponse,
} from '../types/emailChange';

export const emailChangeService = {
  getPendingChange: async (): Promise<PendingEmailChangeResponse> => {
    const { data } = await api.get<PendingEmailChangeResponse>('/profile/email-change/pending');
    return data;
  },

  requestChange: async (dto: EmailChangeRequestDto): Promise<EmailChangeResponse> => {
    const { data } = await api.post<EmailChangeResponse>('/profile/email-change/request', dto);
    return data;
  },

  cancelChange: async (): Promise<EmailChangeResponse> => {
    const { data } = await api.post<EmailChangeResponse>('/profile/email-change/cancel');
    return data;
  },

  inspectToken: async (token: string, signal?: AbortSignal): Promise<EmailChangeInspectionResponse> => {
    const { data } = await publicApi.post<EmailChangeInspectionResponse>(
      '/public/email-change/inspect',
      { token } as EmailChangeInspectRequestDto,
      { signal }
    );
    return data;
  },

  confirmChange: async (token: string): Promise<EmailChangeResponse> => {
    const { data } = await api.post<EmailChangeResponse>(
      '/profile/email-change/confirm',
      { token } as EmailChangeConfirmRequestDto
    );
    return data;
  },
};
