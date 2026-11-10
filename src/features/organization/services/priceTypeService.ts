import api from '../../../lib/axios';
import type { PaginatedResponse } from '../../../types/api';
import type { PriceTypeSettings, SavePriceTypeRequest } from '../types/priceType';

export const priceTypeService = {
  async list(page: number, size: number): Promise<PaginatedResponse<PriceTypeSettings>> {
    const { data } = await api.get<PaginatedResponse<PriceTypeSettings>>('/tenant/price-types/settings', { params: { page, size } });
    return data;
  },
  async create(request: SavePriceTypeRequest): Promise<PriceTypeSettings> {
    const { data } = await api.post<PriceTypeSettings>('/tenant/price-types', request);
    return data;
  },
  async update(id: string, request: SavePriceTypeRequest): Promise<PriceTypeSettings> {
    const { data } = await api.put<PriceTypeSettings>(`/tenant/price-types/${id}`, request);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/tenant/price-types/${id}`);
  },
};
