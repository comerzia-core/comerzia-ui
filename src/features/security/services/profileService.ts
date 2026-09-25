import api from '../../../lib/axios';
import type { 
  MyProfileResponse, 
  UpdateMyProfileRequest, 
  ChangeMyPasswordRequest 
} from '../types/profile';

export const profileService = {
  /**
   * Retrieves profile information of the currently authenticated user
   */
  getMyProfile: async (): Promise<MyProfileResponse> => {
    const { data } = await api.get<MyProfileResponse>('/profile');
    return data;
  },

  /**
   * Updates personal contact information and avatar for the currently authenticated user
   */
  updateMyProfile: async (request: UpdateMyProfileRequest): Promise<MyProfileResponse> => {
    const { data } = await api.put<MyProfileResponse>('/profile', request);
    return data;
  },

  /**
   * Changes the password of the currently authenticated user by validating current password
   */
  changeMyPassword: async (request: ChangeMyPasswordRequest): Promise<void> => {
    await api.post<void>('/profile/change-password', request);
  }
};
