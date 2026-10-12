import api from '../../../lib/axios';
import type { SelectOption } from '../../../types/dictionary';
import type { HwPrintJobResponse } from '../types/hardware';
import type { RollSize, SaveRollSizeRequest, LabelContent, LabelPreview, PreviewLabelRequest, LabelPage } from '../types/labels';

const base = '/tenant/hardware';

export const labelService = {
  getRolls: async (search: string, page: number, size: number): Promise<LabelPage<RollSize>> =>
    (await api.get<LabelPage<RollSize>>(`${base}/roll-sizes`, { params: { search, page, size, sort: 'name,asc' } })).data,
  saveRoll: async (id: string | null, request: SaveRollSizeRequest): Promise<RollSize> =>
    (id ? await api.put<RollSize>(`${base}/roll-sizes/${id}`, request) : await api.post<RollSize>(`${base}/roll-sizes`, request)).data,
  deleteRoll: async (id: string): Promise<void> => { await api.delete(`${base}/roll-sizes/${id}`); },
  content: async (variantId: string, signal?: AbortSignal): Promise<LabelContent> =>
    (await api.get<LabelContent>(`${base}/product-labels/content/${variantId}`, { signal })).data,
  preview: async (request: PreviewLabelRequest, signal?: AbortSignal): Promise<LabelPreview> =>
    (await api.post<LabelPreview>(`${base}/product-labels/preview`, request, { signal })).data,
  print: async (previewId: string, deviceId: string, quantity: number): Promise<HwPrintJobResponse> =>
    (await api.post<HwPrintJobResponse>(`${base}/product-labels/print`, { previewId, deviceId, quantity })).data,
  lookup: async (key: string, productId?: string): Promise<SelectOption[]> => {
    const options: SelectOption[] = [];
    let page = 0;
    let totalPages = 1;
    do {
      const { data } = await api.get<LabelPage<SelectOption>>(`${base}/product-labels/lookups/${key}`, {
        params: { productId, page, size: 100, sort: 'name,asc' },
      });
      options.push(...data.content);
      totalPages = data.totalPages;
      page++;
    } while (page < totalPages);
    return options;
  },
};

export const getLabelError = (error: unknown, fallback: string): string => {
  const response = error as { response?: { data?: { message?: string } } };
  return response?.response?.data?.message || (error instanceof Error ? error.message : fallback);
};
