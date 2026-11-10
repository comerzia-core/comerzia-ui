import api from '../../../lib/axios';

export interface VariantTypeOption { id: string; name: string }

export const variantTypeService = {
  list: async () => (await api.get<VariantTypeOption[]>('/tenant/variant-types')).data,
  create: async (name: string) => (await api.post<VariantTypeOption>('/tenant/variant-types', { name })).data,
  update: async (id: string, name: string) => {
    await api.put('/tenant/variant-types/' + encodeURIComponent(id), { name });
  },
  remove: async (id: string) => {
    await api.delete('/tenant/variant-types/' + encodeURIComponent(id));
  },
};
