import { create } from 'zustand';
import type { RealtimeStatus } from '../types/realtime';

export const useRealtimeStore = create<{ status: RealtimeStatus; setStatus: (status: RealtimeStatus) => void }>(set => ({
  status: 'connecting',
  setStatus: status => set({ status }),
}));
