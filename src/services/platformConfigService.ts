import { publicApi } from '../features/public/services/publicService';

export interface PlatformConfig {
  platformMode: 'PRIVATE' | 'PUBLIC';
  publicRegistrationEnabled: boolean;
  publicLandingEnabled: boolean;
  publicCatalogsEnabled: boolean;
  brandName?: string;
}

export const platformConfigService = {
  getConfig: async (): Promise<PlatformConfig> => {
    const response = await publicApi.get('/public/platform/config');
    const payload = response.data;
    return (payload && payload.data) ? payload.data : payload;
  }
};
