import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { browserSessions, type OwnSession } from '../services/browserSessions';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
export function useBrowserSessions() {
  const [page, setPage] = useState(0);
  const sessionId = useAuthStore(state => state.sessionId);
  const cache = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: ['own-browser-sessions', sessionId, page], queryFn: () => browserSessions.list(page) });
  const mutation = useMutation({
    mutationFn: async (session: OwnSession | null) => {
      if (session) await browserSessions.revoke(session.reference);
      else await browserSessions.logoutAll();
    },
    onSuccess: (_, session) => {
      if (!session || session.current) {
        useAuthStore.getState().expireSession();
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('comerzia-session');
          channel.postMessage({ type: 'logout', sessionId }); channel.close();
        }
      } else {
        toast.success('Sesión cerrada.');
        void cache.invalidateQueries({ queryKey: ['own-browser-sessions', sessionId] });
      }
    },
    onError: () => toast.error('No se pudo cerrar. Reintenta.'),
  });
  return { query, mutation, page, setPage };
}
