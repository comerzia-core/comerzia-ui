import { DEFAULT_THEME, getThemeMode, isThemeId, type ThemeId } from '../../../config/themes';

export function readTheme(key = 'theme'): ThemeId | null {
  try { const stored = localStorage.getItem(key); return isThemeId(stored) ? stored : null; }
  catch { return null; }
}
export const userThemeKey = (owner: string) => `comerzia.theme.user.${owner}`;
export function rememberUserTheme(owner: string, theme: ThemeId) {
  try { localStorage.setItem(userThemeKey(owner), theme); } catch { /* Caché opcional. */ }
}
export function applyTheme(theme: ThemeId, owner: string | null) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.colorScheme = getThemeMode(theme);
  document.documentElement.style.colorScheme = getThemeMode(theme);
  try {
    localStorage.setItem('theme', theme);
    if (owner) localStorage.setItem(userThemeKey(owner), theme);
  } catch { /* El tema sigue funcionando cuando el navegador restringe almacenamiento. */ }
}
export function initialTheme(): ThemeId { return readTheme() ?? DEFAULT_THEME; }
