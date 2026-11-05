import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/sessions', outputDir: './test-results/sessions', timeout: 30000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5210' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5210 --strictPort', url: 'https://localhost:5210', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
