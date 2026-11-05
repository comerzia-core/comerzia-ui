import axios from 'axios';
import type { PublicPlan, RegistrationOptions, RegistrationForm } from '../types/public';

// Cliente anónimo: no incorpora tokens, sucursal ni interceptores de la sesión privada.
export const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000,
  headers: { 'Content-Type': 'application/json' }, withCredentials: false });
export const publicService = {
  plans: async (): Promise<PublicPlan[]> => (await publicApi.get('/public/plans')).data,
  options: async (): Promise<RegistrationOptions> => (await publicApi.get('/public/registration-options')).data,
  register: async (form: RegistrationForm, requestKey: string): Promise<{ token: string }> =>
    (await publicApi.post('/public/registrations', { ...form, requestKey })).data,
};
