import daisyui from 'daisyui';
import { readFileSync } from 'node:fs';
const themeCatalog = JSON.parse(readFileSync(new URL('./src/config/themes.json', import.meta.url), 'utf8'));
// DaisyUI 5 expone colores completos; Tailwind 3 necesita resolver explícitamente los modificadores /opacity.
const semanticColors = Object.fromEntries(['base-100', 'base-200', 'base-300', 'base-content',
  'primary', 'primary-content', 'secondary', 'secondary-content', 'accent', 'accent-content',
  'neutral', 'neutral-content', 'info', 'info-content', 'success', 'success-content',
  'warning', 'warning-content', 'error', 'error-content'].map(name => [name,
  ({ opacityValue }) => opacityValue === undefined ? `var(--color-${name})`
    : `color-mix(in srgb, var(--color-${name}) calc(${opacityValue} * 100%), transparent)`]));
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-color-scheme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: { colors: semanticColors },
  },
  plugins: [
    daisyui({ themes: Object.keys(themeCatalog).map(theme => theme === 'light' ? 'light --default' : theme) }),
  ],
}
