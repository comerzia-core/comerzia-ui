import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/security', timeout: 60000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, baseURL: 'http://127.0.0.1:18081' },
});
