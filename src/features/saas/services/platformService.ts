import api from '../../../lib/axios';
import { isAxiosError } from 'axios';
import type { PageResponse } from '../types/platform';
export type QueryParameters = Record<string, string | number | undefined>;
export const platformService = {
  async get<T>(path: string, params?: QueryParameters, signal?: AbortSignal): Promise<T> {
    return (await api.get<T>(path, { params, signal })).data;
  },
  async page<T>(path: string, params: QueryParameters, signal?: AbortSignal): Promise<PageResponse<T>> {
    return this.get<PageResponse<T>>(path, params, signal);
  },
  async post<T>(path: string, body?: unknown): Promise<T> { return (await api.post<T>(path, body)).data; },
  async put<T>(path: string, body: unknown): Promise<T> { return (await api.put<T>(path, body)).data; },
  async delete(path: string): Promise<void> { await api.delete(path); },
  async patch<T>(path: string, body: unknown): Promise<T> { return (await api.patch<T>(path, body)).data; },
};
export function platformError(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data.message) return error.response.data.message;
  return 'No se pudo completar la operación.';
}
