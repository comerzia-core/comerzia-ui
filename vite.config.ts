import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'node:fs';
const themeCatalog: Record<string, { mode: string }> = JSON.parse(readFileSync(new URL('./src/config/themes.json', import.meta.url), 'utf8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'comerzia-theme-bootstrap',
      transformIndexHtml(html) {
        // El catálogo de arranque y el selector provienen del mismo archivo; no hay listas divergentes.
        const modes = Object.fromEntries(Object.entries(themeCatalog).map(([id, theme]) => [id, theme.mode]));
        return html.replace('<!-- theme-bootstrap -->', `<script>(function(){var modes=${JSON.stringify(modes)};var theme='light';try{var stored=localStorage.getItem('theme');if(Object.prototype.hasOwnProperty.call(modes,stored))theme=stored;}catch(e){}var root=document.documentElement;root.dataset.theme=theme;root.dataset.colorScheme=modes[theme];root.style.colorScheme=modes[theme];})();</script>`);
      },
    },
    react(),
    basicSsl()
  ],
  server: {
    host: true, // Expone en la red local para pruebas móviles vía HTTPS
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
