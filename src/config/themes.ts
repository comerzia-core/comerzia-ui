import catalog from './themes.json';
import { Sun, Moon, Candy, Heart, Zap, Sparkles, Leaf, BriefcaseBusiness, Coffee, Flame, Crown, Snowflake, type LucideIcon } from 'lucide-react';

export type ThemeId = keyof typeof catalog;
export const DEFAULT_THEME: ThemeId = 'light';
const icons: Record<string, LucideIcon> = { Sun, Moon, Candy, Heart, Zap, Sparkles, Leaf, BriefcaseBusiness, Coffee, Flame, Crown, Snowflake };
export const THEMES = Object.entries(catalog).map(([id, entry]) => ({ ...entry, id: id as ThemeId, icon: icons[entry.icon] }));
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && Object.hasOwn(catalog, value);
}
export function getThemeMode(theme: ThemeId): 'light' | 'dark' {
  return catalog[theme].mode === 'dark' ? 'dark' : 'light';
}
export function getThemeLabel(theme: ThemeId): string { return catalog[theme].label; }
