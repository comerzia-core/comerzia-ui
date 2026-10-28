import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'node:fs';
const themeCatalog: Record<string, { mode: string }> = JSON.parse(readFileSync(new URL('./src/config/themes.json', import.meta.url), 'utf8'));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const allowed = new Set(['VITE_API_URL', 'VITE_APP_NAME', 'VITE_APP_VERSION', 'VITE_DEFAULT_LANGUAGE', 'VITE_PAGINATION_LIMIT']);
  for (const name of Object.keys(loadEnv(mode, process.cwd(), 'VITE_'))) {
    if (!allowed.has(name)) throw new Error('Unapproved public build variable: ' + name);
  }
  return {
  plugins: [
    {
      name: 'comerzia-theme-bootstrap',
      transformIndexHtml(html) {
        // El catálogo de arranque y el selector provienen del mismo archivo; no hay listas divergentes.
        const modes = Object.fromEntries(Object.entries(themeCatalog).map(([id, theme]) => [id, theme.mode]));
        return html.replace('<!-- theme-bootstrap -->', `<script>(function(){var modes=${JSON.stringify(modes)};var theme='light';try{var publicPage=['/','/registro','/login'].includes(location.pathname);var stored=localStorage.getItem(publicPage?'comerzia.public.theme':'theme');if(Object.prototype.hasOwnProperty.call(modes,stored)&&(!publicPage||stored==='light'||stored==='dark'))theme=stored;}catch(e){}var root=document.documentElement;root.dataset.theme=theme;root.dataset.colorScheme=modes[theme];root.style.colorScheme=modes[theme];})();</script>`);
      },
    },
    react(),
    basicSsl()
  ],
  server: {
    host: '127.0.0.1', // Las pruebas móviles requieren habilitar --host explícitamente.
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
  };
})
