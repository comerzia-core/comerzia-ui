import { useEffect, useState } from 'react';
import { useThemeStore } from '../../../stores/useThemeStore';
import { getThemeMode } from '../../../config/themes';

const key = 'comerzia.public.theme';
export function usePublicAppearance() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme; root.dataset.colorScheme = theme; root.style.colorScheme = theme;
    try { localStorage.setItem(key, theme); } catch { /* El tema sigue funcionando sin almacenamiento. */ }
    return () => {
      const saved = useThemeStore.getState().theme;
      root.dataset.theme = saved;
      const mode = getThemeMode(saved);
      root.dataset.colorScheme = mode; root.style.colorScheme = mode;
    };
  }, [theme]);
  return { theme, toggle: () => setTheme(current => current === 'light' ? 'dark' : 'light') };
}
