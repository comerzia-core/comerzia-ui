import api from '../lib/axios';

export interface PlatformConfig {
  platformMode: 'PRIVATE' | 'PUBLIC';
  publicRegistrationEnabled: boolean;
  publicLandingEnabled: boolean;
  publicCatalogsEnabled: boolean;
  brandName?: string;
}

export const platformConfigService = {
  getConfig: async (): Promise<PlatformConfig> => {
    try {
      const response = await api.get('/public/platform/config');
      const payload = response.data;
      return (payload && payload.data) ? payload.data : payload;
    } catch {
      return {
        platformMode: 'PRIVATE',
        publicRegistrationEnabled: false,
        publicLandingEnabled: false,
        publicCatalogsEnabled: false,
        brandName: 'Comerzia ERP'
      };
    }
  }
};

