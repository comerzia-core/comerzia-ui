import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/checkout', testMatch: '**/*.spec.mjs', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5183' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort',
    url: 'https://localhost:5183/tests/checkout/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false,
  },
});
