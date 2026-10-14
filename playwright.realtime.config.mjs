import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/realtime', testMatch: '**/*.spec.mjs', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5184' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5184 --strictPort',
    url: 'https://localhost:5184/tests/realtime/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false,
  },
});
