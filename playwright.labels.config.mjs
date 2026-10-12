import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/labels', testMatch: '**/*.spec.mjs', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5182' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5182 --strictPort',
    url: 'https://localhost:5182/tests/labels/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false,
  },
});
