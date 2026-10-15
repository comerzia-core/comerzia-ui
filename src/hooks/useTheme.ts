import { useThemeStore } from '../stores/useThemeStore';

// Todas las vistas comparten el estado de apariencia.
export const useTheme = () => {
  const theme = useThemeStore(state => state.theme);
  const preview = useThemeStore(state => state.preview);
  return { theme, setSpecificTheme: preview, toggleTheme: () => preview(theme === 'light' ? 'dark' : 'light') };
};
