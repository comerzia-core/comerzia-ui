import { create } from 'zustand';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../config/themes';
import { profileService } from '../features/security/services/profileService';
import { applyTheme, initialTheme, readTheme, rememberUserTheme, userThemeKey } from '../features/security/utils/themeStorage';

interface ThemeState {
  theme: ThemeId;
  savedTheme: ThemeId;
  owner: string | null;
  sessionToken: string | null;
  isOpen: boolean;
  isSaving: boolean;
  error: string | null;
  revision: number;
  pendingTheme: ThemeId | null;
  bindProfile: (owner: string, theme: unknown, token: string, startedAt: number) => void;
  clearSession: () => void;
  open: () => void;
  preview: (theme: ThemeId) => void;
  close: () => void;
  retry: () => void;
  flush: () => Promise<void>;
}

let activeRequest: AbortController | null = null;
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(), savedTheme: initialTheme(), owner: null, sessionToken: null,
  isOpen: false, isSaving: false, error: null, revision: 0, pendingTheme: null,
  bindProfile: (owner, theme, token, startedAt) => {
    const state = get();
    const newSession = state.owner !== owner || state.sessionToken !== token;
    if (!newSession && (state.isOpen || state.isSaving || state.error || state.revision !== startedAt)) return;
    const resolved = isThemeId(theme) ? theme : readTheme(userThemeKey(owner)) ?? DEFAULT_THEME;
    if (newSession) activeRequest?.abort();
    applyTheme(resolved, owner);
    set({ owner, sessionToken: token, theme: resolved, savedTheme: resolved, isOpen: false,
      isSaving: false, error: null, pendingTheme: null, revision: state.revision + 1 });
  },
  clearSession: () => {
    activeRequest?.abort();
    set(state => ({ owner: null, sessionToken: null, isOpen: false, isSaving: false,
      error: null, pendingTheme: null, revision: state.revision + 1 }));
  },
  open: () => { if (get().owner && get().sessionToken) set({ isOpen: true }); },
  preview: theme => {
    if (!isThemeId(theme) || !get().owner) return;
    applyTheme(theme, null);
    set(state => ({ theme, error: null, revision: state.revision + 1 }));
  },
  close: () => {
    const state = get();
    set({ isOpen: false });
    if (state.theme === state.savedTheme && !state.isSaving && !state.error) return;
    set({ pendingTheme: state.theme });
    void get().flush();
  },
  retry: () => { set({ pendingTheme: get().theme }); void get().flush(); },
  flush: async () => {
    const { owner, sessionToken } = get();
    if (!owner || !sessionToken || get().isSaving) return;
    const sameSession = () => get().owner === owner && get().sessionToken === sessionToken;
    set({ isSaving: true, error: null });
    // Una petición a la vez; una segunda selección reemplaza el pendiente, no compite con él.
    while (sameSession() && get().pendingTheme) {
      const target = get().pendingTheme!;
      const controller = new AbortController(); activeRequest = controller;
      try {
        const response = await profileService.updateTheme(target, sessionToken, controller.signal);
        if (!sameSession()) return;
        if (response.theme !== target) throw new Error('Unexpected theme response');
        rememberUserTheme(owner, target);
        set(state => ({ savedTheme: target, pendingTheme: state.pendingTheme === target ? null : state.pendingTheme }));
      } catch {
        if (sameSession() && get().pendingTheme !== target) continue;
        if (sameSession()) set({ isSaving: false, error: 'No se pudo guardar el tema. Intenta nuevamente.' });
        return;
      } finally { if (activeRequest === controller) activeRequest = null; }
    }
    if (sameSession()) set({ isSaving: false });
  },
}));
