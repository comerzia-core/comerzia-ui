import api from '../../../lib/axios';
export interface OwnSession {
  reference: string;
  current: boolean;
  authenticatedAt: string;
  lastActiveAt: string;
  absoluteExpiresAt: string;
  policy: string;
}
export interface SessionPage { content: OwnSession[]; totalElements: number; totalPages: number; }
export const browserSessions = {
  list: async (page: number): Promise<SessionPage> => (await api.get('/auth/sessions', { params: { page, size: 5 } })).data,
  revoke: async (reference: string): Promise<void> => { await api.delete(`/auth/sessions/${encodeURIComponent(reference)}`); },
  logoutAll: async (): Promise<void> => { await api.post('/auth/logout-all', {}); },
};
