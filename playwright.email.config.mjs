import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/email', outputDir: './test-results/email', workers: 1, timeout: 30000,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true,
    ignoreHTTPSErrors: true, baseURL: 'https://localhost:5213' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5213 --strictPort',
    env: { VITE_API_URL: '/api' },
    url: 'https://localhost:5213', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
