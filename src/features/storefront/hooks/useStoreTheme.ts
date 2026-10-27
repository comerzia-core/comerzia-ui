import { useState } from 'react';

export function useStoreTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { const saved = localStorage.getItem('public-catalog-theme'); if (saved === 'light' || saved === 'dark') return saved; } catch { /* La preferencia puede mantenerse en memoria. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'; setTheme(next);
    try { localStorage.setItem('public-catalog-theme', next); } catch { /* El catálogo sigue operativo sin almacenamiento local. */ }
  };
  return { theme, toggle };
}
